import React from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'

// ============================================================================
// IKON SVG INLINE MURNI (Konsisten satu set gaya Lucide/Phosphor tanpa dependensi)
// ============================================================================

function HomeIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function VisitIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <path d="M9 16l2 2 4-4" />
    </svg>
  )
}

function StoreIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M3 9l2-5h14l2 5" />
      <path d="M21 9v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9" />
      <path d="M9 22V12h6v10" />
      <path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" />
    </svg>
  )
}

function InvoiceIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  )
}

function ProductIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  )
}

function BrandLogo({ className = 'w-7 h-7' }: { className?: string }) {
  return (
    <div className={`rounded-xl bg-primary flex items-center justify-center text-white shrink-0 shadow-xs ${className}`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
        <path d="M20 7L12 3L4 7M20 7L12 11M20 7V17L12 21M12 11L4 7M12 11V21M4 7V17L12 21" />
      </svg>
    </div>
  )
}

// ============================================================================
// KONFIGURASI 5 NAVIGASI RESMI TITIPKU
// ============================================================================

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

// ============================================================================
// KOMPONEN UTAMA APPLAYOUT (RESPONSIF DESKTOP SIDEBAR + MOBILE BOTTOM NAV)
// ============================================================================

export function AppLayout() {
  const location = useLocation()

  return (
    <div
      className="app-layout min-h-screen bg-page text-ink flex flex-col md:flex-row font-sans"
      style={{ ['--bottom-offset' as string]: '76px' }}
    >
      {/* --------------------------------------------------------------------
          1. DESKTOP SIDEBAR (Hanya tampil pada viewport md: >= 768px)
          -------------------------------------------------------------------- */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-surface border-r border-line p-4 justify-between z-30 select-none">
        <div className="flex flex-col gap-6">
          {/* Header Brand Logo */}
          <div className="flex items-center gap-2.5 px-2 py-1">
            <BrandLogo className="w-8 h-8" />
            <span className="text-title-2 font-extrabold text-ink tracking-tight">Titipku</span>
          </div>

          {/* Daftar Navigasi Utama Sidebar */}
          <nav aria-label="Navigasi Utama Desktop" className="flex flex-col gap-1.5">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.to === '/'
                  ? location.pathname === '/' || location.pathname === '/home'
                  : location.pathname.startsWith(item.to)

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-button font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-soft text-primary font-bold shadow-2xs'
                      : 'text-ink-soft hover:text-ink hover:bg-surface-raised'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </div>

                  {/* Badge Indikator (Contoh: Titik Perhatian di Tagihan) */}
                  {item.hasBadge && (
                    <span className="w-2 h-2 rounded-full bg-danger ring-2 ring-surface" />
                  )}
                </NavLink>
              )
            })}
          </nav>
        </div>

        {/* Footer Sidebar: Profil Pengguna (Bu Rina - Keripik Pisang Rina) */}
        <div className="p-2.5 rounded-2xl bg-surface-raised border border-line flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent-soft text-accent font-extrabold text-caption flex items-center justify-center shrink-0 border border-accent/20">
            BR
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-caption font-bold text-ink truncate leading-tight">Bu Rina</p>
            <p className="text-[11px] text-ink-soft truncate leading-tight mt-0.5">
              Keripik Pisang Rina
            </p>
          </div>
        </div>
      </aside>

      {/* --------------------------------------------------------------------
          2. AREA KONTEN UTAMA (Tempat Halaman Dirender via <Outlet />)
          -------------------------------------------------------------------- */}
      <main className="flex-1 md:pl-64 flex flex-col min-w-0 pb-20 md:pb-8">
        <div className="w-full max-w-5xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* --------------------------------------------------------------------
          3. MOBILE BOTTOM NAVIGATION (Hanya tampil di mobile < 768px)
          -------------------------------------------------------------------- */}
      <nav
        aria-label="Navigasi Bawah Mobile"
        className="fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-line md:hidden pb-[env(safe-area-inset-bottom,0px)]"
      >
        <div className="flex items-center justify-around px-2 py-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.to === '/'
                ? location.pathname === '/' || location.pathname === '/home'
                : location.pathname.startsWith(item.to)

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className="flex-1 min-h-[52px] min-w-[48px] py-1 flex flex-col items-center justify-center gap-1 transition-colors select-none"
              >
                {/* Ikon dengan Pill Aktif di Mobile */}
                <div
                  className={`relative px-3 py-1 rounded-full flex items-center justify-center transition-colors ${
                    isActive ? 'bg-primary-soft text-primary' : 'text-ink-soft'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {/* Badge Indikator Mobile */}
                  {item.hasBadge && (
                    <span className="absolute top-0.5 right-1.5 w-2 h-2 rounded-full bg-danger ring-1.5 ring-surface" />
                  )}
                </div>

                {/* Teks Label Baku */}
                <span
                  className={`text-[11px] leading-none tracking-tight ${
                    isActive ? 'text-primary font-bold' : 'text-ink-soft font-medium'
                  }`}
                >
                  {item.label}
                </span>
              </NavLink>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

export default AppLayout
