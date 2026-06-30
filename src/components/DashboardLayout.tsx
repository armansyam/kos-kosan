'use client';

import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
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
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settings, setSettings] = useState<any>(null);

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
          <div className="sidebar-brand-icon" style={settings?.logo ? { background: `url(${settings.logo}) center/cover no-repeat` } : undefined}>
            {!settings?.logo && <Building2 size={20} />}
          </div>
          <div>
            <h2>{settings?.namaKos || "A'aTHaRaZ"}</h2>
            <span>Admin Dashboard</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          <span className="nav-section-label">Menu Utama</span>
          {navItems.map((item) => {
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
            onClick={() => signOut({ callbackUrl: '/login' })}
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
                <span className="topbar-user-role">Pemilik Kos</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page */}
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
}