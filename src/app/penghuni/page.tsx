'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Plus, Edit, Trash2, MessageCircle, Phone, LogOut, Check } from 'lucide-react';

interface Room { id: string; name: string; price: number; status: string; }
interface Bill { id: string; month: string; amount: number; dueDate: string; status: string; payments: any[]; }
interface Tenant {
  id: string; fullName: string; whatsapp: string; roomId: string;
  checkInDate: string; checkOutDate: string | null; monthlyPrice: number; dueDate: number;
  notes: string | null; active: boolean; room: Room;
  bills?: Bill[];
}

export default function PenghuniPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [formData, setFormData] = useState({
    fullName: '', whatsapp: '', roomId: '', checkInDate: '',
    monthlyPrice: 0, dueDate: 1, notes: '', active: true
  });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [viewTab, setViewTab] = useState<'aktif' | 'keluar' | 'arsip'>('aktif');

  // Payment states
  const [showPayModal, setShowPayModal] = useState<any | null>(null);
  const [payForm, setPayForm] = useState({ paymentDate: '', paymentMethod: 'transfer', amount: 0, notes: '' });
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    const [t, r, s] = await Promise.all([
      fetch('/api/tenants').then(x => x.json()),
      fetch('/api/rooms').then(x => x.json()),
      fetch('/api/settings').then(x => x.json())
    ]);
    setTenants(Array.isArray(t) ? t : []);
    setRooms(Array.isArray(r) ? r : []);
    setSettings(s && !s.error ? s : null);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingTenant) {
        const res = await fetch(`/api/tenants/${editingTenant.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
        if (!res.ok) {
          const errData = await res.json();
          alert(errData.error || 'Gagal memperbarui data penghuni');
          return;
        }
        showToast('Data penghuni berhasil diperbarui');
      } else {
        const res = await fetch('/api/tenants', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
        if (!res.ok) {
          const errData = await res.json();
          alert(errData.error || 'Gagal menambahkan penghuni');
          return;
        }
        showToast('Penghuni berhasil ditambahkan');
      }
      setShowModal(false);
      setEditingTenant(null);
      resetForm();
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan koneksi');
    }
  }

  async function handleCheckout(tenant: Tenant) {
    if (!confirm(`Yakin ${tenant.fullName} mau keluar dari kos?\nKamar ${tenant.room.name} akan menjadi kosong.`)) return;
    await fetch(`/api/tenants/${tenant.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'checkout' })
    });
    setSelectedTenant(null);
    showToast(`${tenant.fullName} berhasil checkout`);
    fetchData();
  }

  async function handleDelete(id: string) {
    const reason = prompt('Masukkan alasan hapus permanen / arsip:', '');
    if (!reason || !reason.trim()) return;
    if (!confirm('Lanjut hapus? Penghuni aktif akan diarsipkan dulu. Penghuni arsip akan dihapus permanen.')) return;

    const res = await fetch(`/api/tenants/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      alert(data.error || 'Gagal menghapus penghuni');
      return;
    }

    setSelectedTenant(null);
    showToast(data.message || 'Penghuni berhasil dihapus');
    fetchData();
  }

  function toDateInputValue(dateStr: string) {
    const d = new Date(dateStr);
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().split('T')[0];
  }

  function openEdit(tenant: Tenant) {
    setEditingTenant(tenant);
    setFormData({
      fullName: tenant.fullName, whatsapp: tenant.whatsapp, roomId: tenant.roomId,
      checkInDate: toDateInputValue(tenant.checkInDate), monthlyPrice: tenant.monthlyPrice,
      dueDate: tenant.dueDate, notes: tenant.notes || '', active: tenant.active
    });
    setShowModal(true);
  }

  function resetForm() {
    setFormData({ fullName: '', whatsapp: '', roomId: '', checkInDate: '', monthlyPrice: 0, dueDate: 1, notes: '', active: true });
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function formatRp(n: number) { return 'Rp' + n.toLocaleString('id-ID'); }

  function openWhatsApp(wa: string, name: string) {
    const num = wa.replace(/^0/, '62');
    window.open(`https://wa.me/${num}`, '_blank');
  }

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!showPayModal) return;
    try {
      const totalPaid = showPayModal.payments?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0;
      const remaining = showPayModal.amount - totalPaid;
      const payAmount = payForm.amount !== undefined && !isNaN(payForm.amount) ? payForm.amount : remaining;

      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payForm, billId: showPayModal.id, amount: payAmount }),
      });
      if (res.ok) {
        setShowPayModal(null);
        showToast('Pembayaran berhasil dicatat');
        // Fetch fresh tenants data
        const tData = await fetch('/api/tenants').then(x => x.json());
        const tenantsList = Array.isArray(tData) ? tData : [];
        setTenants(tenantsList);
        const updated = tenantsList.find(x => x.id === selectedTenant?.id);
        if (updated) setSelectedTenant(updated);
      } else {
        showToast('Gagal mencatat pembayaran');
      }
    } catch {
      showToast('Error koneksi');
    }
  }

  function getDaysLeft(dueDate: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  function getStatusBadge(bill: any) {
    const days = getDaysLeft(bill.dueDate);
    if (bill.status === 'lunas') return <span className="badge badge-success" style={{ fontSize: 11, padding: '3px 8px' }}><Check size={10} /> Lunas</span>;
    if (bill.status === 'menunggak') return <span className="badge badge-danger" style={{ fontSize: 11, padding: '3px 8px' }}>Menunggak</span>;
    return (
      <span className={`badge ${days < 0 ? 'badge-danger' : days <= 3 ? 'badge-warning' : 'badge-info'}`} style={{ fontSize: 11, padding: '3px 8px' }}>
        {days < 0 ? `Terlambat ${Math.abs(days)} hari` : `${days} hari lagi`}
      </span>
    );
  }

  function sendWhatsAppBill(bill: any, tenant: any) {
    const name = tenant.fullName;
    const room = tenant.room.name;
    const month = bill.month;
    const amount = bill.amount.toLocaleString('id-ID');
    const due = new Date(bill.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const wa = tenant.whatsapp.replace(/^0/, '62');
    const bankDetails = settings?.rekening ? `\n\nPembayaran dapat ditransfer ke:\n${settings.rekening}` : '';
    const msg = encodeURIComponent(`Halo Pak/Bu ${name},\nBerikut tagihan kos kamar ${room} untuk bulan ${month}.\n\nTotal Tagihan: Rp${amount}\nJatuh Tempo: ${due}${bankDetails}\n\nTerima kasih 🙏`);
    window.open(`https://wa.me/${wa}?text=${msg}`, '_blank');
  }

  const getDaysSinceCheckout = (checkOutDateStr: string | null) => {
    if (!checkOutDateStr) return 0;
    const checkout = new Date(checkOutDateStr);
    const today = new Date();
    checkout.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - checkout.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const activeTenants = tenants.filter(t => t.active);
  const inactiveTenants = tenants.filter(t => !t.active);

  const recentCheckouts = inactiveTenants.filter(t => getDaysSinceCheckout(t.checkOutDate) <= 30);
  const archivedTenants = inactiveTenants.filter(t => getDaysSinceCheckout(t.checkOutDate) > 30);

  const sortByRoom = (a: Tenant, b: Tenant) => {
    const getRoomSortKey = (name: string) => {
      const match = name.match(/([A-Za-z]+)?\s*(\d+)/);
      if (match) {
        return {
          prefix: (match[1] || '').toUpperCase(),
          number: Number(match[2]),
          raw: name.toUpperCase(),
        };
      }
      return {
        prefix: name.toUpperCase(),
        number: Number.MAX_SAFE_INTEGER,
        raw: name.toUpperCase(),
      };
    };

    const roomA = getRoomSortKey(a.room.name);
    const roomB = getRoomSortKey(b.room.name);

    if (roomA.prefix !== roomB.prefix) {
      return roomA.prefix.localeCompare(roomB.prefix, 'id', { sensitivity: 'base' });
    }

    if (roomA.number !== roomB.number) {
      return roomA.number - roomB.number;
    }

    return roomA.raw.localeCompare(roomB.raw, 'id', { numeric: true, sensitivity: 'base' });
  };

  const displayTenants = (viewTab === 'aktif'
    ? activeTenants
    : viewTab === 'keluar'
      ? recentCheckouts
      : archivedTenants
  ).slice().sort(sortByRoom);

  const availableRooms = rooms.filter(r => r.status === 'kosong' || r.id === editingTenant?.roomId);

  const getBillStatusBadge = (tenant: Tenant) => {
    if (!tenant.active) return null;
    if (!tenant.bills || tenant.bills.length === 0) {
      return (
        <span style={{
          fontSize: '10px',
          fontWeight: 700,
          padding: '2px 6px',
          borderRadius: '6px',
          background: '#f1f5f9',
          color: '#64748b',
          border: '1px solid #e2e8f0'
        }}>
          Belum Tagihan
        </span>
      );
    }

    const latestBill = tenant.bills[0];
    const days = getDaysLeft(latestBill.dueDate);

    if (latestBill.status === 'lunas') {
      return (
        <span style={{
          fontSize: '10px',
          fontWeight: 700,
          padding: '2px 6px',
          borderRadius: '6px',
          background: '#dcfce7',
          color: '#16a34a',
          border: '1px solid #bbf7d0'
        }}>
          Lunas
        </span>
      );
    }

    if (latestBill.status === 'menunggak' || days < 0) {
      return (
        <span style={{
          fontSize: '10px',
          fontWeight: 700,
          padding: '2px 6px',
          borderRadius: '6px',
          background: '#fee2e2',
          color: '#dc2626',
          border: '1px solid #fecaca'
        }}>
          Nunggak
        </span>
      );
    }

    return (
      <span style={{
        fontSize: '10px',
        fontWeight: 700,
        padding: '2px 6px',
        borderRadius: '6px',
        background: '#fef3c7',
        color: '#d97706',
        border: '1px solid #fde68a'
      }}>
        Belum Bayar
      </span>
    );
  };

  return (
    <DashboardLayout>
      {/* MAIN CONTENT */}
      <div className="page-header">
        <div>
          <h2>Penghuni</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
            {activeTenants.length} aktif · {recentCheckouts.length} baru keluar · {archivedTenants.length} diarsipkan
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {viewTab === 'aktif' && (
            <button onClick={() => { setShowModal(true); setEditingTenant(null); resetForm(); }} className="btn btn-primary">
              <Plus size={16} /> Tambah Penghuni
            </button>
          )}
        </div>
      </div>

      {/* Sub navigation tabs */}
      <div className="sub-tabs" style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
        {[
          { key: 'aktif', label: 'Penghuni Aktif', count: activeTenants.length },
          { key: 'keluar', label: 'Sudah Keluar', count: recentCheckouts.length },
          { key: 'arsip', label: 'Arsip', count: archivedTenants.length },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setViewTab(t.key as any)}
            className={`sub-tab-btn ${viewTab === t.key ? 'active' : ''}`}
          >
            {t.label} <span className="sub-tab-count">{t.count}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ borderTopColor: 'var(--primary)', width: 40, height: 40, margin: '0 auto' }} /></div>
      ) : (
        <div className="room-groups-list">
          <div className="dash-room-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
            {displayTenants.map(tenant => {
              const cardColor = tenant.active ? 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)' : '#94A3B8';

              return (
                <div
                  key={tenant.id}
                  onClick={() => setSelectedTenant(tenant)}
                  className={`dash-room-card ${selectedTenant?.id === tenant.id ? 'active-room-card' : ''}`}
                  style={{
                    background: 'white',
                    borderRadius: '12px',
                    border: selectedTenant?.id === tenant.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  {/* Color Bar / Status bar */}
                  <div style={{ height: '5px', background: cardColor }} />

                  {/* Card Body */}
                  <div style={{ padding: '14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {/* Header Info */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span style={{
                          background: tenant.active ? '#eef2ff' : '#f1f5f9',
                          color: tenant.active ? 'var(--primary)' : '#475569',
                          fontSize: '12px',
                          fontWeight: 800,
                          padding: '3px 10px',
                          borderRadius: '6px',
                          border: tenant.active ? '1px solid #e0e7ff' : '1px solid #e2e8f0'
                        }}>
                          Kamar {tenant.room.name}
                        </span>
                        {getBillStatusBadge(tenant)}
                      </div>
                      <span className={`badge ${tenant.active ? 'badge-success' : 'badge-gray'}`} style={{ fontSize: '10px', padding: '2px 6px' }}>
                        {tenant.active ? 'Aktif' : 'Keluar'}
                      </span>
                    </div>

                    {/* Tenant Name */}
                    <h4 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 8px 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: tenant.active ? 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)' : '#94A3B8',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 700,
                        flexShrink: 0
                      }}>
                        {tenant.fullName.charAt(0)}
                      </div>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {tenant.fullName}
                      </span>
                    </h4>

                    {/* Tenant Details */}
                    <div style={{ fontSize: '12px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px', flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>WhatsApp</span>
                        <span style={{ fontWeight: 500 }}>{tenant.whatsapp}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Harga / Bulan</span>
                        <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{formatRp(tenant.monthlyPrice)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Jatuh Tempo</span>
                        <span style={{ fontWeight: 500 }}>
                          {tenant.checkOutDate
                            ? `Keluar ${new Date(tenant.checkOutDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}`
                            : `Tgl ${tenant.dueDate}`
                          }
                        </span>
                      </div>
                    </div>

                    {/* Action buttons footer */}
                    <div onClick={(e) => e.stopPropagation()} style={{
                      display: 'flex',
                      gap: '6px',
                      justifyContent: 'flex-end',
                      borderTop: '1px solid #f1f5f9',
                      paddingTop: '8px'
                    }}>
                      <button onClick={() => openWhatsApp(tenant.whatsapp, tenant.fullName)} className="btn btn-whatsapp btn-sm" title="WhatsApp" style={{ padding: '4px 8px', height: '28px', width: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <MessageCircle size={13} />
                      </button>
                      {tenant.active && (
                        <button onClick={() => openEdit(tenant)} className="btn btn-outline btn-sm" style={{ padding: '4px 8px', height: '28px', width: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Edit size={13} />
                        </button>
                      )}
                      {tenant.active ? (
                        <button onClick={() => handleCheckout(tenant)} className="btn btn-danger btn-sm" title="Keluar" style={{ padding: '4px 8px', height: '28px', width: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <LogOut size={13} />
                        </button>
                      ) : (
                        <button onClick={() => handleDelete(tenant.id)} className="btn btn-danger btn-sm" title="Arsip / Hapus Permanen" style={{ padding: '4px 8px', height: '28px', width: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {displayTenants.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: 32, color: 'var(--text-light)' }}>
              {viewTab === 'aktif'
                ? 'Belum ada penghuni aktif'
                : viewTab === 'keluar'
                  ? 'Belum ada penghuni yang baru keluar (≤30 hari)'
                  : 'Belum ada penghuni di arsip (>30 hari)'}
            </div>
          )}
        </div>
      )}

      {/* DETAIL MODAL OVERLAY */}
      {selectedTenant && (
        <div className="modal-overlay" onClick={() => setSelectedTenant(null)}>
          <div className="modal" style={{ maxWidth: 640, width: '95%' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Detail & Tagihan Penghuni</h3>
              <button className="modal-close" onClick={() => setSelectedTenant(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>

              {/* Profile Card & Info grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <div style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: 20,
                    fontWeight: 700,
                    flexShrink: 0
                  }}>
                    {selectedTenant.fullName.charAt(0)}
                  </div>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px 0' }}>{selectedTenant.fullName}</h3>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span className={`badge ${selectedTenant.active ? 'badge-success' : 'badge-gray'}`}>
                        {selectedTenant.active ? 'Aktif' : 'Non-aktif'}
                      </span>
                      <span style={{ fontSize: 13, color: '#475569', fontWeight: 600 }}>Kamar {selectedTenant.room.name}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  {[
                    ['No. WhatsApp', selectedTenant.whatsapp],
                    ['Tanggal Masuk', formatDate(selectedTenant.checkInDate)],
                    ['Harga Sewa', formatRp(selectedTenant.monthlyPrice) + '/bulan'],
                    ['Jatuh Tempo', `Setiap tanggal ${selectedTenant.dueDate}`],
                    ['Catatan', selectedTenant.notes || '-'],
                  ].map(([k, v]) => (
                    <div key={k} style={{ padding: '8px 12px', background: 'white', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                      <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, display: 'block', textTransform: 'uppercase', marginBottom: 2 }}>{k}</span>
                      <span style={{ fontSize: 13, fontWeight: 500, color: '#1e293b' }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Billing History Section */}
              <div style={{ borderTop: '2px dashed var(--border)', paddingTop: '20px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px', color: '#0f172a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Riwayat Tagihan Bulanan</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 400 }}>
                    {selectedTenant.bills?.length || 0} tagihan
                  </span>
                </h4>

                <div className="table-container" style={{ borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                  <table style={{ margin: 0, minWidth: '100%' }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9' }}>
                        <th style={{ padding: '10px 14px', fontSize: '12px' }}>Bulan</th>
                        <th style={{ padding: '10px 14px', fontSize: '12px' }}>Nominal</th>
                        <th style={{ padding: '10px 14px', fontSize: '12px' }}>Status</th>
                        <th style={{ padding: '10px 14px', fontSize: '12px', textAlign: 'right' }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedTenant.bills && selectedTenant.bills.length > 0 ? (
                        selectedTenant.bills.map((bill: any) => (
                          <tr key={bill.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '10px 14px', fontSize: '13px' }}><strong>{bill.month}</strong></td>
                            <td style={{ padding: '10px 14px', fontSize: '13px' }}>{formatRp(bill.amount)}</td>
                            <td style={{ padding: '10px 14px', fontSize: '13px' }}>{getStatusBadge(bill)}</td>
                            <td style={{ padding: '10px 14px' }}>
                              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                <button onClick={() => sendWhatsAppBill(bill, selectedTenant)} className="btn btn-whatsapp btn-sm" title="Kirim Pengingat WA" style={{ padding: '4px 8px' }}>
                                  <MessageCircle size={12} />
                                </button>
                                {bill.status !== 'lunas' && (
                                  <button onClick={() => {
                                    const totalPaid = bill.payments?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0;
                                    const remaining = bill.amount - totalPaid;
                                    setShowPayModal(bill);
                                    setPayForm({
                                      paymentDate: new Date().toISOString().split('T')[0],
                                      paymentMethod: 'transfer',
                                      amount: remaining,
                                      notes: ''
                                    });
                                  }} className="btn btn-success btn-sm" style={{ padding: '4px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Check size={12} /> Bayar
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-light)', fontSize: '13px' }}>
                            Belum ada tagihan terdaftar untuk penghuni ini.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Checkout / Hapus actions at bottom of modal body */}
              <div style={{ marginTop: '24px', display: 'flex', gap: '10px' }}>
                {selectedTenant.active ? (
                  <button onClick={() => { handleCheckout(selectedTenant); setSelectedTenant(null); }} className="btn btn-danger" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <LogOut size={16} /> Keluar dari Kos
                  </button>
                ) : (
                  <button onClick={() => { handleDelete(selectedTenant.id); setSelectedTenant(null); }} className="btn btn-danger" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <Trash2 size={16} /> Arsip / Hapus
                  </button>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => { openEdit(selectedTenant); setSelectedTenant(null); }} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Edit size={14} /> Edit Data
              </button>
              <button className="btn btn-primary" onClick={() => setSelectedTenant(null)}>Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL BAYAR */}
      {showPayModal && (
        <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={() => setShowPayModal(null)}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Catat Pembayaran</h3>
              <button className="modal-close" onClick={() => setShowPayModal(null)}>✕</button>
            </div>
            <form onSubmit={handlePay}>
              <div className="modal-body">
                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 13, border: '1px solid var(--border)' }}>
                  <p style={{ margin: '0 0 4px 0' }}>Bulan: <strong>{showPayModal.month}</strong></p>
                  {(() => {
                    const totalPaid = showPayModal.payments?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0;
                    const remaining = showPayModal.amount - totalPaid;
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 4 }}>
                        <p style={{ margin: 0 }}>Total Tagihan: <strong>{formatRp(showPayModal.amount)}</strong></p>
                        {totalPaid > 0 && <p style={{ margin: 0 }}>Sudah Dibayar: <strong style={{ color: '#16a34a' }}>{formatRp(totalPaid)}</strong></p>}
                        <p style={{ margin: 0 }}>Sisa Tagihan: <strong style={{ color: '#dc2626' }}>{formatRp(remaining)}</strong></p>
                      </div>
                    );
                  })()}
                </div>
                <div className="form-group">
                  <label>Tanggal Pembayaran</label>
                  <input className="form-input" type="date" value={payForm.paymentDate} onChange={e => setPayForm({ ...payForm, paymentDate: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Metode Pembayaran</label>
                  <select className="form-select" value={payForm.paymentMethod} onChange={e => setPayForm({ ...payForm, paymentMethod: e.target.value })}>
                    <option value="transfer">Transfer Bank</option>
                    <option value="tunai">Tunai</option>
                    <option value="qris">QRIS</option>
                    <option value="gopay">GoPay</option>
                    <option value="ovo">OVO</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Jumlah Bayar (Rp)</label>
                  <input className="form-input" type="number" value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: parseInt(e.target.value) })} required />
                </div>
                <div className="form-group">
                  <label>Catatan Pembayaran</label>
                  <input className="form-input" type="text" value={payForm.notes} onChange={e => setPayForm({ ...payForm, notes: e.target.value })} placeholder="Nama pengirim, bank asal, dll..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowPayModal(null)}>Batal</button>
                <button type="submit" className="btn btn-success">Sudah Bayar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PENGHUNI */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingTenant ? 'Edit Penghuni' : 'Tambah Penghuni'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group full">
                    <label>Nama Lengkap</label>
                    <input className="form-input" type="text" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>No. WhatsApp</label>
                    <input className="form-input" type="text" value={formData.whatsapp} onChange={e => setFormData({ ...formData, whatsapp: e.target.value })} placeholder="628xxx" required />
                  </div>
                  <div className="form-group">
                    <label>Kamar</label>
                    <select className="form-select" value={formData.roomId} onChange={e => {
                      const r = rooms.find(x => x.id === e.target.value);
                      setFormData({ ...formData, roomId: e.target.value, monthlyPrice: r?.price || formData.monthlyPrice });
                    }} required>
                      <option value="">Pilih Kamar</option>
                      {availableRooms.map(r => <option key={r.id} value={r.id}>{r.name} — {formatRp(r.price)}/bln</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Tanggal Check-in</label>
                    <input className="form-input" type="date" value={formData.checkInDate} onChange={e => setFormData({ ...formData, checkInDate: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Harga per Bulan (Rp)</label>
                    <input className="form-input" type="number" value={formData.monthlyPrice} onChange={e => setFormData({ ...formData, monthlyPrice: parseInt(e.target.value) })} required />
                  </div>
                  <div className="form-group">
                    <label>Jatuh Tempo (tanggal ke-)</label>
                    <input className="form-input" type="number" value={formData.dueDate} onChange={e => setFormData({ ...formData, dueDate: parseInt(e.target.value) })} min={1} max={31} required />
                  </div>
                  <div className="form-group full">
                    <label>Catatan</label>
                    <textarea className="form-textarea" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="KTP, kendaraan, catatan lain..." />
                  </div>
                  <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 0 }}>
                    <input type="checkbox" id="active" checked={formData.active} onChange={e => setFormData({ ...formData, active: e.target.checked })} style={{ width: 16, height: 16 }} />
                    <label htmlFor="active" style={{ marginBottom: 0 }}>Penghuni Aktif</label>
                  </div>
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

      {toast && <div className="toast">✅ {toast}</div>}
    </DashboardLayout>
  );
}
