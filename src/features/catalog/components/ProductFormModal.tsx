import { useEffect } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/Input'
import { MoneyInput } from '@/components/ui/MoneyInput'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/toast-store'
import { rupiah } from '@/lib/format'
import { ApiError } from '@/lib/api-client'
import { productFormSchema, type ProductFormData } from '../schema'
import { calculateProductMargin } from '../calc'
import type { Product, ProductFormInput } from '../types'

export interface ProductFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ProductFormInput) => Promise<void>
  initialData?: Product | null
  isLoading?: boolean
}

export function ProductFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
}: ProductFormModalProps) {
  const isEditMode = Boolean(initialData)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    setError,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      consignPrice: initialData?.consignPrice || 0,
      retailPrice: initialData?.retailPrice || 0,
      shelfLifeDays: initialData?.shelfLifeDays || 30,
      isActive: initialData?.isActive ?? true,
    },
  })

  useEffect(() => {
    if (isOpen) {
      reset({
        name: initialData?.name || '',
        consignPrice: initialData?.consignPrice || 0,
        retailPrice: initialData?.retailPrice || 0,
        shelfLifeDays: initialData?.shelfLifeDays || 30,
        isActive: initialData?.isActive ?? true,
      })
    }
  }, [isOpen, initialData, reset])

  const consignPrice = watch('consignPrice') || 0
  const retailPrice = watch('retailPrice') || 0
  const isActive = watch('isActive')

  const { marginRp, marginPct } = calculateProductMargin(consignPrice, retailPrice)

  if (!isOpen) return null

  const onValidSubmit: SubmitHandler<ProductFormData> = async (data) => {
    try {
      await onSubmit({
        name: data.name.trim(),
        consign_price: data.consignPrice,
        retail_price: data.retailPrice,
        shelf_life_days: data.shelfLifeDays,
        is_active: data.isActive,
      })
      toast.show({
        title: isEditMode ? 'Produk Diperbarui' : 'Produk Ditambahkan',
        description: `Produk "${data.name.trim()}" berhasil disimpan ke katalog.`,
        type: 'success',
      })
      onClose()
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.fields) {
          for (const [key, msg] of Object.entries(err.fields)) {
            if (key === 'name') setError('name', { message: msg })
            if (key === 'consign_price') setError('consignPrice', { message: msg })
            if (key === 'retail_price') setError('retailPrice', { message: msg })
            if (key === 'shelf_life_days') setError('shelfLifeDays', { message: msg })
          }
        }
        toast.show({
          title: 'Gagal Menyimpan Produk',
          description: err.message || 'Terjadi kesalahan pada server.',
          type: 'error',
        })
      } else {
        toast.show({
          title: 'Gagal Menyimpan Produk',
          description: 'Koneksi bermasalah. Silakan periksa jaringan dan coba lagi.',
          type: 'error',
        })
      }
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-surface border border-line rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-line bg-page/50">
          <div>
            <h2 id="modal-title" className="text-lg font-bold text-ink">
              {isEditMode ? 'Ubah Data Produk' : 'Tambah Produk Baru'}
            </h2>
            <p className="text-xs text-ink-soft mt-0.5">
              {isEditMode
                ? 'Perbarui harga atau masa simpan produk konsinyasi ini.'
                : 'Daftarkan varian atau produk baru untuk dititipkan ke warung mitra.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-ink-soft hover:text-ink hover:bg-surface-raised transition-colors cursor-pointer"
            aria-label="Tutup modal"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onValidSubmit)} className="flex flex-col flex-1 overflow-y-auto">
          <div className="p-4 sm:p-5 flex flex-col gap-4">
            {/* 1. Nama Produk */}
            <Input
              label="Nama Produk"
              required
              placeholder="Contoh: Keripik Pisang Coklat 100g"
              defaultValue={initialData?.name || ''}
              error={errors.name?.message}
              {...register('name')}
            />

            {/* 2. Grid Dua Kolom: Harga Titip & Harga Eceran */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="flex flex-col gap-1">
                <MoneyInput
                  label="Harga Titip (Rp)"
                  required
                  placeholder="10.000"
                  value={consignPrice}
                  onChange={(val) => setValue('consignPrice', val || 0, { shouldValidate: true })}
                />
                <span className="text-[11px] text-ink-soft">Uang yang kamu terima per bungkus laku.</span>
                {errors.consignPrice?.message && (
                  <p className="text-xs text-danger font-semibold mt-0.5">
                    {errors.consignPrice.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <MoneyInput
                  label="Harga Eceran (Rp)"
                  required
                  placeholder="12.000"
                  value={retailPrice}
                  onChange={(val) => setValue('retailPrice', val || 0, { shouldValidate: true })}
                />
                <span className="text-[11px] text-ink-soft">Harga jual warung ke konsumen.</span>
                {errors.retailPrice?.message && (
                  <p className="text-xs text-danger font-semibold mt-0.5">
                    {errors.retailPrice.message}
                  </p>
                )}
              </div>
            </div>

            {/* Preview Margin Warung */}
            <div className="bg-primary-soft/40 border border-primary/20 rounded-xl p-3 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-primary">Margin Warung Mitra:</span>
                <span className="text-[11px] text-ink-soft">
                  Warung untung dari selisih harga eceran dan titip.
                </span>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-primary tabular-nums">
                  {rupiah(marginRp)}
                </span>
                <span className="text-xs text-primary/80 font-medium ml-1">({marginPct}%)</span>
              </div>
            </div>

            {/* 3. Masa Simpan (Shelf Life) */}
            <div className="flex flex-col gap-1">
              <Input
                label="Masa Simpan (Hari)"
                type="number"
                required
                min={1}
                max={365}
                placeholder="30"
                error={errors.shelfLifeDays?.message}
                {...register('shelfLifeDays', { valueAsNumber: true })}
              />
              <span className="text-[11px] text-ink-soft">
                Digunakan untuk estimasi kadaluwarsa pada batch stok di warung.
              </span>
            </div>

            {/* 4. Switch Status Aktif */}
            <div className="flex items-center justify-between p-3.5 bg-surface-raised rounded-xl border border-line mt-1">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-ink">Status Produk Aktif</span>
                <span className="text-xs text-ink-soft">
                  Produk aktif dapat dipilih saat mencatat kunjungan & titip baru.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={isActive}
                  onChange={(e) => setValue('isActive', e.target.checked, { shouldValidate: true })}
                />
                <div className="w-11 h-6 bg-line-strong peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-4 sm:p-5 border-t border-line bg-page/50 flex items-center justify-end gap-3 mt-auto">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="min-h-[48px] px-5"
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isLoading}
              disabled={isLoading}
              className="min-h-[48px] px-6"
            >
              {isEditMode ? 'Simpan Perubahan' : 'Tambah Produk'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
