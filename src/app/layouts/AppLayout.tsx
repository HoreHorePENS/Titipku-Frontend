import { useState, useEffect } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { NAV_ITEMS, PEMILIK_TOKO_NAV_ITEMS, type NavItemConfig } from './nav-items'
import { MapIcon, LogoutIcon } from './nav-icons'
import { NotificationPopover } from '@/components/shared/NotificationPopover'
import { ProfileDetailModal } from '@/components/shared/ProfileDetailModal'
import { useCurrentAccount, logoutUser } from '@/features/auth'
import { useProposals } from '@/features/stores/proposals-api'
import { toast } from '@/components/ui/toast-store'

export function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const isVisitNew = location.pathname.startsWith('/kunjungan/baru')

  const { data: currentAccount } = useCurrentAccount()
  const user = currentAccount?.user
  const isPemilikToko = user?.account_type === 'pemilik_toko'

  const navItems = isPemilikToko ? PEMILIK_TOKO_NAV_ITEMS : NAV_ITEMS

  // Penanda menu dari data asli: tawaran (penitip) / pengajuan (toko) yang menunggu jawaban.
  const { data: proposals } = useProposals(Boolean(currentAccount))
  const incomingDirection = isPemilikToko ? 'penitip_to_store' : 'store_to_penitip'
  const pendingIncoming = (proposals ?? []).filter((p) => p.direction === incomingDirection && p.status === 'pending').length
  const showBadge = (item: NavItemConfig) => item.badge === 'pendingIncoming' && pendingIncoming > 0

  // Custom profile state synced with localStorage
  const [customProfile, setCustomProfile] = useState<{
    fullName?: string
    businessName?: string
    photoUrl?: string
  } | null>(() => {
    try {
      const raw = localStorage.getItem('titipku_custom_profile')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    const handleProfileUpdate = () => {
      try {
        const raw = localStorage.getItem('titipku_custom_profile')
        if (raw) setCustomProfile(JSON.parse(raw))
      } catch {
        // ignore
      }
    }
    window.addEventListener('titipku_profile_updated', handleProfileUpdate)
    return () => window.removeEventListener('titipku_profile_updated', handleProfileUpdate)
  }, [])

  const entityTitle = isPemilikToko
    ? currentAccount?.store?.name || 'Toko Saya'
    : customProfile?.businessName || currentAccount?.business?.name || 'Usaha saya'

  const ownerName = customProfile?.fullName || user?.full_name || ''
  const profilePhoto = customProfile?.photoUrl

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)

  const handleLogout = () => {
    logoutUser()
    setShowLogoutConfirm(false)
    toast.show({
      title: 'Berhasil Keluar',
      description: 'Anda telah keluar dari akun Titipku.',
      type: 'info',
    })
    navigate('/auth', { replace: true })
  }

  return (
    <div
      className="app-layout min-h-screen bg-page text-ink flex flex-col md:flex-row font-sans"
      style={{ ['--bottom-offset' as string]: '76px' }}
      data-testid="app-layout"
    >
      {/* --------------------------------------------------------------------
          1. MOBILE TOP HEADER (Khusus Mobile: Layar < 768px)
          -------------------------------------------------------------------- */}
      <header className="md:hidden sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-line px-4 py-2.5 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white font-bold text-body shadow-2xs">
            T
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-caption font-bold text-slate-900 leading-tight">Titipku</span>
              <span className="text-caption font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                {isPemilikToko ? 'Toko' : 'Penitip'}
              </span>
            </div>
            <span className="text-caption text-slate-500 leading-tight truncate max-w-[170px]">
              {entityTitle}{ownerName ? ' · ' + ownerName : ''}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Fitur Notifikasi Pojok Kanan Atas dengan Titik Merah */}
          <NotificationPopover userRole={isPemilikToko ? 'pemilik_toko' : 'penitip'} />

          {/* Tombol Profil Pojok Kanan Atas Mobile */}
          <button
            type="button"
            onClick={() => setShowProfileModal(true)}
            className="flex items-center justify-center w-11 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 transition-all cursor-pointer min-h-[44px]"
            title="Profil Akun"
          >
            <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center text-caption font-bold shadow-2xs overflow-hidden">
              {profilePhoto ? (
                <img src={profilePhoto} alt={ownerName} className="w-full h-full object-cover" />
              ) : (
                ownerName.slice(0, 1).toUpperCase()
              )}
            </div>
          </button>
        </div>
      </header>

      {/* --------------------------------------------------------------------
          2. DESKTOP SIDEBAR NAVIGASI (Hanya tampil di breakpoint md: ke atas)
          -------------------------------------------------------------------- */}
      <aside
        className="hidden md:flex flex-col w-[84px] bg-surface border-r border-line py-6 shrink-0 fixed inset-y-0 left-0 z-30 justify-between"
        aria-label="Navigasi Utama Desktop"
      >
        <div>
          {/* Brand & Profil Monokrom */}
          <div className="flex flex-col items-center mb-6 px-2 text-center">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-bold text-title-3 shadow-2xs">
              T
            </div>
            <span className="text-caption font-bold text-slate-900 mt-2">Titipku</span>
            <span className="text-caption text-slate-500 max-w-[76px] truncate font-medium">
              {entityTitle}
            </span>
            <span className="text-caption text-slate-400 max-w-[76px] truncate">
              {ownerName}
            </span>
          </div>

          {/* Daftar Menu Desktop */}
          <nav className="flex flex-col items-center gap-1.5 px-2">
            {navItems.map((item: NavItemConfig) => {
              const isActive =
                item.to === '/'
                  ? location.pathname === '/' || location.pathname === '/home'
                  : location.pathname.startsWith(item.to)

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`relative flex flex-col items-center justify-center w-16 h-15 rounded-xl transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-2xs font-semibold'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 font-medium'
                  }`}
                  title={item.label}
                >
                  <div className="relative">
                    <item.icon className="w-5 h-5 stroke-[2]" />
                    {showBadge(item) && (
                      <span
                        className="absolute -top-1 -right-1 w-2 h-2 bg-slate-900 rounded-full ring-2 ring-white"
                        aria-label={pendingIncoming + ' menunggu jawaban'}
                      />
                    )}
                  </div>
                  <span className="text-caption mt-1 tracking-tight leading-none font-medium text-center">
                    {item.label}
                  </span>
                </NavLink>
              )
            })}

            {/* Tombol Akses Peta di Desktop */}
            {!isPemilikToko && (
              <NavLink
                to="/peta"
                className={`relative flex flex-col items-center justify-center w-16 h-15 rounded-xl transition-all mt-1 ${
                  location.pathname.startsWith('/peta') || location.pathname.startsWith('/map')
                    ? 'bg-slate-900 text-white shadow-2xs font-semibold'
                    : 'text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200'
                }`}
                title="Peta Toko Mitra"
              >
                <MapIcon className="w-5 h-5 stroke-[2]" />
                <span className="text-caption mt-1 tracking-tight leading-none font-medium text-center">
                  Peta Toko
                </span>
              </NavLink>
            )}
          </nav>
        </div>

        {/* Tombol Logout Desktop di Bawah Sidebar */}
        <div className="px-2 pt-2 border-t border-line flex flex-col items-center">
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="flex flex-col items-center justify-center w-16 h-13 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-all cursor-pointer"
            title="Keluar dari Akun"
          >
            <LogoutIcon className="w-4 h-4 stroke-[2]" />
            <span className="text-caption mt-1 font-medium">Keluar</span>
          </button>
        </div>
      </aside>

      {/* --------------------------------------------------------------------
          3. AREA KONTEN UTAMA
          -------------------------------------------------------------------- */}
      <main
        className={`flex-1 min-w-0 md:pl-[84px] ${
          isVisitNew ? 'pb-0' : 'pb-24 md:pb-8'
        }`}
      >
        {/* Header Desktop dengan Fitur Notifikasi di Pojok Kanan Atas */}
        {!isVisitNew && (
          <header className="hidden md:flex items-center justify-between px-6 lg:px-8 py-3 bg-surface/90 backdrop-blur-md border-b border-line sticky top-0 z-20">
            <div className="flex items-center gap-2 text-caption text-slate-500 font-medium">
              <span className="font-bold text-slate-900">{entityTitle}</span>
              <span>·</span>
              <span>{isPemilikToko ? 'Pemilik Toko Mitra' : 'Produsen Penitip'}</span>
            </div>

            <div className="flex items-center gap-3">
              {/* Fitur Notifikasi Pojok Kanan Atas Desktop */}
              <NotificationPopover userRole={isPemilikToko ? 'pemilik_toko' : 'penitip'} />

              {/* Button Profil Pojok Kanan Atas Desktop */}
              <button
                type="button"
                onClick={() => setShowProfileModal(true)}
                className="flex items-center gap-2.5 pl-2 pr-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer min-h-[44px]"
                title="Lihat Profil Akun"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-caption font-bold shadow-2xs overflow-hidden">
                  {profilePhoto ? (
                    <img src={profilePhoto} alt={ownerName} className="w-full h-full object-cover" />
                  ) : (
                    ownerName.slice(0, 1).toUpperCase()
                  )}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-caption font-semibold text-slate-900 leading-tight">{ownerName}</span>
                  <span className="text-caption text-slate-400 leading-none">{isPemilikToko ? 'Pemilik Toko' : 'Penitip'}</span>
                </div>
              </button>
            </div>
          </header>
        )}

        <Outlet />
      </main>

      {/* --------------------------------------------------------------------
          4. MOBILE BOTTOM NAVIGATION (Khusus Mobile: Layar < 768px)
          -------------------------------------------------------------------- */}
      {!isVisitNew && (
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-md border-t border-line px-2 py-2 flex items-center justify-around z-50 shadow-lg"
          aria-label="Navigasi Bawah Mobile"
        >
          {navItems.map((item: NavItemConfig) => {
            const isActive =
              item.to === '/'
                ? location.pathname === '/' || location.pathname === '/home'
                : location.pathname.startsWith(item.to)

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`relative flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-xl transition-all min-h-[50px] ${
                  isActive
                    ? 'text-slate-900 font-bold'
                    : 'text-slate-400 hover:text-slate-700 font-medium'
                }`}
              >
                <div className="relative">
                  <item.icon
                    className={`w-5 h-5 transition-transform ${
                      isActive ? 'stroke-[2.2] scale-105' : 'stroke-[1.8]'
                    }`}
                  />
                  {showBadge(item) && (
                    <span
                      className="absolute -top-0.5 -right-1 w-2 h-2 bg-slate-900 rounded-full ring-2 ring-white"
                      aria-label={pendingIncoming + ' menunggu jawaban'}
                    />
                  )}
                </div>

                <span
                  className={`text-caption mt-1 leading-none tracking-tight ${
                    isActive ? 'font-bold' : 'font-medium'
                  }`}
                >
                  {item.label}
                </span>

                {isActive && (
                  <span className="w-1 h-1 bg-slate-900 rounded-full mt-1" />
                )}
              </NavLink>
            )
          })}
        </nav>
      )}

      {/* --------------------------------------------------------------------
          5. MODAL KONFIRMASI LOGOUT MONOKROM
          -------------------------------------------------------------------- */}
      {showLogoutConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-xs animate-fadeIn"
        >
          <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 p-5 shadow-lg flex flex-col gap-4 font-sans">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center shrink-0">
                <LogoutIcon className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <h3 className="text-title-3 text-slate-900">Konfirmasi Keluar</h3>
                <p className="text-caption text-slate-500 mt-0.5">
                  Apakah Anda yakin ingin keluar dari akun Titipku?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-caption font-semibold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-caption font-semibold transition-all shadow-xs cursor-pointer"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal Detail Profil Pengguna (Pojok Kanan Atas) */}
      <ProfileDetailModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        currentAccount={currentAccount}
        onLogout={() => {
          setShowProfileModal(false)
          setShowLogoutConfirm(true)
        }}
      />
    </div>
  )
}

export default AppLayout
