'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Plus, Edit, Trash2, MessageCircle, Phone, LogOut } from 'lucide-react';

interface Room { id: string; name: string; price: number; status: string; }
interface Tenant {
  id: string; fullName: string; whatsapp: string; roomId: string;
  checkInDate: string; checkOutDate: string | null; monthlyPrice: number; dueDate: number;
  notes: string | null; active: boolean; room: Room;
}

export default function PenghuniPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [formData, setFormData] = useState({
    fullName:'', whatsapp:'', roomId:'', checkInDate:'',
    monthlyPrice:0, dueDate:1, notes:'', active:true
  });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    const [t, r] = await Promise.all([fetch('/api/tenants').then(x=>x.json()), fetch('/api/rooms').then(x=>x.json())]);
    setTenants(Array.isArray(t) ? t : []);
    setRooms(Array.isArray(r) ? r : []);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingTenant) {
      await fetch(`/api/tenants/${editingTenant.id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(formData) });
      showToast('Data penghuni berhasil diperbarui');
    } else {
      await fetch('/api/tenants', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(formData) });
      showToast('Penghuni berhasil ditambahkan');
    }
    setShowModal(false);
    setEditingTenant(null);
    resetForm();
    fetchData();
  }

  async function handleCheckout(tenant: Tenant) {
    if (!confirm(`Yakin ${tenant.fullName} mau keluar dari kos?\nKamar ${tenant.room.name} akan menjadi kosong.`)) return;
    await fetch(`/api/tenants/${tenant.id}`, {
      method:'PATCH', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ action:'checkout' })
    });
    setSelectedTenant(null);
    showToast(`${tenant.fullName} berhasil checkout`);
    fetchData();
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus penghuni ini secara permanen? Data tidak bisa dikembalikan.')) return;
    await fetch(`/api/tenants/${id}`, { method:'DELETE' });
    setSelectedTenant(null);
    showToast('Penghuni berhasil dihapus');
    fetchData();
  }

  function openEdit(tenant: Tenant) {
    setEditingTenant(tenant);
    setFormData({
      fullName:tenant.fullName, whatsapp:tenant.whatsapp, roomId:tenant.roomId,
      checkInDate:tenant.checkInDate.split('T')[0], monthlyPrice:tenant.monthlyPrice,
      dueDate:tenant.dueDate, notes:tenant.notes||'', active:tenant.active
    });
    setShowModal(true);
  }

  function resetForm() {
    setFormData({ fullName:'', whatsapp:'', roomId:'', checkInDate:'', monthlyPrice:0, dueDate:1, notes:'', active:true });
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'});
  }

  function formatRp(n: number) { return 'Rp'+n.toLocaleString('id-ID'); }

  function openWhatsApp(wa: string, name: string) {
    const num = wa.replace(/^0/, '62');
    window.open(`https://wa.me/${num}`, '_blank');
  }

  const activeTenants = tenants.filter(t => t.active);
  const inactiveTenants = tenants.filter(t => !t.active);
  const displayTenants = showInactive ? inactiveTenants : activeTenants;
  const availableRooms = rooms.filter(r => r.status === 'kosong' || r.id === editingTenant?.roomId);

  return (
    <DashboardLayout>
      <div style={{ display:'flex', gap:24 }}>
        {/* SIDEBAR DETAIL */}
        {selectedTenant && (
          <div style={{ width:280, flexShrink:0 }}>
            <div className="card" style={{ position:'sticky', top:96 }}>
              <div className="card-header">
                <button onClick={() => setSelectedTenant(null)} style={{ border:'none', background:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:4, fontSize:13, color:'var(--text-secondary)', fontFamily:'inherit' }}>
                  ← Kembali
                </button>
                <button onClick={() => openEdit(selectedTenant)} className="btn btn-outline btn-sm"><Edit size={14} /> Edit</button>
              </div>
              <div className="card-body">
                <div style={{ textAlign:'center', marginBottom:20 }}>
                  <div style={{ width:64, height:64, borderRadius:'50%', background:'linear-gradient(135deg, var(--primary), var(--primary-light))', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:24, fontWeight:700, margin:'0 auto 12px' }}>
                    {selectedTenant.fullName.charAt(0)}
                  </div>
                  <h3 style={{ fontSize:16, fontWeight:700 }}>{selectedTenant.fullName}</h3>
                  <span className={`badge ${selectedTenant.active ? 'badge-success' : 'badge-gray'}`}>{selectedTenant.active ? 'Aktif' : 'Non-aktif'}</span>
                  <p style={{ fontSize:13, color:'var(--text-secondary)', marginTop:4 }}>Kamar {selectedTenant.room.name}</p>
                </div>
                {[
                  ['No. WhatsApp', selectedTenant.whatsapp],
                  ['Tanggal Masuk', formatDate(selectedTenant.checkInDate)],
                  ['Harga Sewa', formatRp(selectedTenant.monthlyPrice)+'/bulan'],
                  ['Jatuh Tempo', `${selectedTenant.dueDate} setiap bulan`],
                  ['Catatan', selectedTenant.notes || '-'],
                ].map(([k,v]) => (
                  <div key={k} style={{ padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
                    <p style={{ fontSize:11, color:'var(--text-secondary)', fontWeight:600, textTransform:'uppercase', marginBottom:2 }}>{k}</p>
                    <p style={{ fontSize:13, fontWeight:500 }}>{v}</p>
                  </div>
                ))}
                <div style={{ marginTop:16, display:'flex', gap:8, flexDirection:'column' }}>
                  {selectedTenant.active && (
                    <button onClick={() => handleCheckout(selectedTenant)} className="btn btn-danger">
                      <LogOut size={16} /> Keluar dari Kos
                    </button>
                  )}
                  <button onClick={() => openWhatsApp(selectedTenant.whatsapp, selectedTenant.fullName)} className="btn btn-whatsapp">
                    <MessageCircle size={16} /> Chat WhatsApp
                  </button>
                  {!selectedTenant.active && (
                    <button onClick={() => handleDelete(selectedTenant.id)} className="btn btn-danger btn-sm">
                      <Trash2 size={14} /> Hapus Permanen
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MAIN CONTENT */}
        <div style={{ flex:1, minWidth:0 }}>
          <div className="page-header">
            <div>
              <h2>Penghuni</h2>
              <p style={{ fontSize:13, color:'var(--text-secondary)', marginTop:2 }}>
                {activeTenants.length} aktif · {inactiveTenants.length} sudah keluar
              </p>
            </div>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <button onClick={() => setShowInactive(!showInactive)} className={`btn ${showInactive ? 'btn-outline' : 'btn-outline'}`} style={{ fontSize:13 }}>
                {showInactive ? '← Kembali ke Aktif' : 'Lihat yang Sudah Keluar'}
              </button>
              {!showInactive && (
                <button onClick={() => { setShowModal(true); setEditingTenant(null); resetForm(); }} className="btn btn-primary">
                  <Plus size={16} /> Tambah Penghuni
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign:'center', padding:60 }}><div className="spinner" style={{ borderTopColor:'var(--primary)', width:40, height:40, margin:'0 auto' }} /></div>
          ) : (
            <div className="room-groups-list">
              <div className="dash-room-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {displayTenants.map(tenant => {
                  const cardColor = tenant.active ? 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)' : '#94A3B8';
                  
                  return (
                    <div 
                      key={tenant.id}
                      onClick={() => setSelectedTenant(tenant)}
                      className={`dash-room-card ${selectedTenant?.id === tenant.id ? 'active-room-card' : ''}`}
                      style={{
                        background: 'white',
                        borderRadius: '16px',
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
                      <div style={{ height: '6px', background: cardColor }} />
                      
                      {/* Card Body */}
                      <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        {/* Header Info */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                          <span style={{
                            background: tenant.active ? '#eef2ff' : '#f1f5f9',
                            color: tenant.active ? 'var(--primary)' : '#475569',
                            fontSize: '14px',
                            fontWeight: 800,
                            padding: '4px 12px',
                            borderRadius: '8px',
                            border: tenant.active ? '1px solid #e0e7ff' : '1px solid #e2e8f0'
                          }}>
                            Kamar {tenant.room.name}
                          </span>
                          <span className={`badge ${tenant.active ? 'badge-success' : 'badge-gray'}`}>
                            {tenant.active ? 'Aktif' : 'Keluar'}
                          </span>
                        </div>

                        {/* Tenant Name */}
                        <h4 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 12px 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: tenant.active ? 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)' : '#94A3B8',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: 700,
                            flexShrink: 0
                          }}>
                            {tenant.fullName.charAt(0)}
                          </div>
                          {tenant.fullName}
                        </h4>

                        {/* Tenant Details */}
                        <div style={{ fontSize: '13px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px', flex: 1 }}>
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
                          gap: '8px',
                          justifyContent: 'flex-end',
                          borderTop: '1px solid #f1f5f9',
                          paddingTop: '12px'
                        }}>
                          <button onClick={() => openWhatsApp(tenant.whatsapp, tenant.fullName)} className="btn btn-whatsapp btn-sm" title="WhatsApp" style={{ padding: '6px 10px' }}>
                            <MessageCircle size={14} />
                          </button>
                          {tenant.active && (
                            <button onClick={() => openEdit(tenant)} className="btn btn-outline btn-sm" style={{ padding: '6px 10px' }}>
                              <Edit size={14} />
                            </button>
                          )}
                          {tenant.active ? (
                            <button onClick={() => handleCheckout(tenant)} className="btn btn-danger btn-sm" title="Keluar" style={{ padding: '6px 10px' }}>
                              <LogOut size={14} />
                            </button>
                          ) : (
                            <button onClick={() => handleDelete(tenant.id)} className="btn btn-danger btn-sm" title="Hapus Permanen" style={{ padding: '6px 10px' }}>
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {displayTenants.length === 0 && (
                <div className="card" style={{ textAlign:'center', padding:32, color:'var(--text-light)' }}>
                  {showInactive ? 'Belum ada penghuni yang keluar' : 'Belum ada penghuni aktif'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODAL PENGHUNI */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth:560 }} onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingTenant ? 'Edit Penghuni' : 'Tambah Penghuni'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group full">
                    <label>Nama Lengkap</label>
                    <input className="form-input" type="text" value={formData.fullName} onChange={e=>setFormData({...formData,fullName:e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>No. WhatsApp</label>
                    <input className="form-input" type="text" value={formData.whatsapp} onChange={e=>setFormData({...formData,whatsapp:e.target.value})} placeholder="628xxx" required />
                  </div>
                  <div className="form-group">
                    <label>Kamar</label>
                    <select className="form-select" value={formData.roomId} onChange={e=>{
                      const r = rooms.find(x=>x.id===e.target.value);
                      setFormData({...formData, roomId:e.target.value, monthlyPrice:r?.price||formData.monthlyPrice});
                    }} required>
                      <option value="">Pilih Kamar</option>
                      {availableRooms.map(r=><option key={r.id} value={r.id}>{r.name} — {formatRp(r.price)}/bln</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Tanggal Check-in</label>
                    <input className="form-input" type="date" value={formData.checkInDate} onChange={e=>setFormData({...formData,checkInDate:e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Harga per Bulan (Rp)</label>
                    <input className="form-input" type="number" value={formData.monthlyPrice} onChange={e=>setFormData({...formData,monthlyPrice:parseInt(e.target.value)})} required />
                  </div>
                  <div className="form-group">
                    <label>Jatuh Tempo (tanggal ke-)</label>
                    <input className="form-input" type="number" value={formData.dueDate} onChange={e=>setFormData({...formData,dueDate:parseInt(e.target.value)})} min={1} max={31} required />
                  </div>
                  <div className="form-group full">
                    <label>Catatan</label>
                    <textarea className="form-textarea" value={formData.notes} onChange={e=>setFormData({...formData,notes:e.target.value})} placeholder="KTP, kendaraan, catatan lain..." />
                  </div>
                  <div className="form-group" style={{ display:'flex', alignItems:'center', gap:8, marginBottom:0 }}>
                    <input type="checkbox" id="active" checked={formData.active} onChange={e=>setFormData({...formData,active:e.target.checked})} style={{ width:16, height:16 }} />
                    <label htmlFor="active" style={{ marginBottom:0 }}>Penghuni Aktif</label>
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
