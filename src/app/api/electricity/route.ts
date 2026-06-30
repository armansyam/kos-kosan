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

    // Default kwhAdded = nominal/1528 (tarif R1/1300)
    const kwh = kwhAdded ?? Math.round((nominal / 1528) * 100) / 100;
    // Default estimatedDaysLeft = currentKwh / (avg usage ~8kwh/day)
    const days = estimatedDaysLeft ?? Math.round((currentKwh || 0) / 8);

    const log = await prisma.electricityLog.create({
      data: {
        topupDate: new Date(),
        nominal,
        kwhAdded: kwh,
        currentKwh: currentKwh || 0,
        estimatedDaysLeft: days,
      },
    });
    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mencatat listrik' }, { status: 500 });
  }
}