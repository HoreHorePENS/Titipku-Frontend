import { describe, it, expect, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { PageContainer } from './PageContainer'
import { PageHeader } from './PageHeader'
import { StatCard, StatCardGrid } from './StatCard'
import { FilterBar } from './FilterBar'
import { Modal } from './Modal'

describe('Composite & Layout Shared Components', () => {
  it('merender PageContainer dengan lebar max-w-7xl dan padding responsif', () => {
    const html = renderToStaticMarkup(
      <PageContainer>
        <div>Konten Halaman</div>
      </PageContainer>
    )
    expect(html).toContain('max-w-7xl')
    expect(html).toContain('Konten Halaman')
  })

  it('merender PageHeader dengan tepat satu tag h1 dan slot actions', () => {
    const html = renderToStaticMarkup(
      <PageHeader
        title="Tagihan &amp; Piutang"
        description="Kelola nota tagihan warung mitra"
        actions={<button type="button">Tambah</button>}
      />
    )
    expect(html).toContain('<h1')
    expect(html).toContain('Tagihan &amp; Piutang')
    expect(html).toContain('Kelola nota tagihan warung mitra')
    expect(html).toContain('Tambah')
  })

  it('merender StatCard dengan label, angka metrik, dan hint', () => {
    const html = renderToStaticMarkup(
      <StatCardGrid columns={3}>
        <StatCard
          label="Total Piutang"
          value="Rp1.200.000"
          subValue="(3 warung)"
          tone="danger"
          hint="Perlu ditagih minggu ini"
        />
      </StatCardGrid>
    )
    expect(html).toContain('Total Piutang')
    expect(html).toContain('Rp1.200.000')
    expect(html).toContain('(3 warung)')
    expect(html).toContain('text-danger')
    expect(html).toContain('Perlu ditagih minggu ini')
  })

  it('merender FilterBar dengan input pencarian dan tab segmented filter', () => {
    const html = renderToStaticMarkup(
      <FilterBar
        searchValue="Pisang"
        onSearchChange={vi.fn()}
        tabs={[
          { value: 'all', label: 'Semua', count: 10 },
          { value: 'active', label: 'Aktif', count: 8 },
        ]}
        activeTab="all"
        onTabChange={vi.fn()}
      />
    )
    expect(html).toContain('value="Pisang"')
    expect(html).toContain('Semua')
    expect(html).toContain('10')
    expect(html).toContain('Aktif')
    expect(html).toContain('8')
  })

  it('merender Modal saat isOpen=true dengan dialog role dan aria-modal', () => {
    const html = renderToStaticMarkup(
      <Modal
        isOpen={true}
        onClose={vi.fn()}
        title="Ubah Data Warung"
        description="Perbarui informasi pemilik"
        footer={<button type="button">Simpan</button>}
      >
        <p>Form Isi</p>
      </Modal>
    )
    expect(html).toContain('role="dialog"')
    expect(html).toContain('aria-modal="true"')
    expect(html).toContain('Ubah Data Warung')
    expect(html).toContain('Form Isi')
    expect(html).toContain('Simpan')
  })

  it('tidak merender Modal saat isOpen=false', () => {
    const html = renderToStaticMarkup(
      <Modal
        isOpen={false}
        onClose={vi.fn()}
        title="Ubah Data Warung"
      >
        <p>Form Isi</p>
      </Modal>
    )
    expect(html).toBe('')
  })
})
