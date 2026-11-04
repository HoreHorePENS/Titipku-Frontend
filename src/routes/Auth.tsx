import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/toast-store'
import {
  loginUser,
  registerUser,
  isAuthenticated,
  loginSchema,
  registerSchema,
  type LoginFormData,
  type RegisterFormData,
} from '@/features/auth'
import { ApiError } from '@/lib/api-client'

export default function AuthRoute() {
  const navigate = useNavigate()
  const location = useLocation()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [isLoading, setIsLoading] = useState(false)

  // Jika sudah memiliki sesi login aktif, langsung arahkan ke beranda atau target sebelumnya
  useEffect(() => {
    if (isAuthenticated()) {
      const target = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/'
      navigate(target, { replace: true })
    }
  }, [navigate, location])

  // Form Login
  const {
    register: registerLogin,
    handleSubmit: handleSubmitLogin,
    setError: setLoginError,
    formState: { errors: loginErrors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  // Form Register
  const {
    register: registerSignUp,
    handleSubmit: handleSubmitSignUp,
    setError: setSignUpError,
    formState: { errors: signUpErrors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      businessName: '',
      ownerName: '',
      email: '',
      whatsapp: '',
      password: '',
      confirmPassword: '',
    },
  })

  // Submit Handler: Login
  const onLoginSubmit: SubmitHandler<LoginFormData> = async (data) => {
    setIsLoading(true)
    try {
      await loginUser({
        email: data.email.trim(),
        password: data.password,
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
          setLoginError('password', { message: 'Kata sandi atau email tidak cocok' })
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

  // Submit Handler: Register
  const onRegisterSubmit: SubmitHandler<RegisterFormData> = async (data) => {
    setIsLoading(true)
    try {
      await registerUser({
        business_name: data.businessName.trim(),
        owner_name: data.ownerName.trim(),
        email: data.email.trim(),
        whatsapp: data.whatsapp.trim(),
        password: data.password,
      })
      toast.show({
        title: 'Pendaftaran Berhasil!',
        description: `Selamat datang, ${data.ownerName.trim()}! Usaha "${data.businessName.trim()}" siap mengelola titipan.`,
        type: 'success',
      })
      const target = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/'
      navigate(target, { replace: true })
    } catch (err: unknown) {
      let errorMessage = 'Gagal mendaftarkan akun baru. Silakan periksa kembali formulir Anda.'
      if (err instanceof ApiError) {
        if (err.fields) {
          for (const [key, msg] of Object.entries(err.fields)) {
            if (key === 'business_name') setSignUpError('businessName', { message: msg })
            if (key === 'owner_name') setSignUpError('ownerName', { message: msg })
            if (key === 'email') setSignUpError('email', { message: msg })
            if (key === 'whatsapp') setSignUpError('whatsapp', { message: msg })
            if (key === 'password') setSignUpError('password', { message: msg })
          }
        }
        if (err.status === 409 || err.code === 'CONFLICT') {
          errorMessage = 'Email atau nomor WhatsApp sudah terdaftar di Titipku.'
          setSignUpError('email', { message: 'Email atau nomor WhatsApp sudah terdaftar' })
        } else if (err.message) {
          errorMessage = err.message
        }
      }
      toast.show({
        title: 'Pendaftaran Gagal',
        description: errorMessage,
        type: 'error',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-page flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-surface rounded-3xl border border-line p-6 md:p-8 shadow-xs flex flex-col gap-6">
        {/* Header Identitas Brand */}
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-extrabold uppercase tracking-wider mb-3">
            <span>📦</span>
            <span>Titipku Konsinyasi</span>
          </div>
          <h1 className="text-2xl font-black text-ink tracking-tight">
            {mode === 'login' ? 'Masuk ke Akun' : 'Daftar Akun Baru'}
          </h1>
          <p className="text-xs sm:text-sm text-ink-soft mt-1">
            {mode === 'login'
              ? 'Kelola pengantaran, stok, dan tagihan barang titipan konsinyasi UMKM Anda.'
              : 'Daftarkan usaha UMKM Anda untuk mulai mencatat stok dan nota titipan di warung mitra.'}
          </p>
        </div>

        {/* Tab Switcher: Masuk vs Daftar */}
        <div className="grid grid-cols-2 p-1 bg-surface-raised rounded-2xl border border-line" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            onClick={() => setMode('login')}
            className={`py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer min-h-[44px] ${
              mode === 'login'
                ? 'bg-surface text-ink shadow-xs border border-line'
                : 'text-ink-soft hover:text-ink'
            }`}
          >
            Masuk
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'register'}
            onClick={() => setMode('register')}
            className={`py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer min-h-[44px] ${
              mode === 'register'
                ? 'bg-surface text-ink shadow-xs border border-line'
                : 'text-ink-soft hover:text-ink'
            }`}
          >
            Daftar Baru
          </button>
        </div>

        {/* Tampilan Form Sesuai Tab Aktif */}
        {mode === 'login' ? (
          <form onSubmit={handleSubmitLogin(onLoginSubmit)} className="flex flex-col gap-4">
            <Input
              label="Alamat Email"
              type="email"
              placeholder="nama@keripikrina.id"
              error={loginErrors.email?.message}
              required
              autoComplete="email"
              autoFocus
              {...registerLogin('email')}
            />

            <Input
              label="Kata Sandi"
              type="password"
              placeholder="Minimal 8 karakter"
              error={loginErrors.password?.message}
              required
              autoComplete="current-password"
              {...registerLogin('password')}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={isLoading}
              disabled={isLoading}
              className="rounded-xl min-h-[48px] text-sm font-bold shadow-xs mt-2"
            >
              Masuk ke Titipku
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSubmitSignUp(onRegisterSubmit)} className="flex flex-col gap-3.5">
            <Input
              label="Nama Usaha / Produk"
              placeholder="Contoh: Keripik Pisang Rina"
              error={signUpErrors.businessName?.message}
              required
              {...registerSignUp('businessName')}
            />

            <Input
              label="Nama Pemilik UMKM"
              placeholder="Contoh: Bu Rina"
              error={signUpErrors.ownerName?.message}
              required
              {...registerSignUp('ownerName')}
            />

            <Input
              label="Nomor WhatsApp"
              placeholder="Contoh: 081234567890"
              error={signUpErrors.whatsapp?.message}
              required
              {...registerSignUp('whatsapp')}
            />

            <Input
              label="Alamat Email"
              type="email"
              placeholder="nama@keripikrina.id"
              error={signUpErrors.email?.message}
              required
              autoComplete="email"
              {...registerSignUp('email')}
            />

            <Input
              label="Kata Sandi"
              type="password"
              placeholder="Minimal 8 karakter"
              error={signUpErrors.password?.message}
              required
              autoComplete="new-password"
              {...registerSignUp('password')}
            />

            <Input
              label="Konfirmasi Kata Sandi"
              type="password"
              placeholder="Ketik ulang kata sandi"
              error={signUpErrors.confirmPassword?.message}
              required
              autoComplete="new-password"
              {...registerSignUp('confirmPassword')}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={isLoading}
              disabled={isLoading}
              className="rounded-xl min-h-[48px] text-sm font-bold shadow-xs mt-2"
            >
              Daftar &amp; Mulai Sekarang
            </Button>
          </form>
        )}

        {/* Footer Keterangan */}
        <div className="pt-4 border-t border-line text-center text-xs text-ink-soft">
          <span>Warung mitra menerima nota digital via WhatsApp tanpa login atau registrasi.</span>
        </div>
      </div>
    </div>
  )
}
