import { useState } from 'react'
import { Modal } from '@/components/shared/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toast } from '@/components/ui/toast-store'
import { describeApiError } from '@/lib/api-errors'
import type { PenitipBusiness } from '../penitip-businesses'
import type { CreateOfferInput } from '../proposals-api'
import type { Store } from '../types'

interface OfferStoreModalProps {
  business: PenitipBusiness | null
  store: Store | null
  isOpen: boolean
  onClose: () => void
  onSendOffer: (input: CreateOfferInput) => Promise<unknown>
  isSending?: boolean
}

const MESSAGE_MAX = 1000

const OFFER_ERROR_MESSAGES: Record<string, string> = {
  PROPOSAL_PENDING: 'Masih ada tawaran atau pengajuan yang menunggu jawaban dengan penitip ini.',
  ALREADY_PARTNERS: 'Tokomu sudah bermitra dengan penitip ini.',
  STORE_NOT_FOUND: 'Lengkapi data tokomu terlebih dahulu sebelum mengirim tawaran.',
}

export function OfferStoreModal({ business, store, isOpen, onClose, onSendOffer, isSending = false }: OfferStoreModalProps) {
  const [message, setMessage] = useState('')
  const [shelfLocation, setShelfLocation] = useState('')
  const [capacity, setCapacity] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  if (!business) return null

  const handleClose = () => {
    setFormError(null)
    onClose()
  }

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault()
    setFormError(null)
    try {
      await onSendOffer({ businessId: business.id, message, shelfLocation, estimatedCapacity: capacity })
      toast.show({
        title: 'Tawaran terkirim',
        description: `${business.businessName} akan melihat tawaranmu. Kamu akan mendapat kabar saat mereka menjawab.`,
        type: 'success',
      })
      setMessage('')
      setShelfLocation('')
      setCapacity('')
      onClose()
    } catch (err) {
      const friendly = describeApiError(err, { codeMessages: OFFER_ERROR_MESSAGES })
      setFormError(friendly.message)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Tawarkan tempat di tokomu" description={`Untuk ${business.businessName} · ${business.ownerName}`} maxWidth="lg">
      <form onSubmit={handleSend} className="flex flex-col gap-4 text-ink" noValidate>
        {store && (
          <p className="p-3 rounded-xl border border-line bg-slate-50 text-body">
            <span className="text-caption text-ink-soft block">Toko yang ditawarkan</span>
            <span className="font-semibold">{store.name}</span>
            <span className="text-ink-soft"> · {store.address}</span>
          </p>
        )}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="offer-message" className="text-label text-ink">
            Pesan untuk penitip <span className="text-ink-soft font-normal">(opsional)</span>
          </label>
          <textarea
            id="offer-message"
            rows={4}
            maxLength={MESSAGE_MAX}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Contoh: Toko kami dekat sekolah dan ramai sore hari. Kami tertarik menjual keripik Anda."
            className="w-full px-3.5 py-2.5 rounded-xl border border-line-strong bg-white text-[16px] leading-normal focus:outline-none focus:ring-2 focus:ring-focus-ring/30 resize-none"
          />
          <span className="text-caption text-ink-soft self-end">{message.length}/{MESSAGE_MAX}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Tempat pajang (opsional)"
            placeholder="Contoh: Rak depan kasir"
            maxLength={120}
            value={shelfLocation}
            onChange={(e) => setShelfLocation(e.target.value)}
            inputSize="md"
          />
          <Input
            label="Perkiraan kapasitas (opsional)"
            placeholder="Contoh: 20 bungkus"
            maxLength={60}
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            inputSize="md"
          />
        </div>

        {formError && (
          <p role="alert" className="p-3 rounded-xl border border-red-200 bg-red-50 text-body text-red-800">
            {formError}
          </p>
        )}

        <div className="flex items-center gap-2 pt-3 border-t border-line">
          <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={handleClose}>
            Batal
          </Button>
          <Button type="submit" variant="primary" className="flex-1 rounded-xl" loading={isSending} disabled={isSending}>
            {isSending ? 'Mengirim…' : 'Kirim tawaran'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
