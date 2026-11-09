import { useState, useEffect } from 'react'
import { PageContainer } from '@/components/shared'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { toast } from '@/components/ui/toast-store'
import {
  useMyStore,
  useUpdateMyStore,
  useSetMyStoreActive,
  getCategoryMeta,
  STORE_CATEGORIES_META,
  LocationPickerMap,
  StoreLocationPreviewMap,
  ConsignmentRequestCard,
  ConsignmentRequestDetailModal,
  useConsignmentRequests,
  type StoreCategory,
  type ConsignmentRequest,
} from '@/features/stores'

export default function MyStoreRoute() {
  const { data: store, isLoading, isError, refetch } = useMyStore()
  const updateMutation = useUpdateMyStore()
  const setActiveMutation = useSetMyStoreActive()

  // State Tab Halaman: 'profile' (Profil & Lokasi) atau 'requests' (Daftar Permintaan Titip)
  const [activeTab, setActiveTab] = useState<'profile' | 'requests'>('profile')

  // Hook Permintaan Titip Barang
  const { requests, pendingCount, updateRequestStatus } = useConsignmentRequests()
  const [selectedRequest, setSelectedRequest] = useState<ConsignmentRequest | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  const handleQuickApprove = (req: ConsignmentRequest) => {
    updateRequestStatus(req.id, 'accepted')
    toast.show({
      title: 'Permintaan Titipan Disetujui',
      description: `Permintaan titipan dari ${req.producerBusinessName} berhasil disetujui.`,
      type: 'success',
    })
  }

  const handleQuickReject = (req: ConsignmentRequest) => {
    updateRequestStatus(req.id, 'rejected')
    toast.show({
      title: 'Permintaan Ditolak',
      description: `Permintaan dari ${req.producerBusinessName} telah ditolak.`,
      type: 'info',
    })
  }

  // State Form Edit Profil
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState('')
  const [category, setCategory] = useState<StoreCategory>('warung')
  const [description, setDescription] = useState('')
  const [acceptedProductsNote, setAcceptedProductsNote] = useState('')
  const [address, setAddress] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [lat, setLat] = useState(-7.2575)
  const [lng, setLng] = useState(112.7521)

  useEffect(() => {
    if (store) {
      const savedNote = localStorage.getItem(`titipku_store_accepted_products_${store.id}`)
      const savedPhoto = localStorage.getItem(`titipku_store_photo_${store.id}`)

      setName(store.name)
      setCategory(store.category)
      setDescription(store.description || '')
      setAcceptedProductsNote(savedNote || 'Menerima aneka jajanan pasar, aneka keripik kemasan, dan produk makanan ringan tahan minimal 3 hari.')
      setAddress(store.address)
      setWhatsapp(store.whatsapp)
      setPhotoUrl(savedPhoto || store.photoUrl || '')
      setLat(store.latitude)
      setLng(store.longitude)
    }
  }, [store])

  const handleToggleActive = async () => {
    if (!store) return
    try {
      await setActiveMutation.mutateAsync(!store.isActive)
      toast.show({
        title: store.isActive ? 'Toko Dinonaktifkan' : 'Toko Diaktifkan',
        description: store.isActive
          ? 'Toko Anda disembunyikan sementara dari peta titip jual.'
          : 'Toko Anda kini terlihat kembali di peta bagi para produsen penitip.',
        type: 'success',
      })
    } catch (err: unknown) {
      toast.show({
        title: 'Gagal Mengubah Status',
        description: err instanceof Error ? err.message : 'Terjadi kendala teknis.',
        type: 'error',
      })
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !address.trim() || !whatsapp.trim()) {
      toast.show({
        title: 'Form Belum Lengkap',
        description: 'Nama toko, alamat, dan nomor WhatsApp wajib diisi.',
        type: 'error',
      })
      return
    }

    try {
      if (store?.id) {
        localStorage.setItem(`titipku_store_accepted_products_${store.id}`, acceptedProductsNote)
        localStorage.setItem(`titipku_store_photo_${store.id}`, photoUrl)
      }

      await updateMutation.mutateAsync({
        name: name.trim(),
        category,
        description: description.trim() || undefined,
        address: address.trim(),
        whatsapp: whatsapp.trim(),
        photo_url: photoUrl.trim() || undefined,
        latitude: lat,
        longitude: lng,
      })

      toast.show({
        title: 'Profil Toko Disimpan',
        description: 'Informasi dan titik lokasi toko Anda berhasil diperbarui.',
        type: 'success',
      })
      setIsEditing(false)
    } catch (err: unknown) {
      toast.show({
        title: 'Gagal Menyimpan',
        description: err instanceof Error ? err.message : 'Terjadi kesalahan.',
        type: 'error',
      })
    }
  }

  const handleOpenRequestDetail = (req: ConsignmentRequest) => {
    setSelectedRequest(req)
    setIsDetailModalOpen(true)
  }

  if (isLoading) {
    return (
      <PageContainer>
        <div className="py-6 flex flex-col gap-4">
          <Skeleton className="h-10 w-48 rounded-xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </PageContainer>
    )
  }

  if (isError || !store) {
    return (
      <PageContainer>
        <div className="py-12 text-center flex flex-col items-center gap-3">
          <h2 className="text-base font-bold text-slate-900">Data Toko Belum Ditemukan</h2>
          <p className="text-xs text-slate-500 max-w-sm">
            Akun Anda terdaftar sebagai pemilik toko namun data toko belum lengkap.
          </p>
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            Muat Ulang
          </Button>
        </div>
      </PageContainer>
    )
  }

  const meta = getCategoryMeta(store.category)

  return (
    <PageContainer maxWidth="full" className="px-4 md:px-8">
      <div className="flex flex-col gap-6 py-4 w-full font-sans">
        {/* Header Toko Saya Minimalis */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold mb-1 border border-slate-200">
              <span>Manajemen Toko Mitra</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Toko Saya</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Kelola profil gerai, titik peta lokasi, dan permohonan titip barang dari produsen.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={store.isActive ? 'outline' : 'primary'}
              size="sm"
              onClick={handleToggleActive}
              loading={setActiveMutation.isPending}
              className="text-xs font-semibold rounded-xl min-h-[44px]"
            >
              {store.isActive ? 'Sembunyikan dari Peta' : 'Tampilkan di Peta'}
            </Button>

            {activeTab === 'profile' && !isEditing && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="text-xs font-semibold rounded-xl min-h-[44px]"
              >
                Edit Profil
              </Button>
            )}
          </div>
        </div>

        {/* Tab Switcher: Profil & Lokasi vs Permintaan Titip */}
        <div
          className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl border border-slate-200"
          role="tablist"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'profile'}
            onClick={() => {
              setActiveTab('profile')
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 min-h-[44px] ${
              activeTab === 'profile'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-500 hover:text-slate-900'
            }`}
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
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            <span>Profil &amp; Lokasi Toko</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'requests'}
            onClick={() => {
              setActiveTab('requests')
              setIsEditing(false)
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 min-h-[44px] ${
              activeTab === 'requests'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-500 hover:text-slate-900'
            }`}
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
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <polyline points="16 11 18 13 22 9"></polyline>
            </svg>
            <span>Daftar Penitip &amp; Titipan</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-slate-900 text-white text-[10px] font-bold">
                {pendingCount}
              </span>
            )}
          </button>
        </div>

        {/* ------------------------------------------------------------------
            KONTEN TAB 1: PROFIL & LOKASI TOKO
            ------------------------------------------------------------------ */}
        {activeTab === 'profile' && (
          <div className="flex flex-col gap-5">
            {!isEditing ? (
              <>
                {/* Card Data Profil Toko */}
                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3.5">
                      {store.photoUrl ? (
                        <div className="w-14 h-14 rounded-xl overflow-hidden border border-slate-200 shrink-0 shadow-2xs">
                          <img
                            src={store.photoUrl}
                            alt={store.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 shrink-0">
                          <svg
                            className="w-6 h-6"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d={meta.svgPath}></path>
                          </svg>
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                            {meta.label}
                          </span>
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${
                              store.isActive
                                ? 'bg-slate-900 text-white border-slate-900'
                                : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}
                          >
                            {store.isActive ? 'Aktif di Peta' : 'Disembunyikan'}
                          </span>
                        </div>
                        <h2 className="text-lg font-bold text-slate-900 mt-1">{store.name}</h2>
                        <p className="text-xs text-slate-500 mt-0.5">{store.address}</p>
                      </div>
                    </div>
                  </div>

                  {/* Catatan Produk yang Dapat Dititipkan */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex flex-col gap-1">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="text-emerald-700 font-bold">*</span>
                      Catatan Produk yang Dapat Dititipkan:
                    </span>
                    <p className="text-slate-700 leading-relaxed pl-3.5">
                      {acceptedProductsNote || store.description || 'Menerima aneka jajanan pasar, aneka keripik kemasan, dan produk makanan ringan tahan minimal 3 hari.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-500 block font-medium">Nomor WhatsApp:</span>
                      <span className="font-semibold text-slate-900">{store.whatsapp}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block font-medium">Titik Koordinat:</span>
                      <span className="font-semibold text-slate-900">
                        {store.latitude.toFixed(6)}, {store.longitude.toFixed(6)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Peta Lokasi Toko Fisik (Read-Only / Pin Statis) */}
                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <svg
                          className="w-4 h-4 text-slate-700"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                          <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        <span>Peta Posisi Toko</span>
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Titik lokasi toko Anda sebagaimana terlihat oleh produsen penitip barang.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="text-xs text-slate-900 font-semibold hover:underline cursor-pointer"
                    >
                      Ubah Titik Lokasi
                    </button>
                  </div>

                  {/* Komponen Peta Read-Only (Pin Statis tidak bisa digeser) Full Width */}
                  <StoreLocationPreviewMap
                    latitude={store.latitude}
                    longitude={store.longitude}
                    storeName={store.name}
                    category={store.category}
                    address={store.address}
                    height="h-[360px] sm:h-[440px] md:h-[520px]"
                    className="w-full"
                  />
                </div>
              </>
            ) : (
              /* Form Edit Data Toko & LocationPickerMap */
              <form
                onSubmit={handleSave}
                className="p-5 bg-white rounded-2xl border border-slate-300 shadow-xs flex flex-col gap-4"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Perbarui Data &amp; Lokasi Toko</h3>
                    <p className="text-xs text-slate-500">
                      Ubah detail gerai dan sesuaikan pin lokasi toko di peta.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="text-xs text-slate-500 hover:text-slate-900 font-semibold cursor-pointer min-h-[44px] flex items-center"
                  >
                    Batal
                  </button>
                </div>

                <Input
                  label="Nama Toko"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700">Kategori Toko</label>
                  <select
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-slate-900"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as StoreCategory)}
                  >
                    {Object.values(STORE_CATEGORIES_META).map((cat) => (
                      <option key={cat.key} value={cat.key}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <Input
                  label="Deskripsi Singkat Toko"
                  placeholder="Contoh: Menerima jajanan pasar, aneka keripik, dan minuman botol."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />

                <Input
                  label="Alamat Toko Lengkap"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />

                <Input
                  label="Nomor WhatsApp"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  required
                />

                {/* Upload Foto Profil Toko (Bukan URL) */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-slate-700">Foto Profil Toko</label>
                  <div className="flex items-center gap-4">
                    {photoUrl ? (
                      <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shrink-0 shadow-2xs">
                        <img src={photoUrl} alt="Preview Foto Toko" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-xl border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                          <circle cx="8.5" cy="8.5" r="1.5"></circle>
                          <polyline points="21 15 16 10 5 21"></polyline>
                        </svg>
                      </div>
                    )}
                    <div className="flex flex-col gap-1.5">
                      <label className="cursor-pointer inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-2xs min-h-[40px]">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="17 8 12 3 7 8"></polyline>
                          <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                        <span>Pilih &amp; Upload Foto Toko</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              const reader = new FileReader()
                              reader.onloadend = () => {
                                setPhotoUrl(reader.result as string)
                              }
                              reader.readAsDataURL(file)
                            }
                          }}
                        />
                      </label>
                      {photoUrl && (
                        <button
                          type="button"
                          onClick={() => setPhotoUrl('')}
                          className="text-[11px] text-rose-600 hover:underline self-start font-medium"
                        >
                          Hapus Foto
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Catatan Produk yang Dapat Dititipkan */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <span className="text-emerald-700 font-bold">*</span>
                    Catatan Produk yang Dapat Dititipkan
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Contoh: Menerima produk jajanan pasar basah tahan 2-3 hari, aneka keripik kemasan kedap udara, dan minuman herbal botol. Tidak menerima produk beku/frozen."
                    value={acceptedProductsNote}
                    onChange={(e) => setAcceptedProductsNote(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-slate-900 resize-none leading-relaxed"
                  />
                  <span className="text-[11px] text-slate-500">
                    Produsen penitip akan membaca catatan kriteria ini untuk memastikan warung Anda cocok dengan produk mereka.
                  </span>
                </div>

                {/* Komponen Peta Interaktif Lengkap (Bisa geser pin, klik peta, GPS deteksi, input manual) */}
                <div className="pt-2 border-t border-slate-100">
                  <LocationPickerMap
                    latitude={lat}
                    longitude={lng}
                    onChangeLocation={(newLat, newLng) => {
                      setLat(newLat)
                      setLng(newLng)
                    }}
                    category={category}
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    onClick={() => setIsEditing(false)}
                    className="rounded-xl font-semibold min-h-[44px]"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    loading={updateMutation.isPending}
                    disabled={updateMutation.isPending}
                    className="rounded-xl font-semibold min-h-[44px]"
                  >
                    Simpan Perubahan
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------------
            KONTEN TAB 2: DAFTAR PERMINTAAN TITIP BARANG (BAR-SHAPED ITEMS)
            ------------------------------------------------------------------ */}
        {activeTab === 'requests' && (
          <div className="flex flex-col gap-4">
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Daftar Pengajuan Titipan Produsen
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Klik pada baris permintaan di bawah untuk melihat rincian barang, harga modal, dan
                  menyetujui permohonan.
                </p>
              </div>

              <div className="flex items-center gap-1.5 self-start sm:self-auto">
                <span className="text-xs text-slate-500 font-medium">Total:</span>
                <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                  {requests.length} Permintaan
                </span>
              </div>
            </div>

            {requests.length === 0 ? (
              <div className="py-12 bg-white rounded-2xl border border-slate-200 text-center flex flex-col items-center gap-2">
                <p className="text-sm font-bold text-slate-800">Belum Ada Permintaan Titipan</p>
                <p className="text-xs text-slate-500 max-w-sm">
                  Ketika produsen UMKM menemukan toko Anda di peta dan mengajukan titip-jual, daftar
                  permohonan akan muncul di sini.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {requests.map((request) => (
                  <ConsignmentRequestCard
                    key={request.id}
                    request={request}
                    onClick={handleOpenRequestDetail}
                    onApprove={handleQuickApprove}
                    onReject={handleQuickReject}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal Pop-up Rincian Permintaan Titip */}
        <ConsignmentRequestDetailModal
          request={selectedRequest}
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          onUpdateStatus={updateRequestStatus}
        />
      </div>
    </PageContainer>
  )
}
