import { useState } from 'react'
import { Modal } from '@/components/shared/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toast } from '@/components/ui/toast-store'
import { useStoreOffers } from '../store-offers'
import { useNotifications } from '@/features/notifications/notification-store'
import type { PenitipBusiness } from '../penitip-businesses'
import type { Store } from '../types'

interface OfferStoreModalProps {
  business: PenitipBusiness | null
  store: Store | null
  isOpen: boolean
  onClose: () => void
  onSendOffer: (businessId: string, message?: string) => void
}

export function OfferStoreModal({
  business,
  store,
  isOpen,
  onClose,
  onSendOffer,
}: OfferStoreModalProps) {
  const { createStoreOffer } = useStoreOffers()
  const { addNotification } = useNotifications('penitip')

  const [message, setMessage] = useState(
    'Halo, kami pemilik toko tertarik untuk menerima titip-jual produk Anda di etalase toko kami.'
  )
  const [shelfLocation, setShelfLocation] = useState('Etalase Depan Kasir')
  const [estimatedQty, setEstimatedQty] = useState('20-30 pcs')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!business) return null

  const handleSend = () => {
    setIsSubmitting(true)
    try {
      const fullMessage = `${message.trim()} (Rencana penempatan: ${shelfLocation}, estimasi kapasitas awal: ${estimatedQty}).`
      onSendOffer(business.id, fullMessage)

      // Sinkronkan ke daftar tawaran masuk toko (Incoming Store Offers)
      const newOffer = createStoreOffer({
        storeId: store?.id || 'store-mine',
        storeName: store?.name || 'Toko Mitra Anda',
        storeCategory: store?.category || 'warung',
        storeOwnerName: 'Pemilik Toko',
        storeWhatsapp: store?.whatsapp || '628123456789',
        storeAddress: store?.address || 'Surabaya',
        targetBusinessName: business.businessName,
        message: message.trim(),
        shelfLocation,
        estimatedCapacity: estimatedQty,
      })

      // Tambahkan notifikasi masuk untuk role penitip (memicu titik merah pada lonceng penitip!)
      addNotification({
        role: 'penitip',
        title: 'Tawaran Masuk dari Toko',
        message: `${store?.name || 'Toko Mitra'} menawarkan etalase (${shelfLocation}) untuk produk ${business.businessName}.`,
        timeAgo: 'Baru saja',
        type: 'offer_incoming',
        dataId: newOffer.id,
      })

      toast.show({
        title: 'Tawaran Berhasil Dikirim',
        description: `Tawaran kemitraan toko Anda telah dikirimkan ke ${business.businessName}. Menunggu persetujuan penitip.`,
        type: 'success',
      })
      onClose()
    } catch {
      toast.show({
        title: 'Gagal Mengirim Tawaran',
        description: 'Terjadi kendala saat mengirimkan tawaran.',
        type: 'error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tawari Toko ke Produsen Penitip"
      className="max-w-lg"
    >
      <div className="flex flex-col gap-4 font-sans text-slate-900">
        {/* Info Bisnis Penitip Target */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0">
            {business.businessName.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
              Produsen UMKM
            </span>
            <h3 className="text-sm font-bold text-slate-900 mt-1 truncate">
              {business.businessName}
            </h3>
            <p className="text-xs text-slate-500 truncate">
              {business.ownerName} · {business.city}
            </p>
          </div>
        </div>

        {/* Info Toko Pengirim */}
        <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs flex flex-col gap-1">
          <span className="text-slate-500 font-medium">Toko Anda yang Ditawarkan:</span>
          <span className="font-bold text-slate-900">
            {store?.name || 'Toko Mitra Titipku'} ({store?.address || 'Alamat Toko'})
          </span>
          <span className="text-[11px] text-slate-500">
            WhatsApp Konfirmasi: {store?.whatsapp || '-'}
          </span>
        </div>

        {/* Form Pesan Tawaran */}
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Rencana Penempatan Rak"
              value={shelfLocation}
              onChange={(e) => setShelfLocation(e.target.value)}
              placeholder="Contoh: Rak Depan Kasir"
              required
            />
            <Input
              label="Estimasi Kapasitas Awal"
              value={estimatedQty}
              onChange={(e) => setEstimatedQty(e.target.value)}
              placeholder="Contoh: 15-20 pcs"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Pesan Tambahan untuk Penitip
            </label>
            <textarea
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-normal focus:outline-none focus:ring-1 focus:ring-slate-900 resize-none"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tuliskan pesan penawaran kerja sama..."
            />
          </div>
        </div>

        {/* Alur Kerja Singkat */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600">
          <p className="font-semibold text-slate-800 mb-0.5">Alur Persetujuan:</p>
          Setelah tawaran dikirim, produsen penitip akan menerima pemberitahuan dan dapat menyetujui
          atau mendiskusikan pengiriman barang titipan pertama ke toko Anda.
        </div>

        {/* Tombol Aksi */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
          <Button
            type="button"
            variant="outline"
            className="flex-1 rounded-xl font-semibold min-h-[44px]"
            onClick={onClose}
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="primary"
            className="flex-1 rounded-xl font-semibold min-h-[44px]"
            loading={isSubmitting}
            onClick={handleSend}
          >
            Kirim Tawaran Toko
          </Button>
        </div>
      </div>
    </Modal>
  )
}
