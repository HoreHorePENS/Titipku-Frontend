import type React from 'react'
import { HomeIcon, VisitIcon, VisitAddIcon, StoreIcon, InvoiceIcon, ProductIcon, UsersIcon } from './nav-icons'

export interface NavItemConfig {
  to: string
  label: string
  /** Label ringkas untuk bottom nav mobile (6 item harus muat satu baris di 360px). */
  shortLabel?: string
  /** Path lain yang membuka halaman yang sama (alias rute lama). */
  aliases?: string[]
  icon: (props: { className?: string }) => React.ReactElement
  /** Titik penanda dihitung dari data asli: proposal masuk yang menunggu jawaban. */
  badge?: 'pendingIncoming'
}

// Navigasi resmi konsinyasi untuk penitip
export const NAV_ITEMS: NavItemConfig[] = [
  { to: '/', label: 'Beranda', aliases: ['/home'], icon: HomeIcon, badge: 'pendingIncoming' },
  { to: '/kunjungan/baru', label: 'Catat Kunjungan', shortLabel: 'Kunjungan', aliases: ['/visit/new'], icon: VisitAddIcon },
  { to: '/kunjungan', label: 'Bukti Nota', shortLabel: 'Nota', icon: VisitIcon },
  { to: '/warung', label: 'Toko Mitra', shortLabel: 'Mitra', icon: StoreIcon },
  { to: '/tagihan', label: 'Catat Tagihan', shortLabel: 'Tagihan', aliases: ['/invoices'], icon: InvoiceIcon },
  { to: '/produk', label: 'Produk', aliases: ['/catalog'], icon: ProductIcon },
]

// Navigasi khusus untuk Pemilik Toko (Beranda, Daftar Penitip/Permintaan Titipan, Toko Saya)
export const PEMILIK_TOKO_NAV_ITEMS: NavItemConfig[] = [
  { to: '/', label: 'Beranda', aliases: ['/home'], icon: HomeIcon },
  { to: '/penitip', label: 'Penitip', icon: UsersIcon, badge: 'pendingIncoming' },
  { to: '/toko-saya', label: 'Toko Saya', icon: StoreIcon },
]

function matchLength(path: string, pathname: string): number {
  if (path === '/') return pathname === '/' ? 1 : 0
  return pathname === path || pathname.startsWith(path + '/') ? path.length : 0
}

/**
 * Menu aktif = item dengan path paling spesifik yang cocok, sehingga
 * '/kunjungan/baru' (Catat Kunjungan) tidak ikut menyalakan '/kunjungan' (Bukti Nota).
 */
export function activeNavItem(items: NavItemConfig[], pathname: string): NavItemConfig | undefined {
  let best: NavItemConfig | undefined
  let bestLength = 0
  for (const item of items) {
    for (const path of [item.to, ...(item.aliases ?? [])]) {
      const length = matchLength(path, pathname)
      if (length > bestLength) {
        best = item
        bestLength = length
      }
    }
  }
  return best
}
