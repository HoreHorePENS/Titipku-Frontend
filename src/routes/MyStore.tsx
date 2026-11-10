import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { PageContainer, PageHeader } from '@/components/shared'
import { ApiErrorState } from '@/components/shared/ApiErrorState'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PhotoPicker } from '@/components/ui/PhotoPicker'
import { KEEP_PHOTO, type PhotoDraft } from '@/components/ui/photo-draft'
import { Skeleton } from '@/components/ui/Skeleton'
import { toast } from '@/components/ui/toast-store'
import { describeApiError } from '@/lib/api-errors'
import { describePhotoError } from '@/lib/photo-errors'
import {
  useMyStore,
  useUpdateMyStore,
  useSetMyStoreActive,
  useSetMyStorePhoto,
  getCategoryMeta,
  STORE_CATEGORIES_META,
  LocationPickerMap,
  StoreLocationPreviewMap,
  ConsignmentRequestCard,
  ConsignmentRequestDetailModal,
  useConsignmentRequests,
  type Store,
  type StoreCategory,
  type ConsignmentRequest,
} from '@/features/stores'

const DESCRIPTION_MAX = 1000

const STORE_FIELD_MESSAGES: Record<string, string> = {
  name: 'Nama toko minimal 2 dan maksimal 120 karakter.',
  address: 'Alamat toko minimal 3 dan maksimal 300 karakter.',
  whatsapp: 'Nomor WhatsApp belum benar. Contoh: 0812 3456 7890',
  description: 'Catatan produk maksimal 1000 karakter.',
  latitude: 'Titik lokasi belum benar. Pilih ulang di peta.',
  longitude: 'Titik lokasi belum benar. Pilih ulang di peta.',
}

interface StoreFormState {
  name: string
  category: StoreCategory
  description: string
  address: string
  whatsapp: string
  lat: number
  lng: number
}

function toFormState(store: Store): StoreFormState {
  return {
    name: store.name,
    category: store.category,
    description: store.description ?? '',
    address: store.address,
    whatsapp: store.whatsapp,
    lat: store.latitude,
    lng: store.longitude,
  }
}

function StoreProfileCard({
  store,
  onEdit,
  onToggleActive,
  isTogglingActive,
}: {
  store: Store
  onEdit: () => void
  onToggleActive: () => void
  isTogglingActive: boolean
}) {
  const meta = getCategoryMeta(store.category)
  return (
    <div className="flex flex-col gap-5">
      {/* Status Toko & Tutup Warung Sementara */}
      <section className="p-4 sm:p-5 bg-white rounded-2xl border border-line shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-title-3 text-ink">Status Operasional Toko</h2>
            <span
              className={`text-caption font-semibold px-2.5 py-0.5 rounded-full border ${
                store.isActive
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              {store.isActive ? '● Menerima Titipan di Peta' : '○ Tutup Sementara'}
            </span>
          </div>
          <p className="text-caption text-ink-soft mt-1">
            {store.isActive
              ? 'Toko Anda aktif dan terlihat di peta bagi para produsen UMKM penitip.'
              : 'Toko Anda sedang disembunyikan sementara dari pencarian peta titip konsinyasi.'}
          </p>
        </div>

        <div className="shrink-0">
          <Button
            variant={store.isActive ? 'outline' : 'primary'}
            size="sm"
            onClick={onToggleActive}
            loading={isTogglingActive}
            className="rounded-xl min-h-[44px] text-caption font-semibold"
          >
            {store.isActive ? 'Tutup Warung Sementara' : 'Buka & Terima Titipan'}
          </Button>
        </div>
      </section>

      <section className="p-5 bg-white rounded-2xl border border-line flex flex-col gap-4">
        <div className="flex items-start gap-4">
          <div className="w-24 aspect-[4/3] rounded-xl overflow-hidden border border-line bg-slate-50 shrink-0 flex items-center justify-center text-slate-400">
            {store.photoUrl ? (
              <img src={store.photoUrl} alt={`Foto ${store.name}`} className="w-full h-full object-cover" />
            ) : (
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d={meta.svgPath} />
              </svg>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-caption font-semibold px-2 py-0.5 rounded-md border border-line text-ink-soft">{meta.label}</span>
              <span className="text-caption font-semibold px-2 py-0.5 rounded-md border border-line text-ink-soft">
                {store.isActive ? 'Tampil di peta' : 'Disembunyikan'}
              </span>
            </div>
            <h2 className="text-title-2 text-ink mt-1">{store.name}</h2>
            <p className="text-body text-ink-soft">{store.address}</p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-line bg-slate-50">
          <p className="text-label text-ink">Produk yang dicari tokomu</p>
          <p className="text-body text-ink-soft mt-0.5">
            {store.description || 'Belum diisi. Ceritakan produk apa yang cocok dititipkan agar penitip yakin tokomu sesuai.'}
          </p>
        </div>

        {!store.photoUrl && (
          <p className="text-body text-ink-soft">
            Tokomu belum punya foto. Toko berfoto lebih mudah dikenali penitip.{' '}
            <button type="button" onClick={onEdit} className="font-semibold text-ink underline underline-offset-2">
              Tambah foto
            </button>
          </p>
        )}

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-line">
          <div>
            <dt className="text-caption text-ink-soft">WhatsApp</dt>
            <dd className="text-body font-mono text-ink">{store.whatsapp}</dd>
          </div>
          <div>
            <dt className="text-caption text-ink-soft">Titik koordinat</dt>
            <dd className="text-body font-mono text-ink">
              {store.latitude.toFixed(6)}, {store.longitude.toFixed(6)}
            </dd>
          </div>
        </dl>
      </section>

      <section className="p-5 bg-white rounded-2xl border border-line flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-title-3 text-ink">Posisi toko di peta</h2>
            <p className="text-caption text-ink-soft">Begini tokomu terlihat oleh penitip di Peta Toko.</p>
          </div>
          <button type="button" onClick={onEdit} className="text-label text-ink underline underline-offset-2 min-h-[44px]">
            Ubah titik lokasi
          </button>
        </div>
        <StoreLocationPreviewMap
          latitude={store.latitude}
          longitude={store.longitude}
          storeName={store.name}
          category={store.category}
          address={store.address}
          height="h-[320px] sm:h-[420px]"
          className="w-full"
        />
      </section>
    </div>
  )
}

function StoreEditForm({ store, onDone }: { store: Store; onDone: () => void }) {
  const updateMutation = useUpdateMyStore()
  const photoMutation = useSetMyStorePhoto()
  const [form, setForm] = useState<StoreFormState>(() => toFormState(store))
  const [photoDraft, setPhotoDraft] = useState<PhotoDraft>(KEEP_PHOTO)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const isSaving = updateMutation.isPending || photoMutation.isPending

  const set = <K extends keyof StoreFormState>(key: K, value: StoreFormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault()
    setFormError(null)
    setFieldErrors({})
    try {
      await updateMutation.mutateAsync({
        name: form.name.trim(),
        category: form.category,
        description: form.description.trim() || undefined,
        address: form.address.trim(),
        whatsapp: form.whatsapp.trim(),
        latitude: form.lat,
        longitude: form.lng,
      })
    } catch (err) {
      const friendly = describeApiError<string>(err, {
        fieldMap: Object.fromEntries(Object.keys(STORE_FIELD_MESSAGES).map((key) => [key, key])),
        fieldMessages: STORE_FIELD_MESSAGES,
      })
      setFieldErrors(friendly.fieldErrors)
      setFormError(friendly.message)
      return
    }

    try {
      if (photoDraft.kind === 'new') await photoMutation.mutateAsync(photoDraft.blob)
      if (photoDraft.kind === 'remove') await photoMutation.mutateAsync(null)
    } catch (err) {
      // Data toko sudah tersimpan; hanya foto yang gagal.
      setFormError(`Data toko tersimpan, tetapi foto belum terunggah. ${describePhotoError(err)}`)
      return
    }

    toast.show({ title: 'Profil toko disimpan', description: 'Data, foto, dan titik lokasi tokomu sudah diperbarui.', type: 'success' })
    onDone()
  }

  return (
    <form onSubmit={handleSave} noValidate className="p-5 bg-white rounded-2xl border border-line-strong flex flex-col gap-4">
      <div className="flex items-center justify-between pb-2 border-b border-line">
        <div>
          <h2 className="text-title-3 text-ink">Ubah data toko</h2>
          <p className="text-caption text-ink-soft">Perubahan berlaku setelah kamu menyimpan.</p>
        </div>
        <button type="button" onClick={onDone} className="text-label text-ink-soft hover:text-ink min-h-[44px]">
          Batal
        </button>
      </div>

      <PhotoPicker label="Foto toko" savedUrl={store.photoUrl ?? null} draft={photoDraft} onDraftChange={setPhotoDraft} placeholder="store" disabled={isSaving} />

      <Input label="Nama toko" value={form.name} onChange={(e) => set('name', e.target.value)} error={fieldErrors.name} required inputSize="md" />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="store-category" className="text-label text-ink">Kategori toko</label>
        <select
          id="store-category"
          value={form.category}
          onChange={(e) => set('category', e.target.value as StoreCategory)}
          className="w-full px-3.5 h-10 rounded-lg border border-line-strong bg-white text-[16px] focus:outline-none focus:ring-2 focus:ring-focus-ring/30"
        >
          {Object.values(STORE_CATEGORIES_META).map((cat) => (
            <option key={cat.key} value={cat.key}>{cat.label}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="store-description" className="text-label text-ink">
          Produk yang dicari tokomu <span className="text-ink-soft font-normal">(opsional)</span>
        </label>
        <textarea
          id="store-description"
          rows={3}
          maxLength={DESCRIPTION_MAX}
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Contoh: Menerima keripik kemasan, kue kering, dan minuman botol. Tidak menerima produk beku."
          aria-describedby="store-description-hint"
          className="w-full px-3.5 py-2.5 rounded-xl border border-line-strong text-[16px] leading-normal resize-none focus:outline-none focus:ring-2 focus:ring-focus-ring/30"
        />
        <span id="store-description-hint" className="text-caption text-ink-soft">
          {fieldErrors.description ?? `Dibaca penitip sebelum mengajukan titip-jual. ${form.description.length}/${DESCRIPTION_MAX}`}
        </span>
      </div>

      <Input label="Alamat toko lengkap" value={form.address} onChange={(e) => set('address', e.target.value)} error={fieldErrors.address} required inputSize="md" />
      <Input label="Nomor WhatsApp" type="tel" inputMode="tel" value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} error={fieldErrors.whatsapp} required inputSize="md" />

      <div className="pt-3 border-t border-line">
        <LocationPickerMap
          latitude={form.lat}
          longitude={form.lng}
          onChangeLocation={(lat, lng) => setForm((prev) => ({ ...prev, lat, lng }))}
          category={form.category}
          error={fieldErrors.latitude ?? fieldErrors.longitude}
        />
      </div>

      {formError && (
        <p role="alert" className="p-3 rounded-xl border border-red-200 bg-red-50 text-body text-red-800">{formError}</p>
      )}

      <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
        <Button type="button" variant="outline" onClick={onDone} className="rounded-xl">Batal</Button>
        <Button type="submit" variant="primary" loading={isSaving} disabled={isSaving} className="rounded-xl">
          {isSaving ? 'Menyimpan…' : 'Simpan perubahan'}
        </Button>
      </div>
    </form>
  )
}

function StoreRequestsTab({ focusId }: { focusId?: string | null }) {
  const navigate = useNavigate()
  const requestsQuery = useConsignmentRequests()
  const [selected, setSelected] = useState<ConsignmentRequest | null>(null)
  const { requests, updateRequestStatus, isUpdating, updatingId } = requestsQuery

  // Gulir ke pengajuan yang dibuka dari notifikasi.
  useEffect(() => {
    if (!focusId || requests.length === 0) return
    document.getElementById(`pengajuan-${focusId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [focusId, requests.length])

  const respond = async (request: ConsignmentRequest, status: 'accepted' | 'rejected') => {
    try {
      await updateRequestStatus(request.id, status)
      toast.show(
        status === 'accepted'
          ? { title: 'Pengajuan disetujui', description: `${request.producerBusinessName} kini mitra tokomu.`, type: 'success' }
          : { title: 'Pengajuan ditolak', description: `Pengajuan dari ${request.producerBusinessName} sudah ditolak.`, type: 'info' }
      )
    } catch (err) {
      toast.show({ title: 'Pengajuan belum bisa diproses', description: describeApiError(err).message, type: 'error' })
    }
  }

  if (requestsQuery.isLoading) {
    return (
      <div className="flex flex-col gap-2.5" aria-busy="true" aria-label="Memuat pengajuan">
        <Skeleton variant="rect" className="h-24 w-full rounded-2xl" />
        <Skeleton variant="rect" className="h-24 w-full rounded-2xl" />
      </div>
    )
  }
  if (requestsQuery.isError) {
    return <ApiErrorState error={requestsQuery.error} onRetry={() => requestsQuery.refetch()} title="Pengajuan belum bisa dimuat" />
  }
  if (requests.length === 0) {
    return (
      <EmptyState
        size="inline"
        title="Belum ada pengajuan titipan"
        description="Saat penitip menemukan tokomu di peta dan mengajukan titip-jual, pengajuannya muncul di sini. Kamu juga bisa menawari penitip lebih dulu."
        action={{ label: 'Tawari penitip', onClick: () => navigate('/') }}
      />
    )
  }

  return (
    <>
      <ul className="flex flex-col gap-2.5">
        {requests.map((request) => (
          <li
            key={request.id}
            id={`pengajuan-${request.id}`}
            aria-current={request.id === focusId ? 'true' : undefined}
            className={request.id === focusId ? 'rounded-2xl ring-2 ring-ink/20' : undefined}
          >
            <ConsignmentRequestCard
              request={request}
              onClick={setSelected}
              onApprove={(r) => respond(r, 'accepted')}
              onReject={(r) => respond(r, 'rejected')}
              busy={updatingId === request.id}
            />
          </li>
        ))}
      </ul>
      <ConsignmentRequestDetailModal
        request={selected}
        isOpen={selected !== null}
        onClose={() => setSelected(null)}
        onUpdateStatus={updateRequestStatus}
        isUpdating={isUpdating}
      />
    </>
  )
}

export default function MyStoreRoute() {
  const { data: store, isLoading, isError, error, refetch } = useMyStore()
  const setActiveMutation = useSetMyStoreActive()
  const { pendingCount } = useConsignmentRequests()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const [activeTab, setActiveTab] = useState<'profile' | 'requests'>(
    searchParams.get('tab') === 'pengajuan' ? 'requests' : 'profile'
  )
  // Notifikasi pengajuan masuk: ?tab=pengajuan membuka tab pengajuan (juga saat halaman sudah terbuka).
  const [handledLocationKey, setHandledLocationKey] = useState(location.key)
  if (handledLocationKey !== location.key) {
    setHandledLocationKey(location.key)
    if (searchParams.get('tab') === 'pengajuan') setActiveTab('requests')
  }
  const focusRequestId = searchParams.get('pengajuan')
  const [isEditing, setIsEditing] = useState(false)

  const handleToggleActive = async () => {
    if (!store) return
    try {
      await setActiveMutation.mutateAsync(!store.isActive)
      toast.show({
        title: store.isActive ? 'Toko disembunyikan' : 'Toko ditampilkan',
        description: store.isActive ? 'Tokomu disembunyikan sementara dari peta.' : 'Tokomu kini terlihat lagi oleh penitip di peta.',
        type: 'success',
      })
    } catch (err) {
      toast.show({ title: 'Status toko belum bisa diubah', description: describeApiError(err).message, type: 'error' })
    }
  }

  if (isLoading) {
    return (
      <PageContainer>
        <div className="py-6 flex flex-col gap-4" aria-busy="true" aria-label="Memuat data toko">
          <Skeleton className="h-10 w-48 rounded-xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </PageContainer>
    )
  }

  if (isError || !store) {
    return (
      <PageContainer>
        <ApiErrorState error={error} onRetry={() => refetch()} title="Data toko belum bisa dimuat" size="page" />
      </PageContainer>
    )
  }

  const tabClass = (tab: 'profile' | 'requests') =>
    `py-2 text-label rounded-lg flex items-center justify-center gap-2 min-h-[44px] ${
      activeTab === tab ? 'bg-white text-ink shadow-xs border border-line' : 'text-ink-soft hover:text-ink'
    }`

  return (
    <PageContainer maxWidth="full" className="px-4 md:px-8">
      <div className="flex flex-col gap-6 py-4 w-full">
        <PageHeader
          title="Toko Saya"
          description="Kelola profil, foto, titik lokasi, dan pengajuan titip dari penitip."
          actions={
            <>
              <Button variant={store.isActive ? 'outline' : 'primary'} size="sm" onClick={handleToggleActive} loading={setActiveMutation.isPending} className="rounded-xl min-h-[44px]">
                {store.isActive ? 'Sembunyikan dari peta' : 'Tampilkan di peta'}
              </Button>
              {activeTab === 'profile' && !isEditing && (
                <Button variant="primary" size="sm" onClick={() => setIsEditing(true)} className="rounded-xl min-h-[44px]">
                  Ubah profil
                </Button>
              )}
            </>
          }
        />

        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl border border-line" role="tablist">
          <button type="button" role="tab" aria-selected={activeTab === 'profile'} onClick={() => setActiveTab('profile')} className={tabClass('profile')}>
            Profil & lokasi
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'requests'}
            onClick={() => {
              setActiveTab('requests')
              setIsEditing(false)
            }}
            className={tabClass('requests')}
          >
            Pengajuan & mitra
            {pendingCount > 0 && (
              <span className="px-1.5 rounded-full bg-slate-900 text-white text-caption" aria-label={`${pendingCount} menunggu`}>
                {pendingCount}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'profile' ? (
          isEditing ? (
            <StoreEditForm store={store} onDone={() => setIsEditing(false)} />
          ) : (
            <StoreProfileCard
              store={store}
              onEdit={() => setIsEditing(true)}
              onToggleActive={handleToggleActive}
              isTogglingActive={setActiveMutation.isPending}
            />
          )
        ) : (
          <StoreRequestsTab focusId={focusRequestId} />
        )}
      </div>
    </PageContainer>
  )
}
