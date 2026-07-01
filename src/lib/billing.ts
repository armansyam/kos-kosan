import { prisma } from './prisma';

function buildBillDueDate(billYear: number, billMonthInt: number, dueDay: number, checkInDate: Date) {
  const maxDays = new Date(billYear, billMonthInt, 0).getDate();
  const clampedDueDay = Math.min(dueDay, maxDays);

  const billMonthStart = new Date(billYear, billMonthInt - 1, 1, 0, 0, 0);
  const billDueDateThisMonth = new Date(billYear, billMonthInt - 1, clampedDueDay, 12, 0, 0);
  const billDueDateNextMonth = new Date(billYear, billMonthInt, clampedDueDay, 12, 0, 0);

  const checkIn = new Date(checkInDate);
  checkIn.setHours(0, 0, 0, 0);

  // Check-in setelah tanggal jatuh tempo bulan itu => tagihan pertama masuk bulan depan
  if (checkIn > billDueDateThisMonth) {
    return billDueDateNextMonth;
  }

  // Check-in di bulan tagihan tapi sebelum/di tanggal jatuh tempo => tagihan bulan ini valid
  if (checkIn >= billMonthStart) {
    return billDueDateThisMonth;
  }

  return billDueDateThisMonth;
}

export async function ensureCurrentMonthBills() {
  try {
    const today = new Date();
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    const tenants = await prisma.tenant.findMany({
      where: {
        active: true,
        checkInDate: {
          lte: today,
        },
      },
    });

    const year = today.getFullYear();
    const monthInt = today.getMonth() + 1;

    for (const tenant of tenants) {
      const existingBill = await prisma.bill.findFirst({
        where: {
          tenantId: tenant.id,
          month: currentMonth,
        },
      });

      if (!existingBill) {
        const dueDate = buildBillDueDate(year, monthInt, tenant.dueDate, tenant.checkInDate);

        await prisma.bill.create({
          data: {
            tenantId: tenant.id,
            month: currentMonth,
            amount: tenant.monthlyPrice,
            dueDate,
            status: 'belum_bayar',
          },
        });
      }
    }
  } catch (error) {
    console.error('Error in JIT auto bill generation:', error);
  }
}