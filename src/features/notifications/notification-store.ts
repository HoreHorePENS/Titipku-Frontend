import { useCallback, useMemo, useState } from 'react'
import { useProposals, type Proposal } from '@/features/stores/proposals-api'
import { ACCOUNT_STORAGE_KEYS, readAccountItem, writeAccountItem } from '@/lib/account-storage'

export type NotificationRole = 'penitip' | 'pemilik_toko'

export interface AppNotification {
  /** Unik per proposal + status, sehingga perubahan status memunculkan notifikasi baru. */
  id: string
  title: string
  message: string
  timestamp: string
  isRead: boolean
  type: 'offer_incoming' | 'request_incoming' | 'accepted' | 'rejected'
  proposalId: string
  /** true bila notifikasi bisa langsung disetujui/ditolak (proposal masuk yang masih pending). */
  actionable: boolean
}

export const READ_STORAGE_KEY = ACCOUNT_STORAGE_KEYS.notificationsRead
/** Hanya proposal 30 hari terakhir yang dijadikan notifikasi. */
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000

function itemCount(proposal: Proposal): string {
  return proposal.items.length > 0 ? ` ${proposal.items.length} produk` : ' produknya'
}

/**
 * Turunkan notifikasi dari proposal asli:
 * - proposal masuk yang masih pending (perlu tindakan), dan
 * - proposal yang kita kirim lalu diterima/ditolak pihak lain.
 */
export function buildNotifications(proposals: Proposal[], role: NotificationRole, readIds: Set<string>, now = Date.now()): AppNotification[] {
  const incomingDirection = role === 'penitip' ? 'store_to_penitip' : 'penitip_to_store'
  const notifications: AppNotification[] = []

  for (const proposal of proposals) {
    const timestamp = proposal.respondedAt ?? proposal.createdAt
    if (now - new Date(timestamp).getTime() > MAX_AGE_MS) continue
    const isIncoming = proposal.direction === incomingDirection
    const counterpart = role === 'penitip' ? proposal.store.name : proposal.business.name
    const id = `${proposal.id}:${proposal.status}`

    let entry: Omit<AppNotification, 'id' | 'isRead' | 'timestamp' | 'proposalId'> | null = null
    if (isIncoming && proposal.status === 'pending') {
      entry =
        role === 'penitip'
          ? { type: 'offer_incoming', title: 'Tawaran masuk dari toko', message: `${counterpart} menawarkan tempat untuk produkmu.`, actionable: true }
          : { type: 'request_incoming', title: 'Pengajuan titip baru', message: `${counterpart} ingin menitipkan${itemCount(proposal)} di tokomu.`, actionable: true }
    } else if (!isIncoming && proposal.status === 'accepted') {
      entry = { type: 'accepted', title: role === 'penitip' ? 'Pengajuan disetujui' : 'Tawaran diterima', message: `${counterpart} kini menjadi mitramu.`, actionable: false }
    } else if (!isIncoming && proposal.status === 'rejected') {
      entry = {
        type: 'rejected',
        title: role === 'penitip' ? 'Pengajuan ditolak' : 'Tawaran ditolak',
        message: `${counterpart} belum bisa bekerja sama saat ini.`,
        actionable: false,
      }
    }
    if (entry) notifications.push({ ...entry, id, timestamp, proposalId: proposal.id, isRead: readIds.has(id) })
  }

  return notifications.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
}

export function formatTimeAgo(iso: string, now = Date.now()): string {
  const minutes = Math.round((now - new Date(iso).getTime()) / 60000)
  if (minutes < 1) return 'Baru saja'
  if (minutes < 60) return `${minutes} mnt lalu`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} jam lalu`
  const days = Math.round(hours / 24)
  return days === 1 ? 'Kemarin' : `${days} hari lalu`
}

function loadReadIds(): Set<string> {
  try {
    const raw = readAccountItem(READ_STORAGE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return new Set(Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [])
  } catch {
    return new Set()
  }
}

function saveReadIds(ids: Set<string>) {
  try {
    // Simpan secukupnya agar tidak tumbuh tanpa batas.
    writeAccountItem(READ_STORAGE_KEY, JSON.stringify([...ids].slice(-300)))
  } catch {
    // Penyimpanan tidak tersedia (mode privat): status baca hanya berlaku di sesi ini.
  }
}

/** Notifikasi untuk akun yang login, diturunkan dari /v1/proposals. */
export function useNotifications(role: NotificationRole) {
  const proposalsQuery = useProposals()
  const [readIds, setReadIds] = useState<Set<string>>(loadReadIds)

  const notifications = useMemo(
    () => buildNotifications(proposalsQuery.data ?? [], role, readIds),
    [proposalsQuery.data, role, readIds]
  )

  const markRead = useCallback((ids: string[]) => {
    setReadIds((prev) => {
      const next = new Set(prev)
      ids.forEach((id) => next.add(id))
      saveReadIds(next)
      return next
    })
  }, [])

  const unreadCount = notifications.filter((n) => !n.isRead).length
  return {
    notifications,
    unreadCount,
    hasUnread: unreadCount > 0,
    isLoading: proposalsQuery.isLoading,
    isError: proposalsQuery.isError,
    error: proposalsQuery.error,
    refetch: proposalsQuery.refetch,
    markAsRead: (id: string) => markRead([id]),
    markAllAsRead: () => markRead(notifications.map((n) => n.id)),
  }
}
