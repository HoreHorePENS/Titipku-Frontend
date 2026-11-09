import { useEffect, useId, useRef, useState } from 'react'
import { searchAddress, type GeocodeResult } from '../geocoding'

interface AddressSearchProps {
  onSelect: (result: GeocodeResult) => void
}

/**
 * Cari alamat (OpenStreetMap Nominatim) lalu pindahkan pin ke hasil yang dipilih.
 * Sesuai kebijakan Nominatim, pencarian dijalankan saat pengguna menekan Cari/Enter
 * (bukan saat mengetik) dan dibatasi 1 permintaan per detik.
 */
export function AddressSearch({ onSelect }: AddressSearchProps) {
  const id = useId()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GeocodeResult[] | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => () => abortRef.current?.abort(), [])

  const runSearch = async () => {
    const term = query.trim()
    if (term.length < 3) {
      setResults([])
      setStatus('idle')
      return
    }
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setStatus('loading')
    try {
      const found = await searchAddress(term, controller.signal)
      setResults(found)
      setStatus('idle')
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setStatus('error')
      setResults(null)
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={`${id}-q`} className="text-label text-ink">
        Cari alamat toko
      </label>
      <div className="flex gap-2">
        <input
          id={`${id}-q`}
          type="search"
          enterKeyHint="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              runSearch()
            }
          }}
          placeholder="Contoh: Jl. Menur 12, Surabaya"
          aria-describedby={`${id}-hint`}
          className="flex-1 min-w-0 px-3.5 h-11 rounded-xl border border-line-strong bg-white text-[16px] focus:outline-none focus:ring-2 focus:ring-focus-ring/30"
        />
        <button
          type="button"
          onClick={runSearch}
          disabled={status === 'loading'}
          className="px-4 h-11 rounded-xl bg-slate-900 text-white text-button disabled:opacity-60 shrink-0"
        >
          {status === 'loading' ? 'Mencari…' : 'Cari'}
        </button>
      </div>
      <p id={`${id}-hint`} className="text-caption text-ink-soft">
        Ketik minimal 3 huruf lalu tekan Cari. Pencarian alamat © OpenStreetMap contributors.
      </p>

      <div aria-live="polite">
        {status === 'error' && (
          <p className="text-caption font-medium text-danger">
            Pencarian alamat belum berhasil. Periksa koneksi lalu coba lagi, atau klik langsung di peta.
          </p>
        )}
        {results && results.length === 0 && status === 'idle' && query.trim().length >= 3 && (
          <p className="text-caption text-ink-soft">Alamat tidak ditemukan. Coba tulis nama jalan dan kota, atau klik peta.</p>
        )}
        {results && results.length > 0 && (
          <ul className="mt-1 rounded-xl border border-line divide-y divide-line bg-white overflow-hidden" aria-label="Hasil pencarian alamat">
            {results.map((result) => (
              <li key={result.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(result)
                    setResults(null)
                  }}
                  className="w-full text-left px-3 py-2.5 text-body text-ink hover:bg-slate-50 min-h-[44px]"
                >
                  {result.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
