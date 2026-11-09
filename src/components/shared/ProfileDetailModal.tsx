import { useState, useEffect, useRef } from 'react'
import { Modal } from '@/components/shared/Modal'
import { Button } from '@/components/ui/Button'
import { useNavigate } from 'react-router-dom'
import type { CurrentAccount } from '@/features/auth'

interface ProfileDetailModalProps {
  isOpen: boolean
  onClose: () => void
  currentAccount?: CurrentAccount
  onLogout: () => void
}

interface SavedCustomProfile {
  fullName?: string
  businessName?: string
  whatsapp?: string
  address?: string
  photoUrl?: string
}

export function ProfileDetailModal({
  isOpen,
  onClose,
  currentAccount,
  onLogout,
}: ProfileDetailModalProps) {
  const navigate = useNavigate()
  const user = currentAccount?.user
  const isPemilikToko = user?.account_type === 'pemilik_toko'

  const [isEditing, setIsEditing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Local state for editing & display
  const [fullName, setFullName] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [address, setAddress] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Initialize data on mount or open
  useEffect(() => {
    if (!isOpen) {
      setIsEditing(false)
      return
    }

    let saved: SavedCustomProfile = {}
    try {
      const raw = localStorage.getItem('titipku_custom_profile')
      if (raw) saved = JSON.parse(raw)
    } catch {
      // ignore
    }

    const defaultOwnerName = user?.full_name || 'Pengguna Titipku'
    const defaultBusinessName = isPemilikToko
      ? currentAccount?.store?.name || 'Toko Saya'
      : currentAccount?.business?.name || 'Usaha Penitip'
    const defaultWhatsapp = isPemilikToko
      ? currentAccount?.store?.whatsapp || ''
      : currentAccount?.business?.whatsapp || ''
    const defaultAddress = isPemilikToko
      ? currentAccount?.store?.address || ''
      : currentAccount?.business?.address || ''

    setFullName(saved.fullName ?? defaultOwnerName)
    setBusinessName(saved.businessName ?? defaultBusinessName)
    setWhatsapp(saved.whatsapp ?? defaultWhatsapp)
    setAddress(saved.address ?? defaultAddress)
    setPhotoUrl(saved.photoUrl ?? '')
    setSaveSuccess(false)
  }, [isOpen, user, isPemilikToko, currentAccount])

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setPhotoUrl(reader.result)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleRemovePhoto = () => {
    setPhotoUrl('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    const payload: SavedCustomProfile = {
      fullName: fullName.trim(),
      businessName: businessName.trim(),
      whatsapp: whatsapp.trim(),
      address: address.trim(),
      photoUrl,
    }

    localStorage.setItem('titipku_custom_profile', JSON.stringify(payload))
    window.dispatchEvent(new CustomEvent('titipku_profile_updated'))

    setSaveSuccess(true)
    setTimeout(() => {
      setIsEditing(false)
      setSaveSuccess(false)
    }, 400)
  }

  const handleNavigate = (path: string) => {
    onClose()
    navigate(path)
  }

  const initials = (fullName || 'Pengguna')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

  if (!isOpen) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Ubah Profil Akun' : 'Profil Akun Pengguna'}
      className="max-w-md"
    >
      <div className="flex flex-col gap-5 font-sans text-slate-900">
        {isEditing ? (
          /* FORM EDIT PROFIL */
          <form onSubmit={handleSave} className="flex flex-col gap-4 text-xs">
            {/* Upload Foto Profil */}
            <div className="flex flex-col gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-semibold text-slate-700">Foto Profil Akun</span>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-200 border border-slate-300 flex items-center justify-center overflow-hidden shrink-0">
                  {photoUrl ? (
                    <img src={photoUrl} alt="Preview Foto" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-base font-bold text-slate-500">{initials}</span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="profile-photo-upload"
                  />
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="profile-photo-upload"
                      className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-[11px] font-semibold cursor-pointer transition-colors shadow-2xs"
                    >
                      Pilih Foto Baru
                    </label>
                    {photoUrl && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 text-[11px] font-semibold transition-colors cursor-pointer"
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400">Format JPG / PNG, maks 2MB</span>
                </div>
              </div>
            </div>

            {/* Nama Lengkap */}
            <div className="flex flex-col gap-1">
              <label htmlFor="owner-full-name" className="font-semibold text-slate-700">
                Nama Lengkap / Pemilik <span className="text-rose-500">*</span>
              </label>
              <input
                id="owner-full-name"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="cth. Bu Siti Aminah"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            {/* Nama Usaha */}
            <div className="flex flex-col gap-1">
              <label htmlFor="entity-title-name" className="font-semibold text-slate-700">
                {isPemilikToko ? 'Nama Toko / Warung' : 'Nama Usaha / Merek Produk'}{' '}
                <span className="text-rose-500">*</span>
              </label>
              <input
                id="entity-title-name"
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder={isPemilikToko ? 'cth. Toko Berkah Mandiri' : 'cth. Keripik Tempe Bu Siti'}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            {/* Nomor WhatsApp */}
            <div className="flex flex-col gap-1">
              <label htmlFor="user-whatsapp" className="font-semibold text-slate-700">
                Nomor WhatsApp <span className="text-rose-500">*</span>
              </label>
              <input
                id="user-whatsapp"
                type="tel"
                required
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="cth. 08123456789"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            {/* Alamat */}
            <div className="flex flex-col gap-1">
              <label htmlFor="user-address" className="font-semibold text-slate-700">
                Alamat {isPemilikToko ? 'Toko' : 'Produksi / Rumah'}
              </label>
              <textarea
                id="user-address"
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="cth. Jl. Rungkut Asri Timur No. 12, Surabaya"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
              />
            </div>

            {saveSuccess && (
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] font-semibold text-center border border-emerald-200">
                Perubahan profil berhasil disimpan!
              </div>
            )}

            {/* Tombol Simpan & Batal */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setIsEditing(false)}
                className="flex-1 text-xs font-semibold rounded-xl min-h-[44px]"
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="flex-1 text-xs font-semibold rounded-xl min-h-[44px]"
              >
                Simpan Perubahan
              </Button>
            </div>
          </form>
        ) : (
          /* READ-ONLY VIEW */
          <>
            {/* Header Profil & Avatar */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-2xs overflow-hidden">
                {photoUrl ? (
                  <img src={photoUrl} alt="Foto Profil" className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900 text-white">
                    {isPemilikToko ? 'Pemilik Toko Mitra' : 'Produsen Penitip'}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 truncate mt-1">{fullName}</h3>
                <p className="text-xs text-slate-500 truncate">{businessName}</p>
              </div>
            </div>

            {/* Informasi Rincian Akun */}
            <div className="flex flex-col gap-2.5 text-xs">
              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                <span className="text-slate-500 font-medium">Email Terdaftar:</span>
                <span className="font-semibold text-slate-900 font-mono text-[11px]">{user?.email || '-'}</span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                <span className="text-slate-500 font-medium">Nomor WhatsApp:</span>
                <span className="font-semibold text-slate-900">{whatsapp || '-'}</span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 flex flex-col gap-1">
                <span className="text-slate-500 font-medium">Alamat Terdaftar:</span>
                <span className="font-semibold text-slate-900 leading-relaxed">
                  {address || 'Belum diatur'}
                </span>
              </div>
            </div>

            {/* Tombol Aksi Navigasi Cepat, Ubah Profil & Logout */}
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="primary"
                size="md"
                onClick={() => setIsEditing(true)}
                className="w-full text-xs font-semibold rounded-xl min-h-[44px] flex items-center justify-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                <span>Ubah Data Profil</span>
              </Button>

              {isPemilikToko ? (
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => handleNavigate('/toko-saya')}
                  className="w-full text-xs font-semibold rounded-xl min-h-[44px]"
                >
                  Kelola Profil &amp; Toko Saya →
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => handleNavigate('/produk')}
                  className="w-full text-xs font-semibold rounded-xl min-h-[44px]"
                >
                  Kelola Katalog Produk Saya →
                </Button>
              )}

              <button
                type="button"
                onClick={onLogout}
                className="w-full py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-colors flex items-center justify-center gap-2 min-h-[44px] cursor-pointer"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>Keluar dari Akun (Logout)</span>
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
