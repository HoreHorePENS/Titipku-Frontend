import { describe, it, expect } from 'vitest'
import { mapProductResponse, type RawProductResponse } from './api'

describe('mapProductResponse', () => {
  it('memetakan respons snake_case dari backend ke objek camelCase domain frontend', () => {
    const raw: RawProductResponse = {
      id: 'prod-uuid-1',
      name: 'Keripik Pisang Keju',
      photo_path: 'https://cdn.example.com/keju.jpg',
      consign_price: 13000,
      retail_price: 16000,
      shelf_life_days: 45,
      is_active: true,
      created_at: '2026-11-01T10:00:00Z',
      updated_at: '2026-11-02T10:00:00Z',
    }

    const domain = mapProductResponse(raw)
    expect(domain.id).toBe('prod-uuid-1')
    expect(domain.name).toBe('Keripik Pisang Keju')
    expect(domain.photoPath).toBe('https://cdn.example.com/keju.jpg')
    expect(domain.consignPrice).toBe(13000)
    expect(domain.retailPrice).toBe(16000)
    expect(domain.shelfLifeDays).toBe(45)
    expect(domain.isActive).toBe(true)
  })
})
