/**
 * Pencarian alamat lewat OpenStreetMap Nominatim.
 *
 * Kebijakan penggunaan (https://operations.osmfoundation.org/policies/nominatim/):
 * - Maksimal 1 permintaan per detik  -> throttle di bawah.
 * - Dilarang autocomplete/cari-saat-mengetik -> pencarian hanya saat pengguna menekan Cari/Enter.
 * - Identifikasi aplikasi: browser otomatis mengirim header Referer (User-Agent tidak bisa diubah dari browser).
 * - Wajib atribusi "© OpenStreetMap contributors" -> ditampilkan di bawah kolom pencarian.
 * - Hasil di-cache agar pencarian berulang tidak membebani server.
 * URL dapat diganti (mis. server Nominatim sendiri) lewat VITE_NOMINATIM_URL.
 */

export const NOMINATIM_URL = (import.meta.env.VITE_NOMINATIM_URL as string | undefined) || 'https://nominatim.openstreetmap.org'
export const MIN_INTERVAL_MS = 1100

export interface GeocodeResult {
  id: string
  label: string
  latitude: number
  longitude: number
}

interface NominatimItem {
  place_id: number
  display_name: string
  lat: string
  lon: string
}

export function mapNominatim(items: NominatimItem[]): GeocodeResult[] {
  return items
    .map((item) => ({
      id: String(item.place_id),
      label: item.display_name,
      latitude: Number(item.lat),
      longitude: Number(item.lon),
    }))
    .filter((item) => Number.isFinite(item.latitude) && Number.isFinite(item.longitude))
}

export function buildSearchUrl(query: string): string {
  const params = new URLSearchParams({
    q: query.trim(),
    format: 'jsonv2',
    limit: '5',
    countrycodes: 'id',
    'accept-language': 'id',
  })
  return `${NOMINATIM_URL}/search?${params.toString()}`
}

const cache = new Map<string, GeocodeResult[]>()
let lastRequestAt = 0

const wait = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    })
  })

/** Cari alamat; menunggu bila permintaan sebelumnya kurang dari 1 detik lalu. */
export async function searchAddress(query: string, signal?: AbortSignal): Promise<GeocodeResult[]> {
  const key = query.trim().toLowerCase()
  if (key.length < 3) return []
  const cached = cache.get(key)
  if (cached) return cached

  const elapsed = Date.now() - lastRequestAt
  if (elapsed < MIN_INTERVAL_MS) await wait(MIN_INTERVAL_MS - elapsed, signal)
  lastRequestAt = Date.now()

  const response = await fetch(buildSearchUrl(query), {
    signal,
    headers: { Accept: 'application/json' },
    referrerPolicy: 'strict-origin-when-cross-origin',
  })
  if (!response.ok) throw new Error(`geocoding failed: ${response.status}`)
  const results = mapNominatim((await response.json()) as NominatimItem[])
  cache.set(key, results)
  return results
}

/** Pesan untuk kegagalan GeolocationPositionError, dibedakan per penyebab. */
export function geolocationErrorMessage(code: number): string {
  switch (code) {
    case 1:
      return 'Izin lokasi ditolak. Izinkan akses lokasi untuk situs ini di pengaturan browser, atau cari alamat / klik peta untuk menandai tokomu.'
    case 2:
      return 'Lokasi perangkat belum tersedia. Pastikan GPS atau Layanan Lokasi menyala lalu coba lagi, atau cari alamat tokomu.'
    case 3:
      return 'Pencarian lokasi terlalu lama. Coba lagi di tempat dengan sinyal lebih baik, atau cari alamat / klik peta.'
    default:
      return 'Lokasi otomatis belum berhasil. Cari alamat atau klik peta untuk menandai tokomu.'
  }
}

export const INSECURE_CONTEXT_MESSAGE =
  'Lokasi otomatis butuh koneksi aman (https). Cari alamat atau klik peta untuk menandai tokomu.'

/** Geolocation hanya tersedia di secure context (https atau localhost). */
export function canUseGeolocation(): boolean {
  return typeof window !== 'undefined' && window.isSecureContext && 'geolocation' in navigator
}
