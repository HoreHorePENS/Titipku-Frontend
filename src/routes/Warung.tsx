import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { PageContainer, PageHeader, FilterBar } from '@/components/shared'
import { usePartners, useCreatePartner, useUpdatePartner } from '@/features/partner/api'
import { useVisits } from '@/features/visit/api'
import { PartnerDetailModal } from '@/features/partner/components/PartnerDetailModal'
import { PartnerFormModal } from '@/features/partner/components/PartnerFormModal'
import type { Partner, PartnerFormInput } from '@/features/partner/types'

type AvailabilityTab = 'all' | 'tersedia' | 'tidak_tersedia'

export default function WarungRoute() {
  const navigate = useNavigate()

  // State pencarian dan tab filter (Semua, Tersedia, Tidak Tersedia)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<AvailabilityTab>('all')

  // State modal detail & modal form CRUD
  const [detailPartner, setDetailPartner] = useState<Partner | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null)

  // Query API
  const { data: partners = [], isLoading, isError, refetch } = usePartners()
  const { data: visits = [] } = useVisits()

  const createPartnerMutation = useCreatePartner()
  const updatePartnerMutation = useUpdatePartner()

  // Hitung jumlah per ketersediaan untuk badge tab
  const counts = useMemo(() => {
    let tersedia = 0
    let tidakTersedia = 0

    for (const p of partners) {
      if (p.isActive !== false) {
        tersedia++
      } else {
        tidakTersedia++
      }
    }

    return {
      all: partners.length,
      tersedia,
      tidakTersedia,
    }
  }, [partners])

  // Filter daftar toko mitra sesuai pencarian & status ketersediaan
  const filteredPartners = useMemo(() => {
    return partners.filter((p) => {
      if (search.trim()) {
        const q = search.toLowerCase()
        const matchName = p.name.toLowerCase().includes(q)
        const matchAddr = (p.address || '').toLowerCase().includes(q)
        const matchOwner = (p.ownerName || '').toLowerCase().includes(q)
        if (!matchName && !matchAddr && !matchOwner) return false
      }

      if (activeTab === 'tersedia' && p.isActive === false) {
        return false
      }
      if (activeTab === 'tidak_tersedia' && p.isActive !== false) {
        return false
      }

      return true
    })
  }, [partners, search, activeTab])

  // Handle buka detail warung
  const handleOpenDetail = (partner: Partner) => {
    setDetailPartner(partner)
    setIsDetailOpen(true)
  }

  // Handle buka form tambah
  const handleOpenCreate = () => {
    setEditingPartner(null)
    setIsFormOpen(true)
  }

  // Handle buka form edit
  const handleOpenEdit = (partner: Partner) => {
    setEditingPartner(partner)
    setIsFormOpen(true)
  }

  // Submit CRUD (Create / Update)
  const handleSubmitForm = async (data: PartnerFormInput) => {
    if (editingPartner) {
      await updatePartnerMutation.mutateAsync({
        id: editingPartner.id,
        data,
      })
    } else {
      const created = await createPartnerMutation.mutateAsync(data)
      handleOpenDetail(created)
    }
  }

  return (
    <PageContainer>
      {/* 1. Header Halaman */}
      <PageHeader
        title="Toko Mitra Saya"
        description={`${partners.length} toko mitra konsinyasi terdaftar`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => navigate('/peta')}
              className="flex items-center gap-1.5 text-xs font-semibold rounded-xl"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
                <line x1="8" y1="2" x2="8" y2="18"></line>
                <line x1="16" y1="6" x2="16" y2="22"></line>
              </svg>
              <span>Cari di Peta</span>
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 text-xs font-semibold rounded-xl"
            >
              <span className="text-sm leading-none font-bold">+</span>
              <span>Tambah Toko Mitra</span>
            </Button>
          </div>
        }
      />

      {/* 2. Konten Halaman Full-Width */}
      {isLoading ? (
        <div className="flex flex-col gap-3 w-full">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-8 w-3/4 rounded-xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
        </div>
      ) : isError ? (
        <ErrorState
          title="Gagal memuat toko mitra"
          description="Terjadi kendala saat mengambil data toko dari server."
          onRetry={() => refetch()}
        />
      ) : partners.length === 0 ? (
        <EmptyState
          title="Belum ada toko mitra terdaftar"
          description="Tambahkan toko mitra pertama Anda untuk mulai menitipkan barang konsinyasi, atau cari warung di peta sekitar Anda."
          action={{
            label: 'Cari Toko di Peta',
            onClick: () => navigate('/peta'),
          }}
        />
      ) : (
        <div className="flex flex-col gap-4 w-full">
          {/* Kontrol Filter & Pencarian (Tersedia / Tidak Tersedia) */}
          <FilterBar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Cari nama toko mitra atau lokasi..."
            activeTab={activeTab}
            onTabChange={(tab) => setActiveTab(tab as AvailabilityTab)}
            tabs={[
              { value: 'all', label: 'Semua', count: counts.all },
              { value: 'tersedia', label: 'Tersedia', count: counts.tersedia },
              { value: 'tidak_tersedia', label: 'Tidak Tersedia', count: counts.tidakTersedia },
            ]}
          />

          {/* Daftar Toko Mitra Sederhana Full-Width (Hanya Nama, Lokasi, Status Ketersediaan + Tombol Detail) */}
          <div className="flex flex-col gap-2.5 w-full">
            {filteredPartners.length === 0 ? (
              <div className="p-8 text-center text-xs text-ink-soft bg-surface rounded-2xl border border-line">
                Tidak ada toko mitra yang cocok dengan filter atau kata kunci.
              </div>
            ) : (
              filteredPartners.map((partner) => (
                <div
                  key={partner.id}
                  onClick={() => handleOpenDetail(partner)}
                  className="p-4 sm:p-5 rounded-2xl bg-surface border border-line shadow-2xs hover:border-ink/20 hover:shadow-xs transition-all flex items-center justify-between gap-4 cursor-pointer"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-ink text-sm sm:text-base truncate">
                        {partner.name}
                      </h3>
                      {partner.isActive !== false ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Tersedia
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          Tidak Tersedia
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-ink-soft mt-1">
                      <svg className="w-3.5 h-3.5 shrink-0 text-ink-soft" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                      <span className="truncate">
                        {partner.address || 'Lokasi belum disetel'}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDetail(partner)}
                      className="text-xs font-semibold rounded-xl min-h-[40px] px-3.5 border-line hover:border-ink hover:text-ink cursor-pointer"
                    >
                      Lihat Detail
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modal Detail Toko Mitra Lengkap */}
      <PartnerDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        partner={detailPartner}
        visits={visits}
        onEdit={handleOpenEdit}
      />

      {/* Modal Dialog Form Tambah / Ubah Toko Mitra */}
      <PartnerFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSubmitForm}
        initialData={editingPartner}
        isLoading={createPartnerMutation.isPending || updatePartnerMutation.isPending}
      />
    </PageContainer>
  )
}
