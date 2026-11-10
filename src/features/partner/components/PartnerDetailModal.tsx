import { Modal } from '@/components/shared/Modal'
import { PartnerDetailPanel } from './PartnerDetailPanel'
import type { Partner } from '../types'

export interface PartnerDetailModalProps {
  isOpen: boolean
  onClose: () => void
  partner: Partner | null
  onEdit: (partner: Partner) => void
}

export function PartnerDetailModal({
  isOpen,
  onClose,
  partner,
  onEdit,
}: PartnerDetailModalProps) {
  if (!partner) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={partner.name}
      description={partner.address || 'Mitra Toko / Warung'}
      maxWidth="2xl"
    >
      <div className="py-2">
        <PartnerDetailPanel
          partner={partner}
          onEdit={(p) => {
            onClose()
            onEdit(p)
          }}
        />
      </div>
    </Modal>
  )
}
