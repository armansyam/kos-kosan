import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { fullName, whatsapp, monthlyPrice, dueDate, notes } = body;

    const tenant = await prisma.tenant.update({
      where: { id },
      data: { fullName, whatsapp, monthlyPrice, dueDate, notes },
    });
    return NextResponse.json(tenant);
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengupdate penghuni' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    if (body.action === 'checkout') {
      const tenant = await prisma.tenant.update({
        where: { id },
        data: {
          active: false,
          checkOutDate: new Date(),
        },
      });
      await prisma.room.update({ where: { id: tenant.roomId }, data: { status: 'kosong' } });
      return NextResponse.json({ message: 'Penghuni berhasil checkout', tenant });
    }
    
    return NextResponse.json({ error: 'Aksi tidak dikenal' }, { status: 400 });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Gagal melakukan checkout', detail: String(error) }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenant = await prisma.tenant.findUnique({ where: { id } });
    if (tenant) {
      await prisma.room.update({ where: { id: tenant.roomId }, data: { status: 'kosong' } });
    }
    await prisma.tenant.delete({ where: { id } });
    return NextResponse.json({ message: 'Penghuni dihapus' });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal menghapus penghuni' }, { status: 500 });
  }
}
