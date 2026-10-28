import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { AppLayout, NAV_ITEMS } from './AppLayout'

describe('AppLayout Shell & Navigation', () => {
  it('harus memuat tepat 5 item navigasi resmi', () => {
    expect(NAV_ITEMS.length).toBe(5)
    expect(NAV_ITEMS.map((item) => item.label)).toEqual([
      'Beranda',
      'Kunjungan',
      'Warung',
      'Tagihan',
      'Produk',
    ])
  })

  it('merender navigasi desktop (aside) dan navigasi mobile (nav bottom)', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/']}>
        <AppLayout />
      </MemoryRouter>
    )

    // Memeriksa keberadaan sidebar desktop
    expect(html).toContain('aria-label="Navigasi Utama Desktop"')
    expect(html).toContain('Titipku')
    expect(html).toContain('Bu Rina')
    expect(html).toContain('Keripik Pisang Rina')

    // Memeriksa keberadaan bottom navigation mobile
    expect(html).toContain('aria-label="Navigasi Bawah Mobile"')

    // Memeriksa 5 label navigasi muncul di dokumen
    NAV_ITEMS.forEach((item) => {
      expect(html).toContain(item.label)
    })
  })

  it('memiliki style --bottom-offset 76px untuk penempatan toast di atas bottom nav', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/']}>
        <AppLayout />
      </MemoryRouter>
    )

    expect(html).toContain('--bottom-offset:76px')
  })
})
