'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Home, Users, FileText, CreditCard, Calendar,
  CheckCircle, XCircle, AlertTriangle, Clock, Wallet,
  Zap, BedDouble, Receipt, ArrowRight,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<any>({});
  const [rooms, setRooms] = useState<any[]>([]);
  const [upcomingBills, setUpcomingBills] = useState<any[]>([]);
  const [unpaidBills, setUnpaidBills] = useState<any[]>([]);
  const [userName, setUserName] = useState('Admin');
  const [activeTab, setActiveTab] = useState('ringkasan');

  function formatRp(n: number) { return 'Rp ' + (n || 0).toLocaleString('id-ID'); }

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, roomsRes, billsRes, sessionRes] = await Promise.all([
          fetch('/api/dashboard/stats'),
          fetch('/api/rooms'),
          fetch('/api/bills'),
          fetch('/api/auth/session'),
        ]);
        if (statsRes.ok) setStats(await statsRes.json());
        if (roomsRes.ok) setRooms(await roomsRes.json());
        if (billsRes.ok) {
          const bills = await billsRes.json();
          const today = new Date();
          const sevenDays = new Date(today);
          sevenDays.setDate(sevenDays.getDate() + 7);

          // Upcoming due in 7 days
          const upcoming = (Array.isArray(bills) ? bills : [])
            .filter((b: any) => b.status === 'belum_bayar')
            .filter((b: any) => {
              const d = new Date(b.dueDate);
              return d >= today && d <= sevenDays;
            })
            .slice(0, 5);
          setUpcomingBills(upcoming);

          // Unpaid / overdue
          const unpaid = (Array.isArray(bills) ? bills : [])
            .filter((b: any) => b.status === 'belum_bayar')
            .slice(0, 5);
          setUnpaidBills(unpaid);
        }
        if (sessionRes.ok) {
          const session = await sessionRes.json();
          if (session?.user?.name) setUserName(session.user.name);
        }
      } catch (e) { console.error(e); }
    }
    fetchData();
  }, []);

  const totalKamar = stats.totalRooms || 0;
  const occupied = stats.occupiedRooms || 0;
  const empty = stats.emptyRooms || 0;
  const overdueRooms = stats.overdueRooms || 0;
  const overdueCount = stats.overdueCount || 0;
  const totalOccupied = occupied + overdueRooms;
  const pctOccupied = totalKamar ? Math.round((totalOccupied / totalKamar) * 100) : 0;

  const tabs = [
    { id: 'ringkasan', label: 'Ringkasan', icon: Home },
    { id: 'kamar', label: 'Kamar', icon: BedDouble },
    { id: 'penghuni', label: 'Penghuni', icon: Users },
    { id: 'tagihan', label: 'Tagihan', icon: Receipt },
    { id: 'listrik', label: 'Listrik', icon: Zap },
  ];

  return (
    <DashboardLayout>
      {/* ── LOW ELECTRICITY TOKEN ALERT ── */}
      {stats.latestElectricity && (stats.latestElectricity.currentKwh < 10 || stats.latestElectricity.estimatedDaysLeft < 3) && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
          border: '1.5px solid #fca5a5',
          borderRadius: '16px',
          padding: '16px 20px',
          marginBottom: '20px',
          color: '#991b1b',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
        }}>
          <div style={{
            background: '#ef4444',
            color: 'white',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 12px rgba(239, 68, 68, 0.4)'
          }}>
            <Zap size={18} fill="white" />
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#7f1d1d' }}>Peringatan Token Listrik Kritis!</h4>
            <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#991b1b', opacity: 0.9 }}>
              Sisa listrik token saat ini tinggal <strong>{stats.latestElectricity.currentKwh.toFixed(2)} kWh</strong> (perkiraan habis dalam <strong>{stats.latestElectricity.estimatedDaysLeft} hari</strong>). Harap segera lakukan pengisian token!
            </p>
          </div>
          <button 
            onClick={() => router.push('/monitoring-listrik')}
            style={{
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              padding: '8px 14px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = '#dc2626')}
            onMouseOut={(e) => (e.currentTarget.style.background = '#ef4444')}
          >
            Isi Ulang
          </button>
        </div>
      )}

      {/* ── TAB NAV ── */}
      <div className="dash-tabs">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              className={`dash-tab ${activeTab === t.id ? 'active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              <Icon size={15} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── KPI CARDS (6) ── */}
      <div className="dash-kpi-grid">
        <div className="dash-kpi">
          <div className="kpi-icon" style={{ background: '#EEF2FF', color: '#6366F1' }}>
            <Home size={20} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Total Kamar</span>
            <span className="kpi-value">{totalKamar}</span>
            <span className="kpi-sub">Pintu</span>
          </div>
        </div>
        <div className="dash-kpi">
          <div className="kpi-icon" style={{ background: '#ECFDF5', color: '#10B981' }}>
            <CheckCircle size={20} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Terisi</span>
            <span className="kpi-value">{totalOccupied}</span>
            <span className="kpi-sub">{pctOccupied}% hunian</span>
          </div>
        </div>
        <div className="dash-kpi">
          <div className="kpi-icon" style={{ background: '#F1F5F9', color: '#64748B' }}>
            <XCircle size={20} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Kosong</span>
            <span className="kpi-value">{empty}</span>
            <span className="kpi-sub">Siap huni</span>
          </div>
        </div>
        <div className="dash-kpi">
          <div className="kpi-icon" style={{ background: '#FEF2F2', color: '#EF4444' }}>
            <AlertTriangle size={20} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Menunggak</span>
            <span className="kpi-value">{overdueCount}</span>
            <span className="kpi-sub">Belum bayar</span>
          </div>
        </div>
        <div className="dash-kpi">
          <div className="kpi-icon" style={{ background: '#FFF7ED', color: '#F97316' }}>
            <Clock size={20} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Jatuh Tempo</span>
            <span className="kpi-value">{stats.upcomingDueCount || 0}</span>
            <span className="kpi-sub">7 hari lagi</span>
          </div>
        </div>
        <div className="dash-kpi">
          <div className="kpi-icon" style={{ background: '#EEF2FF', color: '#6366F1' }}>
            <Wallet size={20} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Total Pendapatan</span>
            <span className="kpi-value">{formatRp(stats.totalRevenue || 0)}</span>
            <span className="kpi-sub">{stats.totalPayments ? stats.totalPayments + ' pembayaran' : '0 pembayaran'}</span>
          </div>
        </div>
      </div>

      {/* ── ROW 1: Upcoming Bills + Status Kamar Donut ── */}
      {(activeTab === 'ringkasan' || activeTab === 'tagihan' || activeTab === 'kamar') && (
        <div className="dash-row" style={{ gridTemplateColumns: activeTab !== 'ringkasan' ? '1fr' : undefined }}>
          {/* Jatuh Tempo in 7 Hari — left 60% */}
          {(activeTab === 'ringkasan' || activeTab === 'tagihan') && (
            <div className="dash-card dash-card-wide">
              <div className="dash-card-header">
                <span className="dash-card-title"><Calendar size={16} /> Jatuh Tempo dalam 7 Hari</span>
                <button className="dash-link" onClick={() => router.push('/tagihan')}>Lihat Semua</button>
              </div>
              <div className="dash-table-wrap">
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Kamar</th>
                      <th>Nama</th>
                      <th>Tanggal</th>
                      <th>Nominal</th>
                      <th>Sisa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcomingBills.length === 0 ? (
                      <tr><td colSpan={5} className="dash-empty">Tidak ada tagihan jatuh tempo</td></tr>
                    ) : upcomingBills.map((b: any) => (
                      <tr key={b.id}>
                        <td>{b.tenant?.room?.name || '-'}</td>
                        <td>{b.tenant?.fullName || '-'}</td>
                        <td>{b.dueDate ? new Date(b.dueDate).toLocaleDateString('id-ID') : '-'}</td>
                        <td className="td-nominal">{formatRp(b.amount)}</td>
                        <td><span className="badge badge-warning">Belum</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Status Kamar Donut — right 40% */}
          {(activeTab === 'ringkasan' || activeTab === 'kamar') && (
            <div className="dash-card dash-card-narrow">
              <div className="dash-card-header">
                <span className="dash-card-title"><Home size={16} /> Status Kamar</span>
              </div>
              <div className="dash-donut-wrap">
                {(() => {
                  const total = totalKamar || 1;
                  const occupiedPct = (occupied / total) * 100;
                  const emptyPct = (empty / total) * 100;
                  const overduePct = (overdueRooms / total) * 100;
                  const r = 46, cx = 60, cy = 60, circ = 2 * Math.PI * r;
                  const segs = [
                    { pct: occupiedPct, color: '#10B981', label: 'Terisi' },
                    { pct: emptyPct, color: '#94A3B8', label: 'Kosong' },
                    { pct: overduePct, color: '#EF4444', label: 'Menunggak' },
                  ].filter(s => s.pct > 0);
                  let off = 0;
                  return (
                    <div className="dash-donut-container">
                      <div className="dash-donut-chart">
                        <svg viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
                          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#E5E7EB" strokeWidth="10" />
                          {segs.map((s, i) => {
                            const dash = (s.pct / 100) * circ;
                            const cur = off; off += s.pct;
                            return (
                              <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color}
                                strokeWidth="10" strokeDasharray={`${dash} ${circ - dash}`}
                                strokeDashoffset={-cur * circ / 100} strokeLinecap="round" />
                            );
                          })}
                        </svg>
                        <div className="dash-donut-center">
                          <span className="dash-donut-num">{totalKamar}</span>
                          <span className="dash-donut-label">Total</span>
                        </div>
                      </div>
                      <div className="dash-donut-legend">
                        {segs.map((s, i) => (
                          <div key={i} className="dash-donut-legend-item">
                            <span className="legend-dot" style={{ background: s.color }} />
                            <span className="legend-label">{s.label}</span>
                            <span className="legend-pct">{Math.round(s.pct)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ROW 2: Unpaid Tenants + Electricity Token ── */}
      {(activeTab === 'ringkasan' || activeTab === 'penghuni' || activeTab === 'listrik') && (
        <div className="dash-row" style={{ gridTemplateColumns: activeTab !== 'ringkasan' ? '1fr' : undefined }}>
          {/* Penghuni Belum Bayar — left 60% */}
          {(activeTab === 'ringkasan' || activeTab === 'penghuni') && (
            <div className="dash-card dash-card-wide">
              <div className="dash-card-header">
                <span className="dash-card-title"><AlertTriangle size={16} color="#F59E0B" /> Penghuni Belum Bayar</span>
                <button className="dash-link" onClick={() => router.push('/tagihan')}>Lihat Semua</button>
              </div>
              <div className="dash-table-wrap">
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Kamar</th>
                      <th>Nama</th>
                      <th>Nominal</th>
                      <th>Jatuh Tempo</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unpaidBills.length === 0 ? (
                      <tr><td colSpan={5} className="dash-empty">Semua tagihan lunas 🎉</td></tr>
                    ) : unpaidBills.map((b: any) => (
                      <tr key={b.id}>
                        <td>{b.tenant?.room?.name || '-'}</td>
                        <td>{b.tenant?.fullName || '-'}</td>
                        <td className="td-nominal">{formatRp(b.amount)}</td>
                        <td>{b.dueDate ? new Date(b.dueDate).toLocaleDateString('id-ID') : '-'}</td>
                        <td>
                          <button className="btn btn-sm btn-outline" onClick={() => router.push('/tagihan')}>
                            Bayar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Listrik Token — right 40% */}
          {(activeTab === 'ringkasan' || activeTab === 'listrik') && (
            <div className="dash-card dash-card-electric">
              <div className="dash-card-header">
                <span className="dash-card-title"><Zap size={16} color="#D97706" /> Listrik Token</span>
                <button className="dash-link" onClick={() => router.push('/monitoring-listrik')}>Detail →</button>
              </div>
              <div className="electric-body">
                <div className="electric-left">
                  <span className="electric-label">Sisa Token</span>
                  <span className="electric-kwh">{stats.latestElectricity?.currentKwh?.toFixed(2) ?? '0.00'} kWh</span>
                  <div className="electric-progress-wrap">
                    <div className="electric-progress-bg">
                      <div className="electric-progress-fill" style={{ width: Math.min(stats.latestElectricity?.currentKwh ?? 0, 100) + '%' }} />
                    </div>
                  </div>
                  <div className="electric-info">
                    <span className="electric-info-label">Terakhir isi:</span>
                    <span>{stats.latestElectricity?.topupDate ? new Date(stats.latestElectricity.topupDate).toLocaleDateString('id-ID') : '-'}</span>
                  </div>
                  <div className="electric-info">
                    <span className="electric-info-label">Nominal:</span>
                    <span>{stats.latestElectricity?.nominal ? formatRp(stats.latestElectricity.nominal) : '-'}</span>
                  </div>
                </div>
                <div className="electric-right">
                  <span className="electric-label">Perkiraan habis</span>
                  <span className="electric-days">{stats.latestElectricity?.estimatedDaysLeft ?? '-'} hari</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ROW 3: Kamar Grid ── */}
      {(activeTab === 'ringkasan' || activeTab === 'kamar') && (
        <div className="dash-card dash-card-full" style={{ marginTop: activeTab !== 'ringkasan' ? 0 : 20 }}>
          <div className="dash-card-header">
            <span className="dash-card-title"><BedDouble size={16} /> Grid Kamar</span>
            <button className="btn btn-primary btn-sm" onClick={() => router.push('/kamar')}>
              Kelola Kamar <ArrowRight size={14} />
            </button>
          </div>
          <div className="dash-room-grid">
            {rooms.length === 0 ? (
              <div className="dash-empty">Belum ada kamar</div>
            ) : rooms.slice(0, 12).map((r: any) => {
              const statusColor =
                r.status === 'terisi' ? '#10B981' :
                r.status === 'menunggak' ? '#EF4444' : '#E5E7EB';
              const statusLabel =
                r.status === 'terisi' ? 'Terisi' :
                r.status === 'menunggak' ? 'Menunggak' : 'Kosong';
              return (
                <div key={r.id} className="dash-room-card">
                  <div className="dash-room-status-bar" style={{ background: statusColor }} />
                  <div className="dash-room-body">
                    <span className="dash-room-name">{r.name}</span>
                    <span className="dash-room-price">{formatRp(r.price)}</span>
                    <span className="dash-room-status-label" style={{ color: statusColor }}>{statusLabel}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}