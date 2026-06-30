import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureCurrentMonthBills } from '@/lib/billing';

export async function GET() {
  try {
    await ensureCurrentMonthBills();
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
    const { tenantId, month, year, amount, rentAmount, electricityAmount, waterAmount, otherAmount, notes, dueDate } = body;

    // Calculate total amount from individual components or use direct amount
    const totalAmount = amount || (rentAmount || 0) + (electricityAmount || 0) + (waterAmount || 0) + (otherAmount || 0);

    // Create month string in "YYYY-MM" format
    let monthStr = new Date().toISOString().slice(0, 7);
    if (month && typeof month === 'string' && month.includes('-')) {
      monthStr = month;
    } else if (month && year) {
      monthStr = `${year}-${String(month).padStart(2, '0')}`;
    }

    // Default due date: 5th of next month or provided date
    const billDueDate = dueDate
      ? new Date(dueDate)
      : (() => {
          const d = new Date();
          d.setDate(d.getDate() + 30);
          return d;
        })();

    const bill = await prisma.bill.create({
      data: {
        tenantId,
        month: monthStr,
        amount: totalAmount,
        dueDate: billDueDate,
      },
    });
    return NextResponse.json(bill, { status: 201 });
  } catch (error) {
    console.error('Bill create error:', error);
    return NextResponse.json({ error: 'Gagal membuat tagihan' }, { status: 500 });
  }
}
