import { rupiah } from '@/lib/format'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/Button'
import { calculateProductMargin } from '../calc'
import type { Product } from '../types'

export interface ProductCardProps {
  product: Product
  onEdit: (product: Product) => void
  onToggleStatus: (product: Product) => void
  isToggling?: boolean
}

export function ProductCard({
  product,
  onEdit,
  onToggleStatus,
  isToggling = false,
}: ProductCardProps) {
  const { marginRp, marginPct } = calculateProductMargin(product.consignPrice, product.retailPrice)

  return (
    <div
      className={`bg-surface border rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-4 transition-all shadow-xs ${
        product.isActive ? 'border-line hover:border-line-strong' : 'border-line/60 bg-surface/60 opacity-80'
      }`}
    >
      {/* Baris Atas: Avatar + Nama Produk + Status Badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-16 aspect-[4/3] rounded-xl overflow-hidden border border-line bg-slate-50 flex items-center justify-center shrink-0 text-slate-400">
            {product.photoUrl ? (
              <img src={product.photoUrl} alt={product.name} loading="lazy" className="w-full h-full object-cover" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            )}
          </div>
          <div>
            <h3 className="text-title-3 text-ink">{product.name}</h3>
            <p className="text-caption text-ink-soft mt-0.5">
              Masa simpan: <span className="font-semibold text-ink">{product.shelfLifeDays} hari</span>
            </p>
          </div>
        </div>

        <StatusBadge
          status={product.isActive ? 'Aktif' : 'Nonaktif'}
          tone={product.isActive ? 'success' : 'neutral'}
        />
      </div>

      {/* Baris Tengah: Rincian Finansial & Margin */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-page/70 rounded-xl p-3 border border-line/60">
        <div className="flex flex-col">
          <span className="text-caption text-ink-soft font-medium">Harga Titip (Modal)</span>
          <span className="text-body font-bold text-ink tabular-nums">
            {rupiah(product.consignPrice)}
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-caption text-ink-soft font-medium">Harga Eceran (Jual)</span>
          <span className="text-body font-bold text-ink tabular-nums">
            {rupiah(product.retailPrice)}
          </span>
        </div>

        <div className="col-span-2 sm:col-span-1 flex flex-col pt-1.5 sm:pt-0 border-t sm:border-t-0 border-line/60">
          <span className="text-caption text-primary font-medium">Margin Warung</span>
          <div className="flex items-baseline gap-1">
            <span className="text-body font-bold text-primary tabular-nums">
              {rupiah(marginRp)}
            </span>
            <span className="text-caption text-primary/80 font-medium">({marginPct}%)</span>
          </div>
        </div>
      </div>

      {/* Baris Bawah: Tombol Aksi */}
      <div className="flex items-center justify-end gap-2 pt-1 border-t border-line/50">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onToggleStatus(product)}
          loading={isToggling}
          disabled={isToggling}
          className="min-h-[44px] px-3.5 text-caption font-semibold"
          aria-label={product.isActive ? `Nonaktifkan ${product.name}` : `Aktifkan ${product.name}`}
        >
          {product.isActive ? 'Nonaktifkan' : 'Aktifkan'}
        </Button>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => onEdit(product)}
          className="min-h-[44px] px-4 text-caption font-bold"
          aria-label={`Ubah data ${product.name}`}
        >
          Ubah Data
        </Button>
      </div>
    </div>
  )
}
