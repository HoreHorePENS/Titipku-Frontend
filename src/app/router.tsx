import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import AppLayout from '@/app/layouts/AppLayout'
import PublicLayout from '@/app/layouts/PublicLayout'
import Home from '@/routes/Home'
import Visit from '@/routes/Visit'
import Landing from '@/routes/Landing'
import Auth from '@/routes/Auth'
import VisitNew from '@/routes/VisitNew'
import VisitSummary from '@/routes/VisitSummary'
import Invoices from '@/routes/Invoices'
import Catalog from '@/routes/Catalog'
import Warung from '@/routes/Warung'
import Receipt from '@/routes/Receipt'

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

export const router = createBrowserRouter([
  // 1. Rute Terpusat dengan Shell Navigasi Utama (AppLayout)
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/home', element: <Home /> },
      { path: '/kunjungan', element: <Visit /> },
      { path: '/kunjungan/baru', element: <VisitNew /> },
      { path: '/visit/new', element: <VisitNew /> },
      { path: '/visit/summary', element: <VisitSummary /> },
      { path: '/warung', element: <Warung /> },
      { path: '/tagihan', element: <Invoices /> },
      { path: '/invoices', element: <Invoices /> },
      { path: '/produk', element: <Catalog /> },
      { path: '/catalog', element: <Catalog /> },
    ],
  },

  // 2. Rute Publik Tanpa Navigasi Pemilik (PublicLayout)
  // /i/:token sesuai kontrak tautan WhatsApp dari backend, /n/:token dipertahankan sebagai alias
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
