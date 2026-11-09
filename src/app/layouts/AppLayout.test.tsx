import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppLayout } from './AppLayout'
import { NAV_ITEMS, PEMILIK_TOKO_NAV_ITEMS } from './nav-items'

function renderLayout() {
  // Lonceng notifikasi memakai TanStack Query (data proposal asli).
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, enabled: false } } })
  return renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/']}>
        <AppLayout />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('AppLayout Shell & Navigation', () => {
  it('harus memuat tepat 5 item navigasi resmi', () => {
    expect(NAV_ITEMS.length).toBe(5)
    expect(NAV_ITEMS.map((item) => item.label)).toEqual([
      'Beranda',
      'Bukti Nota',
      'Toko Mitra',
      'Tagihan',
      'Produk',
    ])
  })

  it('harus memuat 3 item navigasi khusus pemilik toko termasuk penitip', () => {
    expect(PEMILIK_TOKO_NAV_ITEMS.length).toBe(3)
    expect(PEMILIK_TOKO_NAV_ITEMS.map((item) => item.label)).toEqual([
      'Beranda',
      'Penitip',
      'Toko Saya',
    ])
  })

  it('merender navigasi desktop (aside) dan navigasi mobile (nav bottom)', () => {
    const html = renderLayout()

    // Memeriksa keberadaan sidebar desktop
    expect(html).toContain('aria-label="Navigasi Utama Desktop"')
    expect(html).toContain('Titipku')
    // Tanpa data akun, tidak ada nama contoh (mis. 'Bu Rina') yang tampil.
    expect(html).not.toContain('Bu Rina')
    expect(html).not.toContain('Keripik Pisang Rina')
    expect(html).toContain('Usaha saya')

    // Memeriksa keberadaan bottom navigation mobile
    expect(html).toContain('aria-label="Navigasi Bawah Mobile"')

    // Memeriksa 5 label navigasi muncul di dokumen
    NAV_ITEMS.forEach((item) => {
      expect(html).toContain(item.label)
    })
  })

  it('memiliki style --bottom-offset 76px untuk penempatan toast di atas bottom nav', () => {
    const html = renderLayout()

    expect(html).toContain('--bottom-offset:76px')
  })
})
