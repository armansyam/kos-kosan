import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const hashedPassword = await hash('admin123', 12);
  await prisma.user.upsert({
    where: { email: 'admin@kos.com' },
    update: {},
    create: {
      email: 'admin@kos.com',
      password: hashedPassword,
      name: 'Admin Kos',
    },
  });

  // Create rooms A1-A5, B1-B5
  const rooms = [
    { name: 'A1', price: 800000, status: 'terisi' },
    { name: 'A2', price: 800000, status: 'kosong' },
    { name: 'A3', price: 900000, status: 'terisi' },
    { name: 'A4', price: 900000, status: 'kosong' },
    { name: 'A5', price: 1000000, status: 'menunggak' },
    { name: 'B1', price: 1000000, status: 'terisi' },
    { name: 'B2', price: 1200000, status: 'kosong' },
    { name: 'B3', price: 1200000, status: 'terisi' },
    { name: 'B4', price: 1500000, status: 'kosong' },
    { name: 'B5', price: 1500000, status: 'terisi' },
  ];

  for (const room of rooms) {
    await prisma.room.upsert({
      where: { id: room.name.toLowerCase() },
      update: {},
      create: {
        id: room.name.toLowerCase(),
        ...room,
      },
    });
  }

  // Create sample tenants for occupied rooms
  const tenants = [
    { fullName: 'Budi Santoso', whatsapp: '6281234567890', roomId: 'a1', monthlyPrice: 800000, dueDate: 5 },
    { fullName: 'Siti Rahayu', whatsapp: '6281234567891', roomId: 'a3', monthlyPrice: 900000, dueDate: 10 },
    { fullName: 'Ahmad Rizki', whatsapp: '6281234567892', roomId: 'a5', monthlyPrice: 1000000, dueDate: 1 },
    { fullName: 'Dewi Lestari', whatsapp: '6281234567893', roomId: 'b1', monthlyPrice: 1000000, dueDate: 15 },
    { fullName: 'Rudi Hermawan', whatsapp: '6281234567894', roomId: 'b3', monthlyPrice: 1200000, dueDate: 10 },
    { fullName: 'Maya Sari', whatsapp: '6281234567895', roomId: 'b5', monthlyPrice: 1500000, dueDate: 20 },
  ];

  for (const tenant of tenants) {
    const existing = await prisma.tenant.findFirst({ where: { roomId: tenant.roomId } });
    if (!existing) {
      await prisma.tenant.create({
        data: {
          ...tenant,
          checkInDate: new Date('2026-01-01'),
          active: true,
        },
      });
    }
  }

  // Create sample electricity log
  await prisma.electricityLog.create({
    data: {
      topupDate: new Date(),
      nominal: 100000,
      kwhAdded: 65.5,
      currentKwh: 45.2,
      estimatedDaysLeft: 15,
    },
  });

  console.log('✅ Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
