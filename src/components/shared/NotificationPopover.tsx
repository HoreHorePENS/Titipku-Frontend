import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from '@/components/ui/toast-store'
import { useNotifications, type AppNotification } from '@/features/notifications/notification-store'
import { useStoreOffers } from '@/features/stores/store-offers'

interface NotificationPopoverProps {
  userRole: 'penitip' | 'pemilik_toko'
}

export function NotificationPopover({ userRole }: NotificationPopoverProps) {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)

  const { notifications, unreadCount, hasUnread, markAsRead, markAllAsRead } =
    useNotifications(userRole)
  const { approveOffer, rejectOffer, offers } = useStoreOffers()

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Approval langsung dari notifikasi (Role Penitip)
  const handleApproveOffer = (notif: AppNotification) => {
    if (notif.dataId) {
      const offer = offers.find((o) => o.id === notif.dataId)
      approveOffer(notif.dataId)
      markAsRead(notif.id)
      toast.show({
        title: 'Tawaran Toko Diterima!',
        description: `Toko "${offer?.storeName || 'Mitra'}" kini resmi menjadi mitra konsinyasi Anda.`,
        type: 'success',
      })
    }
  }

  // Penolakan langsung dari notifikasi (Role Penitip)
  const handleRejectOffer = (notif: AppNotification) => {
    if (notif.dataId) {
      rejectOffer(notif.dataId)
      markAsRead(notif.id)
      toast.show({
        title: 'Tawaran Ditolak',
        description: 'Tawaran kemitraan toko telah ditolak.',
        type: 'info',
      })
    }
  }

  // Klik navigasi dari notifikasi
  const handleActionClick = (notif: AppNotification) => {
    markAsRead(notif.id)
    setIsOpen(false)
    if (userRole === 'pemilik_toko') {
      navigate('/penitip')
    } else {
      navigate('/')
    }
  }

  return (
    <div className="relative" ref={popoverRef}>
      {/* Tombol Lonceng Notifikasi di Pojok Kanan Atas */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Lihat Notifikasi"
        className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 transition-all cursor-pointer shadow-2xs"
        title="Notifikasi"
      >
        {/* Ikon Lonceng SVG Monokrom */}
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {/* TITIK MERAH (RED DOT INDICATOR) JIKA ADA PESAN/TAWARAN BARU */}
        {hasUnread && (
          <span
            className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white ring-1 ring-rose-500/20 animate-pulse"
            aria-label="Ada pesan baru"
          />
        )}
      </button>

      {/* Dropdown Panel Notifikasi */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden font-sans animate-in fade-in zoom-in-95 duration-100">
          {/* Header Panel */}
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Notifikasi</h3>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500 text-white">
                  {unreadCount} baru
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 hover:underline cursor-pointer"
              >
                Tandai dibaca
              </button>
            )}
          </div>

          {/* List Notifikasi */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="py-8 px-4 text-center">
                <p className="text-xs font-semibold text-slate-700">Tidak ada notifikasi</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Semua aktivitas dan pesan baru akan muncul di sini.
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const isOffer = notif.type === 'offer_incoming'
                const isRequest = notif.type === 'request_incoming'
                const currentOffer = notif.dataId
                  ? offers.find((o) => o.id === notif.dataId)
                  : undefined

                return (
                  <div
                    key={notif.id}
                    className={`p-3.5 flex flex-col gap-2 transition-colors ${
                      !notif.isRead ? 'bg-slate-50/70' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {/* Status Icon */}
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            !notif.isRead
                              ? 'bg-slate-900 text-white'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                          </svg>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 leading-tight">
                          {notif.title}
                        </h4>
                      </div>

                      <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                        {notif.timeAgo}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed pl-9">
                      {notif.message}
                    </p>

                    {/* Tombol Aksi Langsung pada Notifikasi */}
                    {isOffer && userRole === 'penitip' && currentOffer?.status === 'pending' && (
                      <div className="flex items-center gap-1.5 pl-9 pt-1">
                        <button
                          type="button"
                          onClick={() => handleApproveOffer(notif)}
                          className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-[11px] font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          Terima Tawaran
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRejectOffer(notif)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-[11px] font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          Tolak
                        </button>
                      </div>
                    )}

                    {isRequest && userRole === 'pemilik_toko' && (
                      <div className="flex items-center gap-1.5 pl-9 pt-1">
                        <button
                          type="button"
                          onClick={() => handleActionClick(notif)}
                          className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-[11px] font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          Tinjau Pengajuan →
                        </button>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
