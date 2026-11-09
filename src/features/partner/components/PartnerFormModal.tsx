import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Modal } from '@/components/shared/Modal'
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Ubah Data Warung Mitra' : 'Tambah Warung Mitra Baru'}
      description={
        isEditMode
          ? 'Perbarui rincian kontak atau alamat warung'
          : 'Daftarkan warung baru untuk penitipan konsinyasi'
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
            form="partner-form"
            variant="primary"
            loading={isLoading}
            disabled={isLoading}
            className="rounded-xl px-5 min-h-[48px] font-bold"
          >
            {isEditMode ? 'Simpan Perubahan' : 'Tambah Warung'}
          </Button>
        </>
      }
    >
      <form id="partner-form" onSubmit={handleSubmit(onValidSubmit)} className="flex flex-col gap-4">
        <Input
          label="Nama Warung"
          placeholder="Contoh: Warung Bu Sri"
          {...register('name')}
          error={errors.name?.message}
          required
        />

        <Input
          label="Nama Pemilik / Penjaga"
          placeholder="Contoh: Bu Sri Mulyani"
          {...register('ownerName')}
          error={errors.ownerName?.message}
          required
        />

        <Input
          label="Nomor WhatsApp"
          placeholder="Contoh: 081234567890"
          {...register('whatsapp')}
          error={errors.whatsapp?.message}
          required
        />

        <Input
          label="Alamat / Daerah"
          placeholder="Contoh: Jl. Merdeka No. 12, Pasar Anyar"
          {...register('address')}
          error={errors.address?.message}
          required
        />

        <div className="flex items-center justify-between p-3.5 bg-surface-raised rounded-xl border border-line mt-1">
          <div>
            <p className="text-caption font-bold text-ink">Status Warung Aktif</p>
            <p className="text-caption text-ink-soft">
              Warung aktif dapat dipilih saat mencatat kunjungan baru
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={isActive}
              onChange={(e) => setValue('isActive', e.target.checked)}
            />
            <div className="w-11 h-6 bg-line-strong peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>
      </form>
    </Modal>
  )
}
