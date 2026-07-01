import type { Metadata, Viewport } from 'next';
import './globals.css';
import './dashboard-styles.css';
import './landing-styles.css';
import { SessionProviderWrapper } from '@/components/SessionProviderWrapper';
import { prisma } from '@/lib/prisma';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#4f46e5',
};

export const metadata: Metadata = {
  title: "A'aTHaRaZ — Manajemen Kos",
  description: 'Aplikasi manajemen kos modern untuk mengelola kamar, penghuni, tagihan, pembayaran, dan monitoring listrik.',
  manifest: '/api/manifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: "Kos-kosan",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Query db to get settings update timestamp as a favicon cache-buster
  const setting = await prisma.setting.findFirst({ select: { updatedAt: true } });
  const version = setting?.updatedAt ? new Date(setting.updatedAt).getTime() : Date.now();

  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        {/* PWA Manifest — dinamis dari database */}
        <link rel="manifest" href={`/api/manifest?v=${version}`} />
        {/* Favicon & Apple Touch Icon — dinamis mengikuti logo pengaturan dari database */}
        <link rel="icon" href={`/api/manifest/icon?size=32&v=${version}`} type="image/png" />
        <link rel="shortcut icon" href={`/api/manifest/icon?size=32&v=${version}`} type="image/png" />
        <link rel="apple-touch-icon" href={`/api/manifest/icon?size=192&v=${version}`} />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        {/* Register Service Worker */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .catch(function(err) { console.warn('SW registration failed:', err); });
                });
              }
            `,
          }}
        />
      </head>
      <body>
        <SessionProviderWrapper>{children}</SessionProviderWrapper>
      </body>
    </html>
  );
}
