import { useState, useEffect, useCallback } from 'react'

export interface AppNotification {
  id: string
  role: 'penitip' | 'pemilik_toko' | 'all'
  title: string
  message: string
  timeAgo: string
  timestamp: string
  isRead: boolean
  type: 'offer_incoming' | 'offer_accepted' | 'offer_rejected' | 'request_incoming' | 'info'
  // ID data terkait (misal offerId atau requestId)
  dataId?: string
}

export const NOTIFICATIONS_STORAGE_KEY = 'titipku_app_notifications_v1'

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  // Notifikasi untuk Role Penitip
  {
    id: 'notif-p-1',
    role: 'penitip',
    title: 'Tawaran Masuk dari Toko',
    message: 'Toko Kelontong Berkah Jaya menawarkan etalase depan kasir untuk produk keripik Anda.',
    timeAgo: '35 mnt lalu',
    timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    isRead: false,
    type: 'offer_incoming',
    dataId: 'offer-001',
  },
  {
    id: 'notif-p-2',
    role: 'penitip',
    title: 'Tawaran Masuk dari Warung',
    message: 'Warung Madura Barokah 24 Jam mengajak kerja sama titip aneka camilan.',
    timeAgo: '3 jam lalu',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    isRead: false,
    type: 'offer_incoming',
    dataId: 'offer-002',
  },
  {
    id: 'notif-p-3',
    role: 'penitip',
    title: 'Kemitraan Toko Aktif',
    message: 'Kafe & Roastery Kopi Pojok kini resmi menjadi toko mitra konsinyasi Anda.',
    timeAgo: 'Kemarin',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    isRead: true,
    type: 'info',
    dataId: 'offer-003',
  },

  // Notifikasi untuk Role Pemilik Toko
  {
    id: 'notif-t-1',
    role: 'pemilik_toko',
    title: 'Permohonan Titip Baru',
    message: 'Ibu Rina Rahmawati (Keripik Pisang Rina) mengajukan titip 30 bungkus keripik.',
    timeAgo: '45 mnt lalu',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    isRead: false,
    type: 'request_incoming',
    dataId: 'req-001',
  },
  {
    id: 'notif-t-2',
    role: 'pemilik_toko',
    title: 'Permohonan Titip Baru',
    message: 'Ibu Mimin Sunarti (Kue Basah Bu Mimin) mengajukan titip kue lapis legit & risoles.',
    timeAgo: '5 jam lalu',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    isRead: false,
    type: 'request_incoming',
    dataId: 'req-002',
  },
  {
    id: 'notif-t-3',
    role: 'pemilik_toko',
    title: 'Tawaran Toko Diterima!',
    message: 'Produsen Sambal Bu Rudy telah menyetujui tawaran kemitraan toko Anda.',
    timeAgo: '2 hari lalu',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    isRead: true,
    type: 'offer_accepted',
  },
]

export function loadNotifications(): AppNotification[] {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(INITIAL_NOTIFICATIONS))
      return INITIAL_NOTIFICATIONS
    }
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed
    }
    return INITIAL_NOTIFICATIONS
  } catch {
    return INITIAL_NOTIFICATIONS
  }
}

export function useNotifications(userRole: 'penitip' | 'pemilik_toko' = 'penitip') {
  const [allNotifications, setAllNotifications] = useState<AppNotification[]>(loadNotifications)

  useEffect(() => {
    const handleStorageChange = () => {
      setAllNotifications(loadNotifications())
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const persist = useCallback((updater: (prev: AppNotification[]) => AppNotification[]) => {
    setAllNotifications((prev) => {
      const next = updater(prev)
      try {
        localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(next))
      } catch (err) {
        console.error('Failed to save notifications:', err)
      }
      return next
    })
  }, [])

  // Filter notifikasi sesuai role pengguna yang login
  const notifications = allNotifications.filter(
    (item) => item.role === userRole || item.role === 'all'
  )

  const unreadCount = notifications.filter((item) => !item.isRead).length
  const hasUnread = unreadCount > 0

  const markAsRead = useCallback(
    (notificationId: string) => {
      persist((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      )
    },
    [persist]
  )

  const markAllAsRead = useCallback(() => {
    persist((prev) =>
      prev.map((n) =>
        n.role === userRole || n.role === 'all' ? { ...n, isRead: true } : n
      )
    )
  }, [persist, userRole])

  const addNotification = useCallback(
    (newNotif: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>) => {
      const notif: AppNotification = {
        ...newNotif,
        id: `notif-${Date.now()}`,
        timestamp: new Date().toISOString(),
        isRead: false,
      }
      persist((prev) => [notif, ...prev])
      return notif
    },
    [persist]
  )

  return {
    notifications,
    unreadCount,
    hasUnread,
    markAsRead,
    markAllAsRead,
    addNotification,
  }
}
