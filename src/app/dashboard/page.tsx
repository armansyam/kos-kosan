'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Calendar, AlertCircle, Clock, Home, Users, XCircle, CheckCircle,
  Plus, Edit, Trash2, Zap, CreditCard, Send, Search, ChevronDown,
  Receipt, BarChart3, TrendingUp, Wallet, Phone
} from 'lucide-react';
import Link from 'next/link';

/* ===== INTERFACES ===== */
interface Room {
  id: string; name: string; price: number; status: string; notes: string | null;
  createdAt?: string; tenants: Tenant[];
}
interface Tenant {
  id: string; fullName: string; whatsapp: string; roomId: string;
  checkInDate: string; monthlyPrice: number; dueDate: number;
  notes: string | null; active: boolean; room?: Room;
}
interface Bill {
  id: string; tenantId: string; month: string; amount: number;
  dueDate: string; status: string; createdAt?: string;
  tenant: { fullName: string; room: { name: string }; dueDate: number; whatsapp: string };
  payments?: Payment[];
}
interface Payment {
  id: string; billId: string; paymentDate: string; paymentMethod: string;
  amount: number; notes: string | null;
}
interface ElectricityLog {
  id: string; topupDate: string; nominal: number; kwhAdded: number;
  currentKwh: number; estimatedDaysLeft: number;
}

type TabKey = 'overview' | 'kamar' | 'penghuni' | 'tagihan' | 'pembayaran' | 'listrik';

export default function DashboardPage() {
  /* ===== STATE ===== */
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [electricity, setElectricity] = useState<ElectricityLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [visitedTabs, setVisitedTabs] = useState<Set<TabKey>>(() => new Set<TabKey>(['overview']));
  const [toast, setToast] = useState('');
  const today = new Date();

  /* ===== MODAL STATE ===== */
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [roomForm, setRoomForm] = useState({ name: '', price: 0, status: 'kosong', notes: '' });

  const [showTenantModal, setShowTenantModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [tenantForm, setTenantForm] = useState({
    fullName: '', whatsapp: '', roomId: '', checkInDate: '',
    monthlyPrice: 0, dueDate: 1, notes: ''
  });

  const [showBillModal, setShowBillModal] = useState(false);
  const [billForm, setBillForm] = useState({ tenantId: '', month: '', amount: 0, dueDate: '' });

  const [showPayModal, setShowPayModal] = useState(false);
  const [payBillId, setPayBillId] = useState('');
  const [payForm, setPayForm] = useState({ paymentMethod: 'tunai', amount: 0, notes: '' });

  const [showElecModal, setShowElecModal] = useState(false);
  const [elecForm, setElecForm] = useState({ nominal: 0, kwhAdded: 0, currentKwh: 0, estimatedDaysLeft: 0 });

  const [searchTerm, setSearchTerm] = useState('');

  /* ===== TAB SWITCH (with visited tracking) ===== */
  const switchTab = useCallback((tab: TabKey) => {
    setActiveTab(tab);
    setVisitedTabs(prev => {
      if (prev.has(tab)) return prev;
      const next = new Set(prev);
      next.add(tab);
      return next;
    });
  }, []);

  /* ===== FETCH DATA ===== */
  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    try {
      const [r, t, b, e] = await Promise.all([
        fetch('/api/rooms').then(x => x.json()),
        fetch('/api/tenants').then(x => x.json()),
        fetch('/api/bills').then(x => x.json()),
        fetch('/api/electricity').then(x => x.json()),
      ]);
      setRooms(Array.isArray(r) ? r : []);
      setTenants(Array.isArray(t) ? t : []);
      setBills(Array.isArray(b) ? b : []);
      setPayments(Array.isArray(b) ? b.flatMap((bill: Bill) => bill.payments || []) : []);
      setElectricity(Array.isArray(e) && e.length > 0 ? e[0] : null);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  /* ===== COMPUTED STATS ===== */
  const totalRooms = rooms.length;
  const terisiRooms = rooms.filter(r => r.status === 'terisi').length;
  const kosongRooms = rooms.filter(r => r.status === 'kosong').length;
  
  // Bill statuses
  const unpaidBills = bills.filter(b => b.status === 'belum_bayar');
  const paidBills = bills.filter(b => b.status === 'lunas');
  const totalRevenue = paidBills.reduce((s, b) => s + b.amount, 0);
  
  // Accurate "menunggak" count: rooms whose tenant has unpaid bills (regardless of room.status field)
  const menunggakRooms = rooms.filter(r => {
    const tenant = tenants.find(t => t.roomId === r.id && t.active);
    if (!tenant) return false;
    return unpaidBills.some(b => b.tenantId === tenant.id);
  }).length;
  
  // Due soon (7 days) & overdue
  const dueSoon = unpaidBills
    .filter(b => {
      const due = new Date(b.dueDate);
      const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diff <= 7 && diff >= 0;
    })
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const overdueBills = unpaidBills.filter(b => new Date(b.dueDate) < today);
  
  // Format revenue dynamically based on magnitude - now used consistently
  function formatRevenueCompact(n: number) {
    if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1).replace('.0','') + ' M';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.0','') + ' Jt';
    if (n >= 1_000) return (n / 1_000).toFixed(1).replace('.0','') + ' Rb';
    return n.toString();
  }
  
  // Get font size based on number length - now properly sized
  function getRevenueFontSize(n: number) {
    const formatted = formatRevenueCompact(n);
    if (formatted.length > 12) return 16;
    if (formatted.length > 8) return 18;
    return 20;
  }

  /* ===== HELPERS ===== */
  function getDaysLeft(dueDate: string) {
    const due = new Date(dueDate);
    return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }
  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  function formatRp(n: number) {
    return 'Rp' + n.toLocaleString('id-ID');
  }
  function formatMonth(d: string) {
    return new Date(d).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  }
  function getKwhColor(days: number) {
    if (days <= 3) return 'red';
    if (days <= 7) return 'yellow';
    return 'green';
  }
  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  const kwhPct = electricity ? Math.min((electricity.currentKwh / 100) * 100, 100) : 0;

  /* ===== CRUD: ROOMS ===== */
  async function handleRoomSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingRoom) {
      await fetch(`/api/rooms/${editingRoom.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(roomForm) });
      showToast('Kamar diperbarui');
    } else {
      await fetch('/api/rooms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(roomForm) });
      showToast('Kamar ditambahkan');
    }
    setShowRoomModal(false); setEditingRoom(null);
    setRoomForm({ name: '', price: 0, status: 'kosong', notes: '' });
    fetchAll();
  }
  async function deleteRoom(id: string) {
    if (!confirm('Hapus kamar?')) return;
    await fetch(`/api/rooms/${id}`, { method: 'DELETE' });
    showToast('Kamar dihapus');
    fetchAll();
  }
  function openRoomEdit(room: Room) {
    setEditingRoom(room);
    setRoomForm({ name: room.name, price: room.price, status: room.status, notes: room.notes || '' });
    setShowRoomModal(true);
  }

  /* ===== CRUD: TENANTS ===== */
  async function handleTenantSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingTenant) {
      await fetch(`/api/tenants/${editingTenant.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(tenantForm) });
      showToast('Penghuni diperbarui');
    } else {
      await fetch('/api/tenants', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(tenantForm) });
      showToast('Penghuni ditambahkan');
    }
    setShowTenantModal(false); setEditingTenant(null);
    setTenantForm({ fullName: '', whatsapp: '', roomId: '', checkInDate: '', monthlyPrice: 0, dueDate: 1, notes: '' });
    fetchAll();
  }
  async function deleteTenant(id: string) {
    if (!confirm('Hapus penghuni?')) return;
    await fetch(`/api/tenants/${id}`, { method: 'DELETE' });
    showToast('Penghuni dihapus');
    fetchAll();
  }
  function openTenantEdit(t: Tenant) {
    setEditingTenant(t);
    setTenantForm({ fullName: t.fullName, whatsapp: t.whatsapp, roomId: t.roomId, checkInDate: t.checkInDate.split('T')[0], monthlyPrice: t.monthlyPrice, dueDate: t.dueDate, notes: t.notes || '' });
    setShowTenantModal(true);
  }

  /* ===== CRUD: BILLS ===== */
  async function handleBillSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/bills', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(billForm) });
    showToast('Tagihan dibuat');
    setShowBillModal(false);
    setBillForm({ tenantId: '', month: '', amount: 0, dueDate: '' });
    fetchAll();
  }

  /* ===== CRUD: PAYMENTS ===== */
  async function handlePaySubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/payments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ billId: payBillId, ...payForm, paymentDate: new Date().toISOString() }) });
    showToast('Pembayaran dicatat');
    setShowPayModal(false); setPayBillId('');
    setPayForm({ paymentMethod: 'tunai', amount: 0, notes: '' });
    fetchAll();
  }

  /* ===== CRUD: ELECTRICITY ===== */
  async function handleElecSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/electricity', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(elecForm) });
    showToast('Data listrik ditambahkan');
    setShowElecModal(false);
    setElecForm({ nominal: 0, kwhAdded: 0, currentKwh: 0, estimatedDaysLeft: 0 });
    fetchAll();
  }

  /* ===== WHATSAPP LINK ===== */
  function waLink(phone: string, msg: string) {
    return `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`;
  }

  /* ===== TAB CONFIG ===== */
  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Ringkasan', icon: <BarChart3 size={16} /> },
    { key: 'kamar', label: 'Kamar', icon: <Home size={16} /> },
    { key: 'penghuni', label: 'Penghuni', icon: <Users size={16} /> },
    { key: 'tagihan', label: 'Tagihan', icon: <Receipt size={16} /> },
    { key: 'pembayaran', label: 'Pembayaran', icon: <CreditCard size={16} /> },
    { key: 'listrik', label: 'Listrik', icon: <Zap size={16} /> },
  ];

  /* ===== LOADING ===== */
  if (loading) return (
    <DashboardLayout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 16 }}>
        <div className="spinner spinner-dark" style={{ width: 40, height: 40, borderWidth: 3 }} />
        <p style={{ color: '#64748b', fontSize: 14 }}>Memuat data...</p>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      {/* ===== TAB NAVIGATION ===== */}
      <div className="tab-nav">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => switchTab(tab.key)}
            className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ============================= */}
      {/* ===== TAB: OVERVIEW ===== */}
      {/* ============================= */}
      <div style={{ display: activeTab === 'overview' ? 'block' : 'none' }}>
        {/* STAT CARDS */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon blue"><Home size={22} /></div>
            <div className="stat-info">
              <h3>Total Kamar</h3>
              <div className="stat-value">{totalRooms}</div>
              <small style={{ color: 'var(--text-light)', fontSize: 12 }}>Pintu</small>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green"><CheckCircle size={22} /></div>
            <div className="stat-info">
              <h3>Terisi</h3>
              <div className="stat-value" style={{ color: 'var(--success)' }}>{terisiRooms}</div>
              <small style={{ color: 'var(--text-light)', fontSize: 12 }}>{totalRooms > 0 ? Math.round(terisiRooms / totalRooms * 100) : 0}% hunian</small>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon gray"><Home size={22} /></div>
            <div className="stat-info">
              <h3>Kosong</h3>
              <div className="stat-value">{kosongRooms}</div>
              <small style={{ color: 'var(--text-light)', fontSize: 12 }}>Siap huni</small>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon red"><AlertCircle size={22} /></div>
            <div className="stat-info">
              <h3>Menunggak</h3>
              <div className="stat-value" style={{ color: 'var(--danger)' }}>{menunggakRooms}</div>
              <small style={{ color: 'var(--text-light)', fontSize: 12 }}>Kamar belum bayar</small>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon orange"><Clock size={22} /></div>
            <div className="stat-info">
              <h3>Jatuh Tempo</h3>
              <div className="stat-value" style={{ color: 'var(--warning)' }}>{dueSoon.length}</div>
              <small style={{ color: 'var(--text-light)', fontSize: 12 }}>7 hari lagi</small>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon yellow"><Wallet size={22} /></div>
            <div className="stat-info">
              <h3>Total Pendapatan</h3>
              <div className="stat-value" style={{ fontSize: getRevenueFontSize(totalRevenue), color: 'var(--success)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{formatRp(totalRevenue)}</div>
              <small style={{ color: 'var(--text-light)', fontSize: 12 }}>{paidBills.length} pembayaran</small>
            </div>
          </div>
        </div>

        <div className="content-grid">
          {/* JATUH TEMPO 7 HARI */}
          <div className="card">
            <div className="card-header">
              <h3>📅 Jatuh Tempo dalam 7 Hari</h3>
              <button onClick={() => switchTab('tagihan')} style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer' }}>Lihat Semua</button>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr><th>Kamar</th><th>Nama</th><th>Tanggal</th><th>Nominal</th><th>Sisa</th></tr>
                </thead>
                <tbody>
                  {dueSoon.slice(0, 5).map(b => {
                    const days = getDaysLeft(b.dueDate);
                    return (
                      <tr key={b.id}>
                        <td><strong>{b.tenant.room.name}</strong></td>
                        <td>{b.tenant.fullName}</td>
                        <td>{formatDate(b.dueDate)}</td>
                        <td>{formatRp(b.amount)}</td>
                        <td>
                          <span className={`badge ${days <= 0 ? 'badge-danger' : days <= 3 ? 'badge-danger' : 'badge-warning'}`}>
                            {days <= 0 ? 'Lewat' : `${days} hari lagi`}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {dueSoon.length === 0 && (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--text-light)' }}>Tidak ada tagihan jatuh tempo ✓</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* STATUS KAMAR - DONUT */}
          <div className="card">
            <div className="card-header">
              <h3>🏠 Status Kamar</h3>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
                <div style={{ position: 'relative', width: 120, height: 120, flexShrink: 0 }}>
                  <svg width="120" height="120" viewBox="0 0 36 36">
                    {/* Background circle */}
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#E2E8F0" strokeWidth="3.5" />
                    {/* Terisi - green */}
                    {terisiRooms > 0 && (
                      <circle cx="18" cy="18" r="15.9" fill="none" strokeWidth="3.5"
                        stroke="#22c55e"
                        strokeDasharray={`${(terisiRooms / totalRooms) * 100} ${100 - (terisiRooms / totalRooms) * 100}`}
                        strokeLinecap="round"
                        style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }} />
                    )}
                    {/* Menunggak - red */}
                    {menunggakRooms > 0 && (
                      <circle cx="18" cy="18" r="15.9" fill="none" strokeWidth="3.5"
                        stroke="#ef4444"
                        strokeDasharray={`${(menunggakRooms / totalRooms) * 100} ${100 - (menunggakRooms / totalRooms) * 100}`}
                        strokeDashoffset={-(terisiRooms / totalRooms) * 100}
                        strokeLinecap="round"
                        style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }} />
                    )}
                    {/* Kosong - gray */}
                    {kosongRooms > 0 && (
                      <circle cx="18" cy="18" r="15.9" fill="none" strokeWidth="3.5"
                        stroke="#94a3b8"
                        strokeDasharray={`${(kosongRooms / totalRooms) * 100} ${100 - (kosongRooms / totalRooms) * 100}`}
                        strokeDashoffset={-((terisiRooms + menunggakRooms) / totalRooms) * 100}
                        strokeLinecap="round"
                        style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }} />
                    )}
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                    <span style={{ fontSize: 22, fontWeight: 800 }}>{totalRooms}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-light)' }}>Total</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--success)' }} />
                    Terisi {terisiRooms} ({totalRooms > 0 ? Math.round(terisiRooms / totalRooms * 100) : 0}%)
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#94A3B8' }} />
                    Kosong {kosongRooms} ({totalRooms > 0 ? Math.round(kosongRooms / totalRooms * 100) : 0}%)
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--danger)' }} />
                    Menunggak {menunggakRooms}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PENGHUNI BELUM BAYAR + LISTRIK */}
        <div className="content-grid">
          <div className="card">
            <div className="card-header">
              <h3>⚠️ Penghuni Belum Bayar</h3>
              <button onClick={() => switchTab('tagihan')} style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer' }}>Lihat Semua</button>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr><th>Kamar</th><th>Nama</th><th>Nominal</th><th>Jatuh Tempo</th><th>Aksi</th></tr>
                </thead>
                <tbody>
                  {unpaidBills.slice(0, 5).map(b => {
                    const days = getDaysLeft(b.dueDate);
                    return (
                      <tr key={b.id}>
                        <td><strong>{b.tenant.room.name}</strong></td>
                        <td>{b.tenant.fullName}</td>
                        <td>{formatRp(b.amount)}</td>
                        <td>
                          <span className={`badge ${days < 0 ? 'badge-danger' : days <= 3 ? 'badge-danger' : 'badge-warning'}`}>
                            {days < 0 ? `Terlambat ${Math.abs(days)}h` : `${days}h lagi`}
                          </span>
                        </td>
                        <td>
                          <a href={waLink(b.tenant.whatsapp, `Halo ${b.tenant.fullName}, tagihan kos bulan ${b.month} sebesar ${formatRp(b.amount)} sudah jatuh tempo. Mohon segera dilunasi. Terima kasih!`)}
                            target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp btn-sm">
                            <Send size={12} /> WA
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                  {unpaidBills.length === 0 && (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--text-light)' }}>Semua tagihan lunas 🎉</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* LISTRIK TOKEN */}
          <div className="electricity-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>⚡</span>
                <h3 style={{ fontSize: 15, fontWeight: 700 }}>Listrik Token</h3>
              </div>
              <button onClick={() => switchTab('listrik')} style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer' }}>Detail →</button>
            </div>
            {electricity ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
                  <div>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Sisa Token</p>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: 0 }}>
                      <span style={{ fontSize: 36, fontWeight: 800 }}>{electricity.currentKwh.toFixed(2)}</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>kWh</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Perkiraan habis</p>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: 28, fontWeight: 800, color: electricity.estimatedDaysLeft <= 3 ? 'var(--danger)' : electricity.estimatedDaysLeft <= 7 ? 'var(--warning)' : 'var(--success)' }}>
                        {electricity.estimatedDaysLeft}
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>hari</span>
                    </div>
                  </div>
                </div>
                <div className="progress-bar" style={{ margin: '12px 0' }}>
                  <div className={`progress-fill ${getKwhColor(electricity.estimatedDaysLeft)}`} style={{ width: `${kwhPct}%` }} />
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  Terakhir isi: {formatDate(electricity.topupDate)} ({formatRp(electricity.nominal)})
                </p>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-secondary)' }}>
                <p>Belum ada data listrik</p>
              </div>
            )}
          </div>
        </div>

        {/* GRID KAMAR OVERVIEW */}
        <div className="card">
          <div className="card-header">
            <h3>🏠 Grid Kamar</h3>
            <button onClick={() => switchTab('kamar')} className="btn btn-primary btn-sm">Kelola Kamar →</button>
          </div>
          <div className="card-body">
            <div className="room-grid">
              {rooms.map(room => {
                const tenant = room.tenants?.[0];
                const cls = room.status === 'terisi' ? 'status-terisi' : room.status === 'menunggak' ? 'status-menunggak' : 'status-kosong';
                return (
                  <div key={room.id} className={`room-card ${cls}`}>
                    <div className="room-card-name">{room.name}</div>
                    {tenant && <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>{tenant.fullName}</div>}
                    {tenant && <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6 }}>Jatuh tempo: {tenant.dueDate} tiap bulan</div>}
                    <div className="room-card-price">{formatRp(room.price)}/bln</div>
                    <span className="room-card-status">{room.status === 'terisi' ? 'Terisi' : room.status === 'menunggak' ? 'Menunggak' : 'Kosong'}</span>
                  </div>
                );
              })}
            </div>
            {rooms.length === 0 && (
              <div className="empty-state">
                <Home size={40} />
                <h3>Belum ada kamar</h3>
                <p>Tambahkan kamar untuk mulai mengelola kos Anda</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================= */}
      {/* ===== TAB: KAMAR ===== */}
      {/* ============================= */}
      <div style={{ display: activeTab === 'kamar' ? 'block' : 'none' }}>
        <div className="page-header">
          <div>
            <h2>Kelola Kamar</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>Tambah, edit, dan hapus kamar kos</p>
          </div>
          <button onClick={() => { setShowRoomModal(true); setEditingRoom(null); setRoomForm({ name: '', price: 0, status: 'kosong', notes: '' }); }} className="btn btn-primary">
            <Plus size={16} /> Tambah Kamar
          </button>
        </div>

        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
          <div className="stat-card"><div className="stat-icon blue"><Home size={20} /></div><div className="stat-info"><h3>Total</h3><div className="stat-value">{totalRooms}</div></div></div>
          <div className="stat-card"><div className="stat-icon green"><CheckCircle size={20} /></div><div className="stat-info"><h3>Terisi</h3><div className="stat-value" style={{ color: 'var(--success)' }}>{terisiRooms}</div></div></div>
          <div className="stat-card"><div className="stat-icon gray"><Home size={20} /></div><div className="stat-info"><h3>Kosong</h3><div className="stat-value">{kosongRooms}</div></div></div>
          <div className="stat-card"><div className="stat-icon red"><XCircle size={20} /></div><div className="stat-info"><h3>Menunggak</h3><div className="stat-value" style={{ color: 'var(--danger)' }}>{menunggakRooms}</div></div></div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Grid Kamar</h3>
            <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--success)' }} />Terisi</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--danger)' }} />Menunggak</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#94A3B8' }} />Kosong</span>
            </div>
          </div>
          <div className="card-body">
            <div className="room-grid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))' }}>
              {rooms.map(room => {
                const tenant = room.tenants?.[0];
                const cls = room.status === 'terisi' ? 'status-terisi' : room.status === 'menunggak' ? 'status-menunggak' : 'status-kosong';
                return (
                  <div key={room.id} className={`room-card ${cls}`} style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 6 }}>
                      <button onClick={() => openRoomEdit(room)} style={{ background: 'rgba(255,255,255,0.8)', border: 'none', borderRadius: 6, padding: 4, cursor: 'pointer', display: 'flex', color: 'var(--text-secondary)' }}><Edit size={14} /></button>
                      <button onClick={() => deleteRoom(room.id)} style={{ background: 'rgba(255,255,255,0.8)', border: 'none', borderRadius: 6, padding: 4, cursor: 'pointer', display: 'flex', color: 'var(--danger)' }}><Trash2 size={14} /></button>
                    </div>
                    <div className="room-card-name">{room.name}</div>
                    {tenant ? (
                      <>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2 }}>{tenant.fullName}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6 }}>Tgl {tenant.dueDate} tiap bulan</div>
                      </>
                    ) : (
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8 }}>Tidak ada penghuni</div>
                    )}
                    <div className="room-card-price">{formatRp(room.price)}/bln</div>
                    <span className="room-card-status">{room.status === 'terisi' ? 'Terisi' : room.status === 'menunggak' ? 'Menunggak' : 'Kosong'}</span>
                  </div>
                );
              })}
            </div>
            {rooms.length === 0 && (
              <div className="empty-state">
                <Home size={48} />
                <h3>Belum ada kamar</h3>
                <p>Tambahkan kamar untuk mulai mengelola kos Anda</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================= */}
      {/* ===== TAB: PENGHUNI ===== */}
      {/* ============================= */}
      <div style={{ display: activeTab === 'penghuni' ? 'block' : 'none' }}>
        <div className="page-header">
          <div>
            <h2>Kelola Penghuni</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{tenants.length} penghuni aktif</p>
          </div>
          <button onClick={() => { setShowTenantModal(true); setEditingTenant(null); setTenantForm({ fullName: '', whatsapp: '', roomId: '', checkInDate: '', monthlyPrice: 0, dueDate: 1, notes: '' }); }} className="btn btn-primary">
            <Plus size={16} /> Tambah Penghuni
          </button>
        </div>

        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Nama</th><th>WhatsApp</th><th>Kamar</th><th>Masuk</th><th>Harga/Bln</th><th>Jatuh Tempo</th><th>Status</th><th style={{ textAlign: 'right' }}>Aksi</th></tr>
              </thead>
              <tbody>
                {tenants.filter(t => t.active).map(t => {
                  const room = rooms.find(r => r.id === t.roomId);
                  return (
                    <tr key={t.id}>
                      <td><strong>{t.fullName}</strong></td>
                      <td><a href={waLink(t.whatsapp, '')} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontSize: 13 }}>{t.whatsapp}</a></td>
                      <td><span className="badge badge-info">{room?.name || '-'}</span></td>
                      <td style={{ fontSize: 13 }}>{formatDate(t.checkInDate)}</td>
                      <td>{formatRp(t.monthlyPrice)}</td>
                      <td>Tgl {t.dueDate}</td>
                      <td><span className="badge badge-success">Aktif</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button onClick={() => openTenantEdit(t)} className="btn btn-outline btn-sm"><Edit size={14} /></button>
                          <button onClick={() => deleteTenant(t.id)} className="btn btn-danger btn-sm"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {tenants.filter(t => t.active).length === 0 && (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--text-light)' }}>Belum ada penghuni aktif</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ============================= */}
      {/* ===== TAB: TAGIHAN ===== */}
      {/* ============================= */}
      <div style={{ display: activeTab === 'tagihan' ? 'block' : 'none' }}>
        <div className="page-header">
          <div>
            <h2>Kelola Tagihan</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{unpaidBills.length} belum bayar, {paidBills.length} lunas</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
              <input className="form-input" placeholder="Cari tagihan..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                style={{ paddingLeft: 36, width: 200 }} />
            </div>
            <button onClick={() => setShowBillModal(true)} className="btn btn-primary">
              <Plus size={16} /> Buat Tagihan
            </button>
          </div>
        </div>

        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 24 }}>
          <div className="stat-card"><div className="stat-icon red"><AlertCircle size={20} /></div><div className="stat-info"><h3>Belum Bayar</h3><div className="stat-value" style={{ color: 'var(--danger)' }}>{unpaidBills.length}</div></div></div>
          <div className="stat-card"><div className="stat-icon orange"><Clock size={20} /></div><div className="stat-info"><h3>Jatuh Tempo</h3><div className="stat-value" style={{ color: 'var(--warning)' }}>{dueSoon.length}</div></div></div>
          <div className="stat-card"><div className="stat-icon green"><CheckCircle size={20} /></div><div className="stat-info"><h3>Lunas</h3><div className="stat-value" style={{ color: 'var(--success)' }}>{paidBills.length}</div></div></div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Semua Tagihan</h3>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Kamar</th><th>Nama</th><th>Bulan</th><th>Nominal</th><th>Jatuh Tempo</th><th>Status</th><th style={{ textAlign: 'right' }}>Aksi</th></tr>
              </thead>
              <tbody>
                {bills.filter(b => {
                  if (!searchTerm) return true;
                  const s = searchTerm.toLowerCase();
                  return b.tenant.fullName.toLowerCase().includes(s) || b.tenant.room.name.toLowerCase().includes(s) || b.month.toLowerCase().includes(s);
                }).map(b => {
                  const days = getDaysLeft(b.dueDate);
                  return (
                    <tr key={b.id}>
                      <td><strong>{b.tenant.room.name}</strong></td>
                      <td>{b.tenant.fullName}</td>
                      <td style={{ fontSize: 13 }}>{formatMonth(b.dueDate)}</td>
                      <td>{formatRp(b.amount)}</td>
                      <td>{formatDate(b.dueDate)}</td>
                      <td>
                        {b.status === 'lunas'
                          ? <span className="badge badge-success">Lunas</span>
                          : <span className={`badge ${days < 0 ? 'badge-danger' : 'badge-warning'}`}>{days < 0 ? `Terlambat ${Math.abs(days)}h` : `${days}h lagi`}</span>}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          {b.status === 'belum_bayar' && (
                            <>
                              <button onClick={() => { setPayBillId(b.id); setPayForm({ ...payForm, amount: b.amount }); setShowPayModal(true); }} className="btn btn-success btn-sm"><CreditCard size={14} /></button>
                              <a href={waLink(b.tenant.whatsapp, `Halo ${b.tenant.fullName}, tagihan kos bulan ${b.month} sebesar ${formatRp(b.amount)} sudah jatuh tempo. Mohon segera dilunasi. Terima kasih!`)}
                                target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp btn-sm"><Send size={14} /></a>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {bills.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--text-light)' }}>Belum ada tagihan</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ============================= */}
      {/* ===== TAB: PEMBAYARAN ===== */}
      {/* ============================= */}
      <div style={{ display: activeTab === 'pembayaran' ? 'block' : 'none' }}>
        <div className="page-header">
          <div>
            <h2>Riwayat Pembayaran</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{payments.length} total pembayaran</p>
          </div>
        </div>

        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 24 }}>
          <div className="stat-card"><div className="stat-icon green"><Wallet size={20} /></div><div className="stat-info"><h3>Total Diterima</h3><div className="stat-value" style={{ fontSize: 20, color: 'var(--success)' }}>{formatRp(totalRevenue)}</div></div></div>
          <div className="stat-card"><div className="stat-icon blue"><CreditCard size={20} /></div><div className="stat-info"><h3>Total Transaksi</h3><div className="stat-value">{payments.length}</div></div></div>
          <div className="stat-card"><div className="stat-icon orange"><TrendingUp size={20} /></div><div className="stat-info"><h3>Rata-rata</h3><div className="stat-value" style={{ fontSize: 20 }}>{payments.length > 0 ? formatRp(Math.round(totalRevenue / payments.length)) : '-'}</div></div></div>
        </div>

        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Tanggal</th><th>Metode</th><th>Jumlah</th><th>Catatan</th></tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id}>
                    <td>{formatDate(p.paymentDate)}</td>
                    <td><span className="badge badge-info" style={{ textTransform: 'capitalize' }}>{p.paymentMethod}</span></td>
                    <td><strong style={{ color: 'var(--success)' }}>{formatRp(p.amount)}</strong></td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{p.notes || '-'}</td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: 32, color: 'var(--text-light)' }}>Belum ada pembayaran</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ============================= */}
      {/* ===== TAB: LISTRIK ===== */}
      {/* ============================= */}
      <div style={{ display: activeTab === 'listrik' ? 'block' : 'none' }}>
        <div className="page-header">
          <div>
            <h2>Monitoring Listrik Token</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>Pantau penggunaan token listrik</p>
          </div>
          <button onClick={() => setShowElecModal(true)} className="btn btn-primary">
            <Plus size={16} /> Input Token
          </button>
        </div>

        {electricity && (
          <>
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 24 }}>
              <div className="stat-card">
                <div className="stat-icon yellow"><Zap size={20} /></div>
                <div className="stat-info"><h3>Sisa Token</h3><div className="stat-value">{electricity.currentKwh.toFixed(1)} <small style={{ fontSize: 14, color: 'var(--text-secondary)' }}>kWh</small></div></div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ background: electricity.estimatedDaysLeft <= 3 ? '#FFF1F2' : electricity.estimatedDaysLeft <= 7 ? '#FFF7ED' : '#ECFDF5', color: electricity.estimatedDaysLeft <= 3 ? 'var(--danger)' : electricity.estimatedDaysLeft <= 7 ? 'var(--warning)' : 'var(--success)' }}><Clock size={20} /></div>
                <div className="stat-info"><h3>Estimasi Habis</h3><div className="stat-value" style={{ color: electricity.estimatedDaysLeft <= 3 ? 'var(--danger)' : electricity.estimatedDaysLeft <= 7 ? 'var(--warning)' : 'var(--success)' }}>{electricity.estimatedDaysLeft} <small style={{ fontSize: 14, color: 'var(--text-secondary)' }}>hari</small></div></div>
              </div>
              <div className="stat-card">
                <div className="stat-icon orange"><Wallet size={20} /></div>
                <div className="stat-info"><h3>Terakhir Beli</h3><div className="stat-value" style={{ fontSize: 20 }}>{formatRp(electricity.nominal)}</div><small style={{ color: 'var(--text-light)', fontSize: 12 }}>{formatDate(electricity.topupDate)}</small></div>
              </div>
            </div>

            <div className="card" style={{ marginBottom: 24 }}>
              <div className="card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 600 }}>Status Token</h3>
                </div>
                <div className="progress-bar" style={{ height: 14, marginBottom: 16 }}>
                  <div className={`progress-fill ${getKwhColor(electricity.estimatedDaysLeft)}`} style={{ width: `${kwhPct}%` }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-secondary)' }}>
                  <span>{electricity.currentKwh.toFixed(2)} kWh tersisa</span>
                  <span>{electricity.estimatedDaysLeft} hari lagi</span>
                </div>
                {electricity.estimatedDaysLeft <= 3 && (
                  <div style={{ marginTop: 16, padding: '12px 16px', background: '#FEF2F2', borderRadius: 8, border: '1px solid #FECACA', fontSize: 13, color: 'var(--danger)', fontWeight: 600 }}>
                    ⚠️ Token listrik hampir habis! Segera lakukan pembelian ulang.
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {!electricity && (
          <div className="card">
            <div className="empty-state">
              <Zap size={48} />
              <h3>Belum ada data listrik</h3>
              <p>Mulai input data token listrik untuk memantau penggunaan</p>
            </div>
          </div>
        )}
      </div>

      {/* ================================ */}
      {/* ===== MODALS ===== */}
      {/* ================================ */}

      {/* MODAL: KAMAR */}
      {showRoomModal && (
        <div className="modal-overlay" onClick={() => setShowRoomModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingRoom ? 'Edit Kamar' : 'Tambah Kamar'}</h3>
              <button className="modal-close" onClick={() => setShowRoomModal(false)}>✕</button>
            </div>
            <form onSubmit={handleRoomSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Nama Kamar</label>
                    <input className="form-input" type="text" value={roomForm.name} onChange={e => setRoomForm({ ...roomForm, name: e.target.value })} placeholder="A1, B2, ..." required />
                  </div>
                  <div className="form-group">
                    <label>Harga per Bulan (Rp)</label>
                    <input className="form-input" type="number" value={roomForm.price} onChange={e => setRoomForm({ ...roomForm, price: parseInt(e.target.value) })} required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select className="form-select" value={roomForm.status} onChange={e => setRoomForm({ ...roomForm, status: e.target.value })}>
                    <option value="kosong">Kosong</option>
                    <option value="terisi">Terisi</option>
                    <option value="menunggak">Menunggak</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Catatan</label>
                  <textarea className="form-textarea" value={roomForm.notes} onChange={e => setRoomForm({ ...roomForm, notes: e.target.value })} placeholder="Fasilitas, kondisi, dll..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowRoomModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PENGHUNI */}
      {showTenantModal && (
        <div className="modal-overlay" onClick={() => setShowTenantModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingTenant ? 'Edit Penghuni' : 'Tambah Penghuni'}</h3>
              <button className="modal-close" onClick={() => setShowTenantModal(false)}>✕</button>
            </div>
            <form onSubmit={handleTenantSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Nama Lengkap</label>
                    <input className="form-input" type="text" value={tenantForm.fullName} onChange={e => setTenantForm({ ...tenantForm, fullName: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>WhatsApp</label>
                    <input className="form-input" type="text" value={tenantForm.whatsapp} onChange={e => setTenantForm({ ...tenantForm, whatsapp: e.target.value })} placeholder="08xxx" required />
                  </div>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Kamar</label>
                    <select className="form-select" value={tenantForm.roomId} onChange={e => setTenantForm({ ...tenantForm, roomId: e.target.value })} required>
                      <option value="">Pilih Kamar</option>
                      {rooms.filter(r => r.status === 'kosong' || (editingTenant && r.id === editingTenant.roomId)).map(r => (
                        <option key={r.id} value={r.id}>{r.name} - {formatRp(r.price)}/bln</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Tanggal Masuk</label>
                    <input className="form-input" type="date" value={tenantForm.checkInDate} onChange={e => setTenantForm({ ...tenantForm, checkInDate: e.target.value })} required />
                  </div>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Harga Sewa/Bulan (Rp)</label>
                    <input className="form-input" type="number" value={tenantForm.monthlyPrice} onChange={e => setTenantForm({ ...tenantForm, monthlyPrice: parseInt(e.target.value) })} required />
                  </div>
                  <div className="form-group">
                    <label>Jatuh Tempo (tanggal)</label>
                    <input className="form-input" type="number" min={1} max={31} value={tenantForm.dueDate} onChange={e => setTenantForm({ ...tenantForm, dueDate: parseInt(e.target.value) })} required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Catatan</label>
                  <textarea className="form-textarea" value={tenantForm.notes} onChange={e => setTenantForm({ ...tenantForm, notes: e.target.value })} placeholder="Catatan tambahan..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowTenantModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TAGIHAN */}
      {showBillModal && (
        <div className="modal-overlay" onClick={() => setShowBillModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Buat Tagihan Baru</h3>
              <button className="modal-close" onClick={() => setShowBillModal(false)}>✕</button>
            </div>
            <form onSubmit={handleBillSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Penghuni</label>
                  <select className="form-select" value={billForm.tenantId} onChange={e => setBillForm({ ...billForm, tenantId: e.target.value })} required>
                    <option value="">Pilih Penghuni</option>
                    {tenants.filter(t => t.active).map(t => (
                      <option key={t.id} value={t.id}>{t.fullName} ({rooms.find(r => r.id === t.roomId)?.name})</option>
                    ))}
                  </select>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Bulan</label>
                    <input className="form-input" type="month" value={billForm.month} onChange={e => setBillForm({ ...billForm, month: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Nominal (Rp)</label>
                    <input className="form-input" type="number" value={billForm.amount} onChange={e => setBillForm({ ...billForm, amount: parseInt(e.target.value) })} required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Jatuh Tempo</label>
                  <input className="form-input" type="date" value={billForm.dueDate} onChange={e => setBillForm({ ...billForm, dueDate: e.target.value })} required />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowBillModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary">Buat Tagihan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PEMBAYARAN */}
      {showPayModal && (
        <div className="modal-overlay" onClick={() => setShowPayModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Catat Pembayaran</h3>
              <button className="modal-close" onClick={() => setShowPayModal(false)}>✕</button>
            </div>
            <form onSubmit={handlePaySubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Metode Pembayaran</label>
                  <select className="form-select" value={payForm.paymentMethod} onChange={e => setPayForm({ ...payForm, paymentMethod: e.target.value })}>
                    <option value="tunai">Tunai</option>
                    <option value="transfer">Transfer</option>
                    <option value="qris">QRIS</option>
                    <option value="ewallet">E-Wallet</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Jumlah (Rp)</label>
                  <input className="form-input" type="number" value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: parseInt(e.target.value) })} required />
                </div>
                <div className="form-group">
                  <label>Catatan</label>
                  <textarea className="form-textarea" value={payForm.notes} onChange={e => setPayForm({ ...payForm, notes: e.target.value })} placeholder="Contoh: Bayar cash via Budi" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowPayModal(false)}>Batal</button>
                <button type="submit" className="btn btn-success">Simpan Pembayaran</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: LISTRIK */}
      {showElecModal && (
        <div className="modal-overlay" onClick={() => setShowElecModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Input Token Listrik</h3>
              <button className="modal-close" onClick={() => setShowElecModal(false)}>✕</button>
            </div>
            <form onSubmit={handleElecSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Nominal (Rp)</label>
                    <input className="form-input" type="number" value={elecForm.nominal} onChange={e => setElecForm({ ...elecForm, nominal: parseInt(e.target.value) })} required />
                  </div>
                  <div className="form-group">
                    <label>kWh Ditambahkan</label>
                    <input className="form-input" type="number" step="0.01" value={elecForm.kwhAdded} onChange={e => setElecForm({ ...elecForm, kwhAdded: parseFloat(e.target.value) })} required />
                  </div>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>kWh Saat Ini (Sisa)</label>
                    <input className="form-input" type="number" step="0.01" value={elecForm.currentKwh} onChange={e => setElecForm({ ...elecForm, currentKwh: parseFloat(e.target.value) })} required />
                  </div>
                  <div className="form-group">
                    <label>Estimasi Habis (hari)</label>
                    <input className="form-input" type="number" value={elecForm.estimatedDaysLeft} onChange={e => setElecForm({ ...elecForm, estimatedDaysLeft: parseInt(e.target.value) })} required />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowElecModal(false)}>Batal</button>
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