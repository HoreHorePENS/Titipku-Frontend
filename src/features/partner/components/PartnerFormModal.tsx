import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/toast-store'
import { ApiError } from '@/lib/api-client'
import { partnerFormSchema, type PartnerFormData } from '../schema'
import type { Partner, PartnerFormInput } from '../types'

export interface PartnerFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: PartnerFormInput) => Promise<void>
  initialData?: Partner | null
  isLoading?: boolean
}

export function PartnerFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
}: PartnerFormModalProps) {
  const isEditMode = Boolean(initialData)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    setError,
    formState: { errors },
  } = useForm<PartnerFormData>({
    resolver: zodResolver(partnerFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      ownerName: initialData?.ownerName || '',
      whatsapp: initialData?.whatsapp || '',
      address: initialData?.address || '',
      isActive: initialData?.isActive ?? true,
    },
  })

  useEffect(() => {
    if (isOpen) {
      reset({
        name: initialData?.name || '',
        ownerName: initialData?.ownerName || '',
        whatsapp: initialData?.whatsapp || '',
        address: initialData?.address || '',
        isActive: initialData?.isActive ?? true,
      })
    }
  }, [isOpen, initialData, reset])

  const isActive = watch('isActive')

  if (!isOpen) return null

  const onValidSubmit = async (data: PartnerFormData) => {
    try {
      await onSubmit({
        name: data.name.trim(),
        owner_name: data.ownerName.trim(),
        whatsapp: data.whatsapp.trim(),
        address: data.address.trim(),
        is_active: data.isActive,
      })
      toast.show({
        title: isEditMode ? 'Warung Diperbarui' : 'Warung Ditambahkan',
        description: `Data warung ${data.name.trim()} berhasil disimpan.`,
        type: 'success',
      })
      onClose()
    } catch (err: unknown) {
      let desc = 'Terjadi kendala saat menyimpan data warung. Silakan coba kembali.'
      if (err instanceof ApiError) {
        if (err.status === 409 || err.code === 'WHATSAPP_TAKEN') {
          desc = 'Nomor WhatsApp ini sudah terdaftar untuk warung lain. Gunakan nomor berbeda.'
          setError('whatsapp', { type: 'manual', message: 'Nomor WhatsApp sudah digunakan' })
        } else if (err.code === 'VALIDATION_ERROR') {
          desc = 'Periksa kembali kelengkapan formulir warung.'
        } else if (err.message) {
          desc = err.message
        }
      } else if (
        err instanceof TypeError ||
        (err instanceof Error &&
          (err.message.includes('fetch') ||
            err.message.includes('network') ||
            err.message.includes('Failed to fetch')))
      ) {
        desc = 'Koneksi internet terputus. Periksa jaringan Anda dan coba lagi.'
      }
      toast.show({
        title: 'Gagal Menyimpan Warung',
        description: desc,
        type: 'error',
      })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs animate-fadeIn font-sans">
      <div
        className="relative w-full max-w-lg bg-surface rounded-2xl border border-line shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="partner-form-title"
      >
        {/* Header Modal */}
        <div className="p-5 border-b border-line flex items-center justify-between bg-surface">
          <div>
            <h2 id="partner-form-title" className="text-lg font-extrabold text-ink">
              {isEditMode ? 'Ubah Data Warung Mitra' : 'Tambah Warung Mitra Baru'}
            </h2>
            <p className="text-xs text-ink-soft mt-0.5">
              {isEditMode
                ? 'Perbarui rincian kontak atau alamat warung'
                : 'Daftarkan warung baru untuk penitipan konsinyasi'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-soft hover:bg-surface-raised hover:text-ink transition-colors"
            aria-label="Tutup"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onValidSubmit)} className="p-5 overflow-y-auto flex flex-col gap-4">
          <Input
            label="Nama Warung"
            placeholder="Contoh: Warung Bu Sri"
            {...register('name')}
            error={errors.name?.message}
            required
          />

          <Input
            label="Nama Pemilik / Penjaga"
            placeholder="Contoh: Bu Sri"
            {...register('ownerName')}
            error={errors.ownerName?.message}
            required
          />

          <Input
            label="Nomor WhatsApp"
            placeholder="Contoh: 081330124471"
            {...register('whatsapp')}
            error={errors.whatsapp?.message}
            hint="Digunakan untuk pengiriman Nota Digital via WhatsApp"
            type="tel"
            required
          />

          <Input
            label="Alamat Lengkap & Daerah"
            placeholder="Contoh: Jl. Rungkut Asri Tengah No. 14, Rungkut, Surabaya"
            {...register('address')}
            error={errors.address?.message}
            required
          />

          {isEditMode && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-surface-raised border border-line">
              <div>
                <span className="text-xs font-bold text-ink block">Status Kemitraan</span>
                <span className="text-[11px] text-ink-soft">
                  {isActive ? 'Warung aktif menerima titipan' : 'Warung sedang dinonaktifkan'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setValue('isActive', !isActive, { shouldValidate: true })}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                  isActive ? 'bg-primary' : 'bg-ink-disabled'
                }`}
                role="switch"
                aria-checked={isActive}
              >
                <span
                  className={`w-5 h-5 rounded-full bg-white block transition-transform shadow-2xs ${
                    isActive ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-3 border-t border-line mt-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 rounded-xl h-11 text-xs font-bold"
            >
              Batal
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isLoading}
              className="flex-1 rounded-xl h-11 text-xs font-bold shadow-xs"
            >
              {isLoading ? 'Menyimpan…' : isEditMode ? 'Simpan Perubahan' : 'Tambah Warung'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
