'use client';

import { useEffect } from 'react';

export function FaviconUpdater() {
  useEffect(() => {
    // Jalankan hanya SEKALI per session browser (bukan tiap navigasi)
    // Ini mencegah favicon di-download ulang setiap klik sidebar
    if (sessionStorage.getItem('favicon-done')) return;

    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (!data || data.error) return;

        sessionStorage.setItem('favicon-done', '1');

        // Update favicon hanya jika ada logo custom
        if (data.logo) {
          // Gunakan endpoint tanpa cache-buster agar browser bisa cache dengan benar
          const iconHref = '/api/manifest/icon?size=32';
          const appleHref = '/api/manifest/icon?size=192';

          const setIcon = (rel: string, href: string) => {
            let link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
            if (!link) {
              link = document.createElement('link');
              link.rel = rel;
              document.head.appendChild(link);
            }
            if (link.href !== href) link.href = href;
          };

          setIcon('icon', iconHref);
          setIcon('shortcut icon', iconHref);
          setIcon('apple-touch-icon', appleHref);
        }

        // Update tab title sekali saja
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
      .catch(() => {});
  }, []);

  return null;
}
