import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { toast } from '@/components/ui/toast-store'
import { rupiah } from '@/lib/format'
import {
  useCatalogProducts,
  useCreateProduct,
  useUpdateProduct,
  useSetProductActive,
  filterProducts,
  calculateCatalogStats,
  CatalogSkeleton,
  ProductCard,
  ProductFilterTabs,
  ProductFormModal,
  type Product,
  type ProductStatusFilter,
  type ProductFormInput,
} from '@/features/catalog'

export default function CatalogRoute() {
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<ProductStatusFilter>('all')

  // State Modal Form
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  // API Queries & Mutations
  const { data: products = [], isLoading, isError, refetch } = useCatalogProducts()
  const createProductMutation = useCreateProduct()
  const updateProductMutation = useUpdateProduct()
  const setProductActiveMutation = useSetProductActive()

  // Statistik katalog
  const stats = useMemo(() => calculateCatalogStats(products), [products])

  // Filter produk
  const filteredProducts = useMemo(() => {
    return filterProducts(products, {
      search,
      statusFilter: activeTab,
    })
  }, [products, search, activeTab])

  // Handler Buka Form Tambah
  const handleOpenCreate = () => {
    setEditingProduct(null)
    setIsFormOpen(true)
  }

  // Handler Buka Form Ubah
  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product)
    setIsFormOpen(true)
  }

  // Handler Submit Create / Update
  const handleSubmitForm = async (data: ProductFormInput) => {
    if (editingProduct) {
      await updateProductMutation.mutateAsync({
        id: editingProduct.id,
        data,
      })
    } else {
      await createProductMutation.mutateAsync(data)
    }
  }

  // Handler Toggle Status Aktif / Nonaktif
  const handleToggleStatus = async (product: Product) => {
    const nextStatus = !product.isActive
    setTogglingId(product.id)
    try {
      await setProductActiveMutation.mutateAsync({
        id: product.id,
        isActive: nextStatus,
      })
      toast.show({
        title: nextStatus ? 'Produk Diaktifkan' : 'Produk Dinonaktifkan',
        description: `"${product.name}" kini ${nextStatus ? 'aktif dan dapat dititipkan' : 'dinonaktifkan dari pilihan titip baru'}.`,
        type: 'success',
      })
    } catch {
      toast.show({
        title: 'Gagal Mengubah Status',
        description: 'Terjadi gangguan koneksi saat memperbarui status produk.',
        type: 'error',
      })
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex flex-col gap-5 sm:gap-6 pb-24 md:pb-10">
      {/* 1. Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-ink tracking-tight">Katalog Produk</h1>
          <p className="text-xs sm:text-sm text-ink-soft mt-0.5">
            Kelola produk titipan, harga konsinyasi, dan margin keuntungan warung mitra.
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          onClick={handleOpenCreate}
          className="min-h-[48px] px-5 font-bold shadow-xs flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <span className="text-lg leading-none">+</span>
          <span>Tambah Produk</span>
        </Button>
      </div>

      {/* 2. Loading State */}
      {isLoading && <CatalogSkeleton />}

      {/* 3. Error State */}
      {!isLoading && isError && (
        <ErrorState
          title="Gagal Memuat Katalog"
          description="Terjadi kesalahan saat mengambil daftar produk dari server. Silakan coba lagi."
          onRetry={() => refetch()}
        />
      )}

      {/* 4. Konten Utama Jika Sukses */}
      {!isLoading && !isError && (
        <>
          {/* Ringkasan Statistik Dua Kotak */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-surface border border-line rounded-2xl p-4 flex flex-col gap-1 shadow-xs">
              <span className="text-xs font-semibold text-ink-soft">Total SKU Produk</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-ink tabular-nums">{stats.total}</span>
                <span className="text-xs text-primary font-bold">({stats.activeCount} aktif)</span>
              </div>
            </div>

            <div className="bg-surface border border-line rounded-2xl p-4 flex flex-col gap-1 shadow-xs">
              <span className="text-xs font-semibold text-ink-soft">Rata-rata Margin</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-primary tabular-nums">
                  {rupiah(stats.averageMargin)}
                </span>
                <span className="text-xs text-ink-soft font-medium">/ pcs</span>
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1 bg-surface border border-line rounded-2xl p-4 flex flex-col gap-1 shadow-xs">
              <span className="text-xs font-semibold text-ink-soft">Rata-rata Harga Titip</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-ink tabular-nums">
                  {rupiah(stats.averageConsignPrice)}
                </span>
              </div>
            </div>
          </div>

          {/* Baris Pencarian & Tab Status */}
          <ProductFilterTabs
            search={search}
            onSearchChange={setSearch}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            counts={{
              all: stats.total,
              active: stats.activeCount,
              inactive: stats.inactiveCount,
            }}
          />

          {/* Daftar Produk / Empty State */}
          {products.length === 0 ? (
            <EmptyState
              title="Belum Ada Produk di Katalog"
              description="Daftarkan produk konsinyasi pertamamu lengkap dengan harga titip dan harga eceran."
              action={{
                label: '+ Tambah Produk Pertama',
                onClick: handleOpenCreate,
              }}
            />
          ) : filteredProducts.length === 0 ? (
            <EmptyState
              title="Produk Tidak Ditemukan"
              description={`Tidak ditemukan produk yang cocok dengan "${search}" pada filter ${activeTab === 'all' ? 'semua' : activeTab}.`}
              action={{
                label: 'Reset Pencarian',
                onClick: () => {
                  setSearch('')
                  setActiveTab('all')
                },
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onEdit={handleOpenEdit}
                  onToggleStatus={handleToggleStatus}
                  isToggling={togglingId === product.id}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal Form Tambah / Ubah Produk */}
      <ProductFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSubmitForm}
        initialData={editingProduct}
        isLoading={createProductMutation.isPending || updateProductMutation.isPending}
      />
    </div>
  )
}
