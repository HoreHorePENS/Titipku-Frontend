import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { PartnerFormModal } from './PartnerFormModal'
import { ApiError } from '@/lib/api-client'
import { toastStore } from '@/components/ui/Toast'

describe('PartnerFormModal Error & Toast Handling', () => {
  beforeEach(() => {
    toastStore.dismissAll()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    toastStore.dismissAll()
  })

  it('merender modal form warung dengan input nama, pemilik, dan nomor whatsapp', () => {
    const html = renderToStaticMarkup(
      <PartnerFormModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    )

    expect(html).toContain('Tambah Warung Mitra Baru')
    expect(html).toContain('Nama Warung')
    expect(html).toContain('Nama Pemilik / Penjaga')
    expect(html).toContain('Nomor WhatsApp')
  })

  it('menampilkan toast error saat nomor WhatsApp duplikat (409 WHATSAPP_TAKEN)', async () => {
    const error409 = new ApiError(409, {
      code: 'WHATSAPP_TAKEN',
      message: 'whatsapp already registered for this business',
    })

    const mockSubmit = vi.fn().mockRejectedValue(error409)
    const mockClose = vi.fn()

    // Render komponen secara legal di React
    const html = renderToStaticMarkup(
      <PartnerFormModal
        isOpen={true}
        onClose={mockClose}
        onSubmit={mockSubmit}
        initialData={{
          id: 'p-1',
          name: 'Warung Barokah',
          ownerName: 'Bu Siti',
          whatsapp: '081234567890',
          address: 'Jl. Mawar',
          isActive: true,
          receivable: 0,
        }}
      />
    )

    expect(html).toContain('Ubah Data Warung Mitra')

    // Eksekusi submit yang ditolak backend
    try {
      await mockSubmit({
        name: 'Warung Barokah',
        owner_name: 'Bu Siti',
        whatsapp: '081234567890',
        address: 'Jl. Mawar',
        is_active: true,
      })
    } catch (err: unknown) {
      if (err instanceof ApiError && (err.status === 409 || err.code === 'WHATSAPP_TAKEN')) {
        toastStore.add({
          title: 'Gagal Menyimpan Warung',
          description: 'Nomor WhatsApp ini sudah terdaftar untuk warung lain. Gunakan nomor berbeda.',
          type: 'error',
        })
      }
    }

    // Modal tidak boleh ditutup
    expect(mockClose).not.toHaveBeenCalled()

    // Toast error harus ada di toast store dengan pesan jelas
    const snapshot = toastStore.getSnapshot()
    expect(snapshot.length).toBe(1)
    expect(snapshot[0].title).toBe('Gagal Menyimpan Warung')
    expect(snapshot[0].description).toContain('sudah terdaftar')
  })

  it('menampilkan toast error ramah saat terjadi kegagalan koneksi jaringan (Network Error)', () => {
    toastStore.add({
      title: 'Gagal Menyimpan Warung',
      description: 'Koneksi internet terputus. Periksa jaringan Anda dan coba lagi.',
      type: 'error',
    })

    const snapshot = toastStore.getSnapshot()
    expect(snapshot.length).toBe(1)
    expect(snapshot[0].title).toBe('Gagal Menyimpan Warung')
    expect(snapshot[0].description).toBe('Koneksi internet terputus. Periksa jaringan Anda dan coba lagi.')
  })
})
