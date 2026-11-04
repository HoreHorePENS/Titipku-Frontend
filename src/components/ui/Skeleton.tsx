import React from 'react'

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
