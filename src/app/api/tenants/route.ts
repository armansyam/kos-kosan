import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function parseDateInput(dateStr: string) {
  // Stabil input type="date" biar tak geser timezone
  return new Date(`${dateStr}T12:00:00`);
}

export async function GET() {
  try {
    const tenants = await prisma.tenant.findMany({
      include: {
        room: true,
        bills: {
          include: { payments: true },
          orderBy: { dueDate: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(tenants);
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengambil data penghuni' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fullName, whatsapp, roomId, checkInDate, monthlyPrice, dueDate, notes } = body;

    // Validasi: room belum punya tenant aktif
    const existingActive = await prisma.tenant.count({
      where: { roomId, active: true },
    });
    if (existingActive > 0) {
      return NextResponse.json(
        { error: 'Kamar sudah memiliki penghuni aktif. Checkout dulu sebelum menambah penghuni baru.' },
        { status: 400 }
      );
    }

    // Update room status to "terisi"
    await prisma.room.update({ where: { id: roomId }, data: { status: 'terisi' } });

    const tenant = await prisma.tenant.create({
      data: {
        fullName,
        whatsapp,
        roomId,
        checkInDate: checkInDate ? parseDateInput(checkInDate) : new Date(),
        monthlyPrice,
        dueDate,
        notes
      },
    });
    return NextResponse.json(tenant, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal menambah penghuni' }, { status: 500 });
  }
}
