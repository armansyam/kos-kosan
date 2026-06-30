'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Plus, Edit, Trash2, Home, Users, XCircle } from 'lucide-react';

interface Tenant { id: string; fullName: string; dueDate: number; active: boolean; }
interface Room {
  id: string; name: string; price: number; status: string; notes: string | null;
  tenants: Tenant[];
}

export default function KamarPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState({ name: '', price: 0, status: 'kosong', notes: '' });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  useEffect(() => { fetchRooms(); }, []);

  async function fetchRooms() {
    setLoading(true);
    const d = await fetch('/api/rooms').then(r=>r.json());
    setRooms(Array.isArray(d) ? d : []);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingRoom) {
      await fetch(`/api/rooms/${editingRoom.id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(formData) });
      showToast('Kamar berhasil diperbarui');
    } else {
      await fetch('/api/rooms', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(formData) });
      showToast('Kamar berhasil ditambahkan');
    }
    setShowModal(false);
    setEditingRoom(null);
    setFormData({ name:'', price:0, status:'kosong', notes:'' });
    fetchRooms();
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus kamar ini? Data penghuni yang terkait juga akan terhapus.')) return;
    await fetch(`/api/rooms/${id}`, { method:'DELETE' });
    showToast('Kamar berhasil dihapus');
    fetchRooms();
  }

  function openEdit(room: Room) {
    setEditingRoom(room);
    setFormData({ name:room.name, price:room.price, status:room.status, notes:room.notes||'' });
    setShowModal(true);
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  function formatRp(n: number) { return 'Rp'+n.toLocaleString('id-ID'); }

  const totalRooms = rooms.length;
  const terisi = rooms.filter(r=>r.status==='terisi').length;
  const kosong = rooms.filter(r=>r.status==='kosong').length;
  const menunggak = rooms.filter(r=>r.status==='menunggak').length;

  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <h2>Kamar</h2>
          <p style={{ fontSize:13, color:'var(--text-secondary)', marginTop:2 }}>Kelola semua kamar kos Anda</p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={() => { setShowModal(true); setEditingRoom(null); setFormData({ name:'', price:0, status:'kosong', notes:'' }); }} className="btn btn-primary">
            <Plus size={16} /> Tambah Kamar
          </button>
        </div>
      </div>

      {/* STAT MINI */}
      <div className="stats-grid" style={{ marginBottom:24 }}>
        <div className="stat-card"><div className="stat-icon blue"><Home size={20}/></div><div className="stat-info"><h3>Total</h3><div className="stat-value">{totalRooms}</div></div></div>
        <div className="stat-card"><div className="stat-icon green"><Users size={20}/></div><div className="stat-info"><h3>Terisi</h3><div className="stat-value" style={{ color:'var(--success)' }}>{terisi}</div></div></div>
        <div className="stat-card"><div className="stat-icon gray"><Home size={20}/></div><div className="stat-info"><h3>Kosong</h3><div className="stat-value">{kosong}</div></div></div>
        <div className="stat-card"><div className="stat-icon red"><XCircle size={20}/></div><div className="stat-info"><h3>Menunggak</h3><div className="stat-value" style={{ color:'var(--danger)' }}>{menunggak}</div></div></div>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:60 }}><div className="spinner" style={{ borderTopColor:'var(--primary)', width:40, height:40, margin:'0 auto' }} /></div>
      ) : (
        <div className="room-groups-list">
          <div className="dash-room-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {rooms.map(room => {
              const tenant = room.tenants?.[0];
              const cardColor = room.status === 'terisi' 
                ? 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)'
                : room.status === 'menunggak'
                  ? 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)'
                  : 'linear-gradient(135deg, #94a3b8 0%, #cbd5e1 100%)';
              
              return (
                <div 
                  key={room.id}
                  className="dash-room-card"
                  style={{
                    background: 'white',
                    borderRadius: '16px',
                    border: '1px solid var(--border)',
                    overflow: 'hidden',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}
                >
                  {/* Status Color Bar */}
                  <div style={{ height: '6px', background: cardColor }} />
                  
                  {/* Card Content */}
                  <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {/* Header: Room Name & Status Badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                      <span style={{
                        background: '#eef2ff',
                        color: 'var(--primary)',
                        fontSize: '15px',
                        fontWeight: 800,
                        padding: '4px 12px',
                        borderRadius: '8px',
                        border: '1px solid #e0e7ff'
                      }}>
                        Kamar {room.name}
                      </span>
                      {room.status === 'terisi' && <span className="badge badge-success">Terisi</span>}
                      {room.status === 'kosong' && <span className="badge badge-gray">Kosong</span>}
                      {room.status === 'menunggak' && <span className="badge badge-danger">Menunggak</span>}
                    </div>

                    {/* Tenant Details */}
                    <div style={{ fontSize: '13px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px', flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#94a3b8' }}>Penghuni</span>
                        <span style={{ fontWeight: 600, color: tenant ? '#1e293b' : '#94a3b8' }}>
                          {tenant ? tenant.fullName : 'Tidak ada'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#94a3b8' }}>Harga Sewa</span>
                        <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{formatRp(room.price)}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid #f1f5f9', paddingTop: '8px', marginTop: '4px' }}>
                        <span style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>Catatan</span>
                        <span style={{ fontStyle: room.notes ? 'normal' : 'italic', color: room.notes ? '#475569' : '#94a3b8', fontSize: '12px', lineHeight: '1.4' }}>
                          {room.notes || 'Tidak ada catatan'}
                        </span>
                      </div>
                    </div>

                    {/* Actions bar */}
                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      justifyContent: 'flex-end',
                      borderTop: '1px solid #f1f5f9',
                      paddingTop: '12px'
                    }}>
                      <button onClick={() => openEdit(room)} className="btn btn-outline btn-sm" title="Edit Kamar" style={{ padding: '6px 10px' }}>
                        <Edit size={14} />
                      </button>
                      <button onClick={() => handleDelete(room.id)} className="btn btn-danger btn-sm" title="Hapus Kamar" style={{ padding: '6px 10px' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {rooms.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: 32, color: 'var(--text-light)' }}>
              Belum ada kamar terdaftar
            </div>
          )}
        </div>
      )}

      {/* MODAL KAMAR */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingRoom ? 'Edit Kamar' : 'Tambah Kamar'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Nama Kamar</label>
                    <input className="form-input" type="text" value={formData.name} onChange={e=>setFormData({...formData,name:e.target.value})} placeholder="A1, B2, ..." required />
                  </div>
                  <div className="form-group">
                    <label>Harga per Bulan (Rp)</label>
                    <input className="form-input" type="number" value={formData.price} onChange={e=>setFormData({...formData,price:parseInt(e.target.value)})} required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select className="form-select" value={formData.status} onChange={e=>setFormData({...formData,status:e.target.value})}>
                    <option value="kosong">Kosong</option>
                    <option value="terisi">Terisi</option>
                    <option value="menunggak">Menunggak</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Catatan</label>
                  <textarea className="form-textarea" value={formData.notes} onChange={e=>setFormData({...formData,notes:e.target.value})} placeholder="Fasilitas, kondisi, dll..." />
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
