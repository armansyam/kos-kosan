'use client';

import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import packageJson from '../../package.json';

import {
  LayoutDashboard,
  BedDouble,
  Users,
  Receipt,
  CreditCard,
  Zap,
  LogOut,
  Building2,
  Wallet,
  FileText,
  Settings,
  Menu,
  X,
} from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/kamar', label: 'Kamar', icon: BedDouble },
  { href: '/penghuni', label: 'Penghuni', icon: Users },
  { href: '/tagihan', label: 'Tagihan', icon: Receipt },
  { href: '/pengeluaran', label: 'Pengeluaran', icon: Wallet },
  { href: '/laporan', label: 'Laporan', icon: FileText },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [showDevOverlay, setShowDevOverlay] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [latestVersion, setLatestVersion] = useState<string | null>(null);

  useEffect(() => {
    // Check GitHub for updates
    if (session?.user && (session.user as any).role === 'super_admin') {
      fetch('https://api.github.com/repos/armansyam/kos-kosan/releases/latest')
        .then(res => {
          if (!res.ok) throw new Error('GitHub API limit');
          return res.json();
        })
        .then(data => {
          if (data && data.tag_name) {
            const remoteVer = data.tag_name.replace(/^v/, '');
            const localVer = packageJson.version.replace(/^v/, '');
            
            if (remoteVer !== localVer) {
              const remoteParts = remoteVer.split('.').map(Number);
              const localParts = localVer.split('.').map(Number);
              
              let isNewer = false;
              for (let i = 0; i < Math.max(remoteParts.length, localParts.length); i++) {
                const r = remoteParts[i] || 0;
                const l = localParts[i] || 0;
                if (r > l) {
                  isNewer = true;
                  break;
                }
                if (r < l) {
                  break;
                }
              }
              
              if (isNewer) {
                setUpdateAvailable(true);
                setLatestVersion(data.tag_name);
              }
            }
          }
        })
        .catch(() => {});
    }
  }, [session]);

  useEffect(() => {
    fetch('/api/settings')

      .then(r => r.json())
      .then(data => {
        if (data && !data.error) {
          setSettings(data);
          document.documentElement.style.setProperty('--primary', data.colorUtama || '#6366F1');
          document.documentElement.style.setProperty('--primary-dark', (data.colorUtama || '#6366F1') + 'dd');
          document.documentElement.style.setProperty('--sidebar-bg', data.colorSidebar || '#111827');
        }
      })
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const currentPage = navItems.find((item) => pathname === item.href);

  return (
    <div className="dashboard-layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        {/* Brand */}
        <div className="sidebar-brand">
          {!settings ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
              <div className="skeleton-pulse" style={{
                width: '36px', height: '36px', borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.12)',
                flexShrink: 0
              }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '60%' }}>
                <div className="skeleton-pulse" style={{
                  height: '14px', borderRadius: '4px',
                  background: 'rgba(255, 255, 255, 0.15)'
                }} />
                <div className="skeleton-pulse" style={{
                  height: '10px', borderRadius: '4px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  width: '70%'
                }} />
              </div>
            </div>
          ) : (
            <>
              <div className="sidebar-brand-icon" style={settings.logo ? { background: `url(${settings.logo}) center/cover no-repeat` } : undefined}>
                {/* settings sudah di-load — tampilkan Building2 hanya jika memang tidak ada logo */}
                {!settings.logo && <Building2 size={20} />}
              </div>
              <div>
                <h2>{settings.namaKos || "A'aTHaRaZ"}</h2>
                <span>Admin Dashboard</span>
              </div>
            </>
          )}
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          <span className="nav-section-label">Menu Utama</span>
          {navItems
            .filter(item => {
              if (item.href === '/laporan' && (session?.user as any)?.role !== 'super_admin') {
                return false;
              }
              return true;
            })
            .map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                >
                  <Icon size={17} />
                  {item.label}
                </Link>
              );
            })}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <Link
            href="/pengaturan"
            className={`nav-item ${pathname === '/pengaturan' ? 'active' : ''}`}
          >
            <Settings size={17} />
            Pengaturan
          </Link>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '6px 0' }} />
          <button
            onClick={async () => {
              await signOut({ redirect: false });
              router.push('/login');
              router.refresh();
            }}
            className="nav-item"
            style={{ color: '#f87171' }}
          >
            <LogOut size={17} />
            Keluar
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="hamburger-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h1 className="topbar-title">
              {currentPage?.label ?? 'Dashboard'}
            </h1>
          </div>

          <div className="topbar-right">
            <div className="topbar-date">
              📅 {new Date().toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </div>
            <div className="topbar-user">
              <div className="topbar-avatar">
                {session?.user?.name?.charAt(0).toUpperCase() ?? 'A'}
              </div>
              <div>
                <div className="topbar-user-name">
                  {session?.user?.name ?? 'Admin'}
                </div>
                <span className="topbar-user-role">
                  {(session?.user as any)?.role === 'super_admin' ? 'Pemilik Kos' : 'Staff / Kasir'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page */}
        <main className="page-content">
          {children}
        </main>
      </div>

      {/* ── Developer Watermark ── */}
      <div 
        className="dev-watermark-btn" 
        onClick={() => setShowDevOverlay(!showDevOverlay)}
        title="Developer Info"
      >
        <img 
          src="/ams-logo.png" 
          alt="AMS Logo" 
          style={{ width: '38px', height: '38px', objectFit: 'contain' }} 
        />
        {updateAvailable && (
          <span style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: '#ef4444',
            border: '2px solid #fff',
            boxShadow: '0 0 8px #ef4444',
            animation: 'pulseGlow 1.5s infinite',
          }} />
        )}
      </div>

      {showDevOverlay && (
        <div className="dev-watermark-popup">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)', fontWeight: 700 }}>Developer Credit</span>
            {updateAvailable ? (
              <div className="dev-watermark-status" style={{ color: '#c2410c', background: '#fff7ed', borderColor: '#ffedd5' }}>
                <span className="dev-watermark-dot" style={{ background: '#f97316', boxShadow: '0 0 8px #f97316' }} />
                <span>Update Available</span>
              </div>
            ) : (
              <div className="dev-watermark-status">
                <span className="dev-watermark-dot" />
                <span>Active Release</span>
              </div>
            )}
          </div>
          <div>
            <img 
              src="/ams-logo.png" 
              alt="AMS Logo" 
              style={{ height: '36px', objectFit: 'contain', marginBottom: '8px', display: 'block' }} 
            />
            {updateAvailable && (
              <div style={{
                background: '#fff7ed',
                border: '1px solid #ffedd5',
                borderRadius: '10px',
                padding: '10px 12px',
                fontSize: '11px',
                color: '#c2410c',
                lineHeight: '1.4',
                marginBottom: '10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px'
              }}>
                <span style={{ fontWeight: 700 }}>Pembaruan Tersedia!</span>
                <span>Versi terbaru ({latestVersion}) telah dirilis di GitHub. Hubungi administrator untuk melakukan update.</span>
              </div>
            )}
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              Designed, built, and optimized with Next.js, Prisma, and custom styling.
            </p>
          </div>
          <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>System Version</span>
            <strong style={{ color: '#1e293b' }}>v{packageJson.version}</strong>

          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <a 
              href="https://ammang.my.id"
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                flex: 1,
                textAlign: 'center',
                background: 'var(--primary)',
                color: 'white',
                padding: '8px 0',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                textDecoration: 'none',
                boxShadow: '0 2px 8px rgba(99, 102, 241, 0.2)'
              }}
            >
              Developer Website
            </a>
            <button 
              onClick={() => setShowDevOverlay(false)}
              style={{
                padding: '8px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                background: 'white',
                color: '#64748b',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}