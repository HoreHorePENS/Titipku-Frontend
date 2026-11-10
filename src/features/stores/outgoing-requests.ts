import type { Proposal } from './proposals-api'

/** Pengajuan titip yang dikirim penitip ke toko (terbaru dulu), tanpa yang dibatalkan. */
export function outgoingRequests(proposals: Proposal[]): Proposal[] {
  return proposals
    .filter((p) => p.direction === 'penitip_to_store' && p.status !== 'cancelled')
    .sort((a, b) => (b.respondedAt ?? b.createdAt).localeCompare(a.respondedAt ?? a.createdAt))
}
