import type { VisitRecord, VisitItem, PaymentStatus } from '@/features/visit/types'

const STORAGE_KEY = 'titipku_digital_invoices'

export interface CreateStoreInvoiceItemInput {
  productId: string
  productName: string
  unitPrice: number
  sold: number
  returned?: number
  remaining?: number
}

export interface CreateStoreInvoiceInput {
  partnerId: string
  partnerName: string
  partnerWhatsApp?: string
  businessName?: string
  receivedBy: string
  status: PaymentStatus
  notes?: string
  items: CreateStoreInvoiceItemInput[]
}

export function getStoreDigitalInvoices(): VisitRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as VisitRecord[]
  } catch {
    return []
  }
}

export function saveStoreDigitalInvoice(invoice: VisitRecord): void {
  try {
    const current = getStoreDigitalInvoices()
    const updated = [invoice, ...current]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (err) {
    console.error('Failed to save digital invoice to storage', err)
  }
}

export function createStoreDigitalInvoice(input: CreateStoreInvoiceInput): VisitRecord {
  const invoiceNumber = `NOTA-${Date.now().toString().slice(-6)}`
  const now = new Date().toISOString()

  let total = 0
  const items: VisitItem[] = input.items.map((it, idx) => {
    const sold = Math.max(0, it.sold)
    const returned = Math.max(0, it.returned || 0)
    const subtotal = sold * it.unitPrice
    total += subtotal

    return {
      id: `item-${Date.now()}-${idx}`,
      productId: it.productId,
      productName: it.productName,
      prevStock: sold + returned + (it.remaining || 0),
      remaining: it.remaining || 0,
      returned,
      newDrop: 0,
      sold,
      stockAfter: it.remaining || 0,
      unitPrice: it.unitPrice,
      subtotal,
    }
  })

  const newRecord: VisitRecord = {
    id: `store-inv-${Date.now()}`,
    number: invoiceNumber,
    businessName: input.businessName || 'Warung Mitra',
    partnerId: input.partnerId,
    partnerName: input.partnerName,
    partnerWhatsApp: input.partnerWhatsApp,
    visitedAt: now,
    receivedBy: input.receivedBy,
    total,
    paid: input.status === 'paid' ? total : 0,
    status: input.status,
    publicToken: `token-${Date.now().toString().slice(-8)}`,
    items,
  }

  saveStoreDigitalInvoice(newRecord)
  return newRecord
}
