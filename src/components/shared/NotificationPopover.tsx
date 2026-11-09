import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from '@/components/ui/toast-store'
import { describeApiError } from '@/lib/api-errors'
import { formatTimeAgo, useNotifications, type AppNotification, type NotificationRole } from '@/features/notifications/notification-store'
import { useProposalAction } from '@/features/stores/proposals-api'

interface NotificationPopoverProps {
  userRole: NotificationRole
}

function BellIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

export function NotificationPopover({ userRole }: NotificationPopoverProps) {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)
  const { notifications, unreadCount, hasUnread, isError, markAsRead, markAllAsRead } = useNotifications(userRole)
  const action = useProposalAction()

  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) setIsOpen(false)
    }
    const handleEscape = (event: KeyboardEvent) => event.key === 'Escape' && setIsOpen(false)
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const respond = async (notif: AppNotification, accept: boolean) => {
    try {
      await action.mutateAsync({ id: notif.proposalId, action: accept ? 'accept' : 'reject' })
      markAsRead(notif.id)
      toast.show(
        accept
          ? { title: 'Tawaran diterima', description: 'Toko tersebut kini menjadi mitramu.', type: 'success' }
          : { title: 'Tawaran ditolak', description: 'Tawaran sudah ditolak.', type: 'info' }
      )
    } catch (err) {
      toast.show({ title: 'Belum bisa diproses', description: describeApiError(err).message, type: 'error' })
    }
  }

  const openDetail = (notif: AppNotification) => {
    markAsRead(notif.id)
    setIsOpen(false)
    navigate(userRole === 'pemilik_toko' ? '/penitip' : '/')
  }

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={hasUnread ? `Notifikasi, ${unreadCount} belum dibaca` : 'Notifikasi'}
        aria-expanded={isOpen}
        className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 border border-line text-ink-soft cursor-pointer"
      >
        <BellIcon />
        {hasUnread && <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-danger rounded-full border-2 border-white" aria-hidden="true" />}
      </button>

      {isOpen && (
        <div
          className="fixed inset-x-3 top-[4.5rem] max-h-[calc(100dvh-6rem)] sm:absolute sm:inset-x-auto sm:top-auto sm:right-0 sm:mt-2 sm:w-96 sm:max-h-none bg-white rounded-2xl border border-line shadow-xl z-[60] overflow-hidden flex flex-col"
          role="dialog"
          aria-label="Notifikasi"
        >
          <div className="px-4 py-3 bg-slate-50 border-b border-line flex items-center justify-between">
            <h2 className="text-title-3 text-ink">
              Notifikasi{unreadCount > 0 && <span className="text-caption text-ink-soft font-medium"> · {unreadCount} baru</span>}
            </h2>
            {unreadCount > 0 && (
              <button type="button" onClick={markAllAsRead} className="text-caption font-semibold text-ink-soft hover:text-ink min-h-[44px] px-1">
                Tandai semua dibaca
              </button>
            )}
          </div>

          <ul className="min-h-0 flex-1 sm:max-h-96 overflow-y-auto divide-y divide-line">
            {isError ? (
              <li className="py-8 px-4 text-center text-body text-ink-soft">Notifikasi belum bisa dimuat. Coba lagi sebentar lagi.</li>
            ) : notifications.length === 0 ? (
              <li className="py-8 px-4 text-center">
                <p className="text-label text-ink">Belum ada notifikasi</p>
                <p className="text-caption text-ink-soft mt-0.5">Tawaran dan pengajuan baru akan muncul di sini.</p>
              </li>
            ) : (
              notifications.map((notif) => (
                <li key={notif.id} className={`p-3.5 flex flex-col gap-1.5 ${notif.isRead ? 'bg-white' : 'bg-slate-50'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-label text-ink flex items-center gap-1.5">
                      {!notif.isRead && <span className="w-2 h-2 rounded-full bg-danger shrink-0" aria-label="Belum dibaca" />}
                      {notif.title}
                    </p>
                    <span className="text-caption text-ink-soft shrink-0">{formatTimeAgo(notif.timestamp)}</span>
                  </div>
                  <p className="text-body text-ink-soft">{notif.message}</p>
                  <div className="flex items-center gap-1.5 pt-1">
                    {notif.actionable && userRole === 'penitip' ? (
                      <>
                        <button
                          type="button"
                          disabled={action.isPending}
                          onClick={() => respond(notif, true)}
                          className="px-3 rounded-lg bg-slate-900 text-white text-caption font-semibold min-h-[36px] disabled:opacity-50"
                        >
                          Terima
                        </button>
                        <button
                          type="button"
                          disabled={action.isPending}
                          onClick={() => respond(notif, false)}
                          className="px-3 rounded-lg border border-line text-ink text-caption font-semibold min-h-[36px] disabled:opacity-50"
                        >
                          Tolak
                        </button>
                      </>
                    ) : (
                      <button type="button" onClick={() => openDetail(notif)} className="px-3 rounded-lg border border-line text-ink text-caption font-semibold min-h-[36px]">
                        {notif.actionable ? 'Tinjau pengajuan' : 'Lihat'}
                      </button>
                    )}
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
