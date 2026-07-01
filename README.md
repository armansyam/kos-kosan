# 🚀 Aplikasi Manajemen Kos (AMS)

Aplikasi web manajemen kos-kosan modern berbasis **Next.js (App Router)** dan **Prisma ORM (SQLite)**.

---

## 🔑 Kredensial Login Default

Berikut adalah akun bawaan yang terbuat setelah melakukan inisialisasi database (seeding):

### 1. Peran: Owner (Super Admin)
* **Email / Username**: `admin@super.com`
* **Password**: `superadmin`
* **Hak Akses**: Mengelola seluruh kamar, transaksi, pengeluaran, laporan keuangan, dan menambah/menghapus akun Staff/Kasir.

### 2. Peran: Staff / Kasir (Admin Biasa)
* **Email / Username**: `admin@ams.com`
* **Password**: `admin123`
* **Hak Akses**: Mengelola kamar, penghuni, tagihan, dan pengeluaran. **Tidak dapat** melihat menu Laporan Keuangan, Total Pendapatan di Dashboard, atau mengelola akun staff lainnya.

---

## 🛠️ Panduan Menjalankan Aplikasi

### 1. Inisialisasi Database & Jalankan Lokal
Pastikan Node.js sudah terinstall, kemudian jalankan perintah berikut secara berurutan:
```bash
# 1. Install dependencies
npm install

# 2. Sinkronisasi database SQLite
npx prisma db push

# 3. Masukkan data seed awal (Membuat akun default di atas)
npx prisma db seed

# 4. Jalankan aplikasi dalam mode development
npm run dev
```
Aplikasi akan berjalan di alamat: `http://localhost:3000` (atau port alternatif seperti `http://localhost:3001`).

### 2. Deployment Otomatis (Production/VPS)
Jika Anda men-deploy ke server Linux/VPS, gunakan skrip otomatisasi yang telah disediakan:
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## 🚨 Pemulihan Darurat (Emergency Recovery)

### Skrip Reset Cepat Superadmin
Jika Anda lupa password Owner (Superadmin) utama, Anda bisa meresetnya kembali ke setelan pabrik (`admin@super.com` / `superadmin`) dengan menjalankan perintah CLI berikut di server Anda:
```bash
node reset-admin.js
```

### Bypass Login via `.env` (Master Backdoor)
Anda juga dapat login darurat menggunakan akun master bypass yang didefinisikan langsung di file `.env`. Akun ini akan selalu bisa login meskipun database SQLite Anda kosong atau terhapus:
1. Buka file `.env` di server Anda.
2. Definisikan variabel berikut:
   ```env
   ROOT_EMAIL="root@ams.com"
   ROOT_PASSWORD="rootmasterpassword"
   ```
3. Anda sekarang bisa login menggunakan kredensial tersebut langsung di halaman login.

---

## 🐳 Panduan Menjalankan dengan Docker

Untuk memudahkan deployment tanpa perlu menginstall Node.js secara manual di server, Anda bisa menggunakan Docker & Docker Compose:

### 1. Jalankan Container
Jalankan perintah berikut di root folder project:
```bash
docker-compose up -d --build
```
Aplikasi akan otomatis mengunduh dependencies, melakukan migrasi skema database Prisma, memasukkan data seed awal, dan berjalan pada port `3000` (`http://localhost:3000`).

### 2. Persistensi Data (Volume)
Database SQLite (`dev.db`) disimpan secara aman di dalam Docker volume bernama `prisma-data`. Data Anda tidak akan hilang meskipun container dimatikan atau dibangun ulang.

### 3. Mengubah Konfigurasi
Anda bisa menyesuaikan variabel lingkungan (environment variables) seperti `ROOT_EMAIL`, `ROOT_PASSWORD`, dan port eksternal langsung di dalam file `docker-compose.yml`.