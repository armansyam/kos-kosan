'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Plus, MessageCircle, Check, ChevronDown, ChevronUp } from 'lucide-react';

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
  const [expandedRooms, setExpandedRooms] = useState<Record<string, boolean>>({});
  const [settings, setSettings] = useState<any>(null);

  const toggleRoom = (roomId: string) => {
    setExpandedRooms(prev => ({ ...prev, [roomId]: !prev[roomId] }));
  };

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [b, t, s] = await Promise.all([
      fetch('/api/bills').then(x=>x.json()),
      fetch('/api/tenants').then(x=>x.json()),
      fetch('/api/settings').then(x=>x.json())
    ]);
    setBills(Array.isArray(b) ? b : []);
    setTenants(Array.isArray(t) ? t : []);
    setSettings(s && !s.error ? s : null);
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
    const totalPaid = showPayModal.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    const remaining = showPayModal.amount - totalPaid;
    const payAmount = payForm.amount !== undefined && !isNaN(payForm.amount) ? payForm.amount : remaining;

    await fetch('/api/payments', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ ...payForm, billId: showPayModal.id, amount: payAmount }),
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
    const bankDetails = settings?.rekening ? `\n\nPembayaran dapat ditransfer ke:\n${settings.rekening}` : '';
    const msg = encodeURIComponent(`Halo Pak/Bu ${name},\nBerikut tagihan kos kamar ${room} untuk bulan ${month}.\n\nTotal Tagihan: Rp${amount}\nJatuh Tempo: ${due}${bankDetails}\n\nTerima kasih 🙏`);
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

  // Group bills by Room Accordion
  const billsByRoom = filtered.reduce((acc, bill) => {
    const roomName = bill.tenant?.room?.name || 'Lainnya';
    const roomId = roomName.toLowerCase().replace(/\s+/g, '-');
    if (!acc[roomId]) {
      acc[roomId] = {
        roomId,
        roomName,
        tenantName: bill.tenant?.fullName || 'Tanpa Nama',
        whatsapp: bill.tenant?.whatsapp || '',
        bills: [],
      };
    }
    acc[roomId].bills.push(bill);
    return acc;
  }, {} as Record<string, { roomId: string; roomName: string; tenantName: string; whatsapp: string; bills: Bill[] }>);

  const roomGroups = Object.values(billsByRoom).sort((a, b) => a.roomName.localeCompare(b.roomName));

  const tabs: { key: TabType; label: string; count: number }[] = [
    { key:'semua', label:'Semua', count: bills.length },
    { key:'belum_bayar', label:'Belum Bayar', count: bills.filter(b=>b.status==='belum_bayar').length },
    { key:'lunas', label:'Lunas', count: bills.filter(b=>b.status==='lunas').length },
    { key:'menunggak', label:'Menunggak', count: bills.filter(b=>b.status==='menunggak').length },
  ];

  function getStatusBadge(bill: Bill) {
    const days = getDaysLeft(bill.dueDate);
    if (bill.status === 'lunas') return <span className="badge badge-success"><Check size={12} /> Lunas</span>;
    
    // Hitung total cicilan yang masuk
    const totalPaid = bill.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    
    if (bill.status === 'menunggak') {
      return (
        <span className="badge badge-danger">
          Menunggak {totalPaid > 0 ? `(Sisa: ${formatRp(bill.amount - totalPaid)})` : ''}
        </span>
      );
    }
    
    return (
      <span className={`badge ${days < 0 ? 'badge-danger' : days <= 3 ? 'badge-warning' : 'badge-info'}`}>
        {days < 0 ? `Terlambat ${Math.abs(days)} hari` : `${days} hari lagi`}
        {totalPaid > 0 ? ` (Sisa: ${formatRp(bill.amount - totalPaid)})` : ''}
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

      <div style={{ marginBottom: 20 }}>
        {loading ? (
          <div style={{ textAlign:'center', padding:40 }}><div className="spinner" style={{ borderTopColor:'var(--primary)', width:36, height:36, margin:'0 auto' }} /></div>
        ) : (
          <div className="room-groups-list">
            {roomGroups.map(group => {
              const isExpanded = expandedRooms[group.roomId];
              const unpaidBills = group.bills.filter(b => b.status === 'belum_bayar');
              const isOverdue = unpaidBills.some(b => getDaysLeft(b.dueDate) < 0);
              
              return (
                <div key={group.roomId} className="room-accordion-item" style={{
                  background: 'white',
                  border: '1px solid var(--border)',
                  borderRadius: '16px',
                  marginBottom: '14px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                  transition: 'all 0.2s'
                }}>
                  {/* ACCORDION HEADER */}
                  <div 
                    onClick={() => toggleRoom(group.roomId)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px 20px',
                      cursor: 'pointer',
                      background: isExpanded ? '#f8fafc' : 'white',
                      borderBottom: isExpanded ? '1px solid var(--border)' : 'none',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                      <div style={{
                        background: isOverdue ? 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)' : unpaidBills.length > 0 ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' : 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
                        color: isOverdue ? '#991b1b' : unpaidBills.length > 0 ? '#92400e' : '#166534',
                        fontWeight: 800,
                        fontSize: '14px',
                        padding: '6px 14px',
                        borderRadius: '10px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
                      }}>
                        Kamar {group.roomName}
                      </div>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: '15px', color: '#1e293b', display: 'block' }}>{group.tenantName}</span>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>{group.bills.length} Tagihan Terdaftar</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {isOverdue && (
                          <span className="badge badge-danger">Menunggak</span>
                        )}
                        {unpaidBills.length > 0 ? (
                          <span className="badge badge-warning">{unpaidBills.length} Belum Bayar</span>
                        ) : (
                          <span className="badge badge-success">Lunas</span>
                        )}
                      </div>
                      {isExpanded ? <ChevronUp size={18} color="#64748b" /> : <ChevronDown size={18} color="#64748b" />}
                    </div>
                  </div>

                  {/* ACCORDION CONTENT (BILL DETAILS) */}
                  {isExpanded && (
                    <div style={{ padding: '20px', background: '#f8fafc' }}>
                      <div className="table-container" style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                        <table style={{ margin: 0 }}>
                          <thead>
                            <tr style={{ background: '#f1f5f9' }}>
                              <th style={{ padding: '12px 16px' }}>Bulan</th>
                              <th style={{ padding: '12px 16px' }}>Nominal</th>
                              <th style={{ padding: '12px 16px' }}>Jatuh Tempo</th>
                              <th style={{ padding: '12px 16px' }}>Status</th>
                              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Aksi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.bills.map(bill => (
                              <tr key={bill.id} onClick={(e) => { e.stopPropagation(); setShowDetailModal(bill); }} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}>
                                <td style={{ padding: '12px 16px' }}><strong>{bill.month}</strong></td>
                                <td style={{ padding: '12px 16px' }}>{formatRp(bill.amount)}</td>
                                <td style={{ padding: '12px 16px' }}>{formatDate(bill.dueDate)}</td>
                                <td style={{ padding: '12px 16px' }}>{getStatusBadge(bill)}</td>
                                <td style={{ padding: '12px 16px' }} onClick={e => e.stopPropagation()}>
                                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                    <button onClick={(e) => { e.stopPropagation(); openWhatsApp(bill); }} className="btn btn-whatsapp btn-sm" title="Kirim WA">
                                      <MessageCircle size={14} />
                                    </button>
                                    {bill.status !== 'lunas' && (
                                      <button onClick={(e) => {
                                        e.stopPropagation();
                                        const totalPaid = bill.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
                                        const remaining = bill.amount - totalPaid;
                                        setShowPayModal(bill);
                                        setPayForm({
                                          paymentDate: new Date().toISOString().split('T')[0],
                                          paymentMethod: 'transfer',
                                          amount: remaining,
                                          notes: ''
                                        });
                                      }}
                                        className="btn btn-success btn-sm">
                                        <Check size={14} /> Bayar
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {roomGroups.length === 0 && (
              <div className="card" style={{ textAlign:'center', padding:32, color:'var(--text-light)' }}>Tidak ada data tagihan</div>
            )}
          </div>
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
                  {(() => {
                    const totalPaid = showPayModal.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
                    const remaining = showPayModal.amount - totalPaid;
                    return (
                      <div style={{ fontSize:12, color:'var(--text-secondary)', marginTop: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <p>Total Tagihan: {formatRp(showPayModal.amount)}</p>
                        {totalPaid > 0 && <p>Sudah Dibayar: <span style={{ color: '#16a34a', fontWeight: 600 }}>{formatRp(totalPaid)}</span></p>}
                        <p style={{ fontWeight: 600 }}>Sisa Tagihan: <span style={{ color: '#dc2626' }}>{formatRp(remaining)}</span></p>
                      </div>
                    );
                  })()}
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
                <button type="submit" className="btn btn-success"><Check size={16} /> Sudah Bayar</button>
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