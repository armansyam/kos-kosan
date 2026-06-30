import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // 1. Create admin user
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

  // 2. Create 15 clean rooms (Lantai 1: A1-A5, Lantai 2: B1-B5, Lantai 3: C1-C5)
  const floors = [
    { name: '1', prefix: 'A' },
    { name: '2', prefix: 'B' },
    { name: '3', prefix: 'C' }
  ];

  for (const floor of floors) {
    for (let i = 1; i <= 5; i++) {
      const roomName = `${floor.prefix}${i}`;
      const roomId = roomName.toLowerCase();
      
      // Default price based on floor
      let price = 800000;
      if (floor.name === '2') price = 1000000;
      if (floor.name === '3') price = 1200000;

      await prisma.room.upsert({
        where: { id: roomId },
        update: {},
        create: {
          id: roomId,
          name: roomName,
          floor: parseInt(floor.name),
          price: price,
          status: 'kosong'
        }
      });
    }
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

  console.log('✅ Production Seed data (Admin & 15 Clean Rooms) created successfully');
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
