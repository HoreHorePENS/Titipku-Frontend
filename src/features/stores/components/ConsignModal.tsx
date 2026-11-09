import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal } from '@/components/shared/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toast } from '@/components/ui/toast-store'
import { formatRupiah } from '@/lib/format'
import { useCatalogProducts } from '@/features/catalog/api'
import { useConsignToStore } from '../api'
import { getCategoryMeta } from '../constants'
import type { Store } from '../types'

interface ConsignModalProps {
  store: Store | null
  isOpen: boolean
  onClose: () => void
}

export function ConsignModal({ store, isOpen, onClose }: ConsignModalProps) {
  const navigate = useNavigate()
  const { data: products = [], isLoading: isLoadingProducts } = useCatalogProducts(true)
  const consignMutation = useConsignToStore()

  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({})
  const [note, setNote] = useState('')

  if (!store) return null

  const meta = getCategoryMeta(store.category)

  const handleQtyChange = (productId: string, qty: number) => {
    setSelectedItems((prev) => {
      const copy = { ...prev }
      if (qty <= 0) {
        delete copy[productId]
      } else {
        copy[productId] = qty
      }
      return copy
    })
  }

  const totalUnits = Object.values(selectedItems).reduce((sum, q) => sum + q, 0)

  const totalValue = Object.entries(selectedItems).reduce((sum, [pId, qty]) => {
    const prod = products.find((p) => p.id === pId)
    return sum + (prod ? prod.consignPrice * qty : 0)
  }, 0)

  const handleSubmit = async () => {
    try {
      const itemsPayload = Object.entries(selectedItems)
        .filter(([, qty]) => qty > 0)
        .map(([productId, qty]) => {
          const prod = products.find((p) => p.id === productId)
          return {
            productId,
            qty,
            consignPrice: prod?.consignPrice || 0,
          }
        })

      await consignMutation.mutateAsync({
        storeId: store.id,
        storeName: store.name,
        ownerName: store.name,
        whatsapp: store.whatsapp,
        address: store.address,
        items: itemsPayload.length > 0 ? itemsPayload : undefined,
        note: note.trim() || undefined,
      })

      toast.show({
        title: 'Berhasil Menitipkan Barang',
        description: `Toko "${store.name}" telah ditambahkan ke mitra konsinyasi Anda${
          itemsPayload.length > 0 ? ` dengan ${totalUnits} pcs barang titipan awal.` : '.'
        }`,
        type: 'success',
      })

      setSelectedItems({})
      setNote('')
      onClose()
      navigate('/warung')
    } catch (err: unknown) {
      toast.show({
        title: 'Gagal Menitipkan Barang',
        description: err instanceof Error ? err.message : 'Terjadi kendala saat menghubungkan toko.',
        type: 'error',
      })
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Titipkan Barang ke Toko"
      className="max-w-lg"
    >
      <div className="flex flex-col gap-4 font-sans text-slate-900">
        {/* Info Toko Terpilih Minimalis */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-800 shrink-0 shadow-2xs">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d={meta.svgPath}></path>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white text-slate-700 border border-slate-200">
                {meta.label}
              </span>
              {store.hasConsigned && (
                <span className="text-[10px] font-semibold text-slate-900 bg-slate-200 px-2 py-0.5 rounded-md">
                  Mitra Aktif
                </span>
              )}
            </div>
            <h3 className="text-sm font-bold text-slate-900 mt-1 truncate">{store.name}</h3>
            <p className="text-xs text-slate-500 truncate">{store.address}</p>
            {store.description && (
              <div className="mt-1.5 p-2 bg-white rounded-lg border border-slate-200 text-[11px] text-slate-700">
                <span className="font-bold text-slate-900 block text-[10px] uppercase text-emerald-800">
                  *Kriteria Produk yang Cocok Dititipkan:
                </span>
                <span className="text-slate-600 leading-normal">{store.description}</span>
              </div>
            )}
          </div>
        </div>

        {/* Pemilihan Produk dari Katalog */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Pilih Produk untuk Dititipkan
            </label>
            <span className="text-xs text-slate-500">
              {Object.keys(selectedItems).length} produk dipilih
            </span>
          </div>

          {isLoadingProducts ? (
            <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
              Memuat katalog produk Anda...
            </div>
          ) : products.length === 0 ? (
            <div className="p-5 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 flex flex-col items-center gap-2">
              <p className="text-xs text-slate-600 max-w-xs">
                Anda belum memiliki produk aktif di katalog. Tambahkan produk Anda terlebih dahulu untuk mulai menitipkan barang.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate('/produk')}
                className="text-xs font-semibold mt-1"
              >
                + Tambah Produk Sekarang
              </Button>
            </div>
          ) : (
            <div className="max-h-56 overflow-y-auto flex flex-col gap-2 pr-1 divide-y divide-slate-100">
              {products.map((product) => {
                const currentQty = selectedItems[product.id] || 0

                return (
                  <div
                    key={product.id}
                    className="pt-2 pb-1 flex items-center justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{product.name}</h4>
                      <p className="text-[11px] text-slate-500">
                        Harga titip: <span className="font-semibold text-slate-900">{formatRupiah(product.consignPrice)}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleQtyChange(product.id, Math.max(0, currentQty - 1))}
                        disabled={currentQty === 0}
                        className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 font-bold flex items-center justify-center hover:bg-slate-200 disabled:opacity-40 transition-all cursor-pointer"
                      >
                        -
                      </button>

                      <input
                        type="number"
                        min="0"
                        value={currentQty || ''}
                        placeholder="0"
                        onChange={(e) => handleQtyChange(product.id, parseInt(e.target.value) || 0)}
                        className="w-12 text-center py-1 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                      />

                      <button
                        type="button"
                        onClick={() => handleQtyChange(product.id, currentQty + 1)}
                        className="w-7 h-7 rounded-lg bg-slate-900 text-white font-bold flex items-center justify-center hover:bg-slate-800 transition-all cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <Input
          label="Catatan Tambahan (Opsional)"
          placeholder="Misal: Titip di rak depan, penagihan per minggu"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        {totalUnits > 0 && (
          <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-500 block">Total Unit Titip:</span>
              <span className="text-xs font-bold text-slate-900">{totalUnits} pcs barang</span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-500 block">Estimasi Nilai Titipan:</span>
              <span className="text-sm font-bold text-slate-900">{formatRupiah(totalValue)}</span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
          <Button
            type="button"
            variant="outline"
            className="flex-1 rounded-xl font-semibold"
            onClick={onClose}
          >
            Batal
          </Button>

          <Button
            type="button"
            variant="primary"
            className="flex-1 rounded-xl font-semibold"
            loading={consignMutation.isPending}
            disabled={consignMutation.isPending}
            onClick={handleSubmit}
          >
            {totalUnits > 0 ? 'Titipkan Sekarang' : 'Jadikan Toko Mitra'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
