const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log('⌛ Setting up test scenarios in database...');

  // Reset any existing test records to avoid duplicates
  await prisma.tenant.deleteMany({
    where: {
      fullName: { in: ['Roni Wijaya', 'Hendrawan'] }
    }
  });

  // 1. Penghuni Baru Aktif: Roni Wijaya (Kamar B2, status: terisi)
  // Kamar B2 sebelumnya kosong, diubah menjadi terisi
  await prisma.room.update({
    where: { id: 'b2' },
    data: { status: 'terisi' }
  });
  
  const roni = await prisma.tenant.create({
    data: {
      fullName: 'Roni Wijaya',
      whatsapp: '6281299998888',
      roomId: 'b2',
      monthlyPrice: 1200000,
      dueDate: 12,
      checkInDate: new Date('2026-06-28'),
      active: true
    }
  });
  console.log('✅ Created active tenant: Roni Wijaya in Room B2');

  // 2. Penghuni Keluar: Hendrawan (Kamar A2, status: kosong)
  // Kamar A2 di-set kosong, Hendrawan berstatus active: false (keluar)
  await prisma.room.update({
    where: { id: 'a2' },
    data: { status: 'kosong' }
  });

  const hendrawan = await prisma.tenant.create({
    data: {
      fullName: 'Hendrawan',
      whatsapp: '6281277776666',
      roomId: 'a2',
      monthlyPrice: 800000,
      dueDate: 15,
      checkInDate: new Date('2026-01-10'),
      checkOutDate: new Date('2026-06-15'),
      active: false
    }
  });
  console.log('✅ Created checked-out tenant: Hendrawan in Room A2 (Room status is Kosong)');

  // 3. Penghuni Menunggak (Jatuh Tempo Lewat): Ahmad Rizki (Kamar A5, status: menunggak)
  const ahmad = await prisma.tenant.findFirst({
    where: { roomId: 'a5' }
  });
  if (ahmad) {
    // Hapus bill a5 bulan Juni 2026 jika sudah ada
    await prisma.bill.deleteMany({
      where: { tenantId: ahmad.id, month: '2026-06' }
    });
    // Buat tagihan bulan Juni 2026 yang belum dibayar, jatuh tempo 1 Juni (Overdue/Jatuh tempo lewat)
    await prisma.bill.create({
      data: {
        tenantId: ahmad.id,
        month: '2026-06',
        amount: 1000000,
        dueDate: new Date('2026-06-01'),
        status: 'belum_bayar'
      }
    });
    // Set status kamar A5 menjadi menunggak
    await prisma.room.update({
      where: { id: 'a5' },
      data: { status: 'menunggak' }
    });
    console.log('✅ Created overdue bill for Ahmad Rizki (a5) for June 2026');
  }

  // 4. Penghuni Segera Ditagih: Budi Santoso (Kamar A1, status: terisi)
  // Buat tagihan bulan Juli 2026 yang belum dibayar, jatuh tempo 5 Juli (Jatuh tempo segera datang)
  const budi = await prisma.tenant.findFirst({
    where: { roomId: 'a1' }
  });
  if (budi) {
    await prisma.bill.deleteMany({
      where: { tenantId: budi.id, month: '2026-07' }
    });
    await prisma.bill.create({
      data: {
        tenantId: budi.id,
        month: '2026-07',
        amount: 800000,
        dueDate: new Date('2026-07-05'),
        status: 'belum_bayar'
      }
    });
    console.log('✅ Created upcoming bill for Budi Santoso (a1) for July 2026');
  }

  console.log('🎉 All test scenarios set up successfully in database!');
  prisma.$disconnect();
}

run().catch(e => {
  console.error('❌ Error setting up test scenarios:', e);
  prisma.$disconnect();
});
