import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/Toast'
import { loginUser, isAuthenticated } from '@/features/auth'
import { ApiError } from '@/lib/api-client'

export default function AuthRoute() {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  // Jika sudah memiliki sesi login, langsung arahkan ke beranda atau target sebelumnya
  useEffect(() => {
    if (isAuthenticated()) {
      const target = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/'
      navigate(target, { replace: true })
    }
  }, [navigate, location])

  const validate = () => {
    const errs: { email?: string; password?: string } = {}
    if (!email.trim()) {
      errs.email = 'Email wajib diisi'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Format email tidak valid'
    }
    if (!password) {
      errs.password = 'Kata sandi wajib diisi'
    } else if (password.length < 6) {
      errs.password = 'Kata sandi minimal 6 karakter'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate() || isLoading) return

    setIsLoading(true)
    try {
      await loginUser({
        email: email.trim(),
        password,
      })
      toast.show({
        title: 'Berhasil Masuk',
        description: 'Selamat datang kembali di Titipku',
        type: 'success',
      })
      const target = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/'
      navigate(target, { replace: true })
    } catch (err: unknown) {
      let errorMessage = 'Email atau kata sandi tidak valid. Silakan coba kembali.'
      if (err instanceof ApiError) {
        if (err.status === 401 || err.code === 'UNAUTHORIZED') {
          errorMessage = 'Email atau kata sandi salah. Silakan periksa kembali.'
        } else if (err.message) {
          errorMessage = err.message
        }
      }
      toast.show({
        title: 'Gagal Masuk',
        description: errorMessage,
        type: 'error',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-page flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-sm bg-surface rounded-3xl border border-line p-6 md:p-8 shadow-xs flex flex-col gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-extrabold uppercase tracking-wider mb-3">
            <span>●</span>
            <span>Titipku Konsinyasi</span>
          </div>
          <h1 className="text-2xl font-extrabold text-ink tracking-tight">Masuk ke Akun</h1>
          <p className="text-caption text-ink-soft mt-1">
            Kelola pengantaran, stok, dan tagihan barang titipan konsinyasi UMKM Anda.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Email Bisnis"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="contoh@keripikrina.id"
            error={errors.email}
            required
            autoComplete="email"
            autoFocus
          />

          <Input
            label="Kata Sandi"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            error={errors.password}
            required
            autoComplete="current-password"
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={isLoading}
            className="rounded-xl h-12 text-sm font-bold shadow-xs mt-2"
          >
            Masuk ke Titipku
          </Button>
        </form>

        <div className="pt-4 border-t border-line text-center text-xs text-ink-soft">
          <span>Warung mitra menerima nota digital via WhatsApp tanpa login.</span>
        </div>
      </div>
    </div>
  )
}
