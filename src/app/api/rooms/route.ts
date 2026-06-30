import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const rooms = await prisma.room.findMany({
      include: {
        tenants: {
          where: { active: true },
          take: 1,
          include: {
            bills: {
              where: { status: 'belum_bayar' },
            },
          },
        },
      },
      orderBy: [
        { floor: 'asc' },
        { name: 'asc' },
      ],
    });

    const today = new Date();

    // Compute accurate status on-the-fly based on bill data (no DB writes in GET)
    const result = rooms.map(room => {
      const tenant = room.tenants?.[0];
      if (!tenant) return { ...room, status: 'kosong' };

      const hasOverdue = tenant.bills.some(bill => new Date(bill.dueDate) < today);
      if (hasOverdue) return { ...room, status: 'menunggak' };

      return room; // terisi
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengambil data kamar' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, price, status, notes, floor } = body;

    const room = await prisma.room.create({
      data: { 
        name, 
        price, 
        status: status || 'kosong', 
        notes, 
        floor: floor ? parseInt(floor) : 1 
      },
    });
    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    console.error('Room create error:', error);
    return NextResponse.json({ error: 'Gagal membuat kamar' }, { status: 500 });
  }
}