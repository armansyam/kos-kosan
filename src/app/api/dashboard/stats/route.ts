import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureCurrentMonthBills } from '@/lib/billing';

export async function GET() {
  try {
    await ensureCurrentMonthBills();
    const today = new Date();
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    // 7 days from now for due date range
    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    const rooms = await prisma.room.findMany({
      include: {
        tenants: {
          where: { active: true },
          include: {
            bills: {
              where: { status: 'belum_bayar' },
            },
          },
        },
      },
    });

    let occupiedRooms = 0;
    let emptyRooms = 0;
    let overdueRooms = 0;

    for (const room of rooms) {
      const activeTenants = room.tenants || [];
      if (activeTenants.length === 0) {
        emptyRooms++;
        // Auto-fix: if room status says terisi/menunggak but no active tenants
        if (room.status !== 'kosong') {
          await prisma.room.update({ where: { id: room.id }, data: { status: 'kosong' } });
        }
      } else {
        const hasOverdue = activeTenants.some(t => t.bills.some(bill => new Date(bill.dueDate) < today));
        if (hasOverdue) {
          overdueRooms++;
          if (room.status !== 'menunggak') {
            await prisma.room.update({ where: { id: room.id }, data: { status: 'menunggak' } });
          }
        } else {
          occupiedRooms++;
          if (room.status !== 'terisi') {
            await prisma.room.update({ where: { id: room.id }, data: { status: 'terisi' } });
          }
        }
      }
    }

    const [
      totalRooms,
      currentMonthBills,
      totalPayments,
      overdueBills,
      upcomingBills,
      latestElectricity,
    ] = await Promise.all([
      prisma.room.count(),
      prisma.bill.aggregate({
        where: { month: currentMonth },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
      }),
      prisma.bill.count({
        where: { status: 'belum_bayar', dueDate: { lt: today } },
      }),
      prisma.bill.count({
        where: {
          status: 'belum_bayar',
          dueDate: { gte: today, lte: sevenDaysLater },
        },
      }),
      prisma.electricityLog.findFirst({
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const totalRevenue = await prisma.payment.aggregate({
      _sum: { amount: true },
    });

    return NextResponse.json({
      totalRooms,
      occupiedRooms,
      emptyRooms,
      overdueRooms,
      currentMonthBills: currentMonthBills._sum.amount || 0,
      totalPayments: totalPayments._sum.amount || 0,
      totalRevenue: totalRevenue._sum.amount || 0,
      overdueCount: overdueBills,
      upcomingDueCount: upcomingBills,
      latestElectricity: latestElectricity
        ? {
            currentKwh: latestElectricity.currentKwh,
            topupDate: latestElectricity.topupDate,
            nominal: latestElectricity.nominal,
            estimatedDaysLeft: latestElectricity.estimatedDaysLeft,
          }
        : null,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: 'Gagal mengambil statistik dashboard' }, { status: 500 });
  }
}
