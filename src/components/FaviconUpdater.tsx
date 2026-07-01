'use client';

import { useEffect } from 'react';

export function FaviconUpdater() {
  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (!data || data.error) return;

        // 1. Update semua link favicon — pakai endpoint dinamis yang baca logo dari DB
        //    Ini memastikan tab browser selalu pakai logo terbaru setelah settings berubah
        const iconUrl = '/api/manifest/icon?size=32&t=' + Date.now(); // cache-bust
        const rels = ['icon', 'shortcut icon', 'apple-touch-icon'];

        rels.forEach((rel) => {
          // Hapus semua link lama untuk rel ini
          document.querySelectorAll(`link[rel="${rel}"]`).forEach(el => el.remove());

          // Buat baru
          const link = document.createElement('link');
          link.rel = rel;
          link.href = rel === 'apple-touch-icon'
            ? '/api/manifest/icon?size=192&t=' + Date.now()
            : iconUrl;
          document.head.appendChild(link);
        });

        // 2. Update tab title jika nama kos sudah di-setting
        if (data.namaKos) {
          const currentTitle = document.title;
          if (currentTitle.includes('—')) {
            const pagePart = currentTitle.split('—')[0].trim();
            document.title = `${pagePart} — ${data.namaKos}`;
          } else {
            document.title = `${data.namaKos} — Manajemen Kos`;
          }
        }
      })
      .catch((err) => console.error('FaviconUpdater error:', err));
  }, []);

  return null;
}
