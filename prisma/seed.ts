import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Keep existing users on deploy; only create defaults if missing

  // 1. Create super admin user (Owner/Root) if missing
  const superAdmin = await prisma.user.findUnique({
    where: { email: 'admin@super.com' },
  });
  if (!superAdmin) {
    const hashedSuperPassword = await hash('superadmin', 12);
    await prisma.user.create({
      data: {
        email: 'admin@super.com',
        password: hashedSuperPassword,
        name: 'Owner Kos',
        role: 'super_admin'
      },
    });
  }

  // 2. Create staff admin user (Kasir/Staff) if missing
  const staffAdmin = await prisma.user.findUnique({
    where: { email: 'admin@ams.com' },
  });
  if (!staffAdmin) {
    const hashedStaffPassword = await hash('admin123', 12);
    await prisma.user.create({
      data: {
        email: 'admin@ams.com',
        password: hashedStaffPassword,
        name: 'Kasir Kos',
        role: 'admin'
      },
    });
  }

  // 3. Skip room seeding on deploy to avoid overwriting existing server rooms
  // Rooms are managed manually in production.

  // 4. Create default settings
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

  console.log('✅ Seed data (admin, rooms, settings) created successfully');
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
