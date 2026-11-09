import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getCategoryMeta } from '../constants'
import type { Store } from '../types'
import { Button } from '@/components/ui/Button'

interface StoreMapProps {
  stores: Store[]
  selectedStoreId?: string
  onSelectStore?: (store: Store) => void
  onConsignClick?: (store: Store) => void
  className?: string
  userLocation?: { lat: number; lng: number } | null
}

function MapController({
  center,
  zoom,
}: {
  center: [number, number]
  zoom?: number
}) {
  const map = useMap()
  useEffect(() => {
    map.flyTo(center, zoom || map.getZoom(), { duration: 1.2 })
    const timer1 = setTimeout(() => map.invalidateSize(), 150)
    const timer2 = setTimeout(() => map.invalidateSize(), 500)
    const handleResize = () => map.invalidateSize()
    window.addEventListener('resize', handleResize)
    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      window.removeEventListener('resize', handleResize)
    }
  }, [center, zoom, map])
  return null
}

// Marker Peta Minimalis Hitam-Putih
function createStoreIcon(store: Store, isSelected: boolean) {
  const meta = getCategoryMeta(store.category)
  const isConsigned = store.hasConsigned

  const html = `
    <div class="relative flex items-center justify-center cursor-pointer transition-transform duration-150 ${
      isSelected ? 'scale-110 z-50' : 'hover:scale-105'
    }">
      ${
        isConsigned
          ? `<span class="absolute -top-1 -right-1 flex h-3 w-3 z-20">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-400 opacity-60"></span>
              <span class="relative inline-flex rounded-full h-3 w-3 bg-slate-900 border-2 border-white"></span>
            </span>`
          : ''
      }
      <div 
        class="w-9 h-9 rounded-full flex items-center justify-center shadow-md border-[1.5px] transition-colors ${
          isSelected
            ? 'bg-slate-950 border-slate-950 text-white'
            : 'bg-white border-slate-800 text-slate-800 hover:border-slate-950'
        }"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="${meta.svgPath}"></path>
        </svg>
      </div>
      <div 
        class="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] absolute -bottom-1.5 ${
          isSelected ? 'border-t-slate-950' : 'border-t-slate-800'
        }"
      ></div>
    </div>
  `

  return L.divIcon({
    html,
    className: 'custom-store-pin',
    iconSize: [36, 42],
    iconAnchor: [18, 42],
    popupAnchor: [0, -40],
  })
}

// Marker Posisi Pengguna Monokrom
function createUserIcon() {
  const html = `
    <div class="relative flex items-center justify-center">
      <span class="animate-ping absolute inline-flex h-6 w-6 rounded-full bg-slate-400 opacity-40"></span>
      <div class="relative w-4 h-4 rounded-full bg-slate-900 border-2 border-white shadow-md flex items-center justify-center">
        <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
      </div>
    </div>
  `
  return L.divIcon({
    html,
    className: 'user-location-pin',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })
}

export function StoreMap({
  stores,
  selectedStoreId,
  onSelectStore,
  onConsignClick,
  className = 'h-[460px] md:h-[580px] w-full',
  userLocation,
}: StoreMapProps) {
  const defaultCenter = useMemo<[number, number]>(() => {
    if (userLocation) return [userLocation.lat, userLocation.lng]
    if (stores.length > 0) {
      return [stores[0].latitude, stores[0].longitude]
    }
    return [-7.2575, 112.7521]
  }, [stores, userLocation])

  const [activeCenter, setActiveCenter] = useState<[number, number]>(defaultCenter)

  const selectedStore = useMemo(() => {
    return stores.find((s) => s.id === selectedStoreId)
  }, [stores, selectedStoreId])

  useEffect(() => {
    if (selectedStore) {
      setActiveCenter([selectedStore.latitude, selectedStore.longitude])
    }
  }, [selectedStore])

  const handleMyLocation = () => {
    if (userLocation) {
      setActiveCenter([userLocation.lat, userLocation.lng])
    }
  }

  return (
    <div className={`relative rounded-2xl overflow-hidden border border-line shadow-xs bg-surface ${className}`}>
      <MapContainer
        center={defaultCenter}
        zoom={14}
        scrollWheelZoom={true}
        className="h-full w-full z-0 font-sans"
      >
        <MapController center={activeCenter} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* Marker Pengguna */}
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={createUserIcon()}>
            <Popup className="custom-popup">
              <div className="p-1 text-center font-medium text-caption text-slate-800">
                Lokasi Anda
              </div>
            </Popup>
          </Marker>
        )}

        {/* Marker Toko */}
        {stores.map((store) => {
          const isSelected = store.id === selectedStoreId
          const meta = getCategoryMeta(store.category)

          return (
            <Marker
              key={store.id}
              position={[store.latitude, store.longitude]}
              icon={createStoreIcon(store, isSelected)}
              eventHandlers={{
                click: () => onSelectStore?.(store),
              }}
            >
              <Popup className="titipku-map-popup">
                <div className="p-3 min-w-[220px] max-w-[260px] flex flex-col gap-2 font-sans">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-caption font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                      {meta.label}
                    </span>

                    {store.hasConsigned ? (
                      <span className="text-caption font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-300">
                        Mitra Aktif
                      </span>
                    ) : (
                      <span className="text-caption text-slate-500">
                        Bisa Dititipi
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="text-title-3 text-slate-900">{store.name}</h4>
                    <p className="text-caption text-slate-500 line-clamp-2 mt-0.5">{store.address}</p>
                  </div>

                  {store.description && (
                    <p className="text-caption text-slate-600 line-clamp-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      "{store.description}"
                    </p>
                  )}

                  <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100">
                    <a
                      href={`https://wa.me/${store.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
                        `Halo ${store.name}, saya produsen UMKM ingin bertanya terkait titip jual produk konsinyasi.`,
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 text-caption font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all border border-slate-200"
                      title="Hubungi via WhatsApp"
                    >
                      WhatsApp
                    </a>

                    <Button
                      size="sm"
                      variant="primary"
                      className="flex-1 text-caption font-semibold py-1.5 h-auto rounded-xl"
                      onClick={() => onConsignClick?.(store)}
                    >
                      {store.hasConsigned ? 'Tambah Barang' : 'Titip Barang'}
                    </Button>
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>

      {/* Floating Action Controls */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
        {userLocation && (
          <button
            type="button"
            onClick={handleMyLocation}
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-center text-slate-700 hover:text-slate-950 hover:bg-slate-50 transition-all cursor-pointer"
            title="Pusatkan ke lokasi saya"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M12 2v3m0 14v3M2 12h3m14 0h3"></path>
            </svg>
          </button>
        )}
      </div>

      {/* Info Badge Jumlah Toko */}
      <div className="absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur-xs border border-slate-200 px-3 py-1 rounded-xl shadow-xs text-caption font-semibold text-slate-800 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-slate-900"></span>
        <span>{stores.length} Toko Tersedia</span>
      </div>
    </div>
  )
}
