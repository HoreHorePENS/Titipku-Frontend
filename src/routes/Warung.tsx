import { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { usePartners, useCreatePartner, useUpdatePartner } from '@/features/partner/api'
import { useVisits } from '@/features/visit/api'
import { filterPartners, calculatePartnerHealth } from '@/features/partner/calc'
import { PartnerFilterTabs } from '@/features/partner/components/PartnerFilterTabs'
import { PartnerCardMobile } from '@/features/partner/components/PartnerCardMobile'
import { PartnerListItemDesktop } from '@/features/partner/components/PartnerListItemDesktop'
import { PartnerDetailPanel } from '@/features/partner/components/PartnerDetailPanel'
import { PartnerFormModal } from '@/features/partner/components/PartnerFormModal'
import type { Partner, HealthTier, PartnerFormInput } from '@/features/partner/types'

export default function WarungRoute() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialSelectedId = searchParams.get('id') || ''

  // State pencarian, tab filter, dan warung terpilih
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | HealthTier>('all')
  const [showZeroDebt, setShowZeroDebt] = useState(false)
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>(initialSelectedId)

  // State modal form CRUD
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null)

  // Query API
  const { data: partners = [], isLoading, isError, refetch } = usePartners()
  const { data: visits = [] } = useVisits()

  const createPartnerMutation = useCreatePartner()
  const updatePartnerMutation = useUpdatePartner()

  // Hitung jumlah per tier untuk badge tab
  const counts = useMemo(() => {
    let bagus = 0
    let pantau = 0
    let evaluasi = 0

    for (const p of partners) {
      const h = calculatePartnerHealth(p, visits)
      if (h.tier === 'bagus') bagus++
      else if (h.tier === 'pantau') pantau++
      else if (h.tier === 'evaluasi') evaluasi++
    }

    return {
      all: partners.length,
      bagus,
      pantau,
      evaluasi,
    }
  }, [partners, visits])

  // Filter daftar warung
  const filteredPartners = useMemo(() => {
    return filterPartners(partners, visits, {
      search,
      tierFilter: activeTab,
      showZeroDebt,
    })
  }, [partners, visits, search, activeTab, showZeroDebt])

  // Warung yang sedang aktif dipilih (desktop & mobile detail)
  const effectiveSelectedPartner = useMemo(() => {
    if (!partners.length) return null
    if (selectedPartnerId) {
      return partners.find((p: Partner) => p.id === selectedPartnerId) || partners[0]
    }
    return partners[0]
  }, [partners, selectedPartnerId])

  const zeroDebtCount = useMemo(() => {
    return partners.filter((p: Partner) => (p.receivable || 0) === 0).length
  }, [partners])

  // Handle pilih warung
  const handleSelectPartner = (id: string) => {
    setSelectedPartnerId(id)
    setSearchParams({ id })
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
      handleSelectPartner(created.id)
    }
  }

  return (
    <div className="px-4 py-5 md:px-8 md:py-8 max-w-7xl mx-auto flex flex-col gap-5 md:gap-6 font-sans">
      {/* --------------------------------------------------------------------
          1. HEADER ATAS (Judul, Jumlah Warung & Tombol Tambah Warung)
          -------------------------------------------------------------------- */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-ink tracking-tight">
            Warung
          </h1>
          <p className="text-xs text-ink-soft mt-0.5">
            {partners.length} warung mitra konsinyasi terdaftar
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={handleOpenCreate}
          className="rounded-xl px-4 md:px-5 h-11 text-xs md:text-sm font-bold shadow-2xs flex items-center gap-1.5"
        >
          <span className="text-base leading-none">+</span>
          <span>Tambah Warung</span>
        </Button>
      </div>

      {/* --------------------------------------------------------------------
          2. KONTEN (Loading, Error, Empty, atau Split View)
          -------------------------------------------------------------------- */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-5 lg:col-span-4 flex flex-col gap-3">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-8 w-3/4 rounded-xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
          <div className="hidden md:flex md:col-span-7 lg:col-span-8 flex-col gap-4">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
        </div>
      ) : isError ? (
        <ErrorState
          title="Gagal memuat warung"
          description="Terjadi kendala saat mengambil data warung dari server."
          onRetry={() => refetch()}
        />
      ) : partners.length === 0 ? (
        <EmptyState
          title="Belum ada warung terdaftar"
          description="Tambahkan warung mitra pertama Anda untuk mulai menitipkan barang konsinyasi."
          action={{
            label: 'Tambah Warung Baru',
            onClick: handleOpenCreate,
          }}
        />
      ) : (
        <>
          {/* ================================================================
              A. TAMPILAN DESKTOP (Split View: Daftar Kiri, Detail Kanan Sesuai Mockup)
              ================================================================ */}
          <div className="hidden md:grid md:grid-cols-12 gap-6 items-start">
            {/* Panel Kiri: Kontrol Filter & Daftar Warung */}
            <div className="md:col-span-5 lg:col-span-4 flex flex-col gap-3.5">
              <PartnerFilterTabs
                search={search}
                onSearchChange={setSearch}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                counts={counts}
              />

              <div className="flex flex-col gap-2.5 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
                {filteredPartners.length === 0 ? (
                  <div className="p-6 text-center text-xs text-ink-soft bg-surface rounded-xl border border-line">
                    Tidak ada warung yang cocok dengan filter.
                  </div>
                ) : (
                  filteredPartners.map((partner) => (
                    <PartnerListItemDesktop
                      key={partner.id}
                      partner={partner}
                      visits={visits}
                      isSelected={effectiveSelectedPartner?.id === partner.id}
                      onClick={() => handleSelectPartner(partner.id)}
                    />
                  ))
                )}

                {zeroDebtCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowZeroDebt(!showZeroDebt)}
                    className="w-full py-2.5 px-3 rounded-xl bg-surface border border-line text-xs font-semibold text-ink-soft hover:text-ink hover:bg-surface-raised transition-all text-center mt-1"
                  >
                    {showZeroDebt
                      ? 'Tampilkan semua warung'
                      : `Tampilkan ${zeroDebtCount} warung tanpa utang`}
                  </button>
                )}
              </div>
            </div>

            {/* Panel Kanan: Rincian Lengkap Warung Terpilih */}
            <div className="md:col-span-7 lg:col-span-8 flex flex-col">
              {effectiveSelectedPartner ? (
                <PartnerDetailPanel
                  partner={effectiveSelectedPartner}
                  visits={visits}
                  onEdit={handleOpenEdit}
                />
              ) : (
                <div className="p-12 text-center text-ink-soft bg-surface rounded-2xl border border-line">
                  Pilih warung di panel sebelah kiri untuk melihat rincian stok dan utang.
                </div>
              )}
            </div>
          </div>

          {/* ================================================================
              B. TAMPILAN MOBILE (Mobile First: Daftar atau Layar Detail)
              ================================================================ */}
          <div className="md:hidden flex flex-col gap-4">
            {selectedPartnerId && effectiveSelectedPartner ? (
              // Tampilan Detail Warung di Layar Mobile
              <PartnerDetailPanel
                partner={effectiveSelectedPartner}
                visits={visits}
                onEdit={handleOpenEdit}
                onBackMobile={() => {
                  setSelectedPartnerId('')
                  setSearchParams({})
                }}
              />
            ) : (
              // Tampilan Daftar Warung di Layar Mobile
              <div className="flex flex-col gap-4">
                <PartnerFilterTabs
                  search={search}
                  onSearchChange={setSearch}
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  counts={counts}
                />

                <div className="flex flex-col gap-3">
                  {filteredPartners.length === 0 ? (
                    <div className="p-8 text-center text-xs text-ink-soft bg-surface rounded-2xl border border-line">
                      Tidak ada warung yang sesuai dengan pencarian Anda.
                    </div>
                  ) : (
                    filteredPartners.map((partner) => (
                      <PartnerCardMobile
                        key={partner.id}
                        partner={partner}
                        visits={visits}
                        onClick={() => handleSelectPartner(partner.id)}
                      />
                    ))
                  )}

                  {zeroDebtCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowZeroDebt(!showZeroDebt)}
                      className="w-full py-3 px-4 rounded-xl bg-surface border border-line text-xs font-bold text-ink hover:bg-surface-raised transition-all text-center mt-1 shadow-2xs"
                    >
                      {showZeroDebt
                        ? 'Tampilkan semua warung'
                        : `Tampilkan ${zeroDebtCount} warung tanpa utang`}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal Dialog Form Tambah / Ubah Warung */}
      <PartnerFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSubmitForm}
        initialData={editingPartner}
        isLoading={createPartnerMutation.isPending || updatePartnerMutation.isPending}
      />
    </div>
  )
}
