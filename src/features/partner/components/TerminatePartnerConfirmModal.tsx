import { Modal } from '@/components/shared/Modal'
import { Button } from '@/components/ui/Button'
import type { Partner } from '@/features/partner/types'

interface TerminatePartnerConfirmModalProps {
  partner: Partner | null
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isLoading?: boolean
}

export function TerminatePartnerConfirmModal({
  partner,
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}: TerminatePartnerConfirmModalProps) {
  if (!partner) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Putus Kemitraan"
      maxWidth="md"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-xl min-h-[44px]"
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={onConfirm}
            loading={isLoading}
            className="rounded-xl min-h-[44px] bg-red-600 hover:bg-red-700 text-white"
          >
            Putus Mitra
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-900 text-caption">
          <p className="font-semibold text-body text-red-800 mb-1">
            Yakin ingin memutus kemitraan dengan {partner.name}?
          </p>
          <p>
            Status kemitraan dengan warung/toko ini akan dinonaktifkan. Anda tidak dapat membuat kunjungan titip baru kecuali mengajukan kemitraan kembali.
          </p>
        </div>

        <div className="text-caption text-slate-600 space-y-1">
          <p>
            <span className="text-slate-400">Nama Toko:</span> <strong className="text-slate-800">{partner.name}</strong>
          </p>
          <p>
            <span className="text-slate-400">Pemilik:</span> <strong className="text-slate-800">{partner.ownerName}</strong>
          </p>
          {partner.address && (
            <p>
              <span className="text-slate-400">Alamat:</span> <span className="text-slate-700">{partner.address}</span>
            </p>
          )}
        </div>
      </div>
    </Modal>
  )
}
