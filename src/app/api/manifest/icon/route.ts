import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Endpoint ini melayani icon PWA secara dinamis dari logo yang diupload di pengaturan.
// Browser manifest merujuk ke /api/manifest/icon?size=192 atau ?size=512
// Endpoint ini mengambil logo dari DB, resize-nya diserahkan ke browser (via img tag),
// dan disajikan sebagai image response.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const size = parseInt(searchParams.get('size') || '192', 10);

    const setting = await prisma.setting.findFirst({ select: { logo: true } });

    if (!setting?.logo) {
      // Tidak ada logo → redirect ke icon statis default
      return NextResponse.redirect(
        new URL(`/icons/icon-${size === 512 ? '512' : '192'}.png`, request.url)
      );
    }

    const logo = setting.logo;

    // Jika logo adalah base64 data URL (format: data:image/...;base64,...)
    if (logo.startsWith('data:')) {
      const matches = logo.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) {
        return NextResponse.redirect(new URL('/icons/icon-192.png', request.url));
      }
      const mimeType = matches[1];
      const base64Data = matches[2];
      const imageBuffer = Buffer.from(base64Data, 'base64');

      return new NextResponse(imageBuffer, {
        headers: {
          'Content-Type': mimeType,
          'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        },
      });
    }

    // Jika logo adalah URL eksternal → fetch dan proxy
    if (logo.startsWith('http://') || logo.startsWith('https://')) {
      const imageRes = await fetch(logo);
      if (!imageRes.ok) {
        return NextResponse.redirect(new URL('/icons/icon-192.png', request.url));
      }
      const contentType = imageRes.headers.get('content-type') || 'image/png';
      const buffer = await imageRes.arrayBuffer();

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        },
      });
    }

    // Jika logo adalah path lokal (misal /uploads/logo.png)
    return NextResponse.redirect(new URL(logo, request.url));
  } catch (error) {
    console.error('Manifest icon error:', error);
    return NextResponse.redirect(new URL('/icons/icon-192.png', request.url));
  }
}
