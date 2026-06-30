import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, price, status, notes, floor } = body;

    const room = await prisma.room.update({
      where: { id },
      data: { 
        name, 
        price, 
        status, 
        notes, 
        floor: floor ? parseInt(floor as any) : 1 
      },
    });
    return NextResponse.json(room);
  } catch (error) {
    console.error('PUT room error:', error);
    return NextResponse.json({ error: 'Gagal mengupdate kamar', detail: String(error) }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.room.delete({ where: { id } });
    return NextResponse.json({ message: 'Kamar dihapus' });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal menghapus kamar' }, { status: 500 });
  }
}