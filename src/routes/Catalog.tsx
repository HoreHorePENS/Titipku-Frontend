import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/Button'
import {
  PageContainer,
  PageHeader,
  StatCard,
  StatCardGrid,
  FilterBar,
  EmptyState,
  ErrorState,
} from '@/components/shared'
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
  const handleSubmitForm = async (data: ProductFormInput): Promise<Product> => {
    if (editingProduct) {
      return updateProductMutation.mutateAsync({
        id: editingProduct.id,
        data,
      })
    }
    return createProductMutation.mutateAsync(data)
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
        description: `"${product.name}" kini ${
          nextStatus ? 'aktif dan dapat dititipkan' : 'dinonaktifkan dari pilihan titip baru'
        }.`,
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
    <PageContainer>
      {/* 1. Header Halaman Terstandarisasi */}
      <PageHeader
        title="Katalog Produk"
        description="Kelola produk titipan, harga konsinyasi, dan margin keuntungan warung mitra."
        actions={
          <Button
            type="button"
            variant="primary"
            onClick={handleOpenCreate}
            className="min-h-[48px] px-5 font-bold shadow-xs flex items-center justify-center gap-2"
          >
            <span className="text-title-2 leading-none">+</span>
            <span>Tambah Produk</span>
          </Button>
        }
      />

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
          {/* Ringkasan Statistik Kartu Terstandarisasi */}
          <StatCardGrid columns={3}>
            <StatCard
              label="Total SKU Produk"
              value={stats.total}
              subValue={`(${stats.activeCount} aktif)`}
            />
            <StatCard
              label="Rata-rata Margin"
              value={rupiah(stats.averageMargin)}
              subValue="/ pcs"
              tone="primary"
            />
            <StatCard
              label="Rata-rata Harga Titip"
              value={rupiah(stats.averageConsignPrice)}
            />
          </StatCardGrid>

          {/* Bilah Penyaring Terpadu (Search + Tabs) */}
          <FilterBar<ProductStatusFilter>
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Cari nama produk konsinyasi..."
            activeTab={activeTab}
            onTabChange={setActiveTab}
            tabs={[
              { value: 'all', label: 'Semua', count: stats.total },
              { value: 'active', label: 'Aktif', count: stats.activeCount },
              { value: 'inactive', label: 'Nonaktif', count: stats.inactiveCount },
            ]}
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
              description={`Tidak ditemukan produk yang cocok dengan "${search}" pada filter ${
                activeTab === 'all' ? 'semua' : activeTab
              }.`}
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
    </PageContainer>
  )
}
