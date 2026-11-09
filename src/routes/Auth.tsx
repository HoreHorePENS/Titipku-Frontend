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
import { LocationPickerMap } from '@/features/stores'
import { ApiError } from '@/lib/api-client'

const STORE_CATEGORIES = [
  { value: 'warung', label: 'Warung Makan' },
  { value: 'kelontong', label: 'Toko Kelontong' },
  { value: 'kafe', label: 'Kafe / Coffee Shop' },
  { value: 'resto', label: 'Restoran' },
  { value: 'minimarket', label: 'Minimarket' },
  { value: 'apotek', label: 'Apotek' },
  { value: 'roti', label: 'Toko Roti & Kue' },
  { value: 'lainnya', label: 'Lainnya' },
]

export default function AuthRoute() {
  const navigate = useNavigate()
  const location = useLocation()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [selectedRole, setSelectedRole] = useState<'penitip' | 'pemilik_toko'>('penitip')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isAuthenticated()) {
      const target = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/'
      navigate(target, { replace: true })
    }
  }, [navigate, location])

  const {
    register: registerLogin,
    handleSubmit: handleSubmitLogin,
    setError: setLoginError,
    formState: { errors: loginErrors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const {
    register: registerSignUp,
    handleSubmit: handleSubmitSignUp,
    setValue: setSignUpValue,
    watch: watchSignUp,
    setError: setSignUpError,
    clearErrors: clearSignUpErrors,
    formState: { errors: signUpErrors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      accountType: 'penitip',
      businessName: '',
      storeName: '',
      storeCategory: 'warung',
      storeAddress: '',
      storePhotoUrl: '',
      storeLat: -7.2575,
      storeLng: 112.7521,
      ownerName: '',
      email: '',
      whatsapp: '',
      password: '',
      confirmPassword: '',
    },
  })

  const currentLat = watchSignUp('storeLat')
  const currentLng = watchSignUp('storeLng')

  const handleRoleChange = (role: 'penitip' | 'pemilik_toko') => {
    setSelectedRole(role)
    setSignUpValue('accountType', role, { shouldValidate: true, shouldDirty: true })
    clearSignUpErrors()
  }

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

  const onRegisterSubmit: SubmitHandler<RegisterFormData> = async (data) => {
    setIsLoading(true)
    try {
      const isPemilik = (data.accountType || selectedRole) === 'pemilik_toko'

      const lat =
        typeof data.storeLat === 'number' && !isNaN(data.storeLat) ? data.storeLat : -7.2575
      const lng =
        typeof data.storeLng === 'number' && !isNaN(data.storeLng) ? data.storeLng : 112.7521

      await registerUser({
        account_type: isPemilik ? 'pemilik_toko' : 'penitip',
        business_name: isPemilik ? (data.storeName?.trim() || 'Toko') : data.businessName?.trim(),
        owner_name: data.ownerName.trim(),
        email: data.email.trim(),
        whatsapp: data.whatsapp.trim(),
        password: data.password,
        store: isPemilik
          ? {
              name: (data.storeName || '').trim(),
              category: data.storeCategory || 'warung',
              address: (data.storeAddress || '').trim(),
              whatsapp: data.whatsapp.trim(),
              photo_url: data.storePhotoUrl?.trim() || undefined,
              latitude: lat,
              longitude: lng,
            }
          : undefined,
      })

      const entityName = isPemilik ? data.storeName?.trim() : data.businessName?.trim()
      toast.show({
        title: 'Pendaftaran Berhasil',
        description: `Selamat datang, ${data.ownerName.trim()}! Akun ${isPemilik ? 'Toko' : 'Penitip'} "${entityName}" siap digunakan.`,
        type: 'success',
      })
      const target = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/'
      navigate(target, { replace: true })
    } catch (err: unknown) {
      let errorMessage = 'Gagal mendaftarkan akun baru. Silakan periksa kembali formulir Anda.'
      if (err instanceof ApiError) {
        if (err.fields) {
          const fieldMap: Record<string, keyof RegisterFormData> = {
            business_name: 'businessName',
            owner_name: 'ownerName',
            email: 'email',
            whatsapp: 'whatsapp',
            password: 'password',
            store_name: 'storeName',
            store_category: 'storeCategory',
            store_address: 'storeAddress',
            store_latitude: 'storeLat',
            store_longitude: 'storeLng',
            store_whatsapp: 'whatsapp',
            store: 'storeName',
          }

          const fieldErrorMessages: string[] = []
          for (const [key, msg] of Object.entries(err.fields)) {
            const formField = fieldMap[key] || (key.startsWith('store.') ? 'storeName' : undefined)
            if (formField) {
              setSignUpError(formField, { message: msg })
            }
            fieldErrorMessages.push(msg)
          }

          if (fieldErrorMessages.length > 0) {
            errorMessage = fieldErrorMessages.join(', ')
          }
        }
        if (err.status === 409 || err.code === 'CONFLICT') {
          errorMessage = 'Email atau nomor WhatsApp sudah terdaftar di Titipku.'
          setSignUpError('email', { message: 'Email atau nomor WhatsApp sudah terdaftar' })
        } else if (err.message && !err.fields) {
          errorMessage = err.message
        }
      } else if (err instanceof Error) {
        if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
          errorMessage = 'Gagal terhubung ke server backend (port 8081). Pastikan server backend sedang aktif.'
        } else {
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

  const onRegisterInvalid = (fieldErrors: typeof signUpErrors) => {
    const errorKeys = Object.keys(fieldErrors)
    if (errorKeys.length > 0) {
      const firstKey = errorKeys[0] as keyof typeof fieldErrors
      const firstError = fieldErrors[firstKey]
      const fieldLabels: Record<string, string> = {
        storeName: 'Nama Toko',
        storeAddress: 'Alamat Toko',
        storeLat: 'Koordinat Latitude',
        storeLng: 'Koordinat Longitude',
        businessName: 'Nama Usaha',
        ownerName: 'Nama Pemilik Akun',
        whatsapp: 'Nomor WhatsApp',
        email: 'Email',
        password: 'Kata Sandi',
        confirmPassword: 'Ulangi Kata Sandi',
      }
      const label = fieldLabels[firstKey] || firstKey
      toast.show({
        title: `Kolom ${label} Belum Sesuai`,
        description: firstError?.message || 'Silakan lengkapi kolom yang bertanda wajib.',
        type: 'error',
      })
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-900">
      <div
        className={`w-full ${
          mode === 'register' && selectedRole === 'pemilik_toko' ? 'max-w-2xl' : 'max-w-md'
        } bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-xs flex flex-col gap-6 transition-all duration-200`}
      >
        {/* Header Identitas Brand Minimalis */}
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold mb-2 border border-slate-200">
            <span>Titipku Konsinyasi</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {mode === 'login' ? 'Masuk ke Akun' : 'Daftar Akun Baru'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {mode === 'login'
              ? 'Kelola pengantaran, stok, dan tagihan barang titipan konsinyasi UMKM Anda.'
              : 'Pilih peran Anda untuk mulai terhubung di ekosistem titip-jual Titipku.'}
          </p>
        </div>

        {/* Tab Switcher Minimalis */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl border border-slate-200" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            onClick={() => setMode('login')}
            className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Masuk
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'register'}
            onClick={() => setMode('register')}
            className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              mode === 'register'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Daftar Baru
          </button>
        </div>

        {/* Tampilan Form */}
        {mode === 'login' ? (
          <form onSubmit={handleSubmitLogin(onLoginSubmit)} className="flex flex-col gap-4">
            <Input
              label="Alamat Email"
              type="email"
              placeholder="nama@email.com"
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
              className="rounded-xl min-h-[44px] text-xs font-semibold shadow-xs mt-1"
            >
              Masuk ke Titipku
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSubmitSignUp(onRegisterSubmit, onRegisterInvalid)} className="flex flex-col gap-4">
            {/* Input Tersembunyi Sinkronisasi Form State */}
            <input type="hidden" {...registerSignUp('accountType')} value={selectedRole} />
            <input type="hidden" {...registerSignUp('storeLat', { valueAsNumber: true })} />
            <input type="hidden" {...registerSignUp('storeLng', { valueAsNumber: true })} />

            {/* Pilihan 2 Role / Persona Minimalis */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-700">
                Pilih Peran Akun
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleRoleChange('penitip')}
                  className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    selectedRole === 'penitip'
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span className="text-xs font-bold">Penitip (Produsen)</span>
                  <span className={`text-[11px] leading-tight ${selectedRole === 'penitip' ? 'text-slate-300' : 'text-slate-500'}`}>
                    Produsen mencari warung atau toko untuk titip jual
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleChange('pemilik_toko')}
                  className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    selectedRole === 'pemilik_toko'
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span className="text-xs font-bold">Pemilik Toko</span>
                  <span className={`text-[11px] leading-tight ${selectedRole === 'pemilik_toko' ? 'text-slate-300' : 'text-slate-500'}`}>
                    Pemilik tempat/warung yang menerima titipan
                  </span>
                </button>
              </div>
            </div>

            {/* Field sesuai Role */}
            {selectedRole === 'penitip' ? (
              <Input
                label="Nama Usaha / Produk Konsinyasi"
                placeholder="Contoh: Keripik Pisang Rina"
                error={signUpErrors.businessName?.message}
                required
                {...registerSignUp('businessName')}
              />
            ) : (
              <div className="flex flex-col gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Informasi Toko Fisik</span>
                  <span className="text-[10px] text-slate-600 font-semibold bg-white px-2 py-0.5 rounded border border-slate-200">
                    Tampil di Peta
                  </span>
                </div>

                <Input
                  label="Nama Toko / Warung"
                  placeholder="Contoh: Warung Berkah Bu Siti"
                  error={signUpErrors.storeName?.message}
                  required
                  {...registerSignUp('storeName')}
                />

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700">Kategori Toko</label>
                  <select
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-slate-900"
                    {...registerSignUp('storeCategory')}
                  >
                    {STORE_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <Input
                  label="Alamat Toko Lengkap"
                  placeholder="Contoh: Jl. Menur No. 12, Surabaya"
                  error={signUpErrors.storeAddress?.message}
                  required
                  {...registerSignUp('storeAddress')}
                />

                <Input
                  label="URL Foto Profil Toko (Opsional)"
                  placeholder="Contoh: https://images.unsplash.com/... atau link foto toko"
                  error={signUpErrors.storePhotoUrl?.message}
                  {...registerSignUp('storePhotoUrl')}
                />

                <LocationPickerMap
                  latitude={typeof currentLat === 'number' && !isNaN(currentLat) ? currentLat : -7.2575}
                  longitude={typeof currentLng === 'number' && !isNaN(currentLng) ? currentLng : 112.7521}
                  onChangeLocation={(lat, lng) => {
                    setSignUpValue('storeLat', lat, { shouldValidate: true, shouldDirty: true })
                    setSignUpValue('storeLng', lng, { shouldValidate: true, shouldDirty: true })
                    clearSignUpErrors(['storeLat', 'storeLng'])
                  }}
                  category={watchSignUp('storeCategory') || 'warung'}
                  error={signUpErrors.storeLat?.message || signUpErrors.storeLng?.message}
                />
              </div>
            )}

            <Input
              label="Nama Pemilik Akun"
              placeholder="Contoh: Ibu Rina Rahmawati"
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
              placeholder="nama@email.com"
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
              label="Ulangi Kata Sandi"
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
              className="rounded-xl min-h-[44px] text-xs font-semibold shadow-xs mt-1"
            >
              {selectedRole === 'pemilik_toko' ? 'Daftarkan Toko' : 'Daftar Akun Penitip'}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
