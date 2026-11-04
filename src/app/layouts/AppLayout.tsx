import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { NAV_ITEMS, type NavItemConfig } from './nav-items'

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
      data-testid="app-layout"
    >
      {/* --------------------------------------------------------------------
          1. DESKTOP SIDEBAR NAVIGASI (Hanya tampil di breakpoint md: ke atas)
          -------------------------------------------------------------------- */}
      <aside
        className="hidden md:flex flex-col w-[84px] bg-surface border-r border-line py-6 shrink-0 fixed inset-y-0 left-0 z-30"
        aria-label="Navigasi Utama Desktop"
      >
        {/* Brand & Profil */}
        <div className="flex flex-col items-center mb-6 px-2 text-center">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-extrabold text-lg shadow-xs">
            T
          </div>
          <span className="text-xs font-bold text-ink mt-2">Titipku</span>
          <span className="text-[10px] text-ink-soft">Keripik Pisang Rina</span>
          <span className="text-[10px] text-ink-soft">Bu Rina</span>
        </div>

        {/* Daftar Menu Desktop */}
        <nav className="flex flex-col items-center gap-2 flex-1 px-2">
          {NAV_ITEMS.map((item: NavItemConfig) => {
            const isActive =
              item.to === '/'
                ? location.pathname === '/' || location.pathname === '/home'
                : location.pathname.startsWith(item.to)

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`relative flex flex-col items-center justify-center w-16 h-16 rounded-2xl transition-all ${
                  isActive
                    ? 'bg-primary text-white shadow-xs font-bold'
                    : 'text-ink-soft hover:bg-surface-raised hover:text-ink font-medium'
                }`}
                title={item.label}
              >
                <div className="relative">
                  <item.icon className="w-5 h-5 stroke-[2.2]" />
                  {item.hasBadge && (
                    <span
                      className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-danger rounded-full ring-2 ring-surface"
                      aria-label="Ada tagihan belum lunas"
                    />
                  )}
                </div>
                <span className="text-[11px] mt-1 tracking-tight leading-none font-semibold">
                  {item.label}
                </span>
              </NavLink>
            )
          })}
        </nav>
      </aside>

      {/* --------------------------------------------------------------------
          2. AREA KONTEN UTAMA (Dengan padding yang sesuai untuk Sidebar & Bottom Nav)
          -------------------------------------------------------------------- */}
      <main
        className={`flex-1 min-w-0 md:pl-[84px] ${
          isVisitNew ? 'pb-0' : 'pb-24 md:pb-8'
        }`}
      >
        <Outlet />
      </main>

      {/* --------------------------------------------------------------------
          3. MOBILE BOTTOM NAVIGATION (Khusus Mobile: Layar < 768px)
          Disembunyikan pada halaman formulir input kunjungan baru (/kunjungan/baru)
          agar tidak berebut tempat dengan sticky bottom bar aksi simpan.
          -------------------------------------------------------------------- */}
      {!isVisitNew && (
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-md border-t border-line px-2 py-2 flex items-center justify-around z-50 shadow-lg"
          aria-label="Navigasi Bawah Mobile"
        >
          {NAV_ITEMS.map((item: NavItemConfig) => {
            const isActive =
              item.to === '/'
                ? location.pathname === '/' || location.pathname === '/home'
                : location.pathname.startsWith(item.to)

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`relative flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-xl transition-all min-h-[52px] ${
                  isActive
                    ? 'text-primary font-bold'
                    : 'text-ink-soft hover:text-ink font-medium'
                }`}
              >
                <div className="relative">
                  <item.icon
                    className={`w-5 h-5 transition-transform ${
                      isActive ? 'stroke-[2.4] scale-105' : 'stroke-[1.8]'
                    }`}
                  />
                  {item.hasBadge && (
                    <span
                      className="absolute -top-0.5 -right-1 w-2 h-2 bg-danger rounded-full ring-2 ring-surface"
                      aria-label="Ada tagihan belum lunas"
                    />
                  )}
                </div>

                <span
                  className={`text-[11px] mt-1 leading-none tracking-tight ${
                    isActive ? 'font-bold' : 'font-medium'
                  }`}
                >
                  {item.label}
                </span>

                {/* Indikator Titik Aktif Kecil di Bawah Teks (Sesuai Mockup) */}
                {isActive && (
                  <span className="w-1 h-1 bg-primary rounded-full mt-1 animate-fadeIn" />
                )}
              </NavLink>
            )
          })}
        </nav>
      )}
    </div>
  )
}

export default AppLayout
