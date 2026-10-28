import { Link } from 'react-router-dom'

export default function HomeRoute() {
  return (
    <div className="p-6 max-w-lg mx-auto flex flex-col gap-4">
      <h1 className="text-title-1 text-ink">Titipku Home</h1>
      <p className="text-body text-ink-soft">
        Aplikasi pengelolaan konsinyasi UMKM Titipku.
      </p>

      {/* Tautan Uji Desain - Hanya tampil saat DEV */}
      {import.meta.env.DEV && (
        <div className="pt-4 border-t border-line">
          <Link
            to="/dev/desain"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface border border-line text-caption font-medium text-ink hover:border-line-strong hover:bg-surface-raised transition-colors shadow-2xs"
          >
            <span>🧪</span>
            <span>Buka Halaman Uji Desain (Design Lab)</span>
          </Link>
        </div>
      )}
    </div>
  )
}
