import React, { useState, useEffect, useRef } from 'react'

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'rect' | 'circle'
  width?: string | number
  height?: string | number
}

/**
 * Primitif Skeleton: Komponen dasar visual placeholder saat memuat data.
 * Memakai animasi halus yang menghormati prefers-reduced-motion,
 * dan menggunakan token semantik bg-line/70 di light mode dan bg-surface-raised di dark mode.
 */
export function Skeleton({
  variant = 'text',
  width,
  height,
  className = '',
  style,
  ...props
}: SkeletonProps) {
  let variantClass = 'rounded-md'
  if (variant === 'circle') {
    variantClass = 'rounded-full'
  } else if (variant === 'rect') {
    variantClass = 'rounded-xl'
  }

  const computedStyle: React.CSSProperties = {
    width,
    height,
    ...style,
  }

  return (
    <div
      aria-hidden="true"
      style={computedStyle}
      className={`animate-pulse motion-reduce:animate-none bg-line/80 dark:bg-surface-raised ${variantClass} ${className}`}
      {...props}
    />
  )
}

export interface SkeletonContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  screenReaderText?: string
}

/**
 * Wadah Skeleton pembungkus untuk aksesibilitas layar.
 * Menandai aria-busy="true" dan menyediakan teks tersembunyi bagi pembaca layar (screen reader).
 */
export function SkeletonContainer({
  children,
  screenReaderText = 'Memuat...',
  className = '',
  ...props
}: SkeletonContainerProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      className={`skeleton-container ${className}`}
      {...props}
    >
      <span className="sr-only">{screenReaderText}</span>
      {children}
    </div>
  )
}

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
