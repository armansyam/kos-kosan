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
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/rooms').then(r => r.json()),
      fetch('/api/settings').then(r => r.json())
    ]).then(([rData, sData]) => {
      setRooms(Array.isArray(rData) ? rData : []);
      if (sData && !sData.error) {
        setSettings(sData);
        document.documentElement.style.setProperty('--primary', sData.colorUtama || '#4f46e5');
        document.documentElement.style.setProperty('--primary-dark', (sData.colorUtama || '#4f46e5') + 'dd');
      }
      setLoading(false);
    }).catch(() => setLoading(false));
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
            <div className="landing-brand-icon" style={settings?.logo ? { background: `url(${settings.logo}) center/cover no-repeat` } : undefined}>
              {!settings?.logo && <Building2 size={20} color="#fff" />}
            </div>
            <div>
              <div className="landing-brand-name">{settings?.namaKos || "A'aTHaRaZ"}</div>
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
            Temukan Kamar Impian Di<br />{settings?.namaKos || "A'aTHaRaZ"}
          </h1>
          <p className="landing-desc">
            {settings?.deskripsi || "Kos-kosan modern dengan fasilitas lengkap, keamanan 24 jam, dan suasana nyaman seperti rumah sendiri."}
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
            <p className="section-desc">Informasi ketersediaan unit kamar terupdate saat ini</p>
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
          ) : (
            <div className="landing-empty" style={{ maxWidth: 480, margin: '0 auto 40px', border: '1px solid #e2e8f0' }}>
              <div style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: availableCount > 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                color: availableCount > 0 ? '#22c55e' : '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                fontSize: 28,
                fontWeight: 800,
                border: availableCount > 0 ? '2px solid #22c55e' : '2px solid #ef4444'
              }}>
                {availableCount}
              </div>
              <h3 className="landing-empty-title">
                {availableCount > 0 ? 'Kamar Siap Huni' : 'Kamar Kos Penuh'}
              </h3>
              <p className="landing-empty-desc">
                {availableCount > 0 
                  ? `Saat ini tersedia ${availableCount} unit kamar kosong yang siap untuk Anda tempati.` 
                  : 'Untuk saat ini seluruh kamar sedang terisi penuh. Silakan hubungi kami untuk masuk ke daftar antrean.'}
              </p>
              <a
                href={`https://wa.me/${settings?.whatsapp || "6281234567890"}${availableCount > 0 ? "?text=Halo, saya tertarik memesan kamar kos yang masih tersedia." : "?text=Halo, saya ingin masuk daftar antrean kamar kos."}`}
                target="_blank" rel="noopener noreferrer"
                className="landing-btn-wa"
              >
                <MessageCircle size={18} /> {availableCount > 0 ? 'Tanya/Pesan Kamar' : 'Daftar Antrean WA'}
              </a>
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
                href={`https://wa.me/${settings?.whatsapp || "6281234567890"}`}
                target="_blank" rel="noopener noreferrer"
                className="landing-btn-wa"
              >
                <MessageCircle size={18} /> WhatsApp
              </a>
              <a href={`tel:${settings?.telepon || "081234567890"}`} className="landing-btn-phone">
                <Phone size={18} /> Telepon
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="landing-footer">
        <p>© 2026 {settings?.namaKos || "A'aTHaRaZ"} Kost. All rights reserved.</p>
      </footer>
    </div>
  );
}