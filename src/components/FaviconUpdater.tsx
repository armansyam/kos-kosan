'use client';

import { useEffect } from 'react';

export function FaviconUpdater() {
  useEffect(() => {
    // Fetch settings to get dynamic logo and kos name
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (!data || data.error) return;

        // 1. Update Favicon (Tab Icon)
        if (data.logo) {
          // Find or create favicon links
          const rels = ['icon', 'shortcut icon', 'apple-touch-icon'];
          rels.forEach((rel) => {
            let link = document.querySelector(`link[rel*="${rel}"]`) as HTMLLinkElement;
            if (!link) {
              link = document.createElement('link');
              link.rel = rel;
              document.head.appendChild(link);
            }
            link.href = data.logo;
          });
        }

        // 2. Update Browser Tab Title if custom name exists
        if (data.namaKos && data.namaKos !== "A'aTHaRaZ") {
          // Update title but preserve page path suffix if present
          const currentTitle = document.title;
          if (currentTitle.includes("—")) {
            const pagePart = currentTitle.split('—')[0].trim();
            document.title = `${pagePart} — ${data.namaKos}`;
          } else if (currentTitle === "A'aTHaRaZ — Manajemen Kos") {
            document.title = `${data.namaKos} — Manajemen Kos`;
          }
        }
      })
      .catch((err) => console.error('Error updating favicon/title:', err));
  }, []);

  return null;
}
