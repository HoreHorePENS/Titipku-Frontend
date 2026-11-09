import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getCategoryMeta } from '../constants'

export interface StoreLocationPreviewMapProps {
  latitude: number
  longitude: number
  storeName: string
  category: string
  address?: string
  className?: string
  height?: string
}

function MapCenterController({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, 16)
    
    // Multiple invalidateSize checks agar tile ter-render penuh saat container melebar full-width
    const timer1 = setTimeout(() => map.invalidateSize(), 100)
    const timer2 = setTimeout(() => map.invalidateSize(), 300)
    const timer3 = setTimeout(() => map.invalidateSize(), 700)

    const handleResize = () => {
      map.invalidateSize()
    }
    window.addEventListener('resize', handleResize)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
      window.removeEventListener('resize', handleResize)
    }
  }, [center, map])
  return null
}

function createStaticStoreIcon(category: string, storeName: string) {
  const meta = getCategoryMeta(category)
  const html = `
    <div class="relative flex flex-col items-center cursor-default group">
      <div class="px-2.5 py-1 rounded-md bg-slate-900 text-white text-caption font-bold shadow-md whitespace-nowrap mb-1 border border-white">
        ${storeName}
      </div>
      <div class="w-11 h-11 rounded-full bg-slate-950 text-white flex items-center justify-center shadow-lg border-2 border-white ring-2 ring-slate-900/20">
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="${meta.svgPath}"></path>
        </svg>
      </div>
      <div class="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-slate-950 absolute -bottom-2"></div>
      <div class="w-3 h-1 rounded-full bg-slate-950/25 blur-[1px] absolute -bottom-3"></div>
    </div>
  `
  return L.divIcon({
    html,
    className: 'static-store-pin',
    iconSize: [44, 72],
    iconAnchor: [22, 72],
    popupAnchor: [0, -72],
  })
}

export function StoreLocationPreviewMap({
  latitude,
  longitude,
  storeName,
  category,
  address,
  className = '',
  height = 'h-[360px] sm:h-[440px] md:h-[520px]',
}: StoreLocationPreviewMapProps) {
  const validLat = typeof latitude === 'number' && !isNaN(latitude) ? latitude : -7.2575
  const validLng = typeof longitude === 'number' && !isNaN(longitude) ? longitude : 112.7521
  const position: [number, number] = useMemo(() => [validLat, validLng], [validLat, validLng])

  const pinIcon = useMemo(
    () => createStaticStoreIcon(category, storeName),
    [category, storeName]
  )

  const meta = getCategoryMeta(category)

  return (
    <div
      className={`relative w-full ${height} rounded-2xl overflow-hidden border border-slate-300 shadow-inner z-0 font-sans ${className}`}
    >
      <MapContainer
        center={position}
        zoom={16}
        scrollWheelZoom={false}
        dragging={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapCenterController center={position} />
        {/* Pin statis (tidak bisa digeser/drag, hanya preview lokasi) */}
        <Marker position={position} icon={pinIcon} draggable={false}>
          <Popup className="custom-store-popup">
            <div className="p-1 text-slate-900 font-sans text-caption flex flex-col gap-1 min-w-[180px]">
              <span className="font-bold text-body text-slate-950">{storeName}</span>
              <span className="text-caption font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded w-fit border border-slate-200">
                {meta.label}
              </span>
              {address && (
                <span className="text-caption text-slate-600 leading-tight mt-1">{address}</span>
              )}
              <span className="text-caption text-slate-400 font-mono mt-0.5">
                {validLat.toFixed(6)}, {validLng.toFixed(6)}
              </span>
            </div>
          </Popup>
        </Marker>
      </MapContainer>

      {/* Badge Keterangan Melayang di Sudut Kiri Atas Peta */}
      <div className="absolute top-3 left-3 z-10 pointer-events-none">
        <div className="bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-slate-200 text-caption font-semibold text-slate-800 shadow-xs flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-900"></span>
          <span>Lokasi Fisik Toko di Peta Titipku</span>
        </div>
      </div>

      {/* Badge Koordinat Melayang di Sudut Kanan Bawah */}
      <div className="absolute bottom-3 right-3 z-10 pointer-events-none">
        <div className="bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-slate-200 text-caption font-mono font-medium text-slate-700 shadow-xs">
          {validLat.toFixed(6)}, {validLng.toFixed(6)}
        </div>
      </div>
    </div>
  )
}
