import { useState, useEffect, useCallback } from 'react'

export interface PenitipProductItem {
  id: string
  name: string
  category: string
  consignPrice: number // Harga titip / modal
  suggestedRetailPrice: number // Saran harga jual
  unit: string
  shelfLife: string // Daya tahan
}

export interface PenitipBusiness {
  id: string
  businessName: string
  ownerName: string
  category: string
  city: string
  address: string
  whatsapp: string
  photoUrl?: string
  description: string
  topProducts: PenitipProductItem[]
  // Status tawaran dari toko saat ini ke bisnis penitip ini
  offerStatus: 'none' | 'pending' | 'accepted' | 'rejected'
  offerMessage?: string
  offeredAt?: string
}

export type PenitipCategory =
  | 'all'
  | 'snack'
  | 'kue'
  | 'sambal'
  | 'frozen'
  | 'minuman'
  | 'lainnya'

export const PENITIP_CATEGORIES: { key: PenitipCategory; label: string }[] = [
  { key: 'all', label: 'Semua Kategori' },
  { key: 'snack', label: 'Snack & Keripik' },
  { key: 'kue', label: 'Kue & Roti' },
  { key: 'sambal', label: 'Sambal & Bumbu' },
  { key: 'frozen', label: 'Makanan Beku' },
  { key: 'minuman', label: 'Minuman Segar' },
]

export const PENITIP_STORAGE_KEY = 'titipku_penitip_businesses_v1'

export const INITIAL_PENITIP_BUSINESSES: PenitipBusiness[] = [
  {
    id: 'penitip-001',
    businessName: 'Keripik Pisang & Aneka Snack Bu Rina',
    ownerName: 'Ibu Rina Rahmawati',
    category: 'snack',
    city: 'Surabaya Timur',
    address: 'Jl. Rungkut Asri Timur No. 18, Surabaya',
    whatsapp: '6281234567890',
    description:
      'Produsen keripik pisang aneka rasa (cokelat lumer, keju manis, balado) dan keripik singkong renyah. Kemasan standing pouch bersegel rapi, tahan 3 bulan.',
    topProducts: [
      {
        id: 'p-101',
        name: 'Keripik Pisang Cokelat Lumer 150g',
        category: 'Snack & Keripik',
        consignPrice: 12000,
        suggestedRetailPrice: 15000,
        unit: 'bungkus',
        shelfLife: '90 hari',
      },
      {
        id: 'p-102',
        name: 'Keripik Pisang Keju Gurih 150g',
        category: 'Snack & Keripik',
        consignPrice: 12000,
        suggestedRetailPrice: 15000,
        unit: 'bungkus',
        shelfLife: '90 hari',
      },
      {
        id: 'p-103',
        name: 'Keripik Singkong Pedas Manis 200g',
        category: 'Snack & Keripik',
        consignPrice: 10000,
        suggestedRetailPrice: 13000,
        unit: 'bungkus',
        shelfLife: '60 hari',
      },
    ],
    offerStatus: 'none',
  },
  {
    id: 'penitip-002',
    businessName: 'Kue Basah & Jajanan Tradisional Bu Mimin',
    ownerName: 'Ibu Mimin Sunarti',
    category: 'kue',
    city: 'Surabaya Selatan',
    address: 'Jl. Wonokromo Tangkis No. 45, Surabaya',
    whatsapp: '6285712345678',
    description:
      'Spesialis kue lapis legit potong, lemper bakar ayam suwir, dan aneka jajanan pasar higienis. Pengiriman pagi hari sebelum toko buka.',
    topProducts: [
      {
        id: 'p-201',
        name: 'Lapis Legit Mini Potong (Mika Isi 10)',
        category: 'Kue & Roti',
        consignPrice: 16000,
        suggestedRetailPrice: 20000,
        unit: 'mika',
        shelfLife: '3 hari',
      },
      {
        id: 'p-202',
        name: 'Lemper Bakar Ayam Suwir Spesial',
        category: 'Kue & Roti',
        consignPrice: 3500,
        suggestedRetailPrice: 5000,
        unit: 'buah',
        shelfLife: '2 hari',
      },
    ],
    offerStatus: 'none',
  },
  {
    id: 'penitip-003',
    businessName: 'Sambal Bu Rudy Asli Surabaya',
    ownerName: 'Pak Rudy',
    category: 'sambal',
    city: 'Surabaya Pusat',
    address: 'Jl. Dharmahusada No. 140, Surabaya',
    whatsapp: '6281398765432',
    description:
      'Sambal bawang dan sambal terasi legendaris Surabaya dalam kemasan botol segel aluminium foil. Sangat dicari wisatawan dan pelanggan toko kelontong.',
    topProducts: [
      {
        id: 'p-301',
        name: 'Sambal Bawang Botol Segel 130g',
        category: 'Sambal & Bumbu',
        consignPrice: 25000,
        suggestedRetailPrice: 30000,
        unit: 'botol',
        shelfLife: '180 hari',
      },
      {
        id: 'p-302',
        name: 'Sambal Terasi Udang Khas 130g',
        category: 'Sambal & Bumbu',
        consignPrice: 26000,
        suggestedRetailPrice: 32000,
        unit: 'botol',
        shelfLife: '180 hari',
      },
    ],
    offerStatus: 'accepted',
    offerMessage: 'Toko kami sangat strategis di dekat perumahan dan kampus.',
    offeredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: 'penitip-004',
    businessName: 'Mak Siti Peyek Renyah & Keripik Tempe',
    ownerName: 'Ibu Siti Aminah',
    category: 'snack',
    city: 'Surabaya Barat',
    address: 'Jl. Manukan Kulon No. 12, Surabaya',
    whatsapp: '6281298877665',
    description:
      'Peyek kacang tanah renyah beraroma daun jeruk asli dan keripik tempe gurih khas Malang. Kemasan toples kedap udara dan plastik tebal tahan renyah.',
    topProducts: [
      {
        id: 'p-401',
        name: 'Peyek Kacang Renyah Daun Jeruk 200g',
        category: 'Snack & Keripik',
        consignPrice: 15000,
        suggestedRetailPrice: 18500,
        unit: 'toples',
        shelfLife: '45 hari',
      },
      {
        id: 'p-402',
        name: 'Keripik Tempe Sagu Bumbu Gurih 150g',
        category: 'Snack & Keripik',
        consignPrice: 11000,
        suggestedRetailPrice: 14000,
        unit: 'bungkus',
        shelfLife: '60 hari',
      },
    ],
    offerStatus: 'none',
  },
  {
    id: 'penitip-005',
    businessName: 'Dapur Bunda Risoles & Pastel Frozen',
    ownerName: 'Ibu Ratna Dewi',
    category: 'frozen',
    city: 'Surabaya Timur',
    address: 'Jl. Kalidami No. 27, Surabaya',
    whatsapp: '6287812998877',
    description:
      'Risoles mayones daging asap, pastel sayur telur, dan kroket kentang kemasan beku siap goreng (isi 5-10 pcs per pack). Cocok untuk toko yang memiliki freezer mini.',
    topProducts: [
      {
        id: 'p-501',
        name: 'Risoles Mayo Smoked Beef (Pack 5 pcs)',
        category: 'Makanan Beku',
        consignPrice: 18000,
        suggestedRetailPrice: 22500,
        unit: 'pack',
        shelfLife: '30 hari (freezer)',
      },
      {
        id: 'p-502',
        name: 'Pastel Sayur Telur Gurih (Pack 5 pcs)',
        category: 'Makanan Beku',
        consignPrice: 16000,
        suggestedRetailPrice: 20000,
        unit: 'pack',
        shelfLife: '30 hari (freezer)',
      },
    ],
    offerStatus: 'pending',
    offerMessage:
      'Warung kami memiliki freezer etalase depan toko yang sangat cocok untuk frozen food ibu.',
    offeredAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
  },
  {
    id: 'penitip-006',
    businessName: 'Bakpia Pathok & Pastry Ibu Tien',
    ownerName: 'Mas Bambang Wicaksono',
    category: 'kue',
    city: 'Surabaya Utara',
    address: 'Jl. Perak Barat No. 89, Surabaya',
    whatsapp: '6287811223344',
    description:
      'Bakpia basah dan kering lembut isi kacang hijau kupas, cokelat lumer, dan keju spesial. Kotak kemasan elegan isi 10 dan 15 pcs.',
    topProducts: [
      {
        id: 'p-601',
        name: 'Bakpia Basah Kacang Hijau (Kotak Isi 10)',
        category: 'Kue & Roti',
        consignPrice: 22000,
        suggestedRetailPrice: 28000,
        unit: 'kotak',
        shelfLife: '7 hari',
      },
      {
        id: 'p-602',
        name: 'Bakpia Kering Keju & Cokelat (Kotak Isi 15)',
        category: 'Kue & Roti',
        consignPrice: 28000,
        suggestedRetailPrice: 35000,
        unit: 'kotak',
        shelfLife: '21 hari',
      },
    ],
    offerStatus: 'none',
  },
  {
    id: 'penitip-007',
    businessName: 'Madu Randu Asli & Minuman Herbal Segar',
    ownerName: 'Bapak Joko Santoso',
    category: 'minuman',
    city: 'Surabaya Selatan',
    address: 'Jl. Jemursari Selatan No. 34, Surabaya',
    whatsapp: '6282133445566',
    description:
      'Madu murni nektar bunga randu dari peternak lokal Jawa Timur dan minuman sinom / beras kencur botolan tanpa pemanis buatan.',
    topProducts: [
      {
        id: 'p-701',
        name: 'Madu Murni Randu Asli Botol 250ml',
        category: 'Minuman Segar',
        consignPrice: 40000,
        suggestedRetailPrice: 50000,
        unit: 'botol',
        shelfLife: '360 hari',
      },
      {
        id: 'p-702',
        name: 'Sinom Segar Tradisional Dingin 330ml',
        category: 'Minuman Segar',
        consignPrice: 5000,
        suggestedRetailPrice: 7000,
        unit: 'botol',
        shelfLife: '5 hari (chiller)',
      },
    ],
    offerStatus: 'none',
  },
  {
    id: 'penitip-008',
    businessName: 'Kerupuk Ikan & Terung Kenjeran Cak Hasan',
    ownerName: 'Cak Hasan Basri',
    category: 'snack',
    city: 'Surabaya Timur',
    address: 'Jl. Kenjeran Lor No. 56, Surabaya',
    whatsapp: '6285299887711',
    description:
      'Olahan kerupuk ikan tenggiri asli Kenjeran, kerupuk terung gurih, dan keripik lorjuk khas pesisir pantai timur Surabaya.',
    topProducts: [
      {
        id: 'p-801',
        name: 'Kerupuk Ikan Tenggiri Bulat 150g',
        category: 'Snack & Keripik',
        consignPrice: 13000,
        suggestedRetailPrice: 16500,
        unit: 'bungkus',
        shelfLife: '90 hari',
      },
      {
        id: 'p-802',
        name: 'Kerupuk Kulit Ikan Kakap Renyah 100g',
        category: 'Snack & Keripik',
        consignPrice: 15000,
        suggestedRetailPrice: 19000,
        unit: 'bungkus',
        shelfLife: '60 hari',
      },
    ],
    offerStatus: 'none',
  },
]

export function loadBusinesses(): PenitipBusiness[] {
  try {
    const raw = localStorage.getItem(PENITIP_STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(PENITIP_STORAGE_KEY, JSON.stringify(INITIAL_PENITIP_BUSINESSES))
      return INITIAL_PENITIP_BUSINESSES
    }
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed
    }
    return INITIAL_PENITIP_BUSINESSES
  } catch {
    return INITIAL_PENITIP_BUSINESSES
  }
}

export function usePenitipBusinesses() {
  const [businesses, setBusinesses] = useState<PenitipBusiness[]>(loadBusinesses)

  useEffect(() => {
    const handleStorageChange = () => {
      setBusinesses(loadBusinesses())
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const persist = useCallback((updater: (prev: PenitipBusiness[]) => PenitipBusiness[]) => {
    setBusinesses((prev) => {
      const next = updater(prev)
      try {
        localStorage.setItem(PENITIP_STORAGE_KEY, JSON.stringify(next))
      } catch (err) {
        console.error('Failed to save penitip businesses:', err)
      }
      return next
    })
  }, [])

  // Fungsi toko menawari penitip
  const sendOfferToPenitip = useCallback(
    (businessId: string, message?: string) => {
      persist((prev) =>
        prev.map((biz) =>
          biz.id === businessId
            ? {
                ...biz,
                offerStatus: 'pending',
                offerMessage: message?.trim() || undefined,
                offeredAt: new Date().toISOString(),
              }
            : biz
        )
      )
    },
    [persist]
  )

  // Fungsi membatalkan tawaran
  const cancelOffer = useCallback(
    (businessId: string) => {
      persist((prev) =>
        prev.map((biz) =>
          biz.id === businessId
            ? {
                ...biz,
                offerStatus: 'none',
                offerMessage: undefined,
                offeredAt: undefined,
              }
            : biz
        )
      )
    },
    [persist]
  )

  // Fungsi persetujuan dua arah (respon penitip)
  const respondOffer = useCallback(
    (businessId: string, status: 'accepted' | 'rejected') => {
      persist((prev) =>
        prev.map((biz) =>
          biz.id === businessId
            ? {
                ...biz,
                offerStatus: status,
              }
            : biz
        )
      )
    },
    [persist]
  )

  const pendingOffersCount = businesses.filter((b) => b.offerStatus === 'pending').length
  const acceptedOffersCount = businesses.filter((b) => b.offerStatus === 'accepted').length

  return {
    businesses,
    sendOfferToPenitip,
    cancelOffer,
    respondOffer,
    pendingOffersCount,
    acceptedOffersCount,
  }
}
