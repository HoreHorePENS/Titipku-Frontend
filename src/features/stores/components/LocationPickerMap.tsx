import { useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getCategoryMeta } from '../constants'
import { Modal } from '@/components/shared/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AddressSearch } from './AddressSearch'
import { INSECURE_CONTEXT_MESSAGE, canUseGeolocation, geolocationErrorMessage } from '../geocoding'

export interface LocationPickerMapProps {
  latitude: number
  longitude: number
  onChangeLocation: (lat: number, lng: number) => void
  category?: string
  className?: string
  error?: string
}

function MapController({ center, zoom }: { center: [number, number]; zoom?: number }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo(center, zoom || map.getZoom(), { duration: 0.8 })
    const timer1 = setTimeout(() => map.invalidateSize(), 100)
    const timer2 = setTimeout(() => map.invalidateSize(), 300)
    const timer3 = setTimeout(() => map.invalidateSize(), 700)
    const handleResize = () => map.invalidateSize()
    window.addEventListener('resize', handleResize)
    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
      window.removeEventListener('resize', handleResize)
    }
  }, [center, zoom, map])
  return null
}

function DraggableMarker({
  position,
  onChange,
  icon,
}: {
  position: [number, number]
  onChange: (lat: number, lng: number) => void
  icon: L.DivIcon
}) {
  const markerRef = useRef<L.Marker>(null)

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current
        if (marker != null) {
          const latLng = marker.getLatLng()
          onChange(Number(latLng.lat.toFixed(6)), Number(latLng.lng.toFixed(6)))
        }
      },
    }),
    [onChange]
  )

  useMapEvents({
    click(e) {
      onChange(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6)))
    },
  })

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
      icon={icon}
    />
  )
}

function createPickerPinIcon(category: string = 'warung') {
  const meta = getCategoryMeta(category)
  const html = `
    <div class="relative flex items-center justify-center cursor-grab active:cursor-grabbing hover:scale-105 transition-transform">
      <div class="w-10 h-10 rounded-full bg-slate-950 text-white flex items-center justify-center shadow-lg border-2 border-white ring-2 ring-slate-900/20">
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
    className: 'custom-picker-pin',
    iconSize: [40, 48],
    iconAnchor: [20, 48],
  })
}

export function LocationPickerMap({
  latitude,
  longitude,
  onChangeLocation,
  category = 'warung',
  className = '',
  error,
}: LocationPickerMapProps) {
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [isLocating, setIsLocating] = useState(false)
  // Geolocation hanya jalan di secure context (https/localhost). Di http, jangan
  // tampilkan error 'izin ditolak'; arahkan ke pencarian alamat atau klik peta.
  const [geoAvailable] = useState(canUseGeolocation)
  const [statusMessage, setStatusMessage] = useState<string | null>(() =>
    geoAvailable ? null : INSECURE_CONTEXT_MESSAGE
  )
  const [statusType, setStatusType] = useState<'info' | 'success' | 'error'>('info')
  const [showManualInputs, setShowManualInputs] = useState(false)

  // Pastikan posisi valid angka, fallback ke Surabaya bila kosong/NaN
  const validLat = typeof latitude === 'number' && !isNaN(latitude) ? latitude : -7.2575
  const validLng = typeof longitude === 'number' && !isNaN(longitude) ? longitude : 112.7521
  const position: [number, number] = useMemo(() => [validLat, validLng], [validLat, validLng])

  // State string terpisah agar input manual leluasa untuk mengetik minus/desimal
  const [manualLatStr, setManualLatStr] = useState<string>(validLat.toString())
  const [manualLngStr, setManualLngStr] = useState<string>(validLng.toString())

  useEffect(() => {
    setManualLatStr(validLat.toString())
  }, [validLat])

  useEffect(() => {
    setManualLngStr(validLng.toString())
  }, [validLng])

  const pinIcon = useMemo(() => createPickerPinIcon(category), [category])

  // Handler saat user menentukan titik koordinat secara manual (klik peta / drag pin)
  const handleManualSelection = (lat: number, lng: number) => {
    onChangeLocation(lat, lng)
    setStatusMessage(`Titik lokasi toko berhasil dipilih: ${lat.toFixed(6)}, ${lng.toFixed(6)}`)
    setStatusType('success')
  }

  const requestGeolocation = () => {
    if (!canUseGeolocation()) {
      setStatusMessage(INSECURE_CONTEXT_MESSAGE)
      setStatusType('info')
      setIsConfirmModalOpen(false)
      return
    }

    setIsLocating(true)
    setStatusMessage('Sedang mencari titik koordinat GPS perangkat Anda...')
    setStatusType('info')
    setIsConfirmModalOpen(false)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const detectedLat = Number(pos.coords.latitude.toFixed(6))
        const detectedLng = Number(pos.coords.longitude.toFixed(6))
        const accuracy = Math.round(pos.coords.accuracy)

        onChangeLocation(detectedLat, detectedLng)
        setIsLocating(false)
        setStatusMessage(`GPS Terdeteksi (Akurasi: ±${accuracy} meter): ${detectedLat}, ${detectedLng}`)
        setStatusType('success')
      },
      (err) => {
        setIsLocating(false)
        setStatusMessage(geolocationErrorMessage(err.code))
        setStatusType('error')
      },
      { timeout: 15000, enableHighAccuracy: true }
    )
  }

  return (
    <div className={`flex flex-col gap-3 font-sans ${className}`}>
      {/* Header Bagian Peta & Tombol GPS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <label className="text-caption font-bold text-slate-800 flex items-center gap-1.5">
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
            <span>Titik Lokasi Toko di Peta</span>
          </label>
          <p className="text-caption text-slate-500 mt-0.5">
            Klik peta atau geser pin hitam untuk menentukan lokasi tokomu.
          </p>
        </div>

        {/* Tombol GPS hanya bila geolocation tersedia (secure context) */}
        {geoAvailable && (
        <button
          type="button"
          onClick={() => setIsConfirmModalOpen(true)}
          disabled={isLocating}
          className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-900 bg-white text-slate-900 text-caption font-semibold hover:bg-slate-50 transition-colors shadow-2xs min-h-[44px] cursor-pointer shrink-0 disabled:opacity-60"
        >
          {isLocating ? (
            <>
              <svg className="animate-spin w-4 h-4 text-slate-900" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Mendeteksi GPS...</span>
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4 text-slate-900"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="22" y1="12" x2="18" y2="12"></line>
                <line x1="6" y1="12" x2="2" y2="12"></line>
                <line x1="12" y1="6" x2="12" y2="2"></line>
                <line x1="12" y1="22" x2="12" y2="18"></line>
              </svg>
              <span>Gunakan Lokasi GPS Saya</span>
            </>
          )}
        </button>
        )}
      </div>

      <AddressSearch
        onSelect={(result) => {
          const lat = Number(result.latitude.toFixed(6))
          const lng = Number(result.longitude.toFixed(6))
          onChangeLocation(lat, lng)
          setStatusMessage('Pin dipindahkan ke hasil pencarian. Geser pin bila perlu agar tepat di depan toko.')
          setStatusType('success')
        }}
      />

      {/* Banner Status Deteksi Lokasi / Feedback Pemilihan Manual */}
      {statusMessage && (
        <div
          className={`px-3 py-2 rounded-xl text-caption flex items-center justify-between border transition-all ${
            statusType === 'success'
              ? 'bg-slate-900 text-white border-slate-900'
              : statusType === 'error'
              ? 'bg-rose-50 text-rose-900 border-rose-200'
              : 'bg-slate-100 text-slate-800 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2 flex-wrap">
            {statusType === 'success' && (
              <svg className="w-4 h-4 shrink-0 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            )}
            <span className="font-medium leading-relaxed">{statusMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-caption opacity-75 hover:opacity-100 cursor-pointer ml-2 p-1"
            title="Tutup pesan"
          >
            ✕
          </button>
        </div>
      )}

      {/* Kontainer Peta Leaflet Interaktif Full Width */}
      <div className="relative w-full h-[360px] sm:h-[420px] md:h-[500px] rounded-2xl overflow-hidden border border-slate-300 shadow-inner z-0">
        <MapContainer
          center={position}
          zoom={15}
          scrollWheelZoom={false}
          className="w-full h-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapController center={position} />
          <DraggableMarker
            position={position}
            onChange={handleManualSelection}
            icon={pinIcon}
          />
        </MapContainer>

        {/* Petunjuk Interaktif Melayang di Atas Peta */}
        <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
          <div className="bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-slate-200 text-caption font-semibold text-slate-700 shadow-xs flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-900"></span>
            <span>Geser pin atau klik peta</span>
          </div>
        </div>
      </div>

      {/* Card Info Koordinat Terpilih yang Jelas & Terbaca */}
      <div className="flex flex-col gap-2 p-3 bg-white rounded-xl border border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-caption font-semibold text-slate-600">Koordinat Aktif:</span>
            <span className="text-caption font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              {validLat.toFixed(6)}, {validLng.toFixed(6)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowManualInputs(!showManualInputs)}
            className="text-caption font-semibold text-slate-700 hover:text-slate-950 underline cursor-pointer"
          >
            {showManualInputs ? 'Tutup Input Manual' : 'Input Angka Manual'}
          </button>
        </div>

        {/* Input Koordinat Manual Akordeon */}
        {showManualInputs && (
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
            <Input
              label="Latitude (-90 s/d 90)"
              type="text"
              value={manualLatStr}
              onChange={(e) => {
                setManualLatStr(e.target.value)
                const parsed = parseFloat(e.target.value)
                if (!isNaN(parsed) && parsed >= -90 && parsed <= 90) {
                  handleManualSelection(parsed, validLng)
                }
              }}
              placeholder="-7.2575"
            />
            <Input
              label="Longitude (-180 s/d 180)"
              type="text"
              value={manualLngStr}
              onChange={(e) => {
                setManualLngStr(e.target.value)
                const parsed = parseFloat(e.target.value)
                if (!isNaN(parsed) && parsed >= -180 && parsed <= 180) {
                  handleManualSelection(validLat, parsed)
                }
              }}
              placeholder="112.7521"
            />
          </div>
        )}

        {error && <p className="text-caption text-rose-600 font-medium">{error}</p>}
      </div>

      {/* Modal Dialog Konfirmasi Izin Akses GPS */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="Izinkan Akses Lokasi (GPS)"
        maxWidth="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => {
                setIsConfirmModalOpen(false)
                setStatusMessage('Silakan klik titik lokasi tokomu langsung pada peta atau geser pin hitam.')
                setStatusType('info')
              }}
              className="rounded-xl min-h-[44px]"
            >
              Pilih Manual di Peta
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={requestGeolocation}
              loading={isLocating}
              className="rounded-xl min-h-[44px]"
            >
              Lanjutkan & Deteksi Lokasi
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4 text-slate-700">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0">
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="22" y1="12" x2="18" y2="12"></line>
                <line x1="6" y1="12" x2="2" y2="12"></line>
                <line x1="12" y1="6" x2="12" y2="2"></line>
                <line x1="12" y1="22" x2="12" y2="18"></line>
              </svg>
            </div>
            <div className="text-caption">
              <p className="font-bold text-slate-900">Penentuan Lokasi Warung / Toko</p>
              <p className="text-slate-500 mt-0.5">
                Titipku memerlukan titik koordinat warung Anda agar tampil di peta pencarian penitip.
              </p>
            </div>
          </div>

          <div className="text-caption leading-relaxed flex flex-col gap-2">
            <p>
              Dengan mengizinkan akses lokasi, browser Anda akan meminta konfirmasi. Silakan klik{' '}
              <strong>"Izinkan" (Allow)</strong> saat pop-up browser muncul.
            </p>
            <div className="p-2.5 rounded-lg bg-slate-100 text-caption text-slate-600 border border-slate-200">
              <strong>Catatan:</strong> Jika Anda sedang tidak berada di warung, Anda tetap dapat
              menentukan posisi toko secara presisi dengan mengeklik langsung pada peta.
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
