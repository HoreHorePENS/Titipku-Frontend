import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal } from '@/components/shared/Modal'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/toast-store'
import { describeApiError } from '@/lib/api-errors'
import { rupiah } from '@/lib/format'
import { useCatalogProducts } from '@/features/catalog/api'
import { useCreateConsignmentRequest } from '../proposals-api'
import { getCategoryMeta } from '../constants'
import type { Store } from '../types'

interface ConsignModalProps {
  store: Store | null
  isOpen: boolean
  onClose: () => void
}

const NOTE_MAX = 1000

const REQUEST_ERROR_MESSAGES: Record<string, string> = {
  PROPOSAL_PENDING: 'Masih ada pengajuan atau tawaran dengan toko ini yang menunggu jawaban.',
  ALREADY_PARTNERS: 'Toko ini sudah menjadi mitramu. Catat kunjungan untuk menitipkan barang.',
  STORE_INACTIVE: 'Toko ini sedang tidak menerima titipan. Coba toko lain di peta.',
  NOT_FOUND: 'Ada produk yang sudah tidak aktif. Muat ulang halaman lalu pilih lagi.',
}

/** Penitip mengajukan titip-jual ke toko. Toko menyetujui dulu sebelum menjadi mitra. */
export function ConsignModal({ store, isOpen, onClose }: ConsignModalProps) {
  const navigate = useNavigate()
  const { data: products = [], isLoading: isLoadingProducts } = useCatalogProducts(true)
  const createRequest = useCreateConsignmentRequest()
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [note, setNote] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  if (!store) return null
  const meta = getCategoryMeta(store.category)

  const setQty = (productId: string, qty: number) =>
    setQuantities((prev) => {
      const next = { ...prev }
      if (qty <= 0 || Number.isNaN(qty)) delete next[productId]
      else next[productId] = Math.min(qty, 100000)
      return next
    })

  const selected = Object.entries(quantities)
  const totalUnits = selected.reduce((sum, [, qty]) => sum + qty, 0)
  const totalValue = selected.reduce((sum, [id, qty]) => sum + (products.find((p) => p.id === id)?.consignPrice ?? 0) * qty, 0)

  const handleClose = () => {
    setFormError(null)
    onClose()
  }

  const handleSubmit = async () => {
    setFormError(null)
    try {
      await createRequest.mutateAsync({
        storeId: store.id,
        message: note,
        items: selected.map(([productId, qty]) => ({ productId, qty })),
      })
      toast.show({
        title: 'Pengajuan terkirim',
        description: `${store.name} akan meninjau pengajuanmu. Kamu akan mendapat kabar saat disetujui.`,
        type: 'success',
      })
      setQuantities({})
      setNote('')
      onClose()
    } catch (err) {
      setFormError(describeApiError(err, { codeMessages: REQUEST_ERROR_MESSAGES }).message)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Ajukan titip-jual" description={`${store.name} · ${meta.label}`} maxWidth="lg">
      <div className="flex flex-col gap-4 text-ink">
        <p className="text-body text-ink-soft">{store.address}</p>
        {store.description && (
          <p className="p-3 rounded-xl border border-line bg-slate-50 text-body">
            <span className="text-label block">Produk yang dicari toko</span>
            {store.description}
          </p>
        )}

        {store.hasConsigned ? (
          <div className="flex flex-col gap-3">
            <p className="text-body">Toko ini sudah menjadi mitramu. Titipkan barang dengan mencatat kunjungan.</p>
            <Button variant="primary" className="rounded-xl" onClick={() => navigate('/kunjungan/baru')}>
              Catat kunjungan
            </Button>
          </div>
        ) : (
          <>
            <section>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-title-3">Produk yang ingin dititipkan</h3>
                <span className="text-caption text-ink-soft">{selected.length} dipilih</span>
              </div>
              {isLoadingProducts ? (
                <p className="p-4 text-center text-body text-ink-soft rounded-xl border border-line">Memuat produkmu…</p>
              ) : products.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-line-strong text-center flex flex-col items-center gap-2">
                  <p className="text-body text-ink-soft">Kamu belum punya produk aktif. Tambahkan produk agar toko tahu apa yang akan dititipkan.</p>
                  <Button size="sm" variant="outline" className="rounded-xl" onClick={() => navigate('/produk')}>
                    Tambah produk
                  </Button>
                </div>
              ) : (
                <ul className="max-h-56 overflow-y-auto flex flex-col divide-y divide-line pr-1">
                  {products.map((product) => {
                    const qty = quantities[product.id] ?? 0
                    return (
                      <li key={product.id} className="py-2 flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-body font-semibold truncate">{product.name}</p>
                          <p className="text-caption text-ink-soft">Harga titip <span className="font-mono">{rupiah(product.consignPrice)}</span></p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button type="button" aria-label={`Kurangi ${product.name}`} disabled={qty === 0} onClick={() => setQty(product.id, qty - 1)} className="w-11 h-11 rounded-lg border border-line text-title-3 disabled:opacity-40">−</button>
                          <input
                            type="number"
                            inputMode="numeric"
                            min={0}
                            aria-label={`Jumlah ${product.name}`}
                            value={qty || ''}
                            placeholder="0"
                            onChange={(e) => setQty(product.id, parseInt(e.target.value, 10))}
                            className="w-14 h-11 text-center rounded-lg border border-line text-[16px] font-semibold"
                          />
                          <button type="button" aria-label={`Tambah ${product.name}`} onClick={() => setQty(product.id, qty + 1)} className="w-11 h-11 rounded-lg bg-slate-900 text-white text-title-3">+</button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="consign-note" className="text-label">
                Pesan untuk toko <span className="text-ink-soft font-normal">(opsional)</span>
              </label>
              <textarea
                id="consign-note"
                rows={3}
                maxLength={NOTE_MAX}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Contoh: Kemasan standing pouch, tahan 3 bulan. Bisa antar setiap Senin."
                className="w-full px-3.5 py-2.5 rounded-xl border border-line-strong text-[16px] leading-normal resize-none focus:outline-none focus:ring-2 focus:ring-focus-ring/30"
              />
            </div>

            {totalUnits > 0 && (
              <p className="p-3 rounded-xl bg-slate-50 border border-line text-body flex justify-between">
                <span>{totalUnits} pcs</span>
                <span>Perkiraan nilai titip <span className="font-mono font-semibold">{rupiah(totalValue)}</span></span>
              </p>
            )}

            {formError && (
              <p role="alert" className="p-3 rounded-xl border border-red-200 bg-red-50 text-body text-red-800">
                {formError}
              </p>
            )}

            <div className="flex items-center gap-2 pt-3 border-t border-line">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={handleClose}>
                Batal
              </Button>
              <Button
                variant="primary"
                className="flex-1 rounded-xl"
                loading={createRequest.isPending}
                disabled={createRequest.isPending || !store.isActive}
                onClick={handleSubmit}
              >
                {createRequest.isPending ? 'Mengirim…' : 'Kirim pengajuan'}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
