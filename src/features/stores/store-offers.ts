import { useState, useEffect, useCallback } from 'react'

export interface StoreOffer {
  id: string
  storeId: string
  storeName: string
  storeCategory: string
  storeOwnerName: string
  storeWhatsapp: string
  storeAddress: string
  storePhotoUrl?: string
  targetBusinessName: string
  message: string
  shelfLocation: string
  estimatedCapacity: string
  offeredAt: string
  status: 'pending' | 'accepted' | 'rejected'
  respondedAt?: string
}

export const STORE_OFFERS_STORAGE_KEY = 'titipku_store_offers_v2'

export const INITIAL_STORE_OFFERS: StoreOffer[] = [
  {
    id: 'offer-001',
    storeId: 'store-berkah-01',
    storeName: 'Toko Kelontong Berkah Jaya',
    storeCategory: 'kelontong',
    storeOwnerName: 'Bapak H. Subagyo',
    storeWhatsapp: '6281234455667',
    storeAddress: 'Jl. Raya Mulyosari No. 88, Surabaya Timur',
    targetBusinessName: 'Keripik Pisang Rina',
    message:
      'Halo Bu Rina, toko kami di pertigaan ramai Mulyosari dekat perumahan dan sekolah. Kami berminat menampung keripik pisang cokelat dan aneka snack Anda di rak depan kasir dengan sistem konsinyasi mingguan.',
    shelfLocation: 'Rak Depan Kasir Utama',
    estimatedCapacity: '25-35 bungkus',
    offeredAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(), // 35 mnt lalu
    status: 'pending',
  },
  {
    id: 'offer-002',
    storeId: 'store-barokah-02',
    storeName: 'Warung Madura Barokah 24 Jam',
    storeCategory: 'warung',
    storeOwnerName: 'Cak Mahmud',
    storeWhatsapp: '6285799881122',
    storeAddress: 'Jl. Raya Jemursari No. 12, Surabaya Selatan',
    targetBusinessName: 'Keripik Pisang Rina',
    message:
      'Warung kami buka 24 jam dengan trafik pembeli malam yang ramai. Sangat cocok untuk produk keripik singkong pedas dan keripik pisang Anda.',
    shelfLocation: 'Etalase Kaca Depan',
    estimatedCapacity: '20 bungkus',
    offeredAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 jam lalu
    status: 'pending',
  },
  {
    id: 'offer-003',
    storeId: 'store-kopi-03',
    storeName: 'Kafe & Roastery Kopi Pojok',
    storeCategory: 'kafe',
    storeOwnerName: 'Mas Dika Pratama',
    storeWhatsapp: '6281377889900',
    storeAddress: 'Jl. Tunjungan No. 42, Surabaya Pusat',
    targetBusinessName: 'Keripik Pisang Rina',
    message:
      'Kafe kami butuh snack pendamping kopi untuk nongkrong anak muda. Tertarik titip keripik pisang cokelat lumer.',
    shelfLocation: 'Meja Kasir Bar Kopi',
    estimatedCapacity: '15 bungkus',
    offeredAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // Kemarin
    status: 'accepted',
    respondedAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
  },
  {
    id: 'offer-004',
    storeId: 'store-endang-04',
    storeName: 'Warung Makan Bu Endang',
    storeCategory: 'warung',
    storeOwnerName: 'Ibu Endang Sri',
    storeWhatsapp: '6282133221100',
    storeAddress: 'Jl. Manukan Tama No. 15, Surabaya Barat',
    targetBusinessName: 'Keripik Pisang Rina',
    message: 'Ingin titip peyek dan kerupuk.',
    shelfLocation: 'Rak Samping Meja Makan',
    estimatedCapacity: '10 toples',
    offeredAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    status: 'rejected',
    respondedAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
  },
]

export function loadStoreOffers(): StoreOffer[] {
  try {
    const raw = localStorage.getItem(STORE_OFFERS_STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(STORE_OFFERS_STORAGE_KEY, JSON.stringify(INITIAL_STORE_OFFERS))
      return INITIAL_STORE_OFFERS
    }
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed
    }
    return INITIAL_STORE_OFFERS
  } catch {
    return INITIAL_STORE_OFFERS
  }
}

export function useStoreOffers() {
  const [offers, setOffers] = useState<StoreOffer[]>(loadStoreOffers)

  useEffect(() => {
    const handleStorageChange = () => {
      setOffers(loadStoreOffers())
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const persist = useCallback((updater: (prev: StoreOffer[]) => StoreOffer[]) => {
    setOffers((prev) => {
      const next = updater(prev)
      try {
        localStorage.setItem(STORE_OFFERS_STORAGE_KEY, JSON.stringify(next))
      } catch (err) {
        console.error('Failed to save store offers:', err)
      }
      return next
    })
  }, [])

  // Fungsi Role Penitip: MENYETUJUI tawaran toko (Approval)
  const approveOffer = useCallback(
    (offerId: string) => {
      persist((prev) =>
        prev.map((o) =>
          o.id === offerId
            ? {
                ...o,
                status: 'accepted',
                respondedAt: new Date().toISOString(),
              }
            : o
        )
      )
    },
    [persist]
  )

  // Fungsi Role Penitip: MENOLAK tawaran toko (Reject)
  const rejectOffer = useCallback(
    (offerId: string) => {
      persist((prev) =>
        prev.map((o) =>
          o.id === offerId
            ? {
                ...o,
                status: 'rejected',
                respondedAt: new Date().toISOString(),
              }
            : o
        )
      )
    },
    [persist]
  )

  // Fungsi Role Toko: Mengirim tawaran baru ke penitip
  const createStoreOffer = useCallback(
    (newOffer: Omit<StoreOffer, 'id' | 'offeredAt' | 'status'>) => {
      const offer: StoreOffer = {
        ...newOffer,
        id: `offer-${Date.now()}`,
        offeredAt: new Date().toISOString(),
        status: 'pending',
      }
      persist((prev) => [offer, ...prev])
      return offer
    },
    [persist]
  )

  const pendingOffers = offers.filter((o) => o.status === 'pending')
  const acceptedOffers = offers.filter((o) => o.status === 'accepted')
  const rejectedOffers = offers.filter((o) => o.status === 'rejected')

  return {
    offers,
    pendingOffers,
    acceptedOffers,
    rejectedOffers,
    pendingCount: pendingOffers.length,
    approveOffer,
    rejectOffer,
    createStoreOffer,
  }
}
