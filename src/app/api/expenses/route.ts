import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const expenses = await prisma.expense.findMany({
      orderBy: { date: 'desc' },
    });
    return NextResponse.json(expenses);
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengambil data pengeluaran' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { category, description, amount, date } = body;

    const expense = await prisma.expense.create({
      data: {
        category,
        description,
        amount: Number(amount),
        date: new Date(date),
      },
    });
    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal membuat pengeluaran' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID diperlukan' }, { status: 400 });
    }
    await prisma.expense.delete({ where: { id } });
    return NextResponse.json({ message: 'Pengeluaran berhasil dihapus' });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal menghapus pengeluaran' }, { status: 500 });
  }
}