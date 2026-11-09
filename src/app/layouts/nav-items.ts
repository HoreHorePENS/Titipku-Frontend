import type React from 'react'
import { HomeIcon, VisitIcon, StoreIcon, InvoiceIcon, ProductIcon, UsersIcon } from './nav-icons'

export interface NavItemConfig {
  to: string
  label: string
  icon: (props: { className?: string }) => React.ReactElement
  hasBadge?: boolean
}

// Navigasi resmi konsinyasi (5 item default untuk penitip)
export const NAV_ITEMS: NavItemConfig[] = [
  { to: '/', label: 'Beranda', icon: HomeIcon },
  { to: '/kunjungan', label: 'Bukti Nota', icon: VisitIcon },
  { to: '/warung', label: 'Toko Mitra Saya', icon: StoreIcon },
  { to: '/tagihan', label: 'Tagihan', icon: InvoiceIcon, hasBadge: true },
  { to: '/produk', label: 'Produk', icon: ProductIcon },
]

// Navigasi khusus untuk Pemilik Toko (Beranda, Daftar Penitip/Permintaan Titipan, Toko Saya)
export const PEMILIK_TOKO_NAV_ITEMS: NavItemConfig[] = [
  { to: '/', label: 'Beranda', icon: HomeIcon },
  { to: '/penitip', label: 'Penitip', icon: UsersIcon, hasBadge: true },
  { to: '/toko-saya', label: 'Toko Saya', icon: StoreIcon },
]
