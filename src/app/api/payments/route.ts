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

    if (!billId) {
      return NextResponse.json({ error: 'billId wajib diisi' }, { status: 400 });
    }

    const normalizedAmount = Number(amount);
    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
      return NextResponse.json({ error: 'Nominal pembayaran tidak valid' }, { status: 400 });
    }

    // Get the bill first to find the tenant and room
    const bill = await prisma.bill.findUnique({
      where: { id: billId },
      include: { tenant: { include: { room: true } } },
    });

    if (!bill) {
      return NextResponse.json({ error: 'Tagihan tidak ditemukan' }, { status: 404 });
    }

    const paymentDateValue = paymentDate ? new Date(paymentDate) : new Date();

    // Guard anti-submit dobel: block payment sama persis untuk tagihan yang sama
    const duplicatePayment = await prisma.payment.findFirst({
      where: {
        billId,
        amount: normalizedAmount,
        paymentMethod: paymentMethod || 'transfer',
        paymentDate: paymentDate ? {
          gte: new Date(paymentDateValue.getTime() - 1000),
          lte: new Date(paymentDateValue.getTime() + 1000),
        } : undefined,
      },
    });

    if (duplicatePayment) {
      return NextResponse.json(
        { error: 'Pembayaran duplikat terdeteksi. Data sudah tersimpan sebelumnya.' },
        { status: 409 }
      );
    }

    // Dapatkan data pembayaran lama untuk menghitung total cicilan
    const existingPayments = await prisma.payment.findMany({
      where: { billId },
    });

    const totalPaidBefore = existingPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalPaidAfter = totalPaidBefore + normalizedAmount;

    const payment = await prisma.payment.create({
      data: {
        billId,
        paymentDate: paymentDateValue,
        paymentMethod: paymentMethod || 'transfer',
        amount: normalizedAmount,
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
