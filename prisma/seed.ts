import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // 1. Create super admin user (Owner/Root)
  const hashedRootPassword = await hash('admin123', 12);
  await prisma.user.upsert({
    where: { email: 'admin@ams.com' },
    update: {
      role: 'super_admin'
    },
    create: {
      email: 'admin@ams.com',
      password: hashedRootPassword,
      name: 'Owner Kos',
      role: 'super_admin'
    },
  });

  // Create staff admin user (Kasir)
  const hashedStaffPassword = await hash('kasir123', 12);
  await prisma.user.upsert({
    where: { email: 'kasir@kos.com' },
    update: {
      role: 'admin'
    },
    create: {
      email: 'kasir@kos.com',
      password: hashedStaffPassword,
      name: 'Kasir Kos',
      role: 'admin'
    },
  });

  // 2. Create 5 clean rooms on Floor 1 (A1-A5) as a template
  for (let i = 1; i <= 5; i++) {
    const roomName = `A${i}`;
    const roomId = roomName.toLowerCase();
    
    await prisma.room.upsert({
      where: { id: roomId },
      update: {},
      create: {
        id: roomId,
        name: roomName,
        floor: 1,
        price: 800000,
        status: 'kosong'
      }
    });
  }

  // 3. Create default settings
  const existingSetting = await prisma.setting.findFirst();
  if (!existingSetting) {
    await prisma.setting.create({
      data: {
        id: 'default',
        namaKos: "A'aTHaRaZ",
        deskripsi: "Kos premium dengan fasilitas lengkap dan nyaman",
        alamat: "Jl. Contoh No. 123, Kota",
        telepon: "081234567890",
        email: "kos@example.com",
        whatsapp: "6281234567890",
        website: "",
        instagram: "kos_aatharaz",
        facebook: "",
        colorUtama: "#4F46E5",
        colorSidebar: "#0F172A",
        rekening: "BCA: 123456789 a/n Arman Syam",
        fasilitas: "WiFi Gratis,Parkir Luas,Keamanan 24 Jam,Air Bersih,Listrik Termasuk,Bersih & Nyaman"
      },
    });
  }

  console.log('✅ Template Seed data (Admin & 5 Clean Rooms in Floor 1) created successfully');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
