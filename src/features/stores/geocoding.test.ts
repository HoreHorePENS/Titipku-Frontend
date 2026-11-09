import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  INSECURE_CONTEXT_MESSAGE,
  MIN_INTERVAL_MS,
  buildSearchUrl,
  canUseGeolocation,
  geolocationErrorMessage,
  mapNominatim,
  searchAddress,
} from './geocoding'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('geocoding Nominatim', () => {
  it('URL pencarian dibatasi ke Indonesia, 5 hasil, bahasa Indonesia', () => {
    const url = new URL(buildSearchUrl('  Jl. Menur 12, Surabaya '))
    expect(url.pathname).toBe('/search')
    expect(url.searchParams.get('q')).toBe('Jl. Menur 12, Surabaya')
    expect(url.searchParams.get('countrycodes')).toBe('id')
    expect(url.searchParams.get('limit')).toBe('5')
    expect(url.searchParams.get('format')).toBe('jsonv2')
  })

  it('memetakan hasil dan membuang koordinat tidak valid', () => {
    expect(
      mapNominatim([
        { place_id: 1, display_name: 'Menur, Surabaya', lat: '-7.28', lon: '112.76' },
        { place_id: 2, display_name: 'Rusak', lat: 'x', lon: '1' },
      ])
    ).toEqual([{ id: '1', label: 'Menur, Surabaya', latitude: -7.28, longitude: 112.76 }])
  })

  it('tidak memanggil server untuk kata kunci < 3 huruf, dan cache hasil yang sama', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => [{ place_id: 9, display_name: 'Tunjungan', lat: '-7.26', lon: '112.74' }] })
    vi.stubGlobal('fetch', fetchMock)
    expect(await searchAddress('ab')).toEqual([])
    expect(fetchMock).not.toHaveBeenCalled()

    const first = await searchAddress('Tunjungan Surabaya')
    const second = await searchAddress('  tunjungan surabaya ')
    expect(first).toEqual(second)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('menjaga jeda minimal 1 detik antar permintaan', async () => {
    vi.useFakeTimers()
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => [] })
    vi.stubGlobal('fetch', fetchMock)
    const a = searchAddress('alamat pertama satu')
    await vi.advanceTimersByTimeAsync(MIN_INTERVAL_MS)
    await a
    const callsAfterFirst = fetchMock.mock.calls.length
    const b = searchAddress('alamat kedua dua')
    await vi.advanceTimersByTimeAsync(100)
    expect(fetchMock.mock.calls.length).toBe(callsAfterFirst)
    await vi.advanceTimersByTimeAsync(MIN_INTERVAL_MS)
    await b
    expect(fetchMock.mock.calls.length).toBe(callsAfterFirst + 1)
  })
})

describe('pesan lokasi', () => {
  it('membedakan izin ditolak, lokasi tidak tersedia, dan timeout', () => {
    const messages = [1, 2, 3].map(geolocationErrorMessage)
    expect(new Set(messages).size).toBe(3)
    expect(messages[0]).toContain('Izin lokasi ditolak')
    expect(messages[1]).toContain('GPS')
    expect(messages[2]).toContain('terlalu lama')
  })

  it('di halaman http (bukan secure context) geolocation dianggap tidak tersedia', () => {
    vi.stubGlobal('window', { isSecureContext: false })
    expect(canUseGeolocation()).toBe(false)
    expect(INSECURE_CONTEXT_MESSAGE).toBe('Lokasi otomatis butuh koneksi aman (https). Cari alamat atau klik peta untuk menandai tokomu.')
  })
})
