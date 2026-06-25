'use client';
import { useEffect, useState } from 'react';
import {
  Building2, Phone, CheckCircle, XCircle, Wifi, Car,
  ShieldCheck, Droplets, Zap, Star, MessageCircle,
} from 'lucide-react';
import Link from 'next/link';

interface Room {
  id: string;
  name: string;
  price: number;
  status: string;
  notes: string | null;
  tenants: { id: string }[];
}

export default function LandingPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/rooms')
      .then(r => r.json())
      .then(d => { setRooms(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const availableRooms = rooms.filter(r => r.status === 'kosong');
  const totalRooms = rooms.length;
  const availableCount = availableRooms.length;

  function formatRp(n: number) {
    return 'Rp' + n.toLocaleString('id-ID');
  }

  const facilities = [
    { icon: <Wifi size={22} />, name: 'WiFi Gratis' },
    { icon: <Car size={22} />, name: 'Parkir Luas' },
    { icon: <ShieldCheck size={22} />, name: 'Keamanan 24 Jam' },
    { icon: <Droplets size={22} />, name: 'Air Bersih' },
    { icon: <Zap size={22} />, name: 'Listrik Termasuk' },
    { icon: <Building2 size={22} />, name: 'Bersih & Nyaman' },
  ];

  return (
    <div className="landing-page">

      {/* ── HERO ── */}
      <header className="landing-hero">
        <div className="landing-hero-bg" />

        {/* Nav */}
        <nav className="landing-nav">
          <div className="landing-brand">
            <div className="landing-brand-icon">
              <Building2 size={20} color="#fff" />
            </div>
            <div>
              <div className="landing-brand-name">A&apos;aTHaRaZ</div>
              <span className="landing-brand-tag">Kost Premium</span>
            </div>
          </div>
          <Link href="/login" className="landing-btn-login">
            Admin Login
          </Link>
        </nav>

        {/* Hero Content */}
        <div className="landing-hero-content">
          <div className="landing-badge">✨ Kos Premium Terbaik di Kota</div>
          <h1 className="landing-title">
            Temukan Kamar Impian<br />Untuk Kenyamanan Anda
          </h1>
          <p className="landing-desc">
            Kos-kosan modern dengan fasilitas lengkap, keamanan 24 jam, dan suasana
            nyaman seperti rumah sendiri.
          </p>

          {/* Stats */}
          <div className="landing-stats">
            <div className="landing-stat">
              <div className="landing-stat-value" style={{ color: '#818cf8' }}>{totalRooms}</div>
              <div className="landing-stat-label">Total Kamar</div>
            </div>
            <div className="landing-stat">
              <div className="landing-stat-value" style={{ color: '#34d399' }}>{availableCount}</div>
              <div className="landing-stat-label">Kamar Tersedia</div>
            </div>
            <div className="landing-stat">
              <div className="landing-stat-value" style={{ color: '#fbbf24' }}>{totalRooms - availableCount}</div>
              <div className="landing-stat-label">Sudah Terisi</div>
            </div>
          </div>
        </div>
      </header>

      {/* ── AVAILABLE ROOMS ── */}
      <section className="landing-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Kamar Tersedia</h2>
            <p className="section-desc">
              {availableCount > 0
                ? `Ada ${availableCount} kamar siap huni untuk Anda`
                : 'Semua kamar sedang terisi, hubungi kami untuk daftar tunggu'}
            </p>
          </div>

          {loading ? (
            <div className="landing-loading">
              <div style={{
                width: 40, height: 40, border: '3px solid #e0e7ff',
                borderTopColor: '#6366f1', borderRadius: '50%',
                animation: 'spin 0.7s linear infinite', margin: '0 auto 16px',
              }} />
              <p>Memuat data kamar...</p>
            </div>
          ) : availableRooms.length === 0 ? (
            <div className="landing-empty">
              <div className="landing-empty-icon">
                <XCircle size={28} color="#dc2626" />
              </div>
              <h3 className="landing-empty-title">Semua Kamar Terisi</h3>
              <p className="landing-empty-desc">
                Untuk saat ini semua kamar sudah terisi. Silakan hubungi kami
                untuk informasi kamar yang akan tersedia.
              </p>
              <a
                href="https://wa.me/6281234567890"
                target="_blank" rel="noopener noreferrer"
                className="landing-btn-wa"
              >
                <MessageCircle size={18} /> Hubungi via WhatsApp
              </a>
            </div>
          ) : (
            <div className="landing-room-grid">
              {availableRooms.map(room => (
                <article key={room.id} className="lp-room-card">
                  <div className="lp-room-card-bar" />
                  <div className="lp-room-card-body">
                    <div className="lp-room-card-header">
                      <div>
                        <h3 className="lp-room-card-name">{room.name}</h3>
                        <span className="status-badge status-kosong">
                          <CheckCircle size={11} /> Tersedia
                        </span>
                      </div>
                      <Star size={18} color="#f59e0b" fill="#f59e0b" />
                    </div>
                    <div className="lp-room-card-price">
                      {formatRp(room.price)}<span>/bulan</span>
                    </div>
                    {room.notes && (
                      <p className="lp-room-card-notes">{room.notes}</p>
                    )}
                    <a
                      href={`https://wa.me/6281234567890?text=Halo, saya tertarik dengan kamar ${room.name} yang tersedia.`}
                      target="_blank" rel="noopener noreferrer"
                      className="lp-room-card-btn"
                    >
                      <MessageCircle size={15} /> Tanya Kamar Ini
                    </a>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* All Rooms Table */}
          {!loading && rooms.length > 0 && (
            <div className="landing-all-rooms">
              <div className="landing-all-rooms-title">📋 Semua Kamar</div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Kamar</th>
                      <th>Harga/Bulan</th>
                      <th style={{ textAlign: 'center' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rooms.map(room => {
                      const sc = room.status === 'kosong' ? 'status-kosong'
                        : room.status === 'terisi' ? 'status-terisi' : 'status-menunggak';
                      const label = room.status === 'kosong' ? 'Tersedia'
                        : room.status === 'terisi' ? 'Terisi' : 'Menunggak';
                      return (
                        <tr key={room.id}>
                          <td><strong>{room.name}</strong></td>
                          <td style={{ color: '#4f46e5', fontWeight: 600 }}>{formatRp(room.price)}</td>
                          <td style={{ textAlign: 'center' }}>
                            <span className={`status-badge ${sc}`}>{label}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── FACILITIES ── */}
      <section className="landing-section landing-facilities">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Fasilitas Kami</h2>
            <p className="section-desc">Kenyamanan dan keamanan adalah prioritas utama kami</p>
          </div>
          <div className="facilities-grid">
            {facilities.map((f, i) => (
              <div key={i} className="facility-card">
                <div className="facility-icon">{f.icon}</div>
                <p className="facility-name">{f.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section className="landing-section">
        <div className="container">
          <div className="landing-contact">
            <h2 className="landing-contact-title">Hubungi Kami</h2>
            <p className="landing-contact-desc">
              Tertarik dengan kamar kami? Jangan ragu untuk menghubungi!
            </p>
            <div className="landing-contact-btns">
              <a
                href="https://wa.me/6281234567890"
                target="_blank" rel="noopener noreferrer"
                className="landing-btn-wa"
              >
                <MessageCircle size={18} /> WhatsApp
              </a>
              <a href="tel:+6281234567890" className="landing-btn-phone">
                <Phone size={18} /> Telepon
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="landing-footer">
        <p>© 2026 A&apos;aTHaRaZ Kost. All rights reserved.</p>
      </footer>
    </div>
  );
}