'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/DashboardLayout';
import { Save, Upload, Building2, User, Phone, Mail, MapPin, Globe, Palette, Camera, MessageCircle, Instagram, Facebook, Key, Trash2, Shield } from 'lucide-react';

const PREDEFINED_FACILITIES = [
  { name: 'WiFi Gratis' },
  { name: 'AC' },
  { name: 'Kamar Mandi Dalam' },
  { name: 'Kasur Springbed' },
  { name: 'Parkir Mobil' },
  { name: 'Parkir Motor' },
  { name: 'Keamanan 24 Jam' },
  { name: 'Air Bersih' },
  { name: 'Listrik Termasuk' },
  { name: 'Bersih & Nyaman' },
  { name: 'TV' },
  { name: 'Dapur Bersama' },
  { name: 'Cuci & Laundry' },
  { name: 'Gym / Fitnes' },
  { name: 'Kopi & Dispenser' },
  { name: 'Meja Belajar' },
  { name: 'Balkon' },
  { name: 'CCTV' }
];

export default function PengaturanPage() {
  const { data: session, update: updateSession } = useSession();
  const [profile, setProfile] = useState({
    namaKos: "A'aTHaRaZ",
    deskripsi: "Kos premium dengan fasilitas lengkap dan nyaman",
    alamat: "Jl. Contoh No. 123, Kota",
    telepon: "081234567890",
    email: "kos@example.com",
    whatsapp: "6281234567890",
    website: "",
    instagram: "kos_aatharaz",
    facebook: "",
    colorUtama: "#4F46E5",
    colorSidebar: "#0F172A",
    rekening: "",
  });

  const [logo, setLogo] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  
  // Facilities States
  const [facList, setFacList] = useState<string[]>([]);
  const [facInput, setFacInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Security Account States
  const [accountEmail, setAccountEmail] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountPassword, setAccountPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingAccount, setSavingAccount] = useState(false);

  // Staff Management States
  const [staffList, setStaffList] = useState<any[]>([]);
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('');

  const fetchStaff = () => {
    fetch('/api/settings/users')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setStaffList(data);
        }
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    if (session?.user) {
      setAccountEmail(session.user.email || '');
      setAccountName(session.user.name || '');
      if ((session.user as any).role === 'super_admin') {
        fetchStaff();
      }
    }
  }, [session]);

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        if (data && !data.error) {
          setProfile({
            namaKos: data.namaKos || "A'aTHaRaZ",
            deskripsi: data.deskripsi || "Kos premium dengan fasilitas lengkap dan nyaman",
            alamat: data.alamat || "Jl. Contoh No. 123, Kota",
            telepon: data.telepon || "081234567890",
            email: data.email || "kos@example.com",
            whatsapp: data.whatsapp || "6281234567890",
            website: data.website || "",
            instagram: data.instagram || "",
            facebook: data.facebook || "",
            colorUtama: data.colorUtama || "#4F46E5",
            colorSidebar: data.colorSidebar || "#0F172A",
            rekening: data.rekening || "",
          });
          if (data.fasilitas) {
            setFacList(data.fasilitas.split(',').map((f: any) => f.trim()).filter(Boolean));
          } else {
            setFacList(["WiFi Gratis", "Parkir Luas", "Keamanan 24 Jam", "Air Bersih", "Listrik Termasuk", "Bersih & Nyaman"]);
          }
          if (data.logo) {
            setLogo(data.logo);
          }
        }
      });
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...profile, logo, fasilitas: facList.join(',') }),
      });
      if (res.ok) {
        showToast('Pengaturan berhasil disimpan');
        // Instantly update page CSS variables
        document.documentElement.style.setProperty('--primary', profile.colorUtama);
        document.documentElement.style.setProperty('--primary-dark', profile.colorUtama + 'dd');
        document.documentElement.style.setProperty('--sidebar-bg', profile.colorSidebar);
      } else {
        showToast('Gagal menyimpan pengaturan');
      }
    } catch {
      showToast('Error koneksi');
    }
  }

  async function handleSaveAccount(e: React.FormEvent) {
    e.preventDefault();
    if (accountPassword && accountPassword !== confirmPassword) {
      showToast('Konfirmasi password tidak cocok');
      return;
    }
    setSavingAccount(true);
    try {
      const res = await fetch('/api/settings/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: accountEmail,
          name: accountName,
          password: accountPassword || undefined
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Akun keamanan berhasil diperbarui');
        setAccountPassword('');
        setConfirmPassword('');
        // Update client session state
        updateSession({
          ...session,
          user: {
            ...session?.user,
            email: accountEmail,
            name: accountName
          }
        });
      } else {
        showToast(data.error || 'Gagal memperbarui akun');
      }
    } catch {
      showToast('Error koneksi');
    } finally {
      setSavingAccount(false);
    }
  }

  async function handleAddStaff(e: React.FormEvent) {
    e.preventDefault();
    if (!newStaffEmail || !newStaffName || !newStaffPassword) {
      showToast('Harap isi semua kolom');
      return;
    }
    try {
      const res = await fetch('/api/settings/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          email: newStaffEmail,
          name: newStaffName,
          password: newStaffPassword
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Akun staff berhasil dibuat');
        setNewStaffEmail('');
        setNewStaffName('');
        setNewStaffPassword('');
        fetchStaff();
      } else {
        showToast(data.error || 'Gagal menambahkan staff');
      }
    } catch {
      showToast('Error koneksi');
    }
  }

  async function handleDeleteStaff(id: string) {
    if (!confirm('Apakah Anda yakin ingin menghapus akun staff ini?')) return;
    try {
      const res = await fetch('/api/settings/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          id
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Akun staff berhasil dihapus');
        fetchStaff();
      } else {
        showToast(data.error || 'Gagal menghapus staff');
      }
    } catch {
      showToast('Error koneksi');
    }
  }

  async function handleResetStaffPassword(id: string) {
    const newPass = prompt('Masukkan password baru untuk staff ini:');
    if (!newPass) return;
    if (newPass.length < 6) {
      alert('Password minimal 6 karakter');
      return;
    }
    try {
      const res = await fetch('/api/settings/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          id,
          password: newPass
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Password staff berhasil diperbarui');
      } else {
        showToast(data.error || 'Gagal memperbarui password');
      }
    } catch {
      showToast('Error koneksi');
    }
  }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 256;
        const MAX_HEIGHT = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Compress as PNG at small size
        const compressedBase64 = canvas.toDataURL('image/png');
        setLogo(compressedBase64);
        URL.revokeObjectURL(img.src);
      };
    }
  }

  const inputStyle = {
    width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)',
    borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none',
    background: '#fff', transition: 'border-color 0.2s', boxSizing: 'border-box' as const,
  };

  const labelStyle = {
    display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)',
    marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: '0.5px',
  };

  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <h2>Pengaturan</h2>
          <p style={{ fontSize:13, color:'var(--text-secondary)', marginTop:2 }}>
            Kelola profil kos dan informasi kontak
          </p>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 9999,
          background: 'var(--success)', color: '#fff', padding: '12px 24px',
          borderRadius: 10, fontWeight: 600, fontSize: 13, boxShadow: '0 4px 12px rgba(16,185,129,0.3)'
        }}>
          {toast}
        </div>
      )}

      {session?.user && (session.user as any).role === 'super_admin' && (
        <form onSubmit={handleSave}>
        <div style={{ display: 'grid', gap: 20, maxWidth: 800 }}>

          {/* LOGO */}
          <div className="card">
            <div className="card-header">
              <div className="stat-icon purple"><Camera size={18} /></div>
              <h3>Logo Kos</h3>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                <div style={{
                  width: 80, height: 80, borderRadius: 16,
                  background: logo ? `url(${logo}) center/cover no-repeat` : 'linear-gradient(135deg, #4F46E5, #6366F1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 28, fontWeight: 800, border: '2px solid var(--border)',
                  flexShrink: 0
                }}>
                  {!logo && 'A'}
                </div>
                <div>
                  <label className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <Upload size={16} /> Pilih Logo
                    <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
                  </label>
                  <p style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 8 }}>
                    Format: PNG, JPG. Ukuran maks: 2MB
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* PROFIL USAHA */}
          <div className="card">
            <div className="card-header">
              <div className="stat-icon blue"><Building2 size={18} /></div>
              <h3>Profil Usaha</h3>
            </div>
            <div className="card-body">
              <div style={{ display:'grid', gap:16 }}>
                <div>
                  <label style={labelStyle}>Nama Kos</label>
                  <input type="text" value={profile.namaKos} onChange={e => setProfile(p => ({...p, namaKos: e.target.value}))} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Deskripsi</label>
                  <textarea rows={3} value={profile.deskripsi} onChange={e => setProfile(p => ({...p, deskripsi: e.target.value}))} style={{...inputStyle, resize:'vertical'}} />
                </div>
                <div>
                  <label style={labelStyle}>Alamat</label>
                  <textarea rows={2} value={profile.alamat} onChange={e => setProfile(p => ({...p, alamat: e.target.value}))} style={{...inputStyle, resize:'vertical'}} />
                </div>
              </div>
            </div>
          </div>

          {/* KONTAK */}
          <div className="card">
            <div className="card-header">
              <div className="stat-icon orange"><Phone size={18} /></div>
              <h3>Kontak & Media Sosial</h3>
            </div>
            <div className="card-body">
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                <div>
                  <label style={labelStyle}><Phone size={14} style={{marginRight:4}} /> Telepon</label>
                  <input type="tel" value={profile.telepon} onChange={e => setProfile(p => ({...p, telepon: e.target.value}))} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}><MessageCircle size={14} style={{marginRight:4}} /> WhatsApp</label>
                  <input type="tel" value={profile.whatsapp} onChange={e => setProfile(p => ({...p, whatsapp: e.target.value}))} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}><Mail size={14} style={{marginRight:4}} /> Email</label>
                  <input type="email" value={profile.email} onChange={e => setProfile(p => ({...p, email: e.target.value}))} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}><Globe size={14} style={{marginRight:4}} /> Website</label>
                  <input type="text" value={profile.website} onChange={e => setProfile(p => ({...p, website: e.target.value}))} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}><Instagram size={14} style={{marginRight:4}} /> Instagram</label>
                  <input type="text" value={profile.instagram} onChange={e => setProfile(p => ({...p, instagram: e.target.value}))} style={inputStyle} placeholder="@username" />
                </div>
                <div>
                  <label style={labelStyle}><Facebook size={14} style={{marginRight:4}} /> Facebook</label>
                  <input type="text" value={profile.facebook} onChange={e => setProfile(p => ({...p, facebook: e.target.value}))} style={inputStyle} placeholder="URL atau username" />
                </div>
              </div>
            </div>
          </div>

          {/* REKENING */}
          <div className="card">
            <div className="card-header">
              <div className="stat-icon blue"><Building2 size={18} /></div>
              <h3>Rekening Pembayaran</h3>
            </div>
            <div className="card-body">
              <div>
                <label style={labelStyle}>Nomor Rekening Kos (Ditampilkan di WhatsApp Tagihan)</label>
                <textarea 
                  rows={3} 
                  value={profile.rekening} 
                  onChange={e => setProfile(p => ({...p, rekening: e.target.value}))} 
                  style={{...inputStyle, resize:'vertical'}}
                  placeholder="Contoh:&#10;BCA: 123456789 a/n Arman Syam&#10;Mandiri: 987654321 a/n Arman Syam" 
                />
                <p style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 8 }}>
                  Tuliskan nomor rekening bank Anda. Informasi ini akan otomatis disertakan saat Anda mengirim tagihan via WhatsApp ke penghuni.
                </p>
              </div>
            </div>
          </div>

          {/* TEMA */}
          <div className="card" style={{ overflow: 'visible' }}>
            <div className="card-header">
              <div className="stat-icon purple"><Palette size={18} /></div>
              <h3>Tampilan Landing Page</h3>
            </div>
            <div className="card-body">
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom: 16 }}>
                <div>
                  <label style={labelStyle}>Warna Utama</label>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <input type="color" value={profile.colorUtama} onChange={e => setProfile(p => ({...p, colorUtama: e.target.value}))} style={{ width:40, height:40, borderRadius:8, border:'1.5px solid var(--border)', cursor:'pointer', padding:2 }} />
                    <span style={{ fontSize:13, color:'var(--text-secondary)' }}>{profile.colorUtama}</span>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Warna Sidebar</label>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <input type="color" value={profile.colorSidebar} onChange={e => setProfile(p => ({...p, colorSidebar: e.target.value}))} style={{ width:40, height:40, borderRadius:8, border:'1.5px solid var(--border)', cursor:'pointer', padding:2 }} />
                    <span style={{ fontSize:13, color:'var(--text-secondary)' }}>{profile.colorSidebar}</span>
                  </div>
                </div>
              </div>
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
                <label style={labelStyle}>Daftar Fasilitas Kos</label>
                
                {/* Active Tags list */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                  {facList.map((fac, idx) => (
                    <span key={idx} style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: '#eff6ff',
                      color: '#1d4ed8',
                      padding: '6px 14px',
                      borderRadius: '99px',
                      fontSize: '13px',
                      fontWeight: 600,
                      border: '1px solid #bfdbfe',
                      transition: 'all 0.15s ease'
                    }}>
                      {fac}
                      <button 
                        type="button" 
                        onClick={() => setFacList(facList.filter(item => item !== fac))}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#3b82f6',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          padding: 0,
                          marginLeft: '4px',
                          fontSize: '13px',
                          display: 'inline-flex',
                          alignItems: 'center'
                        }}
                        title="Hapus"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                  {facList.length === 0 && (
                    <span style={{ fontSize: '13px', color: 'var(--text-light)', fontStyle: 'italic' }}>Belum ada fasilitas ditambahkan.</span>
                  )}
                </div>

                {/* Tags Search/Autocomplete input */}
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    value={facInput}
                    onChange={e => {
                      setFacInput(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = facInput.trim();
                        if (val && !facList.includes(val)) {
                          setFacList([...facList, val]);
                          setFacInput('');
                          setShowSuggestions(false);
                        }
                      }
                    }}
                    style={inputStyle}
                    placeholder="Cari atau ketik fasilitas baru lalu tekan Enter (Contoh: AC, TV)..."
                  />

                  {/* Auto-complete suggestions dropdown */}
                  {showSuggestions && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: 'white',
                      border: '1px solid var(--border)',
                      borderRadius: '10px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                      zIndex: 100,
                      maxHeight: '200px',
                      overflowY: 'auto',
                      marginTop: '6px',
                      boxSizing: 'border-box'
                    }}>
                      {PREDEFINED_FACILITIES
                        .filter(f => f.name.toLowerCase().includes(facInput.toLowerCase()) && !facList.includes(f.name))
                        .map(f => (
                          <div 
                            key={f.name}
                            onClick={() => {
                              setFacList([...facList, f.name]);
                              setFacInput('');
                              setShowSuggestions(false);
                            }}
                            style={{
                              padding: '10px 14px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              color: '#334155',
                              borderBottom: '1px solid #f1f5f9',
                              textAlign: 'left',
                              transition: 'background 0.15s'
                            }}
                            onMouseOver={e => e.currentTarget.style.background = '#f8fafc'}
                            onMouseOut={e => e.currentTarget.style.background = 'white'}
                          >
                            ➕ {f.name}
                          </div>
                        ))}
                      {facInput.trim() && !PREDEFINED_FACILITIES.some(f => f.name.toLowerCase() === facInput.toLowerCase()) && (
                        <div 
                          onClick={() => {
                            setFacList([...facList, facInput.trim()]);
                            setFacInput('');
                            setShowSuggestions(false);
                          }}
                          style={{
                            padding: '10px 14px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            color: '#4F46E5',
                            fontWeight: 600,
                            borderBottom: '1px solid #f1f5f9',
                            textAlign: 'left'
                          }}
                        >
                          ✨ Tambah Kustom: "{facInput.trim()}" (Tekan Enter)
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* SIMPAN */}
          <div style={{ display:'flex', justifyContent:'flex-end', gap:12, paddingTop:8 }}>
            <button type="submit" disabled={saving} className="btn btn-primary" style={{ display:'flex', alignItems:'center', gap:8 }}>
              {saving ? (
                <><div className="spinner" style={{ width:16, height:16, borderWidth:2, borderTopColor:'#fff' }} /> Menyimpan...</>
              ) : (
                <><Save size={16} /> Simpan Pengaturan</>
              )}
            </button>
          </div>
        </div>
      </form>
      )}

      {/* AKUN KEAMANAN */}
      <form onSubmit={handleSaveAccount} style={{ marginTop: 24 }}>
        <div style={{ display: 'grid', gap: 20, maxWidth: 800 }}>
          <div className="card">
            <div className="card-header">
              <div className="stat-icon purple"><User size={18} /></div>
              <h3>{session?.user && (session.user as any).role === 'super_admin' ? 'Akun Keamanan Owner (Super Admin)' : 'Akun Keamanan Staff / Kasir'}</h3>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={labelStyle}>{session?.user && (session.user as any).role === 'super_admin' ? 'Nama Owner' : 'Nama Staff'}</label>
                  <input 
                    type="text" 
                    value={accountName} 
                    onChange={e => setAccountName(e.target.value)} 
                    style={inputStyle} 
                    required 
                  />
                </div>
                <div>
                  <label style={labelStyle}>{session?.user && (session.user as any).role === 'super_admin' ? 'Email / Username Owner' : 'Email / Username Staff (Tidak Dapat Diubah)'}</label>
                  <input 
                    type="email" 
                    value={accountEmail} 
                    onChange={e => setAccountEmail(e.target.value)} 
                    style={inputStyle} 
                    required 
                    disabled={session?.user && (session.user as any).role !== 'super_admin'}
                  />
                </div>
                <div style={{ display: 'none' }}></div>
                <div>
                  <label style={labelStyle}>Password Baru</label>
                  <input 
                    type="password" 
                    value={accountPassword} 
                    onChange={e => setAccountPassword(e.target.value)} 
                    style={inputStyle} 
                    placeholder="Kosongkan jika tidak diubah" 
                  />
                </div>
                <div>
                  <label style={labelStyle}>Konfirmasi Password Baru</label>
                  <input 
                    type="password" 
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)} 
                    style={inputStyle} 
                    placeholder="Kosongkan jika tidak diubah" 
                  />
                </div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 8 }}>
            <button type="submit" disabled={savingAccount} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {savingAccount ? (
                <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2, borderTopColor: '#fff' }} /> Menyimpan...</>
              ) : (
                <><Save size={16} /> Simpan Akun Keamanan</>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* KELOLA AKUN STAFF / KASIR (Hanya terlihat jika logged in sebagai super_admin / Owner) */}
      {session?.user && (session.user as any).role === 'super_admin' && (
        <div style={{ marginTop: 24, maxWidth: 800 }}>
          <div style={{ display: 'grid', gap: 24 }}>
            
            {/* Form Tambah Staff */}
            <form onSubmit={handleAddStaff}>
              <div className="card">
                <div className="card-header">
                  <div className="stat-icon blue"><User size={18} /></div>
                  <h3>Tambah Akun Staff / Kasir Baru</h3>
                </div>
                <div className="card-body">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <label style={labelStyle}>Nama Staff</label>
                      <input 
                        type="text" 
                        value={newStaffName} 
                        onChange={e => setNewStaffName(e.target.value)} 
                        style={inputStyle} 
                        placeholder="Nama Lengkap Staff"
                        required 
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Email / Username Staff</label>
                      <input 
                        type="email" 
                        value={newStaffEmail} 
                        onChange={e => setNewStaffEmail(e.target.value)} 
                        style={inputStyle} 
                        placeholder="kasir@ams.com"
                        required 
                      />
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={labelStyle}>Password Staff</label>
                      <input 
                        type="password" 
                        value={newStaffPassword} 
                        onChange={e => setNewStaffPassword(e.target.value)} 
                        style={inputStyle} 
                        placeholder="Password untuk login staff"
                        required 
                      />
                    </div>
                  </div>
                </div>
                <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end', background: '#f8fafc', borderTop: '1px solid var(--border)' }}>
                  <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Save size={16} /> Buat Akun Staff
                  </button>
                </div>
              </div>
            </form>

            {/* List Akun Staff */}
            <div className="card">
              <div className="card-header">
                <div className="stat-icon orange"><Shield size={18} /></div>
                <h3>Daftar Akun Staff / Kasir Aktif</h3>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                {staffList.length === 0 ? (
                  <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-light)', fontSize: 14, fontStyle: 'italic' }}>
                    Belum ada akun staff / kasir yang terdaftar.
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                          <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-secondary)' }}>Nama</th>
                          <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-secondary)' }}>Email / Username</th>
                          <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-secondary)' }}>Role</th>
                          <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {staffList.map((staff) => (
                          <tr key={staff.id} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '14px 20px', color: 'var(--text-primary)', fontWeight: 500 }}>{staff.name}</td>
                            <td style={{ padding: '14px 20px', color: 'var(--text-primary)' }}>{staff.email}</td>
                            <td style={{ padding: '14px 20px' }}>
                              <span style={{
                                display: 'inline-block',
                                background: '#fef3c7',
                                color: '#d97706',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 600
                              }}>
                                Kasir
                              </span>
                            </td>
                            <td style={{ padding: '14px 20px', display: 'flex', gap: 8, justifyContent: 'center' }}>
                              <button
                                onClick={() => handleResetStaffPassword(staff.id)}
                                className="btn btn-secondary"
                                style={{ padding: '6px 10px', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12 }}
                                title="Reset Password"
                              >
                                <Key size={14} /> Reset Sandi
                              </button>
                              <button
                                onClick={() => handleDeleteStaff(staff.id)}
                                className="btn btn-danger"
                                style={{ padding: '6px 10px', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                                title="Hapus Staff"
                              >
                                <Trash2 size={14} /> Hapus
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
            
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}