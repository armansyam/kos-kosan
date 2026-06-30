import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { month } = body; // Expected format "YYYY-MM", e.g., "2026-07"

    if (!month || !month.includes('-')) {
      return NextResponse.json({ error: 'Format bulan harus YYYY-MM' }, { status: 400 });
    }

    const [yearStr, monthStr] = month.split('-');
    const year = parseInt(yearStr);
    const monthInt = parseInt(monthStr);

    if (isNaN(year) || isNaN(monthInt) || monthInt < 1 || monthInt > 12) {
      return NextResponse.json({ error: 'Format bulan tidak valid' }, { status: 400 });
    }

    // Get all active tenants
    const tenants = await prisma.tenant.findMany({
      where: { active: true },
      include: { room: true },
    });

    let generatedCount = 0;

    for (const tenant of tenants) {
      // Check if bill already exists for this month
      const existingBill = await prisma.bill.findFirst({
        where: {
          tenantId: tenant.id,
          month: month,
        },
      });

      if (!existingBill) {
        // Calculate due date based on tenant's dueDate day
        // Ensure day is valid for the target month
        const maxDays = new Date(year, monthInt, 0).getDate();
        const dueDay = Math.min(tenant.dueDate, maxDays);
        const dueDate = new Date(year, monthInt - 1, dueDay, 12, 0, 0); // set to noon to avoid timezone shifts

        await prisma.bill.create({
          data: {
            tenantId: tenant.id,
            month: month,
            amount: tenant.monthlyPrice,
            dueDate: dueDate,
            status: 'belum_bayar',
          },
        });

        generatedCount++;
      }
    }

    return NextResponse.json({
      message: `Berhasil membuat ${generatedCount} tagihan untuk bulan ${month}`,
      count: generatedCount,
    });
  } catch (error) {
    console.error('Auto generate bills error:', error);
    return NextResponse.json({ error: 'Gagal membuat tagihan otomatis', detail: String(error) }, { status: 500 });
  }
}
