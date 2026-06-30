import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    let setting = await prisma.setting.findFirst();
    if (!setting) {
      setting = await prisma.setting.create({
        data: {
          id: 'default',
          namaKos: "A'aTHaRaZ",
          deskripsi: "Kos premium dengan fasilitas lengkap dan nyaman",
          alamat: "Jl. Contoh No. 123, Kota",
          telepon: "081234567890",
          email: "kos@example.com",
          whatsapp: "6281234567890",
          website: "",
          instagram: "kos_aatharaz",
          facebook: "",
          colorUtama: "#4F46E5",
          colorSidebar: "#0F172A",
          rekening: "",
        },
      });
    }
    return NextResponse.json(setting);
  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json({ error: 'Gagal mengambil pengaturan' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      namaKos,
      deskripsi,
      alamat,
      telepon,
      email,
      whatsapp,
      website,
      instagram,
      facebook,
      logo,
      colorUtama,
      colorSidebar,
      rekening,
    } = body;

    let setting = await prisma.setting.findFirst();
    if (setting) {
      setting = await prisma.setting.update({
        where: { id: setting.id },
        data: {
          namaKos,
          deskripsi,
          alamat,
          telepon,
          email,
          whatsapp,
          website,
          instagram,
          facebook,
          logo,
          colorUtama,
          colorSidebar,
          rekening,
        },
      });
    } else {
      setting = await prisma.setting.create({
        data: {
          id: 'default',
          namaKos,
          deskripsi,
          alamat,
          telepon,
          email,
          whatsapp,
          website,
          instagram,
          facebook,
          logo,
          colorUtama,
          colorSidebar,
          rekening,
        },
      });
    }

    return NextResponse.json(setting);
  } catch (error) {
    console.error('Settings POST error:', error);
    return NextResponse.json({ error: 'Gagal menyimpan pengaturan' }, { status: 500 });
  }
}
