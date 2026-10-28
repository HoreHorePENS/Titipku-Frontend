import { describe, it, expect, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { EmptyState } from './EmptyState'

describe('EmptyState Component', () => {
  it('merender judul, deskripsi, ilustrasi, dan tombol aksi utama', () => {
    const handleAction = vi.fn()
    const html = renderToStaticMarkup(
      <EmptyState
        title="Belum ada warung mitra"
        description="Tambahkan warung pertama untuk mulai mencatat titipan dan menagih dengan rapi."
        action={{ label: 'Tambah Warung', onClick: handleAction }}
      />
    )

    expect(html).toContain('Belum ada warung mitra')
    expect(html).toContain(
      'Tambahkan warung pertama untuk mulai mencatat titipan dan menagih dengan rapi.'
    )
    expect(html).toContain('Tambah Warung')
    expect(html).toContain('role="region"')
    expect(html).toContain('aria-label="Belum ada warung mitra"')
  })

  it('merender aksi sekunder jika disediakan', () => {
    const html = renderToStaticMarkup(
      <EmptyState
        title="Belum ada warung mitra"
        description="Deskripsi"
        action={{ label: 'Tambah Warung', onClick: () => {} }}
        secondaryAction={{ label: 'Impor dari daftar kontak', onClick: () => {} }}
      />
    )

    expect(html).toContain('Impor dari daftar kontak')
  })

  it('merender ukuran inline dengan padding dan border kartu', () => {
    const html = renderToStaticMarkup(
      <EmptyState
        size="inline"
        title="Data Kosong"
        description="Deskripsi inline"
        action={{ label: 'Aksi Cepat', onClick: () => {} }}
      />
    )

    expect(html).toContain('bg-surface')
    expect(html).toContain('border-line')
  })
})
