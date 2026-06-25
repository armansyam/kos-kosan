import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const payments = await prisma.payment.findMany({
      include: { bill: { include: { tenant: { include: { room: true } } } } },
      orderBy: { paymentDate: 'desc' },
    });
    return NextResponse.json(payments);
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengambil data pembayaran' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { billId, paymentDate, paymentMethod, amount, notes } = body;

    // Get the bill first to find the tenant and room
    const bill = await prisma.bill.findUnique({
      where: { id: billId },
      include: { tenant: { include: { room: true } } },
    });

    if (!bill) {
      return NextResponse.json({ error: 'Tagihan tidak ditemukan' }, { status: 404 });
    }

    const payment = await prisma.payment.create({
      data: {
        billId,
        paymentDate: new Date(paymentDate),
        paymentMethod,
        amount,
        notes,
      },
    });

    // Update bill status to lunas
    await prisma.bill.update({
      where: { id: billId },
      data: { status: 'lunas' },
    });

    // Check if tenant has any remaining unpaid bills
    const remainingUnpaid = await prisma.bill.count({
      where: {
        tenantId: bill.tenantId,
        status: 'belum_bayar',
        id: { not: billId },
      },
    });

    // If no more unpaid bills, update room status back to terisi
    if (remainingUnpaid === 0) {
      await prisma.room.update({
        where: { id: bill.tenant.roomId },
        data: { status: 'terisi' },
      });
    }

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal membuat pembayaran' }, { status: 500 });
  }
}
