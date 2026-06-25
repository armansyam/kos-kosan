import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    const bill = await prisma.bill.update({
      where: { id },
      data: { status },
    });
    return NextResponse.json(bill);
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengupdate tagihan' }, { status: 500 });
  }
}