import React from 'react'

interface PublicLayoutProps {
  children?: React.ReactNode
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div
      className="public-layout min-h-screen flex flex-col"
      style={{ ['--bottom-offset' as string]: '16px' }}
    >
      {/* Tanpa navigation (misal: untuk Nota Digital) */}
      <main className="flex-1">{children}</main>
    </div>
  )
}

export default PublicLayout
