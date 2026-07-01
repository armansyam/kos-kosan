import { NextRequest, NextResponse } from 'next/server';

// Route handler ini menggantikan favicon.ico statis.
// Setiap request ke /favicon.ico diarahkan ke endpoint icon dinamis
// yang mengambil logo dari database pengaturan.
export async function GET(request: NextRequest) {
  return NextResponse.redirect(
    new URL('/api/manifest/icon?size=32', request.url)
  );
}
