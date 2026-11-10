import { useCallback, useMemo, useState } from 'react'
import { useProposals, type Proposal } from '@/features/stores/proposals-api'
import { useStoreNotas, type StoreNota } from '@/features/invoices/store-visits-api'
import { rupiah } from '@/lib/format'
import { ACCOUNT_STORAGE_KEYS, readAccountItem, writeAccountItem } from '@/lib/account-storage'

export type NotificationRole = 'penitip' | 'pemilik_toko'

export interface AppNotification {
  /** Unik per proposal + status, sehingga perubahan status memunculkan notifikasi baru. */
  id: string
  title: string
  message: string
  timestamp: string
  isRead: boolean
  type: 'offer_incoming' | 'request_incoming' | 'accepted' | 'rejected' | 'nota_new'
  /** Proposal sumber notifikasi ('' untuk notifikasi nota). */
  proposalId: string
  /** Nota sumber notifikasi (khusus 'nota_new'). */
  notaId?: string
  /** Toko yang terlibat di proposal (untuk membuka detail toko mitra). */
  storeId: string
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

    let entry: Omit<AppNotification, 'id' | 'isRead' | 'timestamp' | 'proposalId' | 'storeId' | 'notaId'> | null = null
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
    if (entry) notifications.push({ ...entry, id, timestamp, proposalId: proposal.id, storeId: proposal.store.id, isRead: readIds.has(id) })
  }

  return notifications.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
}

/**
 * Tujuan tombol "Lihat" sebuah notifikasi:
 * - penitip, pengajuan disetujui -> Toko Mitra dengan detail toko tsb terbuka
 * - penitip, pengajuan ditolak   -> daftar pengajuan di Toko Mitra, item tsb disorot
 * - pemilik toko, pengajuan masuk -> Toko Saya, tab pengajuan
 */
export function notificationTarget(notif: AppNotification, role: NotificationRole): string {
  const id = encodeURIComponent(notif.proposalId)
  if (role === 'penitip') {
    if (notif.type === 'accepted') return `/warung?toko=${encodeURIComponent(notif.storeId)}`
    if (notif.type === 'rejected') return `/warung?pengajuan=${id}#pengajuan-saya`
    return '/'
  }
  if (notif.type === 'request_incoming') return `/toko-saya?tab=pengajuan&pengajuan=${id}`
  if (notif.type === 'nota_new' && notif.notaId) return `/penitip?nota=${encodeURIComponent(notif.notaId)}`
  return '/penitip'
}

/** Pemilik toko: satu notifikasi per nota baru dari penitip (30 hari terakhir). */
export function buildNotaNotifications(notas: StoreNota[], readIds: Set<string>, now = Date.now()): AppNotification[] {
  return notas
    .filter((nota) => now - new Date(nota.visitedAt).getTime() <= MAX_AGE_MS)
    .map((nota) => {
      const id = `nota:${nota.id}`
      return {
        id,
        type: 'nota_new' as const,
        title: `Nota baru dari ${nota.businessName}`,
        message: nota.total > 0 ? `${nota.number} · Tagihan ${rupiah(nota.total)}` : `${nota.number} · Titip barang`,
        timestamp: nota.visitedAt,
        isRead: readIds.has(id),
        proposalId: '',
        notaId: nota.id,
        storeId: '',
        actionable: false,
      }
    })
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

/** Notifikasi untuk akun yang login: dari /v1/proposals, dan untuk toko juga nota baru (/v1/store-visits). */
export function useNotifications(role: NotificationRole) {
  const proposalsQuery = useProposals()
  const notasQuery = useStoreNotas(role === 'pemilik_toko')
  const [readIds, setReadIds] = useState<Set<string>>(loadReadIds)

  const notifications = useMemo(
    () =>
      [
        ...buildNotifications(proposalsQuery.data ?? [], role, readIds),
        ...(role === 'pemilik_toko' ? buildNotaNotifications(notasQuery.data ?? [], readIds) : []),
      ].sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
    [proposalsQuery.data, notasQuery.data, role, readIds]
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
