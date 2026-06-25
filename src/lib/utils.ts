import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return inputs.filter(Boolean).join(' ');
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'terisi':
      return 'bg-emerald-500';
    case 'kosong':
      return 'bg-slate-400';
    case 'menunggak':
      return 'bg-rose-500';
    case 'lunas':
      return 'bg-emerald-500';
    case 'belum_bayar':
      return 'bg-amber-500';
    default:
      return 'bg-slate-400';
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case 'terisi':
      return 'Terisi';
    case 'kosong':
      return 'Kosong';
    case 'menunggak':
      return 'Menunggak';
    case 'lunas':
      return 'Lunas';
    case 'belum_bayar':
      return 'Belum Bayar';
    default:
      return status;
  }
}

export function generateWhatsAppLink(phone: string, message: string): string {
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${phone}?text=${encodedMessage}`;
}
