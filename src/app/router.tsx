import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import AppLayout from '@/app/layouts/AppLayout'
import PublicLayout from '@/app/layouts/PublicLayout'
import ProtectedRoute from '@/app/ProtectedRoute'
import { RequireRole } from '@/app/RequireRole'
import Home from '@/routes/Home'
import Visit from '@/routes/Visit'
import Landing from '@/routes/Landing'
import Auth from '@/routes/Auth'
import VisitNew from '@/routes/VisitNew'
import Invoices from '@/routes/Invoices'
import Catalog from '@/routes/Catalog'
import Warung from '@/routes/Warung'
import Receipt from '@/routes/Receipt'
import MapPage from '@/routes/MapPage'
import MyStore from '@/routes/MyStore'
import Penitip from '@/routes/Penitip'

// Lazy load DesignLab khusus saat development environment (tree-shaken di build produksi)
const LazyDesignLab = import.meta.env.DEV
  ? lazy(() => import('@/routes/DesignLab'))
  : null

const devRoutes =
  import.meta.env.DEV && LazyDesignLab
    ? [
        {
          path: '/dev/desain',
          element: (
            <Suspense fallback={<div className="p-4 text-ink-soft">Memuat Design Lab…</div>}>
              <LazyDesignLab />
            </Suspense>
          ),
        },
      ]
    : []

const router = createBrowserRouter([
  // 1. Rute Terpusat dengan Shell Navigasi Utama (AppLayout) yang diproteksi login
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: '/', element: <Home /> },
      { path: '/home', element: <Home /> },
      { path: '/peta', element: <MapPage /> },
      { path: '/map', element: <MapPage /> },
      { path: '/toko-saya', element: <RequireRole role="pemilik_toko"><MyStore /></RequireRole> },
      { path: '/penitip', element: <RequireRole role="pemilik_toko"><Penitip /></RequireRole> },
      { path: '/kunjungan', element: <RequireRole role="penitip"><Visit /></RequireRole> },
      { path: '/kunjungan/baru', element: <RequireRole role="penitip"><VisitNew /></RequireRole> },
      { path: '/visit/new', element: <RequireRole role="penitip"><VisitNew /></RequireRole> },
      { path: '/warung', element: <RequireRole role="penitip"><Warung /></RequireRole> },
      { path: '/tagihan', element: <RequireRole role="penitip"><Invoices /></RequireRole> },
      { path: '/invoices', element: <RequireRole role="penitip"><Invoices /></RequireRole> },
      { path: '/produk', element: <RequireRole role="penitip"><Catalog /></RequireRole> },
      { path: '/catalog', element: <RequireRole role="penitip"><Catalog /></RequireRole> },
    ],
  },

  // 2. Rute Publik Tanpa Navigasi Pemilik (PublicLayout)
  {
    element: <PublicLayout><Receipt /></PublicLayout>,
    path: '/i/:token',
  },
  {
    element: <PublicLayout><Receipt /></PublicLayout>,
    path: '/n/:token',
  },
  { path: '/landing', element: <Landing /> },
  { path: '/auth', element: <Auth /> },

  // 3. Rute Dev
  ...devRoutes,
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
