import { prisma } from './prisma';

export async function ensureCurrentMonthBills() {
  try {
    const today = new Date();
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    
    // Ambil semua penghuni aktif
    const tenants = await prisma.tenant.findMany({
      where: { active: true },
    });
    
    const year = today.getFullYear();
    const monthInt = today.getMonth() + 1;

    for (const tenant of tenants) {
      // Periksa apakah sudah ada tagihan untuk penghuni ini di bulan berjalan
      const existingBill = await prisma.bill.findFirst({
        where: {
          tenantId: tenant.id,
          month: currentMonth,
        },
      });

      // Jika belum ada tagihan untuk bulan berjalan, buat otomatis
      if (!existingBill) {
        const maxDays = new Date(year, monthInt, 0).getDate();
        const dueDay = Math.min(tenant.dueDate, maxDays);
        const dueDate = new Date(year, monthInt - 1, dueDay, 12, 0, 0); // Noon

        await prisma.bill.create({
          data: {
            tenantId: tenant.id,
            month: currentMonth,
            amount: tenant.monthlyPrice,
            dueDate: dueDate,
            status: 'belum_bayar',
          },
        });
      }
    }
  } catch (error) {
    console.error('Error in JIT auto bill generation:', error);
  }
}
