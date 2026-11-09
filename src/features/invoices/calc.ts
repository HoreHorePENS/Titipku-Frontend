import type {
  Invoice,
  InvoicesMetricSummary,
  OverduePartner,
  FIFOAllocation,
  FIFOPreviewResult,
  InvoiceFilterOptions,
} from './types'
import { rupiah } from '@/lib/format'

/**
 * Menghitung selisih hari jatuh tempo dari tanggal terbit nota.
 */
export function calculateDaysOverdue(issuedAt: string, referenceDate: Date = new Date()): number {
  const issued = new Date(issuedAt)
  if (isNaN(issued.getTime())) return 0

  const diffMs = referenceDate.getTime() - issued.getTime()
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  return Math.max(0, days)
}

/**
 * Menghitung akumulasi metrik ringkasan tagihan:
 * - Belum lunas (nominal, jumlah warung, jumlah nota)
 * - Sudah masuk bulan ini (pembayaran terlunasi)
 * - Daftar warung yang belum bayar > 14 hari
 */
export function calculateInvoicesMetrics(
  invoices: Invoice[],
  referenceDate: Date = new Date()
): InvoicesMetricSummary {
  let totalUnpaidAmount = 0
  let totalCollectedThisMonth = 0
  const unpaidPartnerSet = new Set<string>()
  let totalUnpaidInvoicesCount = 0

  const currentYear = referenceDate.getFullYear()
  const currentMonth = referenceDate.getMonth()

  // Map untuk melacak piutang tertua per warung
  const partnerOverdueMap = new Map<
    string,
    { partnerName: string; maxDays: number; unpaidSum: number }
  >()

  for (const inv of invoices) {
    if (inv.status === 'unpaid' || inv.status === 'partial') {
      const remaining = inv.remaining > 0 ? inv.remaining : inv.total - inv.paid
      totalUnpaidAmount += remaining
      unpaidPartnerSet.add(inv.partnerId)
      totalUnpaidInvoicesCount++

      const days = calculateDaysOverdue(inv.issuedAt, referenceDate)
      const existing = partnerOverdueMap.get(inv.partnerId)
      if (existing) {
        existing.unpaidSum += remaining
        if (days > existing.maxDays) {
          existing.maxDays = days
        }
      } else {
        partnerOverdueMap.set(inv.partnerId, {
          partnerName: inv.partnerName,
          maxDays: days,
          unpaidSum: remaining,
        })
      }
    }

    // Hitung pembayaran yang masuk bulan ini
    const issued = new Date(inv.issuedAt)
    if (
      !isNaN(issued.getTime()) &&
      issued.getFullYear() === currentYear &&
      issued.getMonth() === currentMonth
    ) {
      totalCollectedThisMonth += inv.paid
    }
  }

  // Filter warung yang belum bayar > 14 hari
  const overduePartners: OverduePartner[] = []
  let totalOverdueAmount = 0

  for (const [partnerId, data] of partnerOverdueMap.entries()) {
    if (data.maxDays > 14) {
      overduePartners.push({
        partnerId,
        partnerName: data.partnerName,
        days: data.maxDays,
        amount: data.unpaidSum,
      })
      totalOverdueAmount += data.unpaidSum
    }
  }

  // Urutkan dari hari menunggak terlama
  overduePartners.sort((a, b) => b.days - a.days)

  return {
    totalUnpaidAmount,
    totalUnpaidPartnersCount: unpaidPartnerSet.size,
    totalUnpaidInvoicesCount,
    totalCollectedThisMonth,
    overduePartners,
    totalOverdueAmount,
  }
}

/**
 * Mensimulasikan alokasi pembayaran FIFO (nota terlama dilunasi terlebih dahulu).
 * Sesuai mockup Slide 5:
 * "Melunasi nota 20 Okt (Rp40.000), sisanya Rp60.000 ke nota 27 Okt. Sisa utang Bu Sri jadi Rp83.000"
 */
export function simulateFIFOAllocation(
  paymentAmount: number,
  partnerInvoices: Invoice[]
): FIFOPreviewResult {
  const safeAmount = Math.max(0, paymentAmount)

  // Ambil hanya nota yang belum lunas, urutkan dari terlama (issuedAt ASC)
  const unpaid = partnerInvoices
    .filter((inv) => inv.status !== 'paid' && (inv.remaining > 0 || inv.total > inv.paid))
    .sort((a, b) => new Date(a.issuedAt).getTime() - new Date(b.issuedAt).getTime())

  const totalCurrentDebt = unpaid.reduce(
    (sum, inv) => sum + (inv.remaining > 0 ? inv.remaining : inv.total - inv.paid),
    0
  )

  let remainingToAllocate = safeAmount
  const allocations: FIFOAllocation[] = []
  const summaryParts: string[] = []

  for (const inv of unpaid) {
    if (remainingToAllocate <= 0) break

    const invRemaining = inv.remaining > 0 ? inv.remaining : inv.total - inv.paid
    const take = Math.min(remainingToAllocate, invRemaining)
    const isFull = take >= invRemaining
    const remOnInvoice = invRemaining - take

    allocations.push({
      invoiceId: inv.id,
      visitNumber: inv.visitNumber,
      issuedAt: inv.issuedAt,
      allocatedAmount: take,
      isFullyPaid: isFull,
      remainingOnInvoice: remOnInvoice,
    })

    const dateFormatted = new Date(inv.issuedAt).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
    })

    if (isFull) {
      summaryParts.push(`Melunasi nota ${dateFormatted} (${rupiah(take)})`)
    } else {
      summaryParts.push(`sisanya ${rupiah(take)} ke nota ${dateFormatted}`)
    }

    remainingToAllocate -= take
  }

  const finalDebt = Math.max(0, totalCurrentDebt - safeAmount)

  let summaryText = ''
  if (allocations.length === 0 || safeAmount === 0) {
    summaryText = `Masukkan nominal pembayaran untuk melihat simulasi alokasi pelunasan nota (FIFO).`
  } else {
    summaryText = `${summaryParts.join(', ')}. Sisa utang jadi ${rupiah(finalDebt)}.`
  }

  return {
    allocations,
    totalPaid: safeAmount,
    totalRemainingDebt: finalDebt,
    summaryText,
  }
}

/**
 * Filter daftar nota berdasarkan kata kunci, tab status, dan partner.
 */
export function filterInvoices(
  invoices: Invoice[],
  options: InvoiceFilterOptions = {}
): Invoice[] {
  if (!invoices || invoices.length === 0) return []

  const { search = '', statusFilter = 'all', partnerId } = options
  const q = search.toLowerCase().trim()

  return invoices.filter((inv) => {
    // Filter partner
    if (partnerId && partnerId !== 'all' && inv.partnerId !== partnerId) {
      return false
    }

    // Filter status
    if (statusFilter !== 'all') {
      if (inv.status !== statusFilter) return false
    }

    // Filter pencarian
    if (q) {
      const matchNumber = inv.visitNumber.toLowerCase().includes(q)
      const matchPartner = inv.partnerName.toLowerCase().includes(q)
      const matchReceiver = inv.receivedBy ? inv.receivedBy.toLowerCase().includes(q) : false
      if (!matchNumber && !matchPartner && !matchReceiver) return false
    }

    return true
  })
}
