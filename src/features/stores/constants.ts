import type { StoreCategory } from './types'

export interface CategoryMeta {
  key: StoreCategory
  label: string
  // SVG Path data untuk ikon hitam putih minimalis
  svgPath: string
}

export const STORE_CATEGORIES_META: Record<StoreCategory, CategoryMeta> = {
  warung: {
    key: 'warung',
    label: 'Warung Makan',
    svgPath: 'M3 9l1-5h16l1 5v2H3V9zm0 4v7a1 1 0 001 1h16a1 1 0 001-1v-7H3zm7 4h4',
  },
  kelontong: {
    key: 'kelontong',
    label: 'Toko Kelontong',
    svgPath: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 6h13M9 21a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z',
  },
  kafe: {
    key: 'kafe',
    label: 'Kafe & Kopi',
    svgPath: 'M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zm4-5v3m4-3v3m4-3v3',
  },
  resto: {
    key: 'resto',
    label: 'Restoran',
    svgPath: 'M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2M7 2v20M21 15V2a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7',
  },
  minimarket: {
    key: 'minimarket',
    label: 'Minimarket',
    svgPath: 'M4 4h16v16H4V4zm4 4h2v2H8V8zm6 0h2v2h-2V8zm-6 4h2v2H8v-2zm6 0h2v2h-2v-2zm-6 4h8v4H8v-4z',
  },
  apotek: {
    key: 'apotek',
    label: 'Apotek',
    svgPath: 'M12 4v16m-8-8h16M7 3h10a4 4 0 014 4v10a4 4 0 01-4 4H7a4 4 0 01-4-4V7a4 4 0 014-4z',
  },
  roti: {
    key: 'roti',
    label: 'Toko Roti',
    svgPath: 'M12 3a9 9 0 00-9 9c0 3.3 1.8 6.2 4.5 7.7.8.5 1.8.8 2.8.8h3.4c1 0 2-.3 2.8-.8 2.7-1.5 4.5-4.4 4.5-7.7a9 9 0 00-9-9zm-4 7v4m4-5v6m4-5v4',
  },
  lainnya: {
    key: 'lainnya',
    label: 'Lainnya',
    svgPath: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  },
}

export function getCategoryMeta(category: string): CategoryMeta {
  const key = category as StoreCategory
  return STORE_CATEGORIES_META[key] || STORE_CATEGORIES_META.lainnya
}
