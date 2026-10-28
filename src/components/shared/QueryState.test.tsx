import { describe, it, expect, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { QueryState } from './QueryState'

describe('QueryState Component', () => {
  it('1. State Error: menampilkan error state jika query.isError true', () => {
    const query = {
      isPending: false,
      isError: true,
      error: new Error('Network error'),
      refetch: vi.fn(),
    }

    const html = renderToStaticMarkup(
      <QueryState
        query={query}
        loadingComponent={<div id="skeleton">Skeleton</div>}
      >
        <div>Konten Asli</div>
      </QueryState>
    )

    expect(html).toContain('role="alert"')
    expect(html).toContain('Gagal memuat tagihan')
    expect(html).toContain('Coba lagi')
    expect(html).not.toContain('Konten Asli')
  })

  it('2. State Kosong: menampilkan emptyComponent saat data array kosong', () => {
    const query = {
      isPending: false,
      isError: false,
      data: [],
    }

    const html = renderToStaticMarkup(
      <QueryState
        query={query}
        loadingComponent={<div id="skeleton">Skeleton</div>}
        emptyComponent={<div id="empty">Belum ada warung mitra</div>}
      >
        <div>Konten Asli</div>
      </QueryState>
    )

    expect(html).toContain('Belum ada warung mitra')
    expect(html).not.toContain('Konten Asli')
  })

  it('3. State Sukses (Ada Data): merender children dengan data yang tepat', () => {
    interface Outlet {
      id: string
      name: string
    }

    const query = {
      isPending: false,
      isError: false,
      data: [{ id: 'w1', name: 'Warung Bu Sri' }],
    }

    const html = renderToStaticMarkup(
      <QueryState<Outlet[]>
        query={query}
        loadingComponent={<div>Skeleton</div>}
        emptyComponent={<div>Kosong</div>}
      >
        {(outlets) => (
          <div>
            {outlets.map((o) => (
              <span key={o.id}>{o.name}</span>
            ))}
          </div>
        )}
      </QueryState>
    )

    expect(html).toContain('Warung Bu Sri')
    expect(html).not.toContain('Kosong')
    expect(html).not.toContain('Skeleton')
  })

  it('4. Custom Error Component dapat disuplai', () => {
    const query = {
      isPending: false,
      isError: true,
      error: 'Custom error',
    }

    const html = renderToStaticMarkup(
      <QueryState
        query={query}
        loadingComponent={<div>Skeleton</div>}
        errorComponent={(err) => <div>Terjadi: {String(err)}</div>}
      >
        <div>Konten</div>
      </QueryState>
    )

    expect(html).toContain('Terjadi: Custom error')
  })
})
