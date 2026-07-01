const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function reset() {
  console.log('🔄 Mereset akun super admin ke default (admin@super.com / superadmin)...');
  
  const hashedPassword = await bcrypt.hash('superadmin', 12);
  
  // Upsert the admin user with email admin@super.com
  await prisma.user.upsert({
    where: { email: 'admin@super.com' },
    update: {
      password: hashedPassword,
      name: 'Owner Kos',
      role: 'super_admin',
    },
    create: {
      email: 'admin@super.com',
      password: hashedPassword,
      name: 'Owner Kos',
      role: 'super_admin',
    },
  });

  console.log('✅ Akun super admin berhasil direset!');
  console.log('📧 Email   : admin@super.com');
  console.log('🔑 Password: superadmin');
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
