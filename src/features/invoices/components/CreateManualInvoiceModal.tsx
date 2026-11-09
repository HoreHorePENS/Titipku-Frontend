import { useState, useEffect } from 'react'
import { Modal } from '@/components/shared/Modal'
import { Button } from '@/components/ui/Button'
import { rupiah } from '@/lib/format'
import { saveStoreDigitalInvoice } from '../digital-invoices'
import type { Partner } from '@/features/partner/types'
import type { VisitRecord } from '@/features/visit/types'

interface CreateManualInvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  partners: Partner[]
  onSuccess: () => void
}

export function CreateManualInvoiceModal({
  isOpen,
  onClose,
  partners,
  onSuccess,
}: CreateManualInvoiceModalProps) {
  const [partnerId, setPartnerId] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [invoiceDate, setInvoiceDate] = useState('')
  const [amount, setAmount] = useState<number>(0)
  const [receivedBy, setReceivedBy] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      const defaultPartner = partners[0]?.id || ''
      setPartnerId(defaultPartner)
      setInvoiceNumber(`NOTA-${Math.floor(100000 + Math.random() * 900000)}`)
      setInvoiceDate(new Date().toISOString().slice(0, 10))
      setAmount(0)
      const selected = partners.find((p) => p.id === defaultPartner)
      setReceivedBy(selected?.ownerName || selected?.name || '')
      setNotes('')
      setIsSubmitting(false)
    }
  }, [isOpen, partners])

  const handlePartnerChange = (id: string) => {
    setPartnerId(id)
    const selected = partners.find((p) => p.id === id)
    if (selected) {
      setReceivedBy(selected.ownerName || selected.name)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!partnerId || amount <= 0) return

    setIsSubmitting(true)

    const selectedPartner = partners.find((p) => p.id === partnerId)
    const record: VisitRecord = {
      id: `manual-inv-${Date.now()}`,
      number: invoiceNumber || `NOTA-${Date.now().toString().slice(-6)}`,
      businessName: 'Warung Mitra',
      partnerId,
      partnerName: selectedPartner?.name || 'Warung Mitra',
      partnerOwnerName: selectedPartner?.ownerName || '',
      partnerArea: selectedPartner?.address || '',
      partnerWhatsApp: selectedPartner?.whatsapp || '',
      visitedAt: new Date(invoiceDate || Date.now()).toISOString(),
      receivedBy: receivedBy || 'Pemilik Toko',
      total: amount,
      paid: 0,
      status: 'unpaid',
      items: [
        {
          id: `item-${Date.now()}`,
          productId: 'manual-prod',
          productName: notes ? `Tagihan: ${notes}` : 'Barang Konsinyasi Titipan',
          prevStock: 0,
          remaining: 0,
          returned: 0,
          newDrop: 0,
          sold: 1,
          stockAfter: 0,
          unitPrice: amount,
          subtotal: amount,
        },
      ],
    }

    saveStoreDigitalInvoice(record)
    setIsSubmitting(false)
    onSuccess()
    onClose()
  }

  if (!isOpen) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tambah Tagihan Belum Lunas"
      description="Catat tagihan konsinyasi atau piutang warung yang belum dibayarkan."
      className="max-w-md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-caption font-sans text-slate-900">
        {/* Pilih Warung Mitra */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="inv-partner" className="font-semibold text-slate-700">
            Toko / Warung Mitra <span className="text-rose-500">*</span>
          </label>
          <select
            id="inv-partner"
            required
            value={partnerId}
            onChange={(e) => handlePartnerChange(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-caption text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            {partners.length === 0 ? (
              <option value="">Belum ada toko mitra</option>
            ) : (
              partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.address ? `(${p.address.split(',')[0]})` : ''}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Nomor Nota & Tanggal */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="inv-number" className="font-semibold text-slate-700">
              Nomor Nota <span className="text-rose-500">*</span>
            </label>
            <input
              id="inv-number"
              type="text"
              required
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-caption font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="inv-date" className="font-semibold text-slate-700">
              Tanggal Nota <span className="text-rose-500">*</span>
            </label>
            <input
              id="inv-date"
              type="date"
              required
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-caption text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
        </div>

        {/* Nominal Total Tagihan */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="inv-amount" className="font-semibold text-slate-700">
            Total Tagihan Belum Lunas (Rp) <span className="text-rose-500">*</span>
          </label>
          <input
            id="inv-amount"
            type="number"
            min={1000}
            step={1000}
            required
            placeholder="0"
            value={amount || ''}
            onChange={(e) => setAmount(Number(e.target.value) || 0)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-body font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 tabular-nums"
          />
          {amount > 0 && (
            <span className="text-caption font-semibold text-slate-600">
              Terbaca: <strong className="text-slate-900">{rupiah(amount)}</strong> (Status: Belum Lunas)
            </span>
          )}
        </div>

        {/* Penerima / Penanggung Jawab di Warung */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="inv-received-by" className="font-semibold text-slate-700">
            Nama Penerima di Warung
          </label>
          <input
            id="inv-received-by"
            type="text"
            value={receivedBy}
            onChange={(e) => setReceivedBy(e.target.value)}
            placeholder="Nama penanggung jawab warung"
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-caption text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>

        {/* Keterangan / Catatan Barang */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="inv-notes" className="font-semibold text-slate-700">
            Keterangan Titipan / Barang
          </label>
          <input
            id="inv-notes"
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="cth. Keripik Pisang 20 bks & Keripik Tempe 15 bks"
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-caption text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>

        {/* Tombol Simpan & Batal */}
        <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onClose}
            className="flex-1 text-caption font-semibold rounded-xl min-h-[44px]"
          >
            Batal
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={isSubmitting || amount <= 0}
            className="flex-1 text-caption font-semibold rounded-xl min-h-[44px]"
          >
            {isSubmitting ? 'Menyimpan…' : 'Simpan Tagihan'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
