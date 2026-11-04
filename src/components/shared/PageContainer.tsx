import type React from 'react'

export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  /** Tambahan padding bawah untuk memberi ruang bagi navigation bottom bar di mobile */
  withBottomNavPadding?: boolean
  /** Lebar maksimal kontainer halaman, default: '7xl' */
  maxWidth?: '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl'
}

const maxWidthClasses: Record<NonNullable<PageContainerProps['maxWidth']>, string> = {
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
}

/**
 * Wrapper halaman terstandarisasi untuk seluruh rute Titipku.
 * Menggunakan lebar terstandarisasi dengan padding responsif konsisten:
 * Mobile: px-4 py-5, Desktop: md:px-8 md:py-8
 */
export function PageContainer({
  children,
  className = '',
  withBottomNavPadding = true,
  maxWidth = '7xl',
  ...props
}: PageContainerProps) {
  return (
    <div
      className={`w-full ${maxWidthClasses[maxWidth]} mx-auto px-4 py-5 md:px-8 md:py-8 flex flex-col gap-5 sm:gap-6 font-sans ${
        withBottomNavPadding ? 'pb-24 md:pb-12' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
