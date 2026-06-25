import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const logs = await prisma.electricityLog.findMany({
      orderBy: { topupDate: 'desc' },
      take: 30,
    });
    return NextResponse.json(logs);
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengambil data listrik' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nominal, kwhAdded, currentKwh, estimatedDaysLeft } = body;

    const log = await prisma.electricityLog.create({
      data: {
        topupDate: new Date(),
        nominal,
        kwhAdded,
        currentKwh,
        estimatedDaysLeft,
      },
    });
    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mencatat listrik' }, { status: 500 });
  }
}