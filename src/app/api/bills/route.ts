import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const bills = await prisma.bill.findMany({
      include: { tenant: { include: { room: true } }, payments: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(bills);
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengambil data tagihan' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tenantId, month, amount, dueDate } = body;

    const bill = await prisma.bill.create({
      data: { tenantId, month, amount, dueDate: new Date(dueDate) },
    });
    return NextResponse.json(bill, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal membuat tagihan' }, { status: 500 });
  }
}