import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get('limit');
  try {
    const payments = await prisma.payment.findMany({
      include: { bill: { include: { tenant: { include: { room: true } } } } },
      orderBy: { paymentDate: 'desc' },
      ...(limit ? { take: parseInt(limit) } : {}),
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

    // Dapatkan data pembayaran lama untuk menghitung total cicilan
    const existingPayments = await prisma.payment.findMany({
      where: { billId },
    });

    const totalPaidBefore = existingPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalPaidAfter = totalPaidBefore + amount;

    const payment = await prisma.payment.create({
      data: {
        billId,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        paymentMethod: paymentMethod || 'transfer',
        amount,
        notes: notes || '',
      },
    });

    // Update status tagihan secara dinamis
    // Jika total terbayar sudah mencakup nominal tagihan, set Lunas. Jika kurang, tetap belum_bayar (cicil)
    const isFullyPaid = totalPaidAfter >= bill.amount;
    await prisma.bill.update({
      where: { id: billId },
      data: { status: isFullyPaid ? 'lunas' : 'belum_bayar' },
    });

    // Check if tenant has any remaining unpaid bills (including partially unpaid ones)
    const remainingUnpaid = await prisma.bill.count({
      where: {
        tenantId: bill.tenantId,
        status: 'belum_bayar',
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
