import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { fullName, whatsapp, roomId, monthlyPrice, dueDate, notes } = body;

    // Get current tenant to see if roomId changed
    const currentTenant = await prisma.tenant.findUnique({
      where: { id },
    });

    if (!currentTenant) {
      return NextResponse.json({ error: 'Penghuni tidak ditemukan' }, { status: 404 });
    }

    // If room is changing, validate the new room doesn't have another active tenant
    if (roomId && roomId !== currentTenant.roomId) {
      const activeTenantInNewRoom = await prisma.tenant.findFirst({
        where: { roomId, active: true, id: { not: id } }
      });
      if (activeTenantInNewRoom) {
        return NextResponse.json(
          { error: 'Kamar baru sudah memiliki penghuni aktif lain.' },
          { status: 400 }
        );
      }
    }

    const tenant = await prisma.tenant.update({
      where: { id },
      data: { fullName, whatsapp, roomId, monthlyPrice, dueDate, notes },
    });

    // If room changed, adjust room statuses
    if (roomId && roomId !== currentTenant.roomId) {
      // Set new room status to "terisi"
      await prisma.room.update({
        where: { id: roomId },
        data: { status: 'terisi' }
      });

      // Check if old room has any other active tenants left
      const otherActiveInOldRoom = await prisma.tenant.count({
        where: { roomId: currentTenant.roomId, active: true, id: { not: id } }
      });
      if (otherActiveInOldRoom === 0) {
        await prisma.room.update({
          where: { id: currentTenant.roomId },
          data: { status: 'kosong' }
        });
      }
    }

    return NextResponse.json(tenant);
  } catch (error) {
    console.error('Update tenant error:', error);
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
