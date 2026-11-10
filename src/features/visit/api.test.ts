import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchVisits, fetchVisitDetail } from './api'
import * as apiClientModule from '@/lib/api-client'
import * as digitalInvoicesModule from '@/features/invoices/digital-invoices'

describe('fetchVisits Request Optimization (Eliminasi N+1)', () => {
  let callCount = 0
  const calledUrls: string[] = []

  beforeEach(() => {
    callCount = 0
    calledUrls.length = 0
    vi.spyOn(digitalInvoicesModule, 'getStoreDigitalInvoices').mockReturnValue([])

    // Mock apiClient
    vi.spyOn(apiClientModule, 'apiClient').mockImplementation(async (path: string) => {
      callCount++
      calledUrls.push(path)

      if (path.startsWith('/v1/visits?')) {
        // Return 10 visits
        return {
          data: Array.from({ length: 10 }, (_, i) => ({
            id: `visit-${i + 1}`,
            number: `N-261028-000${i + 1}`,
            partner_id: 'p-1',
            partner_name: 'Warung Barokah',
            visited_at: '2026-10-28T10:00:00Z',
            received_by: 'Bu Siti',
            total: 50000,
          })),
        }
      }

      if (path === '/v1/visits') {
        // Return 10 visits
        return {
          data: Array.from({ length: 10 }, (_, i) => ({
            id: `visit-${i + 1}`,
            number: `N-261028-000${i + 1}`,
            partner_id: `p-${i + 1}`,
            partner_name: `Warung ${i + 1}`,
            visited_at: '2026-10-28T10:00:00Z',
            received_by: 'Pemilik',
            total: 30000,
          })),
        }
      }

      if (path === '/v1/invoices') {
        return { data: [] }
      }

      if (path === '/v1/partners') {
        return { data: [] }
      }

      if (path.startsWith('/v1/visits/')) {
        return {
          data: {
            id: 'visit-1',
            number: 'N-261028-0001',
            partner_id: 'p-1',
            partner_name: 'Warung Barokah',
            visited_at: '2026-10-28T10:00:00Z',
            received_by: 'Bu Siti',
            total: 50000,
            items: [
              {
                id: 'it-1',
                product_id: 'prod-1',
                product_name: 'Keripik Pisang 100g',
                remaining: 5,
                returned: 0,
                new_drop: 10,
                sold: 5,
                stock_after: 15,
                unit_price: 10000,
                subtotal: 50000,
              },
            ],
          },
        }
      }

      return { data: [] }
    })
  })

  it('memastikan fetchVisits dengan N kunjungan hanya melakukan pemanggilan O(1) konstan (tanpa request per-item N+1)', async () => {
    // Dengan 10 kunjungan, implementasi lama melakukan 3 + 10 = 13 request HTTP.
    // Implementasi baru yang teroptimasi hanya melakukan 3 request paralel (visits, invoices, partners).
    const results = await fetchVisits()

    expect(results.length).toBe(10)
    expect(callCount).toBe(3) // 3 request O(1), bukan 13!
    expect(calledUrls).toEqual(['/v1/visits', '/v1/invoices', '/v1/partners'])
    expect(calledUrls.some((url) => url.startsWith('/v1/visits/visit-'))).toBe(false)
  })

  it('mengambil rincian produk secara on-demand hanya saat fetchVisitDetail dipanggil', async () => {
    const detail = await fetchVisitDetail('visit-1')

    expect(detail.id).toBe('visit-1')
    expect(detail.items.length).toBe(1)
    expect(calledUrls).toContain('/v1/visits/visit-1')
  })
})
