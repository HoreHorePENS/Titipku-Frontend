import { useState } from 'react'
import { Modal } from '@/components/shared/Modal'
import { Button } from '@/components/ui/Button'
import { Stepper } from '@/components/ui/Stepper'
import { rupiah } from '@/lib/format'
import { useCatalogProducts } from '@/features/catalog/api'
import type { StoreOffer } from '../store-offers'

interface OfferProductSelectModalProps {
  isOpen: boolean
  onClose: () => void
  offer: StoreOffer | null
  onSubmit: (items: { productId: string; qty: number }[]) => Promise<void>
  isSubmitting?: boolean
}

export function OfferProductSelectModal({
  isOpen,
  onClose,
  offer,
  onSubmit,
  isSubmitting = false,
}: OfferProductSelectModalProps) {
  const { data: products = [], isLoading } = useCatalogProducts(true)
  const [quantities, setQuantities] = useState<Record<string, number>>({})

  if (!offer) return null

  const setQty = (productId: string, qty: number) => {
    setQuantities((prev) => {
      const next = { ...prev }
      if (qty <= 0) {
        delete next[productId]
      } else {
        next[productId] = Math.min(qty, 100000)
      }
      return next
    })
  }

  const selected = Object.entries(quantities).filter(([, q]) => q > 0)
  const totalUnits = selected.reduce((sum, [, q]) => sum + q, 0)
  const totalValue = selected.reduce((sum, [id, q]) => {
    const p = products.find((prod) => prod.id === id)
    return sum + (p?.consignPrice ?? 0) * q
  }, 0)

  const handleSubmit = async () => {
    if (selected.length === 0) return
    const items = selected.map(([productId, qty]) => ({ productId, qty }))
    await onSubmit(items)
    setQuantities({})
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pilih Produk untuk Dititipkan"
      description={`Tentukan produk dan jumlah awal yang ingin dititipkan ke ${offer.storeName}.`}
      maxWidth="lg"
    >
      <div className="flex flex-col gap-4 text-ink">
        {isLoading ? (
          <p className="text-body text-ink-soft py-6 text-center">Memuat daftar produk...</p>
        ) : products.length === 0 ? (
          <div className="p-4 rounded-xl border border-line bg-slate-50 text-center">
            <p className="text-body font-semibold">Belum ada produk aktif</p>
            <p className="text-caption text-ink-soft mt-1">
              Tambahkan produk terlebih dahulu di menu Produk sebelum mengajukan titipan.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
            {products.map((p) => {
              const currentQty = quantities[p.id] ?? 0
              const isSelected = currentQty > 0

              return (
                <li
                  key={p.id}
                  className={`p-3 rounded-xl border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isSelected ? 'border-line bg-white' : 'border-slate-200 bg-slate-50 opacity-70'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-body font-semibold truncate">{p.name}</p>
                    <p className="text-caption text-ink-soft">
                      Modal {rupiah(p.consignPrice)} · Jual {rupiah(p.retailPrice)} · Tahan {p.shelfLifeDays} hari
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-line">
                    <div className="flex items-center gap-2">
                      <span className="text-caption text-ink-soft">Jumlah:</span>
                      <Stepper
                        value={currentQty}
                        min={0}
                        max={100000}
                        onChange={(val) => setQty(p.id, val)}
                      />
                    </div>
                    {isSelected && (
                      <p className="text-body font-mono font-semibold shrink-0">
                        {rupiah(p.consignPrice * currentQty)}
                      </p>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        {selected.length > 0 && (
          <div className="p-3 rounded-xl bg-slate-50 border border-line flex justify-between items-center text-body">
            <span className="text-ink-soft">{totalUnits} pcs ({selected.length} produk)</span>
            <span className="font-mono font-semibold">{rupiah(totalValue)}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
          <Button variant="outline" className="rounded-xl min-h-[44px]" onClick={onClose} disabled={isSubmitting}>
            Batal
          </Button>
          <Button
            variant="primary"
            className="rounded-xl min-h-[44px]"
            disabled={selected.length === 0 || isSubmitting}
            loading={isSubmitting}
            onClick={handleSubmit}
          >
            Kirim Rincian Produk ({selected.length})
          </Button>
        </div>
      </div>
    </Modal>
  )
}
