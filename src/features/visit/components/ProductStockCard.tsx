import { Stepper } from '@/components/ui/Stepper'
import { calculateVisitItem, getDropSuggestions } from '../calc'
import type { VisitItemInput } from '../types'
import { rupiah } from '@/lib/format'

export interface ProductStockCardProps {
  item: VisitItemInput
  onChange: (updated: VisitItemInput) => void
}

export function ProductStockCard({ item, onChange }: ProductStockCardProps) {
  const calc = calculateVisitItem({
    prevStock: item.prevStock,
    remaining: item.remaining,
    returned: item.returned,
    newDrop: item.newDrop,
    unitPrice: item.consignPrice,
  })

  const dropSuggestions = getDropSuggestions(item.prevStock, item.remaining, item.returned)

  return (
    <div
      className={`@container bg-surface rounded-2xl border transition-all duration-200 overflow-hidden shadow-2xs ${
        calc.isValid ? 'border-line hover:border-line-strong' : 'border-danger/80 ring-2 ring-danger/20'
      }`}
    >
      {/* 1. Header Kartu Produk */}
      <div className="p-4 border-b border-line bg-surface flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-title-3 text-ink">{item.productName}</h3>
          </div>
          <p className="text-caption text-ink-soft mt-0.5">
            Harga titip: <span className="font-bold text-ink tabular-nums">{rupiah(item.consignPrice)}</span> / bks
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center px-3 py-1 rounded-lg bg-surface-raised border border-line text-caption font-bold text-ink tabular-nums">
            Stok kemarin: {item.prevStock} bks
          </span>
          {calc.isValid && calc.sold > 0 && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-caption font-bold tabular-nums">
              Terjual {calc.sold} bks
            </span>
          )}
        </div>
      </div>

      {/* 2. Peringatan Error Instan (Bila Sisa + Retur > Stok Kemarin) */}
      {!calc.isValid && (
        <div className="px-4 py-2.5 bg-danger/10 border-b border-danger/30 flex items-center gap-2 text-danger text-caption font-semibold animate-fadeIn">
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span>{calc.errorMessage}</span>
        </div>
      )}

      {/* 3. Grid Input (3 Kolom Sejajar di Desktop, Tumpuk Rapi di Mobile) */}
      <div className="p-4 grid grid-cols-1 @3xl:grid-cols-3 gap-4 @3xl:gap-5 divide-y @3xl:divide-y-0 @3xl:divide-x divide-line/60">
        {/* Kolom 1: Sisa di Rak */}
        <div className="flex flex-col pt-3 first:pt-0 @3xl:pt-0 @3xl:pr-4">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 @3xl:block @3xl:h-11">
            <div className="flex flex-col justify-center min-w-0 flex-1">
              <div className="flex items-center justify-between @3xl:justify-start gap-1">
                <span className="text-body font-bold text-ink">Sisa di rak</span>
                <span className="text-caption text-ink-soft hidden @3xl:inline ml-auto">Hasil hitung</span>
              </div>
              <p className="text-caption text-ink-soft mt-0.5 truncate">Barang masih ada di rak warung</p>
            </div>

            {/* Stepper di Mobile: Berdampingan di kanan */}
            <div className="@3xl:hidden shrink-0 ml-auto">
              <Stepper
                value={item.remaining}
                onChange={(val) => onChange({ ...item, remaining: val })}
                isError={!calc.isValid}
                aria-label={`Sisa di rak ${item.productName}`}
              />
            </div>
          </div>

          {/* Stepper di Desktop: Sejajar di bawah header */}
          <div className="hidden @3xl:flex mt-3 items-center justify-center">
            <Stepper
              value={item.remaining}
              onChange={(val) => onChange({ ...item, remaining: val })}
              isError={!calc.isValid}
              aria-label={`Sisa di rak ${item.productName}`}
            />
          </div>

          {/* Quick preset chips */}
          <div className="mt-2.5 @3xl:mt-3 flex flex-wrap items-center gap-1.5 @3xl:min-h-[58px] content-start">
            <button
              type="button"
              onClick={() => onChange({ ...item, remaining: 0 })}
              className={`px-2.5 py-1 rounded-lg text-caption font-semibold transition-all ${
                item.remaining === 0
                  ? 'bg-ink text-surface'
                  : 'bg-surface-raised border border-line text-ink-soft hover:text-ink'
              }`}
            >
              Habis (0)
            </button>
            {item.prevStock > 0 && (
              <button
                type="button"
                onClick={() => onChange({ ...item, remaining: item.prevStock })}
                className={`px-2.5 py-1 rounded-lg text-caption font-semibold transition-all ${
                  item.remaining === item.prevStock
                    ? 'bg-ink text-surface'
                    : 'bg-surface-raised border border-line text-ink-soft hover:text-ink'
                }`}
              >
                Utuh ({item.prevStock})
              </button>
            )}
          </div>
        </div>

        {/* Kolom 2: Retur */}
        <div className="flex flex-col pt-3 @3xl:pt-0 @3xl:px-4">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 @3xl:block @3xl:h-11">
            <div className="flex flex-col justify-center min-w-0 flex-1">
              <div className="flex items-center justify-between @3xl:justify-start gap-1">
                <span className="text-body font-bold text-ink">Retur</span>
                <span className="text-caption text-ink-soft hidden @3xl:inline ml-auto">Ditarik</span>
              </div>
              <p className="text-caption text-ink-soft mt-0.5 truncate">Barang rusak / mendekati basi</p>
            </div>

            {/* Stepper di Mobile: Berdampingan di kanan */}
            <div className="@3xl:hidden shrink-0 ml-auto">
              <Stepper
                value={item.returned}
                onChange={(val) => onChange({ ...item, returned: val })}
                isError={!calc.isValid}
                aria-label={`Retur ${item.productName}`}
              />
            </div>
          </div>

          {/* Stepper di Desktop: Sejajar di bawah header */}
          <div className="hidden @3xl:flex mt-3 items-center justify-center">
            <Stepper
              value={item.returned}
              onChange={(val) => onChange({ ...item, returned: val })}
              isError={!calc.isValid}
              aria-label={`Retur ${item.productName}`}
            />
          </div>

          <div className="mt-2.5 @3xl:mt-3 flex flex-wrap items-center gap-1.5 @3xl:min-h-[58px] content-start">
            <button
              type="button"
              onClick={() => onChange({ ...item, returned: 0 })}
              className={`px-2.5 py-1 rounded-lg text-caption font-semibold transition-all ${
                item.returned === 0
                  ? 'bg-ink text-surface'
                  : 'bg-surface-raised border border-line text-ink-soft hover:text-ink'
              }`}
            >
              Tidak ada (0)
            </button>
          </div>
        </div>

        {/* Kolom 3: Titip Baru */}
        <div className="flex flex-col pt-3 @3xl:pt-0 @3xl:pl-4">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 @3xl:block @3xl:h-11">
            <div className="flex flex-col justify-center min-w-0 flex-1">
              <div className="flex items-center justify-between @3xl:justify-start gap-1">
                <span className="text-body font-bold text-ink">Titip baru</span>
                <span className="text-caption text-ink-soft hidden @3xl:inline ml-auto">Stok tambahan</span>
              </div>
              <p className="text-caption text-ink-soft mt-0.5 truncate">Barang segar ditambahkan hari ini</p>
            </div>

            {/* Stepper di Mobile: Berdampingan di kanan */}
            <div className="@3xl:hidden shrink-0 ml-auto">
              <Stepper
                value={item.newDrop}
                onChange={(val) => onChange({ ...item, newDrop: val })}
                aria-label={`Titip baru ${item.productName}`}
              />
            </div>
          </div>

          {/* Stepper di Desktop: Sejajar di bawah header */}
          <div className="hidden @3xl:flex mt-3 items-center justify-center">
            <Stepper
              value={item.newDrop}
              onChange={(val) => onChange({ ...item, newDrop: val })}
              aria-label={`Titip baru ${item.productName}`}
            />
          </div>

          {/* Chips Saran Titip Baru */}
          <div className="mt-2.5 @3xl:mt-3 flex flex-wrap items-center gap-1.5 @3xl:min-h-[58px] content-start">
            <button
              type="button"
              onClick={() => onChange({ ...item, newDrop: 0 })}
              className={`px-2 py-0.5 rounded-lg text-caption font-semibold transition-all active:scale-95 ${
                item.newDrop === 0
                  ? 'bg-ink text-surface'
                  : 'bg-surface-raised border border-line text-ink-soft hover:text-ink'
              }`}
            >
              0
            </button>
            {dropSuggestions.map((sug, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onChange({ ...item, newDrop: sug.amount })}
                className={`px-2 py-0.5 rounded-lg text-caption font-semibold transition-all active:scale-95 ${
                  item.newDrop === sug.amount
                    ? 'bg-primary text-white shadow-2xs'
                    : 'bg-surface-raised border border-line text-ink hover:border-primary/50'
                }`}
              >
                {sug.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Footer Pratinjau Perhitungan Instan */}
      <div className="px-4 py-3 bg-surface-raised/40 border-t border-line flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-caption">
        <div className="flex items-center gap-3 text-ink-soft">
          <span>
            Terjual: <strong className="text-ink tabular-nums">{calc.sold} bks</strong>
          </span>
          <span>·</span>
          <span>
            Stok jadi: <strong className="text-ink tabular-nums">{calc.stockAfter} bks</strong>
          </span>
        </div>

        <div className="text-right">
          <span className="text-ink-soft mr-1.5">Subtotal:</span>
          <span className="font-bold text-ink tabular-nums text-body">
            {rupiah(calc.subtotal)}
          </span>
        </div>
      </div>
    </div>
  )
}
