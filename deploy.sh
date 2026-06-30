#!/bin/bash

# Exit on error
set -e

echo "🚀 Memulai otomatisasi deployment Kos App..."

# 1. Cek file .env
if [ ! -f .env ]; then
  echo "📄 Membuat file .env default..."
  echo 'DATABASE_URL="file:./dev.db"' > .env
  echo 'NEXTAUTH_SECRET="'$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")'"' >> .env
  echo 'NEXTAUTH_URL="http://localhost:3000"' >> .env
  echo "⚠️ File .env berhasil dibuat dengan NEXTAUTH_SECRET otomatis. Silakan ubah NEXTAUTH_URL di file .env jika domain Anda berbeda."
fi

# 2. Install dependencies
echo "📦 Menginstall dependencies (npm install)..."
npm install

# 3. Sinkronisasi database
echo "🗄️ Sinkronisasi skema database..."
npx prisma db push

# 4. Jalankan seeder admin default jika database kosong
echo "🌱 Menjalankan data seed (jika diperlukan)..."
npx prisma db seed || true

# 5. Build Next.js app
echo "🛠️ Membangun aplikasi Next.js (npm run build)..."
npm run build

# 6. Jalankan/Restart aplikasi menggunakan PM2 jika terinstall, atau npm run start
if command -v pm2 &> /dev/null; then
  echo "🔄 Menjalankan aplikasi dengan PM2..."
  pm2 delete kos-app &> /dev/null || true
  pm2 start npm --name "kos-app" -- start -- -p 3000
  pm2 save
  echo "🎉 Aplikasi berhasil berjalan di background menggunakan PM2!"
else
  echo "⚠️ PM2 tidak ditemukan. Menjalankan aplikasi secara langsung di port 3000..."
  echo "💡 Tips: Anda bisa menginstall PM2 global dengan 'npm install -g pm2' agar aplikasi bisa jalan di background."
  npm run start
fi
