'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Plus, MessageCircle, Check } from 'lucide-react';

interface Bill {
  id: string; tenantId: string; month: string; amount: number;
  dueDate: string; status: string; createdAt: string;
  tenant: {
    id: string; fullName: string; whatsapp: string; dueDate: number;
    room: { name: string };
  };
  payments: Payment[];
}
interface Payment { id: string; amount: number; paymentDate: string; paymentMethod: string; notes: string | null; }
interface Tenant { id: string; fullName: string; monthlyPrice: number; dueDate: number; room: { name: string }; }

type TabType = 'semua' | 'belum_bayar' | 'lunas' | 'menunggak';

export default function TagihanPage() {
  const today = new Date();
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}`;

  const [bills, setBills] = useState<Bill[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tab, setTab] = useState<TabType>('semua');
  const [showModal, setShowModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState<Bill | null>(null);
  const [showDetailModal, setShowDetailModal] = useState<Bill | null>(null);
  const [showAutoModal, setShowAutoModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ tenantId: '', month: '', amount: 0, dueDate: '' });
  const [payForm, setPayForm] = useState({ paymentDate: '', paymentMethod: 'transfer', amount: 0, notes: '' });
  const [autoForm, setAutoForm] = useState({ month: currentMonth });
  const [autoGenerating, setAutoGenerating] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [b, t] = await Promise.all([fetch('/api/bills').then(x=>x.json()), fetch('/api/tenants').then(x=>x.json())]);
    setBills(Array.isArray(b) ? b : []);
    setTenants(Array.isArray(t) ? t : []);
    setLoading(false);
  }

  async function handleAutoGenerate(e: React.FormEvent) {
    e.preventDefault();
    setAutoGenerating(true);
    try {
      const res = await fetch('/api/bills/auto-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(autoForm),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Tagihan otomatis berhasil dibuat');
        setShowAutoModal(false);
        fetchAll();
      } else {
        showToast(data.error || 'Gagal membuat tagihan otomatis');
      }
    } catch {
      showToast('Error koneksi');
    } finally {
      setAutoGenerating(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/bills', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form) });
    setShowModal(false);
    showToast('Tagihan berhasil dibuat');
    fetchAll();
  }

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!showPayModal) return;
    await fetch('/api/payments', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ ...payForm, billId: showPayModal.id, amount: payForm.amount || showPayModal.amount }),
    });
    setShowPayModal(null);
    showToast('Pembayaran berhasil dicatat');
    fetchAll();
  }

  function openWhatsApp(bill: Bill) {
    const name = bill.tenant.fullName;
    const room = bill.tenant.room.name;
    const month = bill.month;
    const amount = bill.amount.toLocaleString('id-ID');
    const due = new Date(bill.dueDate).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'});
    const wa = bill.tenant.whatsapp.replace(/^0/, '62');
    const msg = encodeURIComponent(`Halo Pak/Bu ${name},\nBerikut tagihan kos kamar ${room} untuk bulan ${month}.\n\nTotal Tagihan: Rp${amount}\nJatuh Tempo: ${due}\n\nTerima kasih 🙏`);
    window.open(`https://wa.me/${wa}?text=${msg}`, '_blank');
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  function getDaysLeft(dueDate: string) {
    return Math.ceil((new Date(dueDate).getTime() - today.getTime()) / (1000*60*60*24));
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'});
  }

  function formatRp(n: number) { return 'Rp'+n.toLocaleString('id-ID'); }

  const filtered = bills.filter(b => tab === 'semua' ? true : b.status === tab);

  const tabs: { key: TabType; label: string; count: number }[] = [
    { key:'semua', label:'Semua', count: bills.length },
    { key:'belum_bayar', label:'Belum Bayar', count: bills.filter(b=>b.status==='belum_bayar').length },
    { key:'lunas', label:'Lunas', count: bills.filter(b=>b.status==='lunas').length },
    { key:'menunggak', label:'Menunggak', count: bills.filter(b=>b.status==='menunggak').length },
  ];

  function getStatusBadge(bill: Bill) {
    const days = getDaysLeft(bill.dueDate);
    if (bill.status === 'lunas') return <span className="badge badge-success"><Check size={12} /> Lunas</span>;
    if (bill.status === 'menunggak') return <span className="badge badge-danger">Menunggak</span>;
    return (
      <span className={`badge ${days < 0 ? 'badge-danger' : days <= 3 ? 'badge-warning' : 'badge-info'}`}>
        {days < 0 ? `Terlambat ${Math.abs(days)} hari` : `${days} hari lagi`}
      </span>
    );
  }

  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <h2>Tagihan</h2>
          <p style={{ fontSize:13, color:'var(--text-secondary)', marginTop:2 }}>Kelola tagihan bulanan penghuni kos</p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={() => { setAutoForm({ month: currentMonth }); setShowAutoModal(true); }} className="btn btn-outline" style={{ display:'flex', alignItems:'center', gap:6 }}>
            ⚡ Tagihan Otomatis
          </button>
          <button onClick={() => { setForm({ tenantId:'', month:currentMonth, amount:0, dueDate:'' }); setShowModal(true); }} className="btn btn-primary">
            <Plus size={16} /> Buat Tagihan
          </button>
        </div>
      </div>

      {/* TABS */}
      <div className="tagihan-tabs">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`tagihan-tab ${tab===t.key ? 'active' : ''}`}>
            {t.label}
            {t.count > 0 && <span className={`badge ${t.key==='belum_bayar'?'badge-warning':t.key==='lunas'?'badge-success':t.key==='menunggak'?'badge-danger':'badge-gray'}`}
              style={{ marginLeft:6 }}>{t.count}</span>}
          </button>
        ))}
      </div>

      <div className="card">
        {loading ? (
          <div style={{ textAlign:'center', padding:40 }}><div className="spinner" style={{ borderTopColor:'var(--primary)', width:36, height:36, margin:'0 auto' }} /></div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="table-desktop tagihan-table">
              <table>
                <thead>
                  <tr>
                    <th>Kamar</th><th>Penghuni</th><th>Bulan</th><th>Nominal</th>
                    <th>Jatuh Tempo</th><th>Status</th><th style={{ textAlign:'right' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(bill => (
                    <tr key={bill.id} onClick={() => setShowDetailModal(bill)} style={{ cursor:'pointer' }}>
                      <td><strong>{bill.tenant.room.name}</strong></td>
                      <td>{bill.tenant.fullName}</td>
                      <td>{bill.month}</td>
                      <td>{formatRp(bill.amount)}</td>
                      <td>{formatDate(bill.dueDate)}</td>
                      <td>{getStatusBadge(bill)}</td>
                      <td onClick={e => e.stopPropagation()}>
                        <div style={{ display:'flex', gap:6, justifyContent:'flex-end' }}>
                          <button onClick={() => openWhatsApp(bill)} className="btn btn-whatsapp btn-sm" title="Kirim WA">
                            <MessageCircle size={14} />
                          </button>
                          {bill.status !== 'lunas' && (
                            <button onClick={() => { setShowPayModal(bill); setPayForm({ paymentDate: new Date().toISOString().split('T')[0], paymentMethod:'transfer', amount: bill.amount, notes:'' }); }}
                              className="btn btn-success btn-sm">
                              <Check size={14} /> Bayar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={7} style={{ textAlign:'center', padding:32, color:'var(--text-light)' }}>Tidak ada data tagihan</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="tagihan-cards">
              {filtered.length === 0 ? (
                <div style={{ textAlign:'center', padding:32, color:'var(--text-light)' }}>Tidak ada data tagihan</div>
              ) : filtered.map(bill => (
                <div key={bill.id} className="tagihan-card" onClick={() => setShowDetailModal(bill)}>
                  <div className="tagihan-card-header">
                    <div className="tagihan-card-room">{bill.tenant.room.name}</div>
                    {getStatusBadge(bill)}
                  </div>
                  <div className="tagihan-card-body">
                    <div className="tagihan-card-row">
                      <span className="tagihan-card-label">Penghuni</span>
                      <span className="tagihan-card-value">{bill.tenant.fullName}</span>
                    </div>
                    <div className="tagihan-card-row">
                      <span className="tagihan-card-label">Bulan</span>
                      <span className="tagihan-card-value">{bill.month}</span>
                    </div>
                    <div className="tagihan-card-row">
                      <span className="tagihan-card-label">Nominal</span>
                      <span className="tagihan-card-value" style={{ fontWeight:700, color:'var(--primary)' }}>{formatRp(bill.amount)}</span>
                    </div>
                    <div className="tagihan-card-row">
                      <span className="tagihan-card-label">Jatuh Tempo</span>
                      <span className="tagihan-card-value">{formatDate(bill.dueDate)}</span>
                    </div>
                  </div>
                  <div className="tagihan-card-footer" onClick={e => e.stopPropagation()}>
                    <button onClick={() => openWhatsApp(bill)} className="btn btn-whatsapp btn-sm">
                      <MessageCircle size={14} /> WA
                    </button>
                    {bill.status !== 'lunas' && (
                      <button onClick={() => { setShowPayModal(bill); setPayForm({ paymentDate: new Date().toISOString().split('T')[0], paymentMethod:'transfer', amount: bill.amount, notes:'' }); }}
                        className="btn btn-success btn-sm">
                        <Check size={14} /> Bayar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* MODAL BUAT TAGIHAN */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-mobile" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Buat Tagihan</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Penghuni</label>
                  <select className="form-select" value={form.tenantId} onChange={e => {
                    const t = tenants.find(x=>x.id===e.target.value);
                    setForm({...form, tenantId:e.target.value, amount: t?.monthlyPrice||0});
                  }} required>
                    <option value="">Pilih Penghuni</option>
                    {tenants.map(t => <option key={t.id} value={t.id}>{t.fullName} - Kamar {t.room.name}</option>)}
                  </select>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Bulan (YYYY-MM)</label>
                    <input className="form-input" type="month" value={form.month} onChange={e => setForm({...form, month:e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Nominal (Rp)</label>
                    <input className="form-input" type="number" value={form.amount} onChange={e => setForm({...form, amount:parseInt(e.target.value)})} required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Jatuh Tempo</label>
                  <input className="form-input" type="date" value={form.dueDate} onChange={e => setForm({...form, dueDate:e.target.value})} required />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL BAYAR */}
      {showPayModal && (
        <div className="modal-overlay" onClick={() => setShowPayModal(null)}>
          <div className="modal modal-mobile" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Catat Pembayaran</h3>
              <button className="modal-close" onClick={() => setShowPayModal(null)}>✕</button>
            </div>
            <form onSubmit={handlePay}>
              <div className="modal-body">
                <div style={{ background:'var(--bg-primary)', borderRadius:8, padding:'12px 16px', marginBottom:16 }}>
                  <p style={{ fontSize:13, fontWeight:600 }}>{showPayModal.tenant.fullName} — Kamar {showPayModal.tenant.room.name}</p>
                  <p style={{ fontSize:12, color:'var(--text-secondary)' }}>Tagihan {showPayModal.month} • {formatRp(showPayModal.amount)}</p>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Tanggal Bayar</label>
                    <input className="form-input" type="date" value={payForm.paymentDate} onChange={e=>setPayForm({...payForm,paymentDate:e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Jumlah (Rp)</label>
                    <input className="form-input" type="number" value={payForm.amount} onChange={e=>setPayForm({...payForm,amount:parseInt(e.target.value)})} required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Metode Pembayaran</label>
                  <select className="form-select" value={payForm.paymentMethod} onChange={e=>setPayForm({...payForm,paymentMethod:e.target.value})}>
                    <option value="transfer">Transfer Bank</option>
                    <option value="tunai">Tunai</option>
                    <option value="qris">QRIS</option>
                    <option value="gopay">GoPay</option>
                    <option value="ovo">OVO</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Catatan</label>
                  <textarea className="form-textarea" value={payForm.notes} onChange={e=>setPayForm({...payForm,notes:e.target.value})} placeholder="Opsional..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowPayModal(null)}>Batal</button>
                <button type="submit" className="btn btn-success"><Check size={16} /> Tandai Lunas</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETAIL TAGIHAN */}
      {showDetailModal && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(null)}>
          <div className="modal modal-mobile" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Detail Tagihan — {showDetailModal.tenant.fullName}</h3>
              <button className="modal-close" onClick={() => setShowDetailModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                {[
                  ['Kamar', showDetailModal.tenant.room.name],
                  ['Penghuni', showDetailModal.tenant.fullName],
                  ['Bulan', showDetailModal.month],
                  ['Nominal', formatRp(showDetailModal.amount)],
                  ['Jatuh Tempo', formatDate(showDetailModal.dueDate)],
                  ['Status', showDetailModal.status],
                ].map(([k,v]) => (
                  <div key={k} className="detail-item">
                    <p className="detail-label">{k}</p>
                    <p className="detail-value">{v}</p>
                  </div>
                ))}
              </div>
              {showDetailModal.payments.length > 0 && (
                <>
                  <h4 style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Riwayat Pembayaran</h4>
                  <table>
                    <thead><tr><th>Tanggal</th><th>Jumlah</th><th>Metode</th></tr></thead>
                    <tbody>
                      {showDetailModal.payments.map(p => (
                        <tr key={p.id}>
                          <td>{formatDate(p.paymentDate)}</td>
                          <td>{formatRp(p.amount)}</td>
                          <td>{p.paymentMethod}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-whatsapp" onClick={() => openWhatsApp(showDetailModal)}><MessageCircle size={16} /> Kirim WA</button>
              <button className="btn btn-outline" onClick={() => setShowDetailModal(null)}>Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AUTO GENERATE */}
      {showAutoModal && (
        <div className="modal-overlay" onClick={() => setShowAutoModal(false)}>
          <div className="modal modal-mobile" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⚡ Generate Tagihan Otomatis</h3>
              <button className="modal-close" onClick={() => setShowAutoModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAutoGenerate}>
              <div className="modal-body">
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                  Sistem akan otomatis membuat tagihan bulanan untuk seluruh penghuni yang aktif pada bulan yang dipilih (jika belum ada).
                </p>
                <div className="form-group">
                  <label>Pilih Bulan (YYYY-MM)</label>
                  <input className="form-input" type="month" value={autoForm.month} onChange={e => setAutoForm({ month: e.target.value })} required />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowAutoModal(false)}>Batal</button>
                <button type="submit" disabled={autoGenerating} className="btn btn-primary" style={{ background: '#f59e0b', borderColor: '#f59e0b', color: '#fff' }}>
                  {autoGenerating ? 'Memproses...' : '⚡ Generate Sekarang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <div className="toast">✅ {toast}</div>}
    </DashboardLayout>
  );
}