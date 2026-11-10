import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppLayout } from './AppLayout'
import { NAV_ITEMS, PEMILIK_TOKO_NAV_ITEMS, activeNavItem } from './nav-items'

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
  it('harus memuat 6 item navigasi penitip termasuk Catat Kunjungan & Catat Tagihan', () => {
    expect(NAV_ITEMS.length).toBe(6)
    expect(NAV_ITEMS.map((item) => item.label)).toEqual([
      'Beranda',
      'Catat Kunjungan',
      'Bukti Nota',
      'Toko Mitra',
      'Catat Tagihan',
      'Produk',
    ])
  })

  it('label mobile ringkas agar bottom nav tetap satu baris di 360px', () => {
    NAV_ITEMS.forEach((item) => {
      expect((item.shortLabel ?? item.label).length).toBeLessThanOrEqual(9)
    })
  })

  it('menyalakan menu paling spesifik untuk path aktif', () => {
    expect(activeNavItem(NAV_ITEMS, '/kunjungan/baru')?.label).toBe('Catat Kunjungan')
    expect(activeNavItem(NAV_ITEMS, '/visit/new')?.label).toBe('Catat Kunjungan')
    expect(activeNavItem(NAV_ITEMS, '/kunjungan')?.label).toBe('Bukti Nota')
    expect(activeNavItem(NAV_ITEMS, '/kunjungan/abc-123')?.label).toBe('Bukti Nota')
    expect(activeNavItem(NAV_ITEMS, '/home')?.label).toBe('Beranda')
    expect(activeNavItem(NAV_ITEMS, '/tagihan')?.label).toBe('Catat Tagihan')
    expect(activeNavItem(NAV_ITEMS, '/peta')).toBeUndefined()
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

    // Semua label navigasi muncul di dokumen (desktop: label penuh)
    NAV_ITEMS.forEach((item) => {
      expect(html).toContain(item.label)
    })
  })

  it('memiliki style --bottom-offset 76px untuk penempatan toast di atas bottom nav', () => {
    const html = renderLayout()

    expect(html).toContain('--bottom-offset:76px')
  })
})
