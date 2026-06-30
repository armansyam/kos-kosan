const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function reset() {
  console.log('🔄 Mereset akun admin ke default (admin@ams.com / admin123)...');
  
  const hashedPassword = await bcrypt.hash('admin123', 12);
  
  // Upsert the admin user with email admin@ams.com
  await prisma.user.upsert({
    where: { email: 'admin@ams.com' },
    update: {
      password: hashedPassword,
      name: 'Admin Kos',
    },
    create: {
      email: 'admin@ams.com',
      password: hashedPassword,
      name: 'Admin Kos',
    },
  });

  console.log('✅ Akun admin berhasil direset!');
  console.log('📧 Email   : admin@ams.com');
  console.log('🔑 Password: admin123');
}

reset()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Gagal mereset admin:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
