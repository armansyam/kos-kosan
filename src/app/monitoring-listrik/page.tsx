'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Plus, Zap, AlertTriangle } from 'lucide-react';

interface ElectricityLog {
  id: string; topupDate: string; nominal: number; kwhAdded: number;
  currentKwh: number; estimatedDaysLeft: number; createdAt: string;
}

export default function MonitoringListrikPage() {
  const [logs, setLogs] = useState<ElectricityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [form, setForm] = useState({ nominal: 0, kwhAdded: 0, currentKwh: 0, estimatedDaysLeft: 0 });
  const [updateForm, setUpdateForm] = useState({ currentKwh: 0, estimatedDaysLeft: 0 });
  const [toast, setToast] = useState('');

  useEffect(() => { fetchLogs(); }, []);

  async function fetchLogs() {
    setLoading(true);
    const d = await fetch('/api/electricity').then(r=>r.json());
    setLogs(Array.isArray(d) ? d : []);
    setLoading(false);
  }

  async function handleTopup(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/electricity', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form) });
    setShowModal(false);
    setForm({ nominal:0, kwhAdded:0, currentKwh:0, estimatedDaysLeft:0 });
    showToast('Data listrik berhasil dicatat');
    fetchLogs();
  }

  async function handleUpdateKwh(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/electricity', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ nominal:0, kwhAdded:0, currentKwh:updateForm.currentKwh, estimatedDaysLeft:updateForm.estimatedDaysLeft }) });
    setShowUpdateModal(false);
    showToast('Sisa kWh berhasil diperbarui');
    fetchLogs();
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'});
  }
  function formatRp(n: number) { return 'Rp'+n.toLocaleString('id-ID'); }

  const latest = logs[0];
  const kwhPct = latest ? Math.min((latest.currentKwh / 100) * 100, 100) : 0;
  const daysLeft = latest?.estimatedDaysLeft || 0;

  function getDangerLevel() {
    if (daysLeft <= 3) return 'red';
    if (daysLeft <= 7) return 'yellow';
    return 'green';
  }

  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <h2>Monitoring Listrik Token</h2>
          <p style={{ fontSize:13, color:'var(--text-secondary)', marginTop:2 }}>Pantau dan catat pengisian token listrik PLN</p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={() => { setUpdateForm({ currentKwh: latest?.currentKwh||0, estimatedDaysLeft: latest?.estimatedDaysLeft||0 }); setShowUpdateModal(true); }}
            className="btn btn-outline">
            <Zap size={16} /> Update Sisa kWh
          </button>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            <Plus size={16} /> Isi Token
          </button>
        </div>
      </div>

      {/* STATUS LISTRIK UTAMA */}
      {latest ? (
        <div className="electricity-card" style={{ marginBottom:24 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:24 }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                <Zap size={20} style={{ color:'var(--warning)' }} />
                <h3 style={{ fontSize:16, fontWeight:700 }}>Sisa Token Saat Ini</h3>
              </div>
              <div className="kwh-display">
                <span className="kwh-value">{latest.currentKwh.toFixed(2)}</span>
                <span className="kwh-unit">kWh</span>
              </div>
              <div style={{ width:280, marginTop:8 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--text-secondary)', marginBottom:6 }}>
                  <span>0 kWh</span><span>100 kWh</span>
                </div>
                <div className="progress-bar" style={{ height:14 }}>
                  <div className={`progress-fill ${getDangerLevel()}`} style={{ width:`${kwhPct}%` }} />
                </div>
              </div>
            </div>

            <div style={{ textAlign:'right' }}>
              <p style={{ fontSize:12, color:'var(--text-secondary)', marginBottom:4 }}>Perkiraan habis dalam</p>
              <div style={{ display:'flex', alignItems:'baseline', gap:6, justifyContent:'flex-end' }}>
                <span style={{ fontSize:52, fontWeight:800, color: getDangerLevel()==='red'?'var(--danger)':getDangerLevel()==='yellow'?'var(--warning)':'var(--success)' }}>
                  {daysLeft}
                </span>
                <span style={{ fontSize:18, fontWeight:600, color:'var(--text-secondary)' }}>hari</span>
              </div>
              <span className={`estimation-badge ${getDangerLevel() === 'red' ? 'danger' : getDangerLevel() === 'yellow' ? 'warning' : 'safe'}`}>
                {getDangerLevel() === 'red' ? <><AlertTriangle size={14} /> Segera Isi Token!</> :
                 getDangerLevel() === 'yellow' ? <><AlertTriangle size={14} /> Sisa Sedikit</> :
                 <><Zap size={14} /> Aman</>}
              </span>
            </div>
          </div>

          <div style={{ borderTop:'1px solid rgba(0,0,0,0.08)', marginTop:16, paddingTop:12 }}>
            <p style={{ fontSize:12, color:'var(--text-secondary)' }}>
              Terakhir isi: <strong>{formatDate(latest.topupDate)}</strong> — 
              Nominal: <strong>{formatRp(latest.nominal)}</strong> — 
              kWh ditambahkan: <strong>+{latest.kwhAdded} kWh</strong>
            </p>
          </div>
        </div>
      ) : (
        <div className="card" style={{ marginBottom:24 }}>
          <div className="empty-state">
            <Zap size={48} />
            <h3>Belum ada data listrik</h3>
            <p>Catat pengisian token pertama Anda</p>
            <button onClick={() => setShowModal(true)} className="btn btn-primary" style={{ marginTop:16 }}>
              <Plus size={16} /> Catat Pengisian
            </button>
          </div>
        </div>
      )}

      {/* RIWAYAT PENGISIAN */}
      <div className="card">
        <div className="card-header">
          <h3>📋 Riwayat Pengisian Token</h3>
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
                  <th>Tanggal</th><th>Nominal</th><th>Token (+kWh)</th>
                  <th>Sisa Awal (kWh)</th><th>Estimasi Habis</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr key={log.id}>
                    <td>{formatDate(log.topupDate)}</td>
                    <td>{log.nominal > 0 ? <strong style={{ color:'var(--success)' }}>{formatRp(log.nominal)}</strong> : <span style={{ color:'var(--text-light)' }}>-</span>}</td>
                    <td>{log.kwhAdded > 0 ? <span className="badge badge-success">+{log.kwhAdded} kWh</span> : <span style={{ color:'var(--text-light)' }}>-</span>}</td>
                    <td>{log.currentKwh.toFixed(2)} kWh</td>
                    <td>
                      <span className={`badge ${log.estimatedDaysLeft <= 3 ? 'badge-danger' : log.estimatedDaysLeft <= 7 ? 'badge-warning' : 'badge-success'}`}>
                        {log.estimatedDaysLeft} hari
                      </span>
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign:'center', padding:32, color:'var(--text-light)' }}>Belum ada riwayat pengisian</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL ISI TOKEN */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⚡ Catat Pengisian Token</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleTopup}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Nominal Isi (Rp)</label>
                    <input className="form-input" type="number" value={form.nominal} onChange={e=>setForm({...form,nominal:parseInt(e.target.value)})} required />
                  </div>
                  <div className="form-group">
                    <label>kWh Ditambahkan</label>
                    <input className="form-input" type="number" step="0.01" value={form.kwhAdded} onChange={e=>setForm({...form,kwhAdded:parseFloat(e.target.value)})} required />
                  </div>
                  <div className="form-group">
                    <label>Sisa kWh Sekarang</label>
                    <input className="form-input" type="number" step="0.01" value={form.currentKwh} onChange={e=>setForm({...form,currentKwh:parseFloat(e.target.value)})} required />
                  </div>
                  <div className="form-group">
                    <label>Estimasi Habis (hari)</label>
                    <input className="form-input" type="number" value={form.estimatedDaysLeft} onChange={e=>setForm({...form,estimatedDaysLeft:parseInt(e.target.value)})} required />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary"><Zap size={16} /> Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL UPDATE kWh */}
      {showUpdateModal && (
        <div className="modal-overlay" onClick={() => setShowUpdateModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Update Sisa kWh</h3>
              <button className="modal-close" onClick={() => setShowUpdateModal(false)}>✕</button>
            </div>
            <form onSubmit={handleUpdateKwh}>
              <div className="modal-body">
                <p style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:16 }}>
                  Update sisa kWh saat ini untuk kalkulasi estimasi yang lebih akurat.
                </p>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Sisa kWh Saat Ini</label>
                    <input className="form-input" type="number" step="0.01" value={updateForm.currentKwh} onChange={e=>setUpdateForm({...updateForm,currentKwh:parseFloat(e.target.value)})} required />
                  </div>
                  <div className="form-group">
                    <label>Estimasi Habis (hari)</label>
                    <input className="form-input" type="number" value={updateForm.estimatedDaysLeft} onChange={e=>setUpdateForm({...updateForm,estimatedDaysLeft:parseInt(e.target.value)})} required />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowUpdateModal(false)}>Batal</button>
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
