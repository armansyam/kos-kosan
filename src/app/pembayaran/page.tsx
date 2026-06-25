'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { CreditCard, TrendingUp, Calendar } from 'lucide-react';

interface Payment {
  id: string; billId: string; paymentDate: string; paymentMethod: string;
  amount: number; notes: string | null; createdAt: string;
  bill: {
    month: string; amount: number;
    tenant: { fullName: string; room: { name: string } | null; };
  };
}

export default function PembayaranPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState('');

  const today = new Date();
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}`;

  useEffect(() => {
    fetch('/api/payments').then(r=>r.json()).then(d => {
      setPayments(Array.isArray(d) ? d : []);
      setLoading(false);
    });
  }, []);

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'});
  }
  function formatRp(n: number) { return 'Rp'+n.toLocaleString('id-ID'); }

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

  const filtered = filterMonth
    ? payments.filter(p => new Date(p.paymentDate).toISOString().slice(0,7) === filterMonth)
    : payments;

  const totalIncome = filtered.reduce((s, p) => s + p.amount, 0);

  // Group by month for summary
  const byMonth: Record<string, number> = {};
  payments.forEach(p => {
    const m = new Date(p.paymentDate).toISOString().slice(0,7);
    byMonth[m] = (byMonth[m] || 0) + p.amount;
  });
  const monthSummary = Object.entries(byMonth).sort((a,b) => b[0].localeCompare(a[0])).slice(0,6);

  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <h2>Pembayaran</h2>
          <p style={{ fontSize:13, color:'var(--text-secondary)', marginTop:2 }}>Riwayat semua pembayaran yang masuk</p>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="stats-grid" style={{ gridTemplateColumns:'repeat(3, 1fr)', marginBottom:24 }}>
        <div className="stat-card">
          <div className="stat-icon green"><TrendingUp size={22} /></div>
          <div className="stat-info">
            <h3>Total Pendapatan</h3>
            <div className="stat-value" style={{ fontSize:20 }}>{formatRp(payments.reduce((s,p)=>s+p.amount,0))}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><Calendar size={22} /></div>
          <div className="stat-info">
            <h3>Bulan Ini</h3>
            <div className="stat-value" style={{ fontSize:20 }}>{formatRp(byMonth[currentMonth]||0)}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><CreditCard size={22} /></div>
          <div className="stat-info">
            <h3>Total Transaksi</h3>
            <div className="stat-value">{payments.length}</div>
          </div>
        </div>
      </div>

      <div className="content-grid">
        {/* TABEL PEMBAYARAN */}
        <div className="card" style={{ gridColumn:'1 / -1' }}>
          <div className="card-header">
            <h3>Riwayat Pembayaran</h3>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <label style={{ fontSize:12, fontWeight:600, color:'var(--text-secondary)' }}>Filter Bulan:</label>
              <input type="month" value={filterMonth} onChange={e=>setFilterMonth(e.target.value)}
                style={{ border:'1.5px solid var(--border)', borderRadius:8, padding:'6px 10px', fontSize:13, fontFamily:'inherit' }} />
              {filterMonth && <button onClick={()=>setFilterMonth('')} style={{ border:'none', background:'none', color:'var(--danger)', cursor:'pointer', fontSize:13 }}>✕ Reset</button>}
            </div>
          </div>
          {loading ? (
            <div style={{ textAlign:'center', padding:40 }}>
              <div className="spinner" style={{ borderTopColor:'var(--primary)', width:36, height:36, margin:'0 auto' }} />
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
                  {filtered.map(p => (
                    <tr key={p.id}>
                      <td><strong>{p.bill.tenant.room?.name ?? '-'}</strong></td>
                      <td>{p.bill.tenant.fullName}</td>
                      <td>{p.bill.month}</td>
                      <td>{formatDate(p.paymentDate)}</td>
                      <td><strong style={{ color:'var(--success)' }}>{formatRp(p.amount)}</strong></td>
                      <td><span className={`badge ${methodBadgeClass(p.paymentMethod)}`}>{methodLabel(p.paymentMethod)}</span></td>
                      <td style={{ color:'var(--text-secondary)', fontSize:13 }}>{p.notes || '-'}</td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={7} style={{ textAlign:'center', padding:32, color:'var(--text-light)' }}>
                      Belum ada data pembayaran
                    </td></tr>
                  )}
                </tbody>
                {filtered.length > 0 && (
                  <tfoot>
                    <tr>
                      <td colSpan={4} style={{ padding:'12px 16px', fontWeight:700, background:'var(--bg-primary)' }}>Total</td>
                      <td style={{ padding:'12px 16px', fontWeight:800, color:'var(--success)', background:'var(--bg-primary)' }}>
                        {formatRp(totalIncome)}
                      </td>
                      <td colSpan={2} style={{ background:'var(--bg-primary)' }} />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </div>
      </div>

      {/* RINGKASAN PER BULAN */}
      {monthSummary.length > 0 && (
        <div className="card" style={{ marginTop:0 }}>
          <div className="card-header">
            <h3>📊 Ringkasan per Bulan</h3>
          </div>
          <div className="card-body">
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px,1fr))', gap:12 }}>
              {monthSummary.map(([month, total]) => (
                <div key={month} style={{ background:'var(--bg-primary)', borderRadius:10, padding:'14px 16px', border:'1px solid var(--border)' }}>
                  <p style={{ fontSize:11, fontWeight:600, color:'var(--text-secondary)', textTransform:'uppercase', marginBottom:4 }}>{month}</p>
                  <p style={{ fontSize:18, fontWeight:800, color:'var(--success)' }}>{formatRp(total)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
