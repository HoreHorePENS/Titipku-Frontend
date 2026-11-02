import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
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
  const [name, setName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [address, setAddress] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (initialData) {
      setName(initialData.name)
      setOwnerName(initialData.ownerName || '')
      setWhatsapp(initialData.whatsapp || '')
      setAddress(initialData.address || '')
      setIsActive(initialData.isActive)
    } else {
      setName('')
      setOwnerName('')
      setWhatsapp('')
      setAddress('')
      setIsActive(true)
    }
    setErrors({})
  }, [initialData, isOpen])

  if (!isOpen) return null

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!name.trim()) errs.name = 'Nama warung wajib diisi'
    if (!ownerName.trim()) errs.ownerName = 'Nama pemilik/penjaga wajib diisi'
    if (!whatsapp.trim()) {
      errs.whatsapp = 'Nomor WhatsApp wajib diisi'
    } else if (whatsapp.replace(/\D/g, '').length < 9) {
      errs.whatsapp = 'Nomor WhatsApp minimal 9 digit angka'
    }
    if (!address.trim()) errs.address = 'Alamat/daerah warung wajib diisi'

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    try {
      await onSubmit({
        name: name.trim(),
        owner_name: ownerName.trim(),
        whatsapp: whatsapp.trim(),
        address: address.trim(),
        is_active: isActive,
      })
      onClose()
    } catch (err) {
      console.error('Gagal menyimpan warung:', err)
    }
  }

  const isEditMode = Boolean(initialData)

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
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex flex-col gap-4">
          <Input
            label="Nama Warung"
            placeholder="Contoh: Warung Bu Sri"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
            required
          />

          <Input
            label="Nama Pemilik / Penjaga"
            placeholder="Contoh: Bu Sri"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            error={errors.ownerName}
            required
          />

          <Input
            label="Nomor WhatsApp"
            placeholder="Contoh: 081330124471"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            error={errors.whatsapp}
            hint="Digunakan untuk pengiriman Nota Digital via WhatsApp"
            type="tel"
            required
          />

          <Input
            label="Alamat Lengkap & Daerah"
            placeholder="Contoh: Jl. Rungkut Asri Tengah No. 14, Rungkut, Surabaya"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            error={errors.address}
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
                onClick={() => setIsActive(!isActive)}
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
