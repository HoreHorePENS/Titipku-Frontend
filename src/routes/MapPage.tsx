import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageContainer } from '@/components/shared'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { useCurrentAccount } from '@/features/auth'
import {
  useStores,
  StoreMap,
  ConsignModal,
  STORE_CATEGORIES_META,
  getCategoryMeta,
  type Store,
} from '@/features/stores'

export default function MapPage() {
  const navigate = useNavigate()
  const { data: currentAccount } = useCurrentAccount()
  const isPemilikToko = currentAccount?.user?.account_type === 'pemilik_toko'

  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map')
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)
  const [isConsignOpen, setIsConsignOpen] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    if (isPemilikToko) {
      navigate('/toko-saya', { replace: true })
    }
  }, [isPemilikToko, navigate])

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          })
        },
        () => {},
        { timeout: 8000 },
      )
    }
  }, [])

  const { data: stores = [], isLoading, isError, refetch } = useStores({
    category: selectedCategory !== 'all' ? selectedCategory : undefined,
    search: search.trim() || undefined,
  })

  const filteredStores = useMemo(() => {
    if (!search.trim()) return stores
    const q = search.toLowerCase()
    return stores.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q)),
    )
  }, [stores, search])

  if (isPemilikToko) {
    return null
  }

  const handleOpenConsign = (store: Store) => {
    setSelectedStore(store)
    setIsConsignOpen(true)
  }

  const categoryOptions = [
    { key: 'all', label: 'Semua Toko' },
    ...Object.values(STORE_CATEGORIES_META).map((c) => ({
      key: c.key,
      label: c.label,
    })),
  ]

  return (
    <PageContainer maxWidth="full" className="px-4 md:px-8">
      <div className="flex flex-col gap-5 py-4 w-full font-sans">
        {/* Header Bersih & Minimalis */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-caption font-semibold mb-1 border border-slate-200">
              <span>Peta Titip Jual</span>
            </div>
            <h1 className="text-title-1 text-slate-900">
              Peta Toko Mitra
            </h1>
            <p className="text-caption sm:text-body text-slate-500 mt-0.5">
              Temukan toko fisik yang siap menerima barang titipan konsinyasi produk UMKM Anda.
            </p>
          </div>

          {/* Toggle View: Peta vs Daftar Monokrom */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 self-start md:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 text-caption font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'map'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
                <line x1="8" y1="2" x2="8" y2="18"></line>
                <line x1="16" y1="6" x2="16" y2="22"></line>
              </svg>
              <span>Peta</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-caption font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="6" x2="21" y2="6"></line>
                <line x1="8" y1="12" x2="21" y2="12"></line>
                <line x1="8" y1="18" x2="21" y2="18"></line>
                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                <line x1="3" y1="18" x2="3.01" y2="18"></line>
              </svg>
              <span>Daftar ({filteredStores.length})</span>
            </button>
          </div>
        </div>

        {/* Filter Bar & Search */}
        <div className="flex flex-col gap-3">
          <Input
            placeholder="Cari toko berdasarkan nama, alamat, atau kata kunci..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl bg-white border-slate-200"
          />

          {/* Category Chips Minimalis Monokrom */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categoryOptions.map((cat) => {
              const isSelected = selectedCategory === cat.key
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`px-3 py-1.5 rounded-lg text-caption font-semibold shrink-0 transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-600 hover:text-slate-900 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {cat.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Konten Utama: Peta atau List */}
        {isLoading ? (
          <div className="h-[460px] md:h-[580px] rounded-2xl overflow-hidden border border-slate-200 bg-white">
            <Skeleton className="w-full h-full" />
          </div>
        ) : isError ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 flex flex-col items-center gap-3">
            <h3 className="text-title-3 text-slate-900">Gagal Memuat Data Toko</h3>
            <p className="text-caption text-slate-500 max-w-sm">
              Terjadi kendala saat mengambil data toko di peta. Silakan coba kembali.
            </p>
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              Coba Lagi
            </Button>
          </div>
        ) : viewMode === 'map' ? (
          <StoreMap
            stores={filteredStores}
            selectedStoreId={selectedStore?.id}
            onSelectStore={(store) => setSelectedStore(store)}
            onConsignClick={handleOpenConsign}
            userLocation={userLocation}
            className="h-[520px] md:h-[680px] w-full"
          />
        ) : (
          /* Tampilan Daftar Toko Minimalis */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredStores.length === 0 ? (
              <div className="col-span-full p-8 text-center bg-white rounded-2xl border border-slate-200 flex flex-col items-center gap-2">
                <h3 className="text-title-3 text-slate-900">Tidak Ada Toko yang Cocok</h3>
                <p className="text-caption text-slate-500">
                  Coba sesuaikan kata kunci pencarian atau ubah filter kategori toko.
                </p>
              </div>
            ) : (
              filteredStores.map((store) => {
                const meta = getCategoryMeta(store.category)

                return (
                  <div
                    key={store.id}
                    className="p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 shadow-2xs flex flex-col justify-between gap-3 transition-all"
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-caption font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                          {meta.label}
                        </span>

                        {store.hasConsigned ? (
                          <span className="text-caption font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-300">
                            Mitra Aktif
                          </span>
                        ) : store.hasPendingProposal ? (
                          <span className="text-caption font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-300">
                            Menunggu Persetujuan
                          </span>
                        ) : (
                          <span className="text-caption text-slate-500 font-medium">
                            Bisa Dititipi
                          </span>
                        )}
                      </div>

                      <div>
                        <h3 className="text-title-3 text-slate-900">{store.name}</h3>
                        <p className="text-caption text-slate-500 mt-0.5 line-clamp-2">{store.address}</p>
                      </div>

                      {store.description && (
                        <p className="text-caption text-slate-600 line-clamp-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                          "{store.description}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <a
                        href={`https://wa.me/${store.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
                          `Halo ${store.name}, saya produsen UMKM ingin bertanya terkait titip jual konsinyasi.`,
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 text-caption font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all border border-slate-200"
                      >
                        WhatsApp
                      </a>

                      <Button
                        size="sm"
                        variant={store.hasPendingProposal ? 'outline' : 'primary'}
                        className="flex-1 text-caption font-semibold rounded-lg"
                        disabled={store.hasPendingProposal}
                        onClick={() => handleOpenConsign(store)}
                      >
                        {store.hasConsigned
                          ? 'Tambah Barang'
                          : store.hasPendingProposal
                          ? 'Pengajuan Menunggu'
                          : 'Titip Barang'}
                      </Button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* Modal Titip Barang */}
        <ConsignModal
          store={selectedStore}
          isOpen={isConsignOpen}
          onClose={() => setIsConsignOpen(false)}
        />
      </div>
    </PageContainer>
  )
}
