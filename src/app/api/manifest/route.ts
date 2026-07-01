import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Endpoint ini menggantikan /public/manifest.json
// Manifest dibuat secara dinamis berdasarkan settings di database
// sehingga nama app, icon, dan warna tema selalu up-to-date
export async function GET() {
  try {
    const setting = await prisma.setting.findFirst();

    const namaKos = setting?.namaKos || "Kos-kosan";
    const colorUtama = setting?.colorUtama || '#4f46e5';
    const logo = setting?.logo || null;

    // Susun daftar icons — kalau ada logo dari DB, pakai itu dulu
    // Fallback ke icon statis jika logo belum diupload
    const icons: { src: string; sizes: string; type: string; purpose: string }[] = [];

    if (logo) {
      // Logo dari pengaturan (bisa base64 atau URL)
      // Untuk manifest, kita arahkan ke endpoint proxy agar bisa di-cache browser
      icons.push(
        { src: '/api/manifest/icon?size=192', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
        { src: '/api/manifest/icon?size=512', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
      );
    } else {
      icons.push(
        { src: '/icons/icon-32.png',  sizes: '32x32',   type: 'image/png', purpose: 'any' },
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
      );
    }

    const manifest = {
      name: `${namaKos} — Manajemen Kos`,
      short_name: namaKos,
      description: setting?.deskripsi || 'Aplikasi manajemen kos modern.',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      orientation: 'any',
      background_color: '#0f0f23',
      theme_color: colorUtama,
      lang: 'id',
      categories: ['business', 'productivity'],
      icons,
      shortcuts: [
        {
          name: 'Dashboard',
          short_name: 'Dashboard',
          description: 'Buka halaman dashboard',
          url: '/dashboard',
          icons: [{ src: logo ? '/api/manifest/icon?size=192' : '/icons/icon-192.png', sizes: '192x192' }],
        },
        {
          name: 'Penghuni',
          short_name: 'Penghuni',
          description: 'Kelola data penghuni',
          url: '/penghuni',
          icons: [{ src: logo ? '/api/manifest/icon?size=192' : '/icons/icon-192.png', sizes: '192x192' }],
        },
      ],
    };

    return new NextResponse(JSON.stringify(manifest), {
      headers: {
        'Content-Type': 'application/manifest+json',
        // Revalidate setiap 1 jam agar perubahan logo segera terlihat
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Manifest API error:', error);
    // Fallback manifest minimal kalau DB error
    return new NextResponse(
      JSON.stringify({
        name: 'Kos-kosan',
        short_name: 'Kos-kosan',
        start_url: '/',
        display: 'standalone',
        background_color: '#0f0f23',
        theme_color: '#4f46e5',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      }),
      { headers: { 'Content-Type': 'application/manifest+json' } }
    );
  }
}
