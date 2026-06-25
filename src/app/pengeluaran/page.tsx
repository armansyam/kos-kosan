'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Wallet, Plus, Trash2, Zap, Wifi, Flame, Wrench, Package, X, Search } from 'lucide-react';

interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
}

const defaultCategories = [
  { name: 'Tagihan Listrik', icon: Zap, color: '#F59E0B' },
  { name: 'Tagihan Internet', icon: Wifi, color: '#3B82F6' },
  { name: 'Pembelian Gas', icon: Flame, color: '#EF4444' },
  { name: 'Maintenance', icon: Wrench, color: '#10B981' },
];

export default function PengeluaranPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState('Semua');
  const [form, setForm] = useState({
    category: 'Tagihan Listrik',
    description: '',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
  });
  const [customCategory, setCustomCategory] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');

  const fetchExpenses = () => {
    fetch('/api/expenses')
      .then(r => r.json())
      .then(data => {
        setExpenses(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  };

  useEffect(() => { fetchExpenses(); }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  function formatRp(n: number) {
    return 'Rp' + n.toLocaleString('id-ID');
  }

  function getIcon(cat: string) {
    const found = defaultCategories.find(c => c.name === cat);
    return found ? found.icon : Package;
  }

  function getColor(cat: string) {
    const found = defaultCategories.find(c => c.name === cat);
    return found ? found.color : '#64748B';
  }

  async function handleSubmit() {
    const desc = isCustom ? customCategory.trim() : form.description.trim();
    if (!desc || !form.amount || !form.date) {
      showToast('⚠️ Lengkapi semua data');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: isCustom ? 'Lainnya' : form.category,
          description: isCustom ? customCategory.trim() : form.description,
          amount: Number(form.amount),
          date: form.date,
        }),
      });
      if (res.ok) {
        showToast('✅ Pengeluaran berhasil ditambahkan');
        setShowModal(false);
        setForm({ category: 'Tagihan Listrik', description: '', amount: '', date: new Date().toISOString().slice(0, 10) });
        setCustomCategory('');
        setIsCustom(false);
        fetchExpenses();
      } else {
        showToast('❌ Gagal menyimpan');
      }
    } catch {
      showToast('❌ Error jaringan');
    }
    setSubmitting(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Yakin hapus pengeluaran ini?')) return;
    try {
      await fetch(`/api/expenses?id=${id}`, { method: 'DELETE' });
      showToast('🗑️ Pengeluaran dihapus');
      fetchExpenses();
    } catch {
      showToast('❌ Gagal menghapus');
    }
  }

  const filteredExpenses = filterCategory === 'Semua'
    ? expenses
    : expenses.filter(e => e.category === filterCategory);

  const totalAll = filteredExpenses.reduce((s, e) => s + e.amount, 0);

  const totalByCategory = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  const allCategories = ['Semua', ...new Set(expenses.map(e => e.category))];

  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <h2>Pengeluaran</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>Kelola pengeluaran operasional kos</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Tambah Pengeluaran
        </button>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        {defaultCategories.map(cat => {
          const Icon = cat.icon;
          const total = totalByCategory[cat.name] || 0;
          return (
            <div key={cat.name} className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setFilterCategory(cat.name)}>
              <div className="stat-icon" style={{ background: cat.color + '15', color: cat.color }}><Icon size={22} /></div>
              <div className="stat-info">
                <h3>{cat.name}</h3>
                <div className="stat-value" style={{ fontSize: 16 }}>{formatRp(total)}</div>
              </div>
            </div>
          );
        })}
        {(totalByCategory['Lainnya'] || 0) > 0 && (
          <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setFilterCategory('Lainnya')}>
            <div className="stat-icon" style={{ background: '#F1F5F9', color: '#64748B' }}><Package size={22} /></div>
            <div className="stat-info">
              <h3>Lainnya</h3>
              <div className="stat-value" style={{ fontSize: 16 }}>{formatRp(totalByCategory['Lainnya'] || 0)}</div>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <h3>📋 Daftar Pengeluaran</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select
              className="form-select"
              style={{ width: 'auto', padding: '6px 12px', fontSize: 13 }}
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
            >
              {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Total: <strong style={{ color: 'var(--danger)' }}>{formatRp(totalAll)}</strong>
            </div>
          </div>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ borderTopColor: 'var(--primary)', width: 36, height: 36, margin: '0 auto' }} /></div>
        ) : filteredExpenses.length === 0 ? (
          <div className="empty-state">
            <Wallet size={48} />
            <h3>Belum ada pengeluaran</h3>
            <p>Klik "Tambah Pengeluaran" untuk mulai mencatat</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Kategori</th>
                  <th>Deskripsi</th>
                  <th>Jumlah</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map(exp => {
                  const Icon = getIcon(exp.category);
                  const color = getColor(exp.category);
                  return (
                    <tr key={exp.id}>
                      <td>{new Date(exp.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
                            <Icon size={16} />
                          </div>
                          <span className="badge badge-gray">{exp.category}</span>
                        </div>
                      </td>
                      <td>{exp.description}</td>
                      <td><strong style={{ color: 'var(--danger)' }}>{formatRp(exp.amount)}</strong></td>
                      <td>
                        <button className="btn btn-sm btn-outline" onClick={() => handleDelete(exp.id)} style={{ color: 'var(--danger)', borderColor: '#FECACA' }}>
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Tambah Pengeluaran</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Kategori Pengeluaran</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 8 }}>
                  {defaultCategories.map(cat => {
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.name}
                        type="button"
                        onClick={() => { setIsCustom(false); setForm({ ...form, category: cat.name, description: '' }); }}
                        style={{
                          padding: '10px 8px', borderRadius: 8, border: (!isCustom && form.category === cat.name) ? `2px solid ${cat.color}` : '2px solid var(--border)',
                          background: (!isCustom && form.category === cat.name) ? cat.color + '10' : 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: (!isCustom && form.category === cat.name) ? cat.color : 'var(--text-secondary)', transition: 'all 0.15s ease',
                        }}
                      >
                        <Icon size={18} />
                        {cat.name.replace('Tagihan ', '').replace('Pembelian ', '')}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setIsCustom(true)}
                    style={{
                      padding: '10px 8px', borderRadius: 8, border: isCustom ? '2px solid var(--primary)' : '2px solid var(--border)',
                      background: isCustom ? 'var(--primary)10' : 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: isCustom ? 'var(--primary)' : 'var(--text-secondary)', transition: 'all 0.15s ease',
                    }}
                  >
                    <Plus size={18} />
                    Lainnya
                  </button>
                </div>
              </div>

              {isCustom ? (
                <div className="form-group">
                  <label>Nama Pengeluaran</label>
                  <input
                    className="form-input"
                    placeholder="Contoh: Beli cat tembok"
                    value={customCategory}
                    onChange={e => setCustomCategory(e.target.value)}
                  />
                </div>
              ) : (
                <div className="form-group">
                  <label>Deskripsi</label>
                  <input
                    className="form-input"
                    placeholder={
                      form.category === 'Tagihan Listrik' ? 'Contoh: Tagihan listrik bulan Juni' :
                      form.category === 'Tagihan Internet' ? 'Contoh: WiFi Indihome bulan Juni' :
                      form.category === 'Pembelian Gas' ? 'Contoh: Gas 3kg x 2 tabung' :
                      'Contoh: Ganti lampu kamar 3'
                    }
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                  />
                </div>
              )}

              <div className="form-grid">
                <div className="form-group">
                  <label>Jumlah (Rp)</label>
                  <input
                    className="form-input"
                    type="number"
                    placeholder="0"
                    value={form.amount}
                    onChange={e => setForm({ ...form, amount: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Tanggal</label>
                  <input
                    className="form-input"
                    type="date"
                    value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Batal</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
                {submitting ? <><div className="spinner" /> Menyimpan...</> : '💾 Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </DashboardLayout>
  );
}