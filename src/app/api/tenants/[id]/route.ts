import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { fullName, whatsapp, roomId, monthlyPrice, dueDate, notes, active } = body;

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
      data: { fullName, whatsapp, roomId, monthlyPrice, dueDate, notes, active },
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
    const body = await request.json().catch(() => ({}));
    const { reason } = body as { reason?: string };

    if (!reason || !reason.trim()) {
      return NextResponse.json({ error: 'Alasan hapus wajib diisi' }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        bills: {
          include: { payments: true }
        }
      }
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Penghuni tidak ditemukan' }, { status: 404 });
    }

    if (tenant.active) {
      await prisma.tenant.update({
        where: { id },
        data: {
          active: false,
          checkOutDate: new Date(),
          notes: tenant.notes ? `${tenant.notes}\n[Hapus permanen diajukan] ${reason}` : `[Hapus permanen diajukan] ${reason}`,
        },
      });
      await prisma.room.update({ where: { id: tenant.roomId }, data: { status: 'kosong' } });
      return NextResponse.json({ message: 'Penghuni diarsipkan. Hapus permanen hanya dari tab arsip.' });
    }

    await prisma.$transaction(async (tx) => {
      for (const bill of tenant.bills) {
        await tx.payment.deleteMany({ where: { billId: bill.id } });
      }
      await tx.bill.deleteMany({ where: { tenantId: id } });
      await tx.tenant.delete({ where: { id } });
      const activeTenantInRoom = await tx.tenant.count({
        where: { roomId: tenant.roomId, active: true }
      });
      if (activeTenantInRoom === 0) {
        await tx.room.update({ where: { id: tenant.roomId }, data: { status: 'kosong' } });
      }
    });

    return NextResponse.json({ message: 'Penghuni dihapus permanen' });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal menghapus penghuni' }, { status: 500 });
  }
}
