import type React from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'

// ============================================================================
// IKON SVG INLINE MURNI (Sesuai persis dengan mockup gambar)
// ============================================================================

export function HomeIcon({ className = 'w-5 h-5' }: { className?: string }) {
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
      <path d="M3 10.5 12 3l9 7.5V20a1.5 1.5 0 0 1-1.5 1.5H4.5A1.5 1.5 0 0 1 3 20z" />
      <path d="M9.5 21.5v-6a1.5 1.5 0 0 1 1.5-1.5h2a1.5 1.5 0 0 1 1.5 1.5v6" />
    </svg>
  )
}

export function VisitIcon({ className = 'w-5 h-5' }: { className?: string }) {
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
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 2h6a1 1 0 0 1 1 1v2H8V3a1 1 0 0 1 1-1z" />
      <circle cx="9" cy="10" r="0.75" fill="currentColor" />
      <line x1="12" y1="10" x2="16" y2="10" />
      <circle cx="9" cy="14" r="0.75" fill="currentColor" />
      <line x1="12" y1="14" x2="16" y2="14" />
    </svg>
  )
}

export function StoreIcon({ className = 'w-5 h-5' }: { className?: string }) {
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
      <path d="M3 9.5 5 4h14l2 5.5v1.5H3V9.5z" />
      <path d="M5 11v8.5a1.5 1.5 0 0 0 1.5 1.5h11a1.5 1.5 0 0 0 1.5-1.5V11" />
      <path d="M10 21v-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5" />
    </svg>
  )
}

export function InvoiceIcon({ className = 'w-5 h-5' }: { className?: string }) {
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
      <path d="M4 2.5 6.5 4 9 2.5 11.5 4 14 2.5 16.5 4 19 2.5v19l-2.5-1.5-2.5 1.5-2.5-1.5-2.5 1.5-2.5-1.5L4 21.5V2.5z" />
      <line x1="8" y1="8" x2="16" y2="8" />
      <line x1="8" y1="12" x2="16" y2="12" />
      <line x1="8" y1="16" x2="13" y2="16" />
    </svg>
  )
}

export function ProductIcon({ className = 'w-5 h-5' }: { className?: string }) {
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
  const isVisitNew = location.pathname.startsWith('/kunjungan/baru')

  return (
    <div
      className="app-layout min-h-screen bg-page text-ink flex flex-col md:flex-row font-sans"
      style={{ ['--bottom-offset' as string]: '76px' }}
    >
      {/* --------------------------------------------------------------------
          1. DESKTOP SIDEBAR (Ramping & Vertikal persis seperti gambar mockup)
          -------------------------------------------------------------------- */}
      <aside className="hidden md:flex md:w-[84px] md:flex-col md:fixed md:inset-y-0 bg-page border-r border-line py-5 px-2 justify-between z-30 select-none">
        <div className="flex flex-col items-center gap-6">
          {/* Logo Teks Hijau Teal */}
          <div className="text-center py-1">
            <span className="text-base font-bold text-primary tracking-tight">Titipku</span>
          </div>

          {/* Navigasi Vertikal Berikon di atas Label */}
          <nav aria-label="Navigasi Utama Desktop" className="flex flex-col items-center gap-2 w-full">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.to === '/'
                  ? location.pathname === '/' || location.pathname === '/home'
                  : location.pathname.startsWith(item.to)

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`w-16 h-16 flex flex-col items-center justify-center rounded-xl transition-all relative ${
                    isActive
                      ? 'bg-primary-soft text-primary font-bold'
                      : 'text-ink-soft hover:text-ink hover:bg-surface-raised'
                  }`}
                >
                  <item.icon className="w-6 h-6 mb-1" />
                  <span className="text-[11px] leading-tight font-medium tracking-tight">
                    {item.label}
                  </span>

                  {/* Badge Indikator Merah */}
                  {item.hasBadge && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-danger ring-2 ring-page" />
                  )}
                </NavLink>
              )
            })}
          </nav>
        </div>

        {/* Footer Profil Pengguna (KR - Keripik Pisang Rina / Bu Rina) */}
        <div
          className="flex flex-col items-center text-center pt-3 border-t border-line w-full"
          title="Profil Bu Rina - Keripik Pisang Rina"
        >
          <div className="w-10 h-10 rounded-xl bg-[#1c1917] text-white font-bold text-xs flex items-center justify-center shrink-0 mb-1.5 shadow-2xs">
            KR
          </div>
          <p className="text-[10px] font-semibold text-ink leading-tight">
            Keripik<br />Pisang Rina
          </p>
          <span className="sr-only">Bu Rina</span>
        </div>
      </aside>

      {/* --------------------------------------------------------------------
          2. AREA KONTEN UTAMA
          -------------------------------------------------------------------- */}
      <main className="flex-1 md:pl-[84px] flex flex-col min-w-0 pb-20 md:pb-8">
        <div className="w-full max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* --------------------------------------------------------------------
          3. MOBILE BOTTOM NAVIGATION (Sesuai mockup HP)
          Disembunyikan pada alur /kunjungan/baru agar tidak tumpang tindih
          dengan bar aksi 'Lanjut Pembayaran' (Thumb-zone)
          -------------------------------------------------------------------- */}
      {!isVisitNew && (
        <nav
          aria-label="Navigasi Bawah Mobile"
          className="fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-line md:hidden pb-[env(safe-area-inset-bottom,0px)]"
        >
          <div className="flex items-center justify-around px-2 py-1.5">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.to === '/'
                  ? location.pathname === '/' || location.pathname === '/home'
                  : location.pathname.startsWith(item.to)

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`flex-1 min-h-[50px] min-w-[48px] py-1 flex flex-col items-center justify-center gap-1 transition-colors select-none ${
                    isActive ? 'text-primary' : 'text-ink-soft'
                  }`}
                >
                  <div className="relative flex items-center justify-center">
                    <item.icon className="w-6 h-6" />
                    {item.hasBadge && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-danger ring-1.5 ring-surface" />
                    )}
                  </div>

                  <span
                    className={`text-[11px] leading-none tracking-tight ${
                      isActive ? 'font-bold text-primary' : 'font-medium text-ink-soft'
                    }`}
                  >
                    {item.label}
                  </span>
                </NavLink>
              )
            })}
          </div>
        </nav>
      )}
    </div>
  )
}

export default AppLayout
