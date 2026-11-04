import { useState, useEffect, useRef } from 'react'

export interface UseDelayedLoadingOptions {
  delayMs?: number
  minDisplayMs?: number
}

/**
 * Hook untuk mencegah kedipan loading pada koneksi cepat:
 * - Menunda tampilan loading hingga 200ms
 * - Jika tampil, bertahan minimal 300ms agar mata pengguna tidak kaget (anti layout-flash)
 */
export function useDelayedLoading(
  isLoading: boolean,
  { delayMs = 200, minDisplayMs = 300 }: UseDelayedLoadingOptions = {}
): boolean {
  const [showLoading, setShowLoading] = useState(false)
  const shownAtRef = useRef<number | null>(null)
  const delayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const minTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (isLoading) {
      // Bersihkan timer penutupan sebelumnya jika ada
      if (minTimerRef.current) {
        clearTimeout(minTimerRef.current)
        minTimerRef.current = null
      }

      // Tunggu delayMs sebelum menampilkan skeleton
      delayTimerRef.current = setTimeout(() => {
        shownAtRef.current = Date.now()
        setShowLoading(true)
      }, delayMs)
    } else {
      // Bersihkan timer delay jika pemuatan selesai sebelum delayMs berakhir
      if (delayTimerRef.current) {
        clearTimeout(delayTimerRef.current)
        delayTimerRef.current = null
      }

      if (shownAtRef.current !== null) {
        // Skeleton sedang tampil, pastikan bertahan minimal minDisplayMs
        const elapsed = Date.now() - shownAtRef.current
        const remaining = Math.max(0, minDisplayMs - elapsed)

        minTimerRef.current = setTimeout(() => {
          setShowLoading(false)
          shownAtRef.current = null
        }, remaining)
      } else {
        // Skeleton belum pernah tampil (selesai sebelum 200ms)
        setShowLoading(false)
      }
    }

    return () => {
      if (delayTimerRef.current) clearTimeout(delayTimerRef.current)
      if (minTimerRef.current) clearTimeout(minTimerRef.current)
    }
  }, [isLoading, delayMs, minDisplayMs])

  return showLoading
}
