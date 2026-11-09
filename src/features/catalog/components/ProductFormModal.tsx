import { useEffect, useState } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Modal } from '@/components/shared/Modal'
import { Input } from '@/components/ui/Input'
import { MoneyInput } from '@/components/ui/MoneyInput'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/toast-store'
import { PhotoPicker } from '@/components/ui/PhotoPicker'
import { KEEP_PHOTO, type PhotoDraft } from '@/components/ui/photo-draft'
import { describeApiError } from '@/lib/api-errors'
import { describePhotoError } from '@/lib/photo-errors'
import { useSetProductPhoto } from '../api'
import { productFormSchema, type ProductFormData } from '../schema'
import type { Product, ProductFormInput } from '../types'

export interface ProductFormModalProps {
  isOpen: boolean
  onClose: () => void
  /** Simpan data produk; mengembalikan produk tersimpan (dipakai untuk unggah foto). */
  onSubmit: (data: ProductFormInput) => Promise<Product | void>
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
  const photoMutation = useSetProductPhoto()
  const [photoDraft, setPhotoDraft] = useState<PhotoDraft>(KEEP_PHOTO)
  const isSaving = isLoading || photoMutation.isPending

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
      retailPrice: initialData?.retailPrice || undefined,
      shelfLifeDays: initialData?.shelfLifeDays || 30,
      isActive: initialData?.isActive ?? true,
    },
  })

  useEffect(() => {
    if (isOpen) {
      setPhotoDraft(KEEP_PHOTO)
      reset({
        name: initialData?.name || '',
        consignPrice: initialData?.consignPrice || 0,
        retailPrice: initialData?.retailPrice || undefined,
        shelfLifeDays: initialData?.shelfLifeDays || 30,
        isActive: initialData?.isActive ?? true,
      })
    }
  }, [isOpen, initialData, reset])

  const consignPrice = watch('consignPrice') || 0
  const retailPrice = watch('retailPrice')
  const isActive = watch('isActive')

  if (!isOpen) return null

  const onValidSubmit: SubmitHandler<ProductFormData> = async (data) => {
    let saved: Product | void
    try {
      saved = await onSubmit({
        name: data.name.trim(),
        consign_price: data.consignPrice,
        retail_price: data.retailPrice || data.consignPrice,
        shelf_life_days: data.shelfLifeDays,
        is_active: data.isActive,
      })
    } catch (err: unknown) {
      const friendly = describeApiError<keyof ProductFormData>(err, {
        fieldMap: { name: 'name', consign_price: 'consignPrice', retail_price: 'retailPrice', shelf_life_days: 'shelfLifeDays' },
        fieldMessages: {
          name: 'Nama produk minimal 2 dan maksimal 120 karakter.',
          consignPrice: 'Harga titip tidak boleh negatif.',
          retailPrice: 'Harga jual tidak boleh negatif.',
          shelfLifeDays: 'Masa simpan antara 1 dan 3650 hari.',
        },
      })
      for (const [field, message] of Object.entries(friendly.fieldErrors)) {
        setError(field as keyof ProductFormData, { message: message as string })
      }
      toast.show({ title: 'Produk belum tersimpan', description: friendly.message, type: 'error' })
      return
    }

    const productId = saved?.id ?? initialData?.id
    if (productId && photoDraft.kind !== 'keep') {
      try {
        await photoMutation.mutateAsync({ id: productId, file: photoDraft.kind === 'new' ? photoDraft.blob : null })
      } catch (err) {
        toast.show({
          title: 'Produk tersimpan, foto belum terunggah',
          description: `${describePhotoError(err)} Kamu bisa mengunggahnya lagi lewat tombol Ubah.`,
          type: 'error',
        })
        onClose()
        return
      }
    }

    toast.show({
      title: isEditMode ? 'Produk diperbarui' : 'Produk ditambahkan',
      description: `"${data.name.trim()}" sudah tersimpan di katalog.`,
      type: 'success',
    })
    onClose()
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
            disabled={isSaving}
            className="rounded-xl px-4 min-h-[48px]"
          >
            Batal
          </Button>
          <Button
            type="submit"
            form="product-form"
            variant="primary"
            loading={isSaving}
            disabled={isSaving}
            className="rounded-xl px-5 min-h-[48px] font-bold"
          >
            {isEditMode ? 'Simpan Perubahan' : 'Tambah Produk'}
          </Button>
        </>
      }
    >
      <form id="product-form" noValidate onSubmit={handleSubmit(onValidSubmit)} className="flex flex-col gap-4">
        <PhotoPicker
          label="Foto produk"
          savedUrl={initialData?.photoUrl ?? null}
          draft={photoDraft}
          onDraftChange={setPhotoDraft}
          placeholder="product"
          disabled={isSaving}
        />

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
          <span className="text-caption text-ink-soft">
            Uang yang Anda terima dari warung untuk setiap bungkus yang laku terjual.
          </span>
          {errors.consignPrice?.message && (
            <p className="text-caption text-danger font-semibold mt-0.5">
              {errors.consignPrice.message}
            </p>
          )}
        </div>

        {/* Harga jual ke konsumen: opsional; kosong berarti sama dengan harga titip */}
        <div className="flex flex-col gap-1">
          <MoneyInput
            label="Harga Jual ke Konsumen (Rp, opsional)"
            placeholder="15.000"
            value={retailPrice}
            onChange={(val) =>
              setValue('retailPrice', val === undefined || val === 0 ? undefined : val, { shouldValidate: true })
            }
          />
          <span className="text-caption text-ink-soft">
            Saran harga di rak toko. Kosongkan bila sama dengan harga titip.
          </span>
          {errors.retailPrice?.message && (
            <p role="alert" className="text-caption text-danger font-semibold mt-0.5">
              {errors.retailPrice.message}
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
          <span className="text-caption text-ink-soft">
            Digunakan untuk estimasi kadaluwarsa pada batch stok di warung.
          </span>
        </div>

        {/* 4. Switch Status Aktif */}
        <div className="flex items-center justify-between p-3.5 bg-surface-raised rounded-xl border border-line mt-1">
          <div className="flex flex-col">
            <span className="text-body font-bold text-ink">Status Produk Aktif</span>
            <span className="text-caption text-ink-soft">
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
