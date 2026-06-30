'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { TrendingUp, TrendingDown, DollarSign, FileText, Wallet, Receipt, Calendar, BarChart3, Banknote } from 'lucide-react';

export default function LaporanPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/payments').then(r => r.json()),
      fetch('/api/bills').then(r => r.json()),
      fetch('/api/expenses').then(r => r.json()),
    ]).then(([p, b, e]) => {
      setPayments(Array.isArray(p) ? p : []);
      setBills(Array.isArray(b) ? b : []);
      setExpenses(Array.isArray(e) ? e : []);
      setLoading(false);
    });
  }, []);

  function formatRp(n: number) {
    return 'Rp' + n.toLocaleString('id-ID');
  }

  function methodLabel(m: string) {
    const map: Record<string,string> = { transfer:'Transfer Bank', tunai:'Tunai', qris:'QRIS', gopay:'GoPay', ovo:'OVO' };
    return map[m] || m;
  }

  function methodBadgeClass(m: string) {
    if (m==='transfer') return 'badge-info';
    if (m==='tunai') return 'badge-success';
    if (m==='qris'||m==='gopay'||m==='ovo') return 'badge-warning';
    return 'badge-gray';
  }

  // === PENDAPATAN ===
  const totalIncome = payments.reduce((s, p) => s + p.amount, 0);
  const totalUnpaid = bills.filter(b => b.status === 'belum_bayar').reduce((s, b) => s + b.amount, 0);
  const totalPaid = bills.filter(b => b.status === 'lunas').reduce((s, b) => s + b.amount, 0);
  const paidBills = bills.filter(b => b.status === 'lunas').length;
  const unpaidBills = bills.filter(b => b.status === 'belum_bayar').length;

  // === PENGELUARAN ===
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const expensesByCategory = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  // === DANA KAS ===
  const danaKas = totalIncome - totalExpenses;

  // === LABA RUGI ===
  const netProfit = totalIncome - totalExpenses;

  // === FILTERED PAYMENTS ===
  const filteredPayments = filterMonth
    ? payments.filter(p => new Date(p.paymentDate).toISOString().slice(0, 7) === filterMonth)
    : payments;

  // === PER BULAN ===
  const monthlyData: Record<string, { income: number; expenses: number; incomeCount: number; expenseCount: number }> = {};
  
  payments.forEach(p => {
    const m = new Date(p.paymentDate).toISOString().slice(0, 7);
    if (!monthlyData[m]) monthlyData[m] = { income: 0, expenses: 0, incomeCount: 0, expenseCount: 0 };
    monthlyData[m].income += p.amount;
    monthlyData[m].incomeCount += 1;
  });

  expenses.forEach(e => {
    const m = new Date(e.date).toISOString().slice(0, 7);
    if (!monthlyData[m]) monthlyData[m] = { income: 0, expenses: 0, incomeCount: 0, expenseCount: 0 };
    monthlyData[m].expenses += e.amount;
    monthlyData[m].expenseCount += 1;
  });

  const sortedMonths = Object.entries(monthlyData).sort((a, b) => b[0].localeCompare(a[0]));
  const monthNames: Record<string, string> = {
    '01': 'Januari', '02': 'Februari', '03': 'Maret', '04': 'April',
    '05': 'Mei', '06': 'Juni', '07': 'Juli', '08': 'Agustus',
    '09': 'September', '10': 'Oktober', '11': 'November', '12': 'Desember',
  };

  function formatMonth(m: string) {
    const [year, month] = m.split('-');
    return `${monthNames[month] || month} ${year}`;
  }

  // === LAPORAN TAHUNAN ===
  const yearlyData: Record<string, { income: number; expenses: number; profit: number; transaksiIncome: number; transaksiExpense: number }> = {};

  payments.forEach(p => {
    const year = new Date(p.paymentDate).getFullYear().toString();
    if (!yearlyData[year]) yearlyData[year] = { income: 0, expenses: 0, profit: 0, transaksiIncome: 0, transaksiExpense: 0 };
    yearlyData[year].income += p.amount;
    yearlyData[year].transaksiIncome += 1;
  });

  expenses.forEach(e => {
    const year = new Date(e.date).getFullYear().toString();
    if (!yearlyData[year]) yearlyData[year] = { income: 0, expenses: 0, profit: 0, transaksiIncome: 0, transaksiExpense: 0 };
    yearlyData[year].expenses += e.amount;
    yearlyData[year].transaksiExpense += 1;
  });

  Object.keys(yearlyData).forEach(y => {
    yearlyData[y].profit = yearlyData[y].income - yearlyData[y].expenses;
  });

  const sortedYears = Object.entries(yearlyData).sort((a, b) => b[0].localeCompare(a[0]));

  // Rata-rata per bulan dalam setahun
  function getMonthlyAvg(yearStr: string, income: number) {
    const months = Object.keys(monthlyData).filter(m => m.startsWith(yearStr));
    return months.length > 0 ? Math.round(income / months.length) : 0;
  }

  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <h2>Laporan Keuangan</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>Ringkasan pendapatan, pengeluaran, dan laba rugi kos</p>
        </div>
      </div>

      {/* STAT KARTU UTAMA (Unified Cash & Income Summary) */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: 20 }}>
        
        {/* Card 1: Saldo Kas */}
        <div className="stat-card" style={{ borderLeft: '4px solid var(--primary)', background: '#F8FAFF' }}>
          <div className="stat-icon blue"><Wallet size={22} /></div>
          <div className="stat-info">
            <h3>Saldo Dana KAS</h3>
            <div className="stat-value" style={{ fontSize: 18, color: 'var(--primary)', fontWeight: 800 }}>
              {danaKas >= 0 ? '+' : ''}{formatRp(danaKas)}
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
              {danaKas >= 0 ? '🟢 Kas Surplus' : '🔴 Kas Defisit'}
            </p>
          </div>
        </div>

        {/* Card 2: Total Pemasukan */}
        <div className="stat-card" style={{ borderLeft: '4px solid var(--success)', background: '#F4FDF7' }}>
          <div className="stat-icon green"><TrendingUp size={22} /></div>
          <div className="stat-info">
            <h3>Total Pemasukan</h3>
            <div className="stat-value" style={{ fontSize: 18, color: 'var(--success)', fontWeight: 800 }}>
              {formatRp(totalIncome)}
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
              {paidBills} tagihan lunas
            </p>
          </div>
        </div>

        {/* Card 3: Total Pengeluaran */}
        <div className="stat-card" style={{ borderLeft: '4px solid var(--danger)', background: '#FDF4F5' }}>
          <div className="stat-icon red"><TrendingDown size={22} /></div>
          <div className="stat-info">
            <h3>Total Pengeluaran</h3>
            <div className="stat-value" style={{ fontSize: 18, color: 'var(--danger)', fontWeight: 800 }}>
              {formatRp(totalExpenses)}
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
              {expenses.length} transaksi keluar
            </p>
          </div>
        </div>

        {/* Card 4: Piutang Belum Bayar */}
        <div className="stat-card" style={{ borderLeft: '4px solid var(--warning)', background: '#FEF9F0' }}>
          <div className="stat-icon orange"><Receipt size={22} /></div>
          <div className="stat-info">
            <h3>Piutang (Belum Bayar)</h3>
            <div className="stat-value" style={{ fontSize: 18, color: 'var(--warning)', fontWeight: 800 }}>
              {formatRp(totalUnpaid)}
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
              {unpaidBills} tagihan pending
            </p>
          </div>
        </div>

      </div>

      {/* Info Banner */}
      <div style={{ padding: '12px 16px', background: '#F0F4FF', borderLeft: '4px solid var(--primary)', borderRadius: 8, fontSize: 13, color: '#312E81', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <span style={{ fontSize: 16 }}>ℹ️</span>
        <span>
          <strong>Informasi Keuangan</strong>: Saldo Dana KAS diperoleh dari Total Pemasukan dikurangi Total Pengeluaran. Total piutang aktif saat ini sebesar <strong>{formatRp(totalUnpaid)}</strong>.
        </span>
      </div>

      {/* 2-COLUMN ANALYSIS BLOCK */}
      <div className="content-grid" style={{ marginBottom: 20 }}>
        
        {/* Left Column: Pengeluaran per Kategori */}
        <div className="card">
          <div className="card-header">
            <h3>📂 Rincian & Proporsi Pengeluaran</h3>
          </div>
          <div className="card-body">
            {Object.keys(expensesByCategory).length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, textAlign: 'center', padding: 20 }}>Belum ada data pengeluaran</p>
            ) : (
              Object.entries(expensesByCategory as Record<string, number>)
                .sort((a, b) => b[1] - a[1])
                .map(([cat, total]) => {
                  const pct = totalExpenses > 0 ? (((total as number) / totalExpenses) * 100).toFixed(1) : '0';
                  const colors: Record<string, string> = {
                    'Tagihan Listrik': '#F59E0B',
                    'Tagihan Internet': '#3B82F6',
                    'Pembelian Gas': '#EF4444',
                    'Maintenance': '#10B981',
                    'Lainnya': '#64748B',
                  };
                  const c = colors[cat] || '#64748B';
                  return (
                    <div key={cat} style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                        <span style={{ fontWeight: 500 }}>{cat}</span>
                        <span style={{ fontWeight: 600, color: 'var(--danger)' }}>{formatRp(total)} ({pct}%)</span>
                      </div>
                      <div className="progress-bar" style={{ height: 8 }}>
                        <div className="progress-fill" style={{ width: `${pct}%`, background: c }} />
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>

        {/* Right Column: Ringkasan Tagihan */}
        <div className="card">
          <div className="card-header">
            <h3>📈 Status Tagihan & Transaksi</h3>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ background: '#ECFDF5', borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#059669', marginBottom: 2 }}>Tagihan Lunas</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#059669' }}>{paidBills}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{formatRp(totalPaid)}</div>
              </div>
              <div style={{ background: '#FFF7ED', borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#D97706', marginBottom: 2 }}>Belum Bayar</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#D97706' }}>{unpaidBills}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{formatRp(totalUnpaid)}</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ background: '#EFF6FF', borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#2563EB', marginBottom: 2 }}>Total Tagihan</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#2563EB' }}>{bills.length}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{formatRp(bills.reduce((s, b) => s + b.amount, 0))}</div>
              </div>
              <div style={{ background: '#F5F3FF', borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#7C3AED', marginBottom: 2 }}>Total Transaksi</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#7C3AED' }}>{payments.length}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{formatRp(totalIncome)}</div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* TABEL LABA RUGI PER BULAN */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <h3><Calendar size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Laba Rugi per Bulan</h3>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div className="spinner" style={{ borderTopColor: 'var(--primary)', width: 36, height: 36, margin: '0 auto' }} />
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Bulan</th>
                  <th>Pendapatan</th>
                  <th>Pengeluaran</th>
                  <th>Laba / Rugi</th>
                </tr>
              </thead>
              <tbody>
                {sortedMonths.map(([month, data]) => {
                  const profit = data.income - data.expenses;
                  return (
                    <tr key={month}>
                      <td><strong>{formatMonth(month)}</strong></td>
                      <td style={{ color: 'var(--success)' }}>+{formatRp(data.income)}</td>
                      <td style={{ color: 'var(--danger)' }}>-{formatRp(data.expenses)}</td>
                      <td>
                        <strong style={{ color: profit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                          {profit >= 0 ? '+' : ''}{formatRp(profit)}
                        </strong>
                      </td>
                    </tr>
                  );
                })}
                {sortedMonths.length === 0 && (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: 32, color: 'var(--text-light)' }}>Belum ada data keuangan</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* LAPORAN TAHUNAN */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <h3><BarChart3 size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Laporan Tahunan</h3>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div className="spinner" style={{ borderTopColor: 'var(--primary)', width: 36, height: 36, margin: '0 auto' }} />
          </div>
        ) : sortedYears.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-light)' }}>Belum ada data tahunan</div>
        ) : (
          <div style={{ padding: 0 }}>
            {sortedYears.map(([year, data]) => (
              <div key={year} style={{ borderBottom: '1px solid var(--border)', padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16 }}>
                    {year}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>Tahun {year}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-light)' }}>{data.transaksiIncome} transaksi masuk · {data.transaksiExpense} transaksi keluar</div>
                  </div>
                  <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-light)' }}>Laba Bersih</div>
                    <div style={{ fontWeight: 800, fontSize: 18, color: data.profit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                      {data.profit >= 0 ? '+' : ''}{formatRp(data.profit)}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
                  <div style={{ background: '#ECFDF5', borderRadius: 8, padding: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#059669' }}>Total Pendapatan</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#059669' }}>{formatRp(data.income)}</div>
                    <div style={{ fontSize: 11, color: '#059669' }}>~{formatRp(getMonthlyAvg(year, data.income))}/bulan</div>
                  </div>
                  <div style={{ background: '#FFF7ED', borderRadius: 8, padding: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#D97706' }}>Total Pengeluaran</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#D97706' }}>{formatRp(data.expenses)}</div>
                    <div style={{ fontSize: 11, color: '#D97706' }}>~{formatRp(getMonthlyAvg(year, data.expenses))}/bulan</div>
                  </div>
                  <div style={{ background: data.profit >= 0 ? '#EFF6FF' : '#FFF1F2', borderRadius: 8, padding: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: data.profit >= 0 ? '#2563EB' : '#E11D48' }}>Laba / Rugi</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: data.profit >= 0 ? '#2563EB' : '#E11D48' }}>
                      {data.profit >= 0 ? '+' : ''}{formatRp(data.profit)}
                    </div>
                    <div style={{ fontSize: 11, color: data.profit >= 0 ? '#2563EB' : '#E11D48' }}>
                      {data.income > 0 ? ((data.profit / data.income) * 100).toFixed(1) : '0'}% margin
                    </div>
                  </div>
                  <div style={{ background: '#F5F3FF', borderRadius: 8, padding: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#7C3AED' }}>Total Transaksi</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#7C3AED' }}>{data.transaksiIncome + data.transaksiExpense}</div>
                    <div style={{ fontSize: 11, color: '#7C3AED' }}>{data.transaksiIncome} masuk · {data.transaksiExpense} keluar</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RIWAYAT TRANSAKSI PEMBAYARAN MASUK */}
      <div className="card">
        <div className="card-header">
          <h3>📋 Riwayat Pembayaran Masuk</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Filter Bulan:</label>
            <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
              style={{ border: '1.5px solid var(--border)', borderRadius: 8, padding: '6px 10px', fontSize: 13, fontFamily: 'inherit' }} />
            {filterMonth && <button onClick={() => setFilterMonth('')} style={{ border: 'none', background: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 13 }}>✕ Reset</button>}
          </div>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div className="spinner" style={{ borderTopColor: 'var(--primary)', width: 36, height: 36, margin: '0 auto' }} />
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Kamar</th><th>Penghuni</th><th>Bulan Tagihan</th>
                  <th>Tanggal Bayar</th><th>Nominal</th><th>Metode</th><th>Catatan</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map(p => (
                  <tr key={p.id}>
                    <td><strong>{p.bill?.tenant?.room?.name ?? '-'}</strong></td>
                    <td>{p.bill?.tenant?.fullName || '-'}</td>
                    <td>{p.bill?.month}</td>
                    <td>{new Date(p.paymentDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td><strong style={{ color: 'var(--success)' }}>{formatRp(p.amount)}</strong></td>
                    <td><span className={`badge ${methodBadgeClass(p.paymentMethod)}`}>{methodLabel(p.paymentMethod)}</span></td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{p.notes || '-'}</td>
                  </tr>
                ))}
                {filteredPayments.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--text-light)' }}>
                    Belum ada data pembayaran
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}