import type React from 'react'
import { HomeIcon, VisitIcon, StoreIcon, InvoiceIcon, ProductIcon } from './nav-icons'

export interface NavItemConfig {
  to: string
  label: string
  icon: (props: { className?: string }) => React.ReactNode
  hasBadge?: boolean
}

export const NAV_ITEMS: NavItemConfig[] = [
  { to: '/', label: 'Beranda', icon: HomeIcon },
  { to: '/kunjungan', label: 'Kunjungan', icon: VisitIcon },
  { to: '/warung', label: 'Warung', icon: StoreIcon },
  { to: '/tagihan', label: 'Tagihan', icon: InvoiceIcon, hasBadge: true },
  { to: '/produk', label: 'Produk', icon: ProductIcon },
]
