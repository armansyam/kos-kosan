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
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
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
          <div style={{ display:'flex', border:'1.5px solid var(--border)', borderRadius:8, overflow:'hidden' }}>
            <button onClick={() => setViewMode('grid')} style={{ padding:'8px 14px', border:'none', background: viewMode==='grid'?'var(--primary)':'white', color: viewMode==='grid'?'white':'var(--text-secondary)', cursor:'pointer', fontFamily:'inherit', fontSize:13, fontWeight:600, transition:'all 0.15s' }}>
              Grid
            </button>
            <button onClick={() => setViewMode('table')} style={{ padding:'8px 14px', border:'none', background: viewMode==='table'?'var(--primary)':'white', color: viewMode==='table'?'white':'var(--text-secondary)', cursor:'pointer', fontFamily:'inherit', fontSize:13, fontWeight:600, transition:'all 0.15s' }}>
              Tabel
            </button>
          </div>
          <button onClick={() => { setShowModal(true); setEditingRoom(null); setFormData({ name:'', price:0, status:'kosong', notes:'' }); }} className="btn btn-primary">
            <Plus size={16} /> Tambah Kamar
          </button>
        </div>
      </div>

      {/* STAT MINI */}
      <div className="stats-grid" style={{ gridTemplateColumns:'repeat(4,1fr)', marginBottom:24 }}>
        <div className="stat-card"><div className="stat-icon blue"><Home size={20}/></div><div className="stat-info"><h3>Total</h3><div className="stat-value">{totalRooms}</div></div></div>
        <div className="stat-card"><div className="stat-icon green"><Users size={20}/></div><div className="stat-info"><h3>Terisi</h3><div className="stat-value" style={{ color:'var(--success)' }}>{terisi}</div></div></div>
        <div className="stat-card"><div className="stat-icon gray"><Home size={20}/></div><div className="stat-info"><h3>Kosong</h3><div className="stat-value">{kosong}</div></div></div>
        <div className="stat-card"><div className="stat-icon red"><XCircle size={20}/></div><div className="stat-info"><h3>Menunggak</h3><div className="stat-value" style={{ color:'var(--danger)' }}>{menunggak}</div></div></div>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:60 }}><div className="spinner" style={{ borderTopColor:'var(--primary)', width:40, height:40, margin:'0 auto' }} /></div>
      ) : viewMode === 'grid' ? (
        <div className="card">
          <div className="card-header">
            <h3>Grid Kamar</h3>
            <div style={{ display:'flex', gap:12, fontSize:12 }}>
              <span style={{ display:'flex', alignItems:'center', gap:4 }}><span style={{ width:10, height:10, borderRadius:'50%', background:'var(--success)' }} />Terisi</span>
              <span style={{ display:'flex', alignItems:'center', gap:4 }}><span style={{ width:10, height:10, borderRadius:'50%', background:'var(--danger)' }} />Menunggak</span>
              <span style={{ display:'flex', alignItems:'center', gap:4 }}><span style={{ width:10, height:10, borderRadius:'50%', background:'#94A3B8' }} />Kosong</span>
            </div>
          </div>
          <div className="card-body">
            {rooms.length === 0 ? (
              <div className="empty-state">
                <Home size={48} />
                <h3>Belum ada kamar</h3>
                <p>Tambahkan kamar untuk mulai mengelola kos Anda</p>
              </div>
            ) : (
              <div className="room-grid" style={{ gridTemplateColumns:'repeat(auto-fill,minmax(170px,1fr))' }}>
                {rooms.map(room => {
                  const tenant = room.tenants?.[0];
                  const cls = room.status==='terisi'?'status-terisi':room.status==='menunggak'?'status-menunggak':'status-kosong';
                  return (
                    <div key={room.id} className={`room-card ${cls}`} style={{ position:'relative' }}>
                      <div style={{ position:'absolute', top:10, right:10, display:'flex', gap:6 }}>
                        <button onClick={() => openEdit(room)} style={{ background:'rgba(255,255,255,0.8)', border:'none', borderRadius:6, padding:4, cursor:'pointer', display:'flex', color:'var(--text-secondary)' }}>
                          <Edit size={14} />
                        </button>
                        <button onClick={() => handleDelete(room.id)} style={{ background:'rgba(255,255,255,0.8)', border:'none', borderRadius:6, padding:4, cursor:'pointer', display:'flex', color:'var(--danger)' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="room-card-name">{room.name}</div>
                      {tenant ? (
                        <>
                          <div style={{ fontSize:11, color:'var(--text-secondary)', marginBottom:2 }}>{tenant.fullName}</div>
                          <div style={{ fontSize:11, color:'var(--text-secondary)', marginBottom:6 }}>Tgl {tenant.dueDate} tiap bulan</div>
                        </>
                      ) : (
                        <div style={{ fontSize:11, color:'var(--text-secondary)', marginBottom:8 }}>Tidak ada penghuni</div>
                      )}
                      <div className="room-card-price">{formatRp(room.price)}/bln</div>
                      <span className="room-card-status">{room.status==='terisi'?'Terisi':room.status==='menunggak'?'Menunggak':'Kosong'}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Nama</th><th>Harga/Bln</th><th>Status</th><th>Penghuni</th><th>Catatan</th><th style={{ textAlign:'right' }}>Aksi</th></tr>
              </thead>
              <tbody>
                {rooms.map(room => {
                  const tenant = room.tenants?.[0];
                  return (
                    <tr key={room.id}>
                      <td><strong style={{ fontSize:16 }}>{room.name}</strong></td>
                      <td>{formatRp(room.price)}</td>
                      <td>
                        {room.status==='terisi'&&<span className="badge badge-success">Terisi</span>}
                        {room.status==='kosong'&&<span className="badge badge-gray">Kosong</span>}
                        {room.status==='menunggak'&&<span className="badge badge-danger">Menunggak</span>}
                      </td>
                      <td>{tenant ? tenant.fullName : <span style={{ color:'var(--text-light)' }}>-</span>}</td>
                      <td style={{ color:'var(--text-secondary)', fontSize:13 }}>{room.notes||'-'}</td>
                      <td>
                        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
                          <button onClick={() => openEdit(room)} className="btn btn-outline btn-sm"><Edit size={14} /></button>
                          <button onClick={() => handleDelete(room.id)} className="btn btn-danger btn-sm"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {rooms.length===0 && <tr><td colSpan={6} style={{ textAlign:'center', padding:32, color:'var(--text-light)' }}>Belum ada kamar</td></tr>}
              </tbody>
            </table>
          </div>
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
