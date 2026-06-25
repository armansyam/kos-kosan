import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const tenants = await prisma.tenant.findMany({
      include: { room: true },
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

    // Update room status to "terisi"
    await prisma.room.update({ where: { id: roomId }, data: { status: 'terisi' } });

    const tenant = await prisma.tenant.create({
      data: { fullName, whatsapp, roomId, checkInDate: new Date(checkInDate), monthlyPrice, dueDate, notes },
    });
    return NextResponse.json(tenant, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal menambah penghuni' }, { status: 500 });
  }
}