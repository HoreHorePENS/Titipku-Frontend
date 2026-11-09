import { useState, useEffect, useCallback } from 'react'

export interface ConsignmentRequestItem {
  id: string
  productName: string
  category: string
  qty: number
  unit: string
  consignPrice: number // Modal harga titip
  suggestedRetailPrice: number // Saran harga jual konsumen
}

export interface ConsignmentRequest {
  id: string
  producerUserId?: string
  producerRole: 'penitip'
  producerBusinessName: string
  producerOwnerName: string
  producerWhatsapp: string
  producerCity: string
  submittedAt: string
  status: 'pending' | 'accepted' | 'rejected'
  note?: string
  items: ConsignmentRequestItem[]
}

const STORAGE_KEY = 'titipku_store_consignment_requests_v2'

const INITIAL_REQUESTS: ConsignmentRequest[] = [
  {
    id: 'req-001',
    producerUserId: 'user-pnt-001',
    producerRole: 'penitip',
    producerBusinessName: 'Keripik Pisang Rina',
    producerOwnerName: 'Ibu Rina Rahmawati',
    producerWhatsapp: '081234567890',
    producerCity: 'Surabaya Timur',
    submittedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 menit lalu
    status: 'pending',
    note: 'Halo Bu, kami ingin menitipkan keripik pisang aneka rasa varian cokelat dan keju untuk etalase depan kasir. Kemasan standing pouch rapi, tahan 3 bulan.',
    items: [
      {
        id: 'item-1',
        productName: 'Keripik Pisang Cokelat 150g',
        category: 'Snack / Keripik',
        qty: 15,
        unit: 'bungkus',
        consignPrice: 12000,
        suggestedRetailPrice: 15000,
      },
      {
        id: 'item-2',
        productName: 'Keripik Pisang Keju Gurih 150g',
        category: 'Snack / Keripik',
        qty: 15,
        unit: 'bungkus',
        consignPrice: 12000,
        suggestedRetailPrice: 15000,
      },
    ],
  },
  {
    id: 'req-002',
    producerUserId: 'user-pnt-002',
    producerRole: 'penitip',
    producerBusinessName: 'Kue Basah & Snack Bu Mimin',
    producerOwnerName: 'Ibu Mimin Sunarti',
    producerWhatsapp: '085712345678',
    producerCity: 'Surabaya Selatan',
    submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 jam lalu
    status: 'pending',
    note: 'Mohon izin titip kue lapis legit mini dan risoles frozen siap goreng. Jika ada sisa sore hari bisa diretur penuh.',
    items: [
      {
        id: 'item-3',
        productName: 'Lapis Legit Mini Potong (Isi 10)',
        category: 'Kue Basah',
        qty: 10,
        unit: 'mika',
        consignPrice: 16000,
        suggestedRetailPrice: 20000,
      },
      {
        id: 'item-4',
        productName: 'Risoles Mayo Daging (Pack 5 pcs)',
        category: 'Frozen Food',
        qty: 8,
        unit: 'pack',
        consignPrice: 18000,
        suggestedRetailPrice: 22000,
      },
    ],
  },
  {
    id: 'req-003',
    producerUserId: 'user-pnt-003',
    producerRole: 'penitip',
    producerBusinessName: 'Sambal Bu Rudy Asli',
    producerOwnerName: 'Pak Rudy',
    producerWhatsapp: '081398765432',
    producerCity: 'Surabaya Pusat',
    submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(), // Kemarin
    status: 'accepted',
    note: 'Produk botol bersegel aluminium foil rapi. Sangat diminati pembeli dan tahan 6 bulan di suhu ruangan.',
    items: [
      {
        id: 'item-5',
        productName: 'Sambal Bawang Botol 130g',
        category: 'Sambal & Saus',
        qty: 12,
        unit: 'botol',
        consignPrice: 25000,
        suggestedRetailPrice: 30000,
      },
    ],
  },
  {
    id: 'req-004',
    producerUserId: 'user-pnt-004',
    producerRole: 'penitip',
    producerBusinessName: 'Mak Siti Peyek & Keripik Tempe',
    producerOwnerName: 'Ibu Siti Aminah',
    producerWhatsapp: '081298877665',
    producerCity: 'Surabaya Barat',
    submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 jam lalu
    status: 'pending',
    note: 'Peyek kacang tanah renyah daun jeruk kemasan toples mini dan keripik tempe gurih khas Malang. Dijamin gurih tanpa pengawet.',
    items: [
      {
        id: 'item-6',
        productName: 'Peyek Kacang Renyah Daun Jeruk 200g',
        category: 'Snack Tradisional',
        qty: 10,
        unit: 'toples',
        consignPrice: 15000,
        suggestedRetailPrice: 18500,
      },
      {
        id: 'item-7',
        productName: 'Keripik Tempe Aneka Rasa 120g',
        category: 'Snack / Keripik',
        qty: 12,
        unit: 'bungkus',
        consignPrice: 9000,
        suggestedRetailPrice: 12000,
      },
    ],
  },
  {
    id: 'req-005',
    producerUserId: 'user-pnt-005',
    producerRole: 'penitip',
    producerBusinessName: 'Bakpia Pathok Ibu Tien',
    producerOwnerName: 'Mas Bambang Wicaksono',
    producerWhatsapp: '087811223344',
    producerCity: 'Surabaya Utara',
    submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 hari lalu
    status: 'rejected',
    note: 'Bakpia basah isi kacang hijau kupas dan keju lembut.',
    items: [
      {
        id: 'item-8',
        productName: 'Bakpia Basah Kacang Hijau (Kotak Isi 10)',
        category: 'Kue & Oleh-oleh',
        qty: 10,
        unit: 'kotak',
        consignPrice: 20000,
        suggestedRetailPrice: 25000,
      },
    ],
  },
]

export function useConsignmentRequests() {
  const [requests, setRequests] = useState<ConsignmentRequest[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch {
      // Ignore
    }
    return INITIAL_REQUESTS
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(requests))
    } catch {
      // Ignore
    }
  }, [requests])

  const updateRequestStatus = useCallback(
    (requestId: string, status: 'accepted' | 'rejected') => {
      setRequests((prev) =>
        prev.map((req) => (req.id === requestId ? { ...req, status } : req))
      )
    },
    []
  )

  const pendingCount = requests.filter((r) => r.status === 'pending').length
  const acceptedCount = requests.filter((r) => r.status === 'accepted').length
  const rejectedCount = requests.filter((r) => r.status === 'rejected').length

  return {
    requests,
    pendingCount,
    acceptedCount,
    rejectedCount,
    updateRequestStatus,
  }
}
