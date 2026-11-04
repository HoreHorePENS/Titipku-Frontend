import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { setAuthToken } from '@/lib/api-client'

describe('ProtectedRoute Guard', () => {
  beforeEach(() => {
    setAuthToken(null)
  })

  afterEach(() => {
    setAuthToken(null)
  })

  it('mengalihkan pengguna tanpa token ke halaman /auth', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/kunjungan']}>
        <Routes>
          <Route
            element={
              <ProtectedRoute>
                <div>Konten Rahasia Kunjungan</div>
              </ProtectedRoute>
            }
          >
            <Route path="/kunjungan" element={<div>Konten Rahasia Kunjungan</div>} />
          </Route>
          <Route path="/auth" element={<div>Halaman Login Auth</div>} />
        </Routes>
      </MemoryRouter>
    )

    // Pengguna belum login, konten privat tidak boleh dirender
    expect(html).not.toContain('Konten Rahasia Kunjungan')
  })

  it('merender konten anak jika pengguna telah memiliki token autentikasi', () => {
    setAuthToken('dummy-jwt-token')

    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/kunjungan']}>
        <Routes>
          <Route
            element={
              <ProtectedRoute>
                <div>Konten Rahasia Kunjungan</div>
              </ProtectedRoute>
            }
          >
            <Route path="/kunjungan" element={<div>Konten Rahasia Kunjungan</div>} />
          </Route>
          <Route path="/auth" element={<div>Halaman Login Auth</div>} />
        </Routes>
      </MemoryRouter>
    )

    // Pengguna sudah login, konten privat harus berhasil dirender
    expect(html).toContain('Konten Rahasia Kunjungan')
  })
})
