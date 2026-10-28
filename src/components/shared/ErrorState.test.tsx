import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { ErrorState } from './ErrorState'

describe('ErrorState Component', () => {
  it('merender tombol Coba lagi dan tanpa tombol Lihat data lama jika lastUpdatedAt tidak ada', () => {
    const html = renderToStaticMarkup(
      <ErrorState title="Gagal memuat tagihan" onRetry={() => {}} />
    )

    expect(html).toContain('Gagal memuat tagihan')
    expect(html).toContain('Coba lagi')
    expect(html).not.toContain('Lihat data lama')
    expect(html).toContain('role="alert"')
    expect(html).toContain('aria-live="assertive"')
  })

  it('menampilkan "Lihat data lama" dan waktu format WIB jika lastUpdatedAt ada', () => {
    // 00:12 UTC = 07:12 WIB
    const lastUpdated = new Date('2026-10-28T00:12:00.000Z')

    const html = renderToStaticMarkup(
      <ErrorState
        type="network"
        onRetry={() => {}}
        lastUpdatedAt={lastUpdated}
      />
    )

    expect(html).toContain('Gagal memuat tagihan')
    expect(html).toContain('Lihat data lama')
    expect(html).toContain('07.12')
    expect(html).toContain('Data terakhir dari 07.12 masih bisa dilihat.')
  })

  it('merender jenis kegagalan server dengan judul dan deskripsi default yang sesuai', () => {
    const html = renderToStaticMarkup(
      <ErrorState type="server" onRetry={() => {}} />
    )

    expect(html).toContain('Gangguan server')
    expect(html).toContain('Server Titipku sedang sibuk')
  })
})
