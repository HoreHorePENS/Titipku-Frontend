import { useEffect } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Modal } from '@/components/shared/Modal'
import { Input } from '@/components/ui/Input'
import { MoneyInput } from '@/components/ui/MoneyInput'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/toast-store'
import { ApiError } from '@/lib/api-client'
import { productFormSchema, type ProductFormData } from '../schema'
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
  const isActive = watch('isActive')

  if (!isOpen) return null

  const onValidSubmit: SubmitHandler<ProductFormData> = async (data) => {
    try {
      await onSubmit({
        name: data.name.trim(),
        consign_price: data.consignPrice,
        retail_price: data.retailPrice || data.consignPrice,
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Ubah Data Produk' : 'Tambah Produk Baru'}
      description={
        isEditMode
          ? 'Perbarui harga atau masa simpan produk konsinyasi ini.'
          : 'Daftarkan varian atau produk baru untuk dititipkan ke warung mitra.'
      }
      maxWidth="lg"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-xl px-4 min-h-[48px]"
          >
            Batal
          </Button>
          <Button
            type="submit"
            form="product-form"
            variant="primary"
            loading={isLoading}
            disabled={isLoading}
            className="rounded-xl px-5 min-h-[48px] font-bold"
          >
            {isEditMode ? 'Simpan Perubahan' : 'Tambah Produk'}
          </Button>
        </>
      }
    >
      <form id="product-form" onSubmit={handleSubmit(onValidSubmit)} className="flex flex-col gap-4">
        {/* 1. Nama Produk */}
        <Input
          label="Nama Produk"
          required
          placeholder="Contoh: Keripik Pisang Coklat 100g"
          defaultValue={initialData?.name || ''}
          error={errors.name?.message}
          {...register('name')}
        />

        {/* 2. Harga Titip (Modal yang Diterima Penitip) */}
        <div className="flex flex-col gap-1">
          <MoneyInput
            label="Harga Titip / Modal Konsinyasi (Rp)"
            required
            placeholder="10.000"
            value={consignPrice}
            onChange={(val) => setValue('consignPrice', val || 0, { shouldValidate: true })}
          />
          <span className="text-[11px] text-ink-soft">
            Uang yang Anda terima dari warung untuk setiap bungkus yang laku terjual.
          </span>
          {errors.consignPrice?.message && (
            <p className="text-xs text-danger font-semibold mt-0.5">
              {errors.consignPrice.message}
            </p>
          )}
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
              Produk aktif dapat dipilih saat menitipkan barang ke warung mitra.
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
      </form>
    </Modal>
  )
}
