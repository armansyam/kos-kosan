'use client';

import { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Building2, Mail, Lock, LogIn } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setSettings(data);
          if (data.colorUtama) {
            document.documentElement.style.setProperty('--primary', data.colorUtama);
            document.documentElement.style.setProperty('--primary-dark', data.colorUtama + 'dd');
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoadingSettings(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError('Email atau password salah');
      setLoading(false);
    } else {
      // Hard navigation agar session cookie NextAuth terbaca dengan benar
      window.location.href = '/dashboard';
    }
  };

  if (loadingSettings) {
    return (
      <div className="login-page">
        <div className="login-bg" />
        <div className="login-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 380 }}>
          <div style={{
            width: 36, height: 36, border: '3px solid #e2e8f0',
            borderTopColor: 'var(--primary, #4F46E5)', borderRadius: '50%',
            animation: 'spin 0.7s linear infinite'
          }} />
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-bg" />

      <div className="login-card">
        {/* Header */}
         <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div className="login-icon" style={settings?.logo ? { background: `url(${settings.logo}) center/cover no-repeat` } : undefined}>
            {/* Saat masih loading settings → tidak tampilkan apa-apa.
                Setelah load → tampilkan Building2 hanya jika tidak ada logo */}
            {!loadingSettings && !settings?.logo && <Building2 size={32} />}
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
            {settings?.namaKos || "Manajemen Kos"}
          </h1>
          <p style={{ fontSize: 14, color: '#64748b' }}>
            Masuk ke dashboard untuk mengelola kos Anda
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="login-error">{error}</div>}

          {/* Email */}
          <div className="form-group">
            <label htmlFor="email" style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>
              Email / Username
            </label>
            <div className="input-wrapper">
              <Mail size={17} className="input-icon" />
              <input
                id="email"
                type="text"
                placeholder="admin@super.com atau username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="form-input input-with-icon"
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="password" style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>
              Password
            </label>
            <div className="input-wrapper">
              <Lock size={17} className="input-icon" />
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="form-input input-with-icon"
              />
            </div>
          </div>
          <button type="submit" disabled={loading} className="login-btn">
            {loading ? (
              <span className="spinner" />
            ) : (
              <>
                <LogIn size={18} />
                Masuk
              </>
            )}
          </button>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <a 
              href="https://ammang.my.id" 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{
                fontSize: 13,
                color: '#64748b',
                textDecoration: 'none',
                transition: 'color 0.2s',
                fontWeight: 500
              }}
              onMouseOver={(e) => e.currentTarget.style.color = 'var(--primary, #4f46e5)'}
              onMouseOut={(e) => e.currentTarget.style.color = '#64748b'}
            >
              Lupa Password?
            </a>
          </div>
        </form>

        {/* Developer Credit */}
        <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 12, color: '#94a3b8' }}>
          <span>Developed by</span>
          <a 
            href="https://ammang.my.id" 
            target="_blank" 
            rel="noopener noreferrer" 
            style={{ display: 'inline-flex', alignItems: 'center', transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1) rotate(3deg)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <img 
              src="/ams-logo.png" 
              alt="AMS Logo" 
              style={{ height: '24px', objectFit: 'contain', display: 'block' }} 
            />
          </a>
        </div>
      </div>
    </div>
  );
}
