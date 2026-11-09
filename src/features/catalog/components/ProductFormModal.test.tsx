import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ProductFormModal } from './ProductFormModal'
import { ProductCard } from './ProductCard'
import { toastStore } from '@/components/ui/toast-store'
import type { Product } from '../types'

// Form produk memakai TanStack Query untuk unggah foto.
const render = (ui: ReactElement) =>
  renderToStaticMarkup(<QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>)

describe('ProductFormModal & ProductCard Component Tests', () => {
  beforeEach(() => {
    toastStore.dismissAll()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    toastStore.dismissAll()
  })

  it('merender modal form produk dengan input nama, harga titip, dan masa simpan', () => {
    const html = render(
      <ProductFormModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    )

    expect(html).toContain('Tambah Produk Baru')
    expect(html).toContain('Nama Produk')
    expect(html).toContain('Harga Titip / Modal Konsinyasi (Rp)')
    expect(html).toContain('Masa Simpan (Hari)')
    expect(html).toContain('Status Produk Aktif')
    expect(html).toContain('Foto produk')
    expect(html).toContain('Ambil dari kamera')
  })

  it('merender mode edit saat initialData disediakan', () => {
    const initialProduct: Product = {
      id: 'p-1',
      name: 'Keripik Tempe Renyah',
      consignPrice: 8000,
      retailPrice: 10000,
      shelfLifeDays: 45,
      isActive: true,
    }

    const html = render(
      <ProductFormModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        initialData={initialProduct}
      />
    )

    expect(html).toContain('Ubah Data Produk')
    expect(html).toContain('Simpan Perubahan')
    expect(html).toContain('Keripik Tempe Renyah')
  })

  it('merender ProductCard dengan nama, badge status, nominal rupiah, dan tombol aksi', () => {
    const mockProduct: Product = {
      id: 'p-10',
      name: 'Keripik Singkong Pedas Manis',
      consignPrice: 10000,
      retailPrice: 13000,
      shelfLifeDays: 60,
      isActive: true,
    }

    const html = render(
      <ProductCard
        product={mockProduct}
        onEdit={vi.fn()}
        onToggleStatus={vi.fn()}
      />
    )

    expect(html).toContain('Keripik Singkong Pedas Manis')
    expect(html).toContain('Aktif')
    expect(html).toContain('60 hari')
    expect(html).toContain('Ubah Data')
    expect(html).toContain('Nonaktifkan')
  })
})
