'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Plus, Edit, Trash2, Home, Users, XCircle } from 'lucide-react';

interface Tenant { id: string; fullName: string; dueDate: number; active: boolean; }
interface Room {
  id: string; name: string; price: number; status: string; notes: string | null; floor: number;
  tenants: Tenant[];
}

export default function KamarPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState({ name: '', price: 0, status: 'kosong', notes: '', floor: 1 });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [selectedFloor, setSelectedFloor] = useState<'semua' | number>('semua');
  
  // Custom floor states
  const [showCustomFloor, setShowCustomFloor] = useState(false);
  const [customFloorValue, setCustomFloorValue] = useState('');

  function getRoomFloor(room: Room) {
    return room.floor || 1;
  }

  useEffect(() => { fetchRooms(); }, []);

  async function fetchRooms() {
    setLoading(true);
    const d = await fetch('/api/rooms').then(r=>r.json());
    setRooms(Array.isArray(d) ? d : []);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const floorToSave = showCustomFloor && customFloorValue ? parseInt(customFloorValue) : formData.floor;
    const payload = { ...formData, floor: floorToSave };
    
    if (editingRoom) {
      await fetch(`/api/rooms/${editingRoom.id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
      showToast('Kamar berhasil diperbarui');
    } else {
      await fetch('/api/rooms', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
      showToast('Kamar berhasil ditambahkan');
    }
    // Auto-switch to the saved floor's tab so the room is visible
    setSelectedFloor(floorToSave);
    setShowModal(false);
    setEditingRoom(null);
    setFormData({ name:'', price:0, status:'kosong', notes:'', floor:1 });
    setShowCustomFloor(false);
    setCustomFloorValue('');
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
    setFormData({ name:room.name, price:room.price, status:room.status, notes:room.notes||'', floor:room.floor || 1 });
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

  const floors = Array.from(new Set(rooms.map(r => getRoomFloor(r)))).sort((a, b) => a - b);

  const filteredRooms = selectedFloor === 'semua'
    ? rooms
    : rooms.filter(r => getRoomFloor(r) === selectedFloor);

  const availableFloorOptions = Array.from(new Set([1, 2, 3, ...rooms.map(r => r.floor || 1)])).sort((a, b) => a - b);

  return (
    <DashboardLayout>
      <div className="page-header" style={{ marginBottom: 16, paddingBottom: 12 }}>
        <div>
          <h2>Kamar</h2>
          <p style={{ fontSize:13, color:'var(--text-secondary)', marginTop:2 }}>Kelola semua kamar kos Anda</p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={() => { setShowModal(true); setEditingRoom(null); setFormData({ name:'', price:0, status:'kosong', notes:'', floor:1 }); }} className="btn btn-primary">
            <Plus size={16} /> Tambah Kamar
          </button>
        </div>
      </div>

      {/* Sub navigation tabs for Floor */}
      <div className="sub-tabs" style={{ display:'flex', gap:8, marginBottom:20, overflowX:'auto', paddingBottom:4 }}>
        <button 
          onClick={() => setSelectedFloor('semua')} 
          className={`sub-tab-btn ${selectedFloor === 'semua' ? 'active' : ''}`}
        >
          Semua Kamar <span className="sub-tab-count">{rooms.length}</span>
        </button>
        {floors.map(floor => {
          const count = rooms.filter(r => getRoomFloor(r) === floor).length;
          return (
            <button 
              key={floor} 
              onClick={() => setSelectedFloor(floor)} 
              className={`sub-tab-btn ${selectedFloor === floor ? 'active' : ''}`}
            >
              Lantai {floor} <span className="sub-tab-count">{count}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:60 }}><div className="spinner" style={{ borderTopColor:'var(--primary)', width:40, height:40, margin:'0 auto' }} /></div>
      ) : (
        <div className="room-groups-list">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
            {filteredRooms.map(room => {
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
                    borderRadius: '14px',
                    border: '1px solid var(--border)',
                    overflow: 'hidden',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}
                >
                  {/* Status Color Bar */}
                  <div style={{ height: '5px', background: cardColor }} />
                  
                  {/* Card Content */}
                  <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {/* Header: Room Name & Status Badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <span style={{
                        background: '#eef2ff',
                        color: 'var(--primary)',
                        fontSize: '14px',
                        fontWeight: 800,
                        padding: '3px 10px',
                        borderRadius: '8px',
                        border: '1px solid #e0e7ff'
                      }}>
                        {room.name}
                      </span>
                      {room.status === 'terisi' && <span className="badge badge-success" style={{ fontSize: '11px' }}>Terisi</span>}
                      {room.status === 'kosong' && <span className="badge badge-gray" style={{ fontSize: '11px' }}>Kosong</span>}
                      {room.status === 'menunggak' && <span className="badge badge-danger" style={{ fontSize: '11px' }}>Menunggak</span>}
                    </div>

                    {/* Tenant Details */}
                    <div style={{ fontSize: '12px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px', flex: 1 }}>
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
                      {room.notes && (
                        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '6px', marginTop: '2px' }}>
                          <span style={{ color: '#94a3b8', fontSize: '11px' }}>Catatan: </span>
                          <span style={{ color: '#475569', fontSize: '11px' }}>{room.notes}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions bar */}
                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      justifyContent: 'flex-end',
                      borderTop: '1px solid #f1f5f9',
                      paddingTop: '10px'
                    }}>
                      <button onClick={() => openEdit(room)} className="btn btn-outline btn-sm" title="Edit Kamar" style={{ padding: '5px 9px' }}>
                        <Edit size={13} />
                      </button>
                      <button onClick={() => handleDelete(room.id)} className="btn btn-danger btn-sm" title="Hapus Kamar" style={{ padding: '5px 9px' }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {filteredRooms.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: 32, color: 'var(--text-light)' }}>
              {rooms.length === 0 ? 'Belum ada kamar terdaftar' : 'Belum ada kamar di lantai ini'}
            </div>
          )}
        </div>
      )}

      {/* MODAL KAMAR */}
      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); setShowCustomFloor(false); setCustomFloorValue(''); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingRoom ? 'Edit Kamar' : 'Tambah Kamar'}</h3>
              <button className="modal-close" onClick={() => { setShowModal(false); setShowCustomFloor(false); setCustomFloorValue(''); }}>✕</button>
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
                  <label>Lantai</label>
                  {!showCustomFloor ? (
                    <select 
                      className="form-select" 
                      value={formData.floor} 
                      onChange={e => {
                        if (e.target.value === 'new') {
                          setShowCustomFloor(true);
                        } else {
                          setFormData({ ...formData, floor: parseInt(e.target.value) });
                        }
                      }}
                    >
                      {availableFloorOptions.map(f => (
                        <option key={f} value={f}>Lantai {f}</option>
                      ))}
                      <option value="new">+ Tambah Lantai Baru</option>
                    </select>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input 
                        className="form-input" 
                        type="number" 
                        value={customFloorValue} 
                        onChange={e => setCustomFloorValue(e.target.value)} 
                        placeholder="Masukkan nomor lantai..." 
                        min={1}
                        required 
                      />
                      <button 
                        type="button" 
                        className="btn btn-outline" 
                        onClick={() => {
                          setShowCustomFloor(false);
                          setCustomFloorValue('');
                        }}
                        style={{ padding: '8px 12px' }}
                      >
                        Batal
                      </button>
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label>Catatan</label>
                  <textarea className="form-textarea" value={formData.notes} onChange={e=>setFormData({...formData,notes:e.target.value})} placeholder="Fasilitas, kondisi, dll..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => { setShowModal(false); setShowCustomFloor(false); setCustomFloorValue(''); }}>Batal</button>
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
