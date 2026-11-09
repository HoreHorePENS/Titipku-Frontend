import { useState, useEffect, useRef, type ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useForm, type FieldErrors, type FieldValues, type Path, type SubmitHandler, type UseFormSetError } from 'react-hook-form'
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
  toLoginPayload,
  toRegisterPayload,
  describeLoginError,
  describeRegisterError,
  LOGIN_FIELD_ORDER,
  REGISTER_FIELD_ORDER,
  PASSWORD_REQUIREMENTS,
  type LoginFormData,
  type RegisterFormData,
} from '@/features/auth'
import { LocationPickerMap, useSetMyStorePhoto } from '@/features/stores'
import { PhotoPicker } from '@/components/ui/PhotoPicker'
import { KEEP_PHOTO, type PhotoDraft } from '@/components/ui/photo-draft'
import { describePhotoError } from '@/lib/photo-errors'
import type { FriendlyApiError } from '@/lib/api-errors'

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

interface FormAlertState {
  message: string
  /** Tampilkan tautan "Masuk" (mis. saat email sudah terdaftar). */
  offerLogin?: boolean
}

function invalidSummary(count: number): string {
  return count === 1
    ? 'Ada 1 isian yang perlu diperbaiki. Periksa kolom yang ditandai merah.'
    : `Ada ${count} isian yang perlu diperbaiki. Periksa kolom yang ditandai merah.`
}

/** Pasang error server ke field form, fokus ke field pertama sesuai urutan form. */
function applyServerFieldErrors<T extends FieldValues>(
  friendly: FriendlyApiError<Path<T>>,
  order: Path<T>[],
  setError: UseFormSetError<T>
): number {
  let focused = false
  let count = 0
  for (const field of order) {
    const message = friendly.fieldErrors[field]
    if (!message) continue
    setError(field, { type: 'server', message }, { shouldFocus: !focused })
    focused = true
    count += 1
  }
  return count
}

function FormAlert({ alert, children }: { alert: FormAlertState | null; children?: ReactNode }) {
  if (!alert) return null
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-caption font-medium text-red-800"
    >
      <svg className="mt-0.5 h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
      <div className="flex flex-col gap-1">
        <p>{alert.message}</p>
        {children}
      </div>
    </div>
  )
}

export default function AuthRoute() {
  const navigate = useNavigate()
  const location = useLocation()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [selectedRole, setSelectedRole] = useState<'penitip' | 'pemilik_toko'>('penitip')
  const [loginAlert, setLoginAlert] = useState<FormAlertState | null>(null)
  const [registerAlert, setRegisterAlert] = useState<FormAlertState | null>(null)
  const loginEmailRef = useRef<HTMLInputElement | null>(null)
  const [storePhotoDraft, setStorePhotoDraft] = useState<PhotoDraft>(KEEP_PHOTO)
  const storePhotoMutation = useSetMyStorePhoto()

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
    setValue: setLoginValue,
    formState: { errors: loginErrors, isSubmitting: isLoginSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    // Validasi saat field ditinggalkan, lalu langsung saat diperbaiki.
    mode: 'onTouched',
    reValidateMode: 'onChange',
    shouldFocusError: true,
  })

  const {
    register: registerSignUp,
    handleSubmit: handleSubmitSignUp,
    setValue: setSignUpValue,
    getValues: getSignUpValues,
    watch: watchSignUp,
    setError: setSignUpError,
    clearErrors: clearSignUpErrors,
    formState: { errors: signUpErrors, isSubmitting: isSignUpSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      accountType: 'penitip',
      businessName: '',
      storeName: '',
      storeCategory: 'warung',
      storeAddress: '',
      storeLat: -7.2575,
      storeLng: 112.7521,
      ownerName: '',
      email: '',
      whatsapp: '',
      password: '',
      confirmPassword: '',
    },
    mode: 'onTouched',
    reValidateMode: 'onChange',
    shouldFocusError: true,
  })

  const currentLat = watchSignUp('storeLat')
  const currentLng = watchSignUp('storeLng')

  const { ref: loginEmailFieldRef, ...loginEmailField } = registerLogin('email')

  const handleRoleChange = (role: 'penitip' | 'pemilik_toko') => {
    setSelectedRole(role)
    setSignUpValue('accountType', role, { shouldValidate: false, shouldDirty: true })
    clearSignUpErrors()
    setRegisterAlert(null)
  }

  const goToLogin = (email?: string) => {
    setMode('login')
    setRegisterAlert(null)
    setLoginAlert(null)
    if (email) setLoginValue('email', email)
    // Fokus ke field email setelah form masuk dirender.
    setTimeout(() => loginEmailRef.current?.focus(), 0)
  }

  const redirectAfterAuth = () => {
    const target = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/'
    navigate(target, { replace: true })
  }

  const onLoginSubmit: SubmitHandler<LoginFormData> = async (data) => {
    setLoginAlert(null)
    try {
      await loginUser(toLoginPayload(data))
      toast.show({
        title: 'Berhasil Masuk',
        description: 'Selamat datang kembali di Titipku',
        type: 'success',
      })
      redirectAfterAuth()
    } catch (err: unknown) {
      const friendly = describeLoginError(err)
      applyServerFieldErrors(friendly, LOGIN_FIELD_ORDER, setLoginError)
      setLoginAlert({ message: friendly.message })
      if (friendly.kind === 'unauthorized') loginEmailRef.current?.focus()
    }
  }

  const onLoginInvalid = (fieldErrors: FieldErrors<LoginFormData>) => {
    setLoginAlert({ message: invalidSummary(Object.keys(fieldErrors).length) })
  }

  const onRegisterSubmit: SubmitHandler<RegisterFormData> = async (data) => {
    setRegisterAlert(null)
    const isPemilik = data.accountType === 'pemilik_toko'
    try {
      const payload = toRegisterPayload(data)
      await registerUser(payload)

      // Foto toko diunggah setelah akun dibuat (endpoint unggah butuh login).
      if (isPemilik && storePhotoDraft.kind === 'new') {
        try {
          await storePhotoMutation.mutateAsync(storePhotoDraft.blob)
        } catch (photoErr) {
          toast.show({
            title: 'Akun dibuat, foto toko belum terunggah',
            description: describePhotoError(photoErr) + ' Unggah lagi dari halaman Toko Saya.',
            type: 'error',
          })
        }
      }

      toast.show({
        title: 'Pendaftaran Berhasil',
        description: `Selamat datang, ${payload.owner_name}! Akun ${isPemilik ? 'Toko' : 'Penitip'} "${payload.business_name}" siap digunakan.`,
        type: 'success',
      })
      redirectAfterAuth()
    } catch (err: unknown) {
      const friendly = describeRegisterError(err)
      applyServerFieldErrors(friendly, REGISTER_FIELD_ORDER, setSignUpError)
      setRegisterAlert({ message: friendly.message, offerLogin: friendly.code === 'EMAIL_TAKEN' })
    }
  }

  const onRegisterInvalid = (fieldErrors: FieldErrors<RegisterFormData>) => {
    setRegisterAlert({ message: invalidSummary(Object.keys(fieldErrors).length) })
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
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-caption font-semibold mb-2 border border-slate-200">
            <span>Titipku Konsinyasi</span>
          </div>
          <h1 className="text-title-1 text-slate-900">
            {mode === 'login' ? 'Masuk ke Akun' : 'Daftar Akun Baru'}
          </h1>
          <p className="text-caption text-slate-500 mt-1">
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
            onClick={() => goToLogin()}
            className={`py-2 text-caption font-semibold rounded-lg transition-all cursor-pointer ${
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
            onClick={() => {
              setMode('register')
              setLoginAlert(null)
            }}
            className={`py-2 text-caption font-semibold rounded-lg transition-all cursor-pointer ${
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
          <form
            noValidate
            aria-label="Masuk ke akun"
            onSubmit={handleSubmitLogin(onLoginSubmit, onLoginInvalid)}
            className="flex flex-col gap-4"
          >
            <FormAlert alert={loginAlert} />

            <Input
              label="Alamat Email"
              type="email"
              inputMode="email"
              placeholder="nama@email.com"
              error={loginErrors.email?.message}
              required
              autoComplete="email"
              autoFocus
              {...loginEmailField}
              ref={(el) => {
                loginEmailFieldRef(el)
                loginEmailRef.current = el
              }}
            />

            <Input
              label="Kata Sandi"
              type="password"
              placeholder="Kata sandi akun Anda"
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
              loading={isLoginSubmitting}
              disabled={isLoginSubmitting}
              className="rounded-xl min-h-[44px] text-caption font-semibold shadow-xs mt-1"
            >
              {isLoginSubmitting ? 'Memproses…' : 'Masuk ke Titipku'}
            </Button>
          </form>
        ) : (
          <form
            noValidate
            aria-label="Daftar akun baru"
            onSubmit={handleSubmitSignUp(onRegisterSubmit, onRegisterInvalid)}
            className="flex flex-col gap-4"
          >
            {/* Input Tersembunyi Sinkronisasi Form State */}
            <input type="hidden" {...registerSignUp('accountType')} value={selectedRole} />
            <input type="hidden" {...registerSignUp('storeLat', { valueAsNumber: true })} />
            <input type="hidden" {...registerSignUp('storeLng', { valueAsNumber: true })} />

            {/* Pilihan 2 Role / Persona Minimalis */}
            <fieldset className="flex flex-col gap-2">
              <legend className="text-caption font-semibold text-slate-700 mb-2">Pilih Peran Akun</legend>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  aria-pressed={selectedRole === 'penitip'}
                  onClick={() => handleRoleChange('penitip')}
                  className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    selectedRole === 'penitip'
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span className="text-caption font-bold">Penitip (Produsen)</span>
                  <span className={`text-caption leading-tight ${selectedRole === 'penitip' ? 'text-slate-300' : 'text-slate-500'}`}>
                    Produsen mencari warung atau toko untuk titip jual
                  </span>
                </button>

                <button
                  type="button"
                  aria-pressed={selectedRole === 'pemilik_toko'}
                  onClick={() => handleRoleChange('pemilik_toko')}
                  className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    selectedRole === 'pemilik_toko'
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span className="text-caption font-bold">Pemilik Toko</span>
                  <span className={`text-caption leading-tight ${selectedRole === 'pemilik_toko' ? 'text-slate-300' : 'text-slate-500'}`}>
                    Pemilik tempat/warung yang menerima titipan
                  </span>
                </button>
              </div>
            </fieldset>

            {/* Field sesuai Role */}
            {selectedRole === 'penitip' ? (
              <Input
                label="Nama Usaha / Produk Konsinyasi"
                placeholder="Contoh: Keripik Pisang Rina"
                error={signUpErrors.businessName?.message}
                required
                autoComplete="organization"
                {...registerSignUp('businessName')}
              />
            ) : (
              <div className="flex flex-col gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-caption font-bold text-slate-800">Informasi Toko Fisik</span>
                  <span className="text-caption text-slate-600 font-semibold bg-white px-2 py-0.5 rounded border border-slate-200">
                    Tampil di Peta
                  </span>
                </div>

                <Input
                  label="Nama Toko / Warung"
                  placeholder="Contoh: Warung Berkah Bu Siti"
                  error={signUpErrors.storeName?.message}
                  required
                  autoComplete="organization"
                  {...registerSignUp('storeName')}
                />

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="register-store-category" className="text-caption font-semibold text-slate-700">
                    Kategori Toko
                  </label>
                  <select
                    id="register-store-category"
                    aria-invalid={signUpErrors.storeCategory ? 'true' : undefined}
                    aria-describedby={signUpErrors.storeCategory ? 'register-store-category-error' : undefined}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 text-caption font-medium focus:outline-none focus:ring-1 focus:ring-slate-900"
                    {...registerSignUp('storeCategory')}
                  >
                    {STORE_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                  {signUpErrors.storeCategory?.message && (
                    <p id="register-store-category-error" className="text-caption text-danger font-medium">
                      {signUpErrors.storeCategory.message}
                    </p>
                  )}
                </div>

                <Input
                  label="Alamat Toko Lengkap"
                  placeholder="Contoh: Jl. Menur No. 12, Surabaya"
                  error={signUpErrors.storeAddress?.message}
                  required
                  autoComplete="street-address"
                  {...registerSignUp('storeAddress')}
                />

                <PhotoPicker
                  label="Foto toko (opsional)"
                  savedUrl={null}
                  draft={storePhotoDraft}
                  onDraftChange={setStorePhotoDraft}
                  placeholder="store"
                  disabled={isSignUpSubmitting}
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
              autoComplete="name"
              {...registerSignUp('ownerName')}
            />

            <Input
              label="Nomor WhatsApp"
              type="tel"
              inputMode="tel"
              placeholder="Contoh: 0812 3456 7890"
              hint="Boleh diawali 08, 628, atau +628."
              error={signUpErrors.whatsapp?.message}
              required
              autoComplete="tel"
              {...registerSignUp('whatsapp')}
            />

            <Input
              label="Alamat Email"
              type="email"
              inputMode="email"
              placeholder="nama@email.com"
              error={signUpErrors.email?.message}
              required
              autoComplete="email"
              {...registerSignUp('email')}
            />

            <Input
              label="Kata Sandi"
              type="password"
              placeholder="Buat kata sandi"
              hint={PASSWORD_REQUIREMENTS}
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

            <FormAlert alert={registerAlert}>
              {registerAlert?.offerLogin && (
                <button
                  type="button"
                  onClick={() => goToLogin(getSignUpValues('email').trim().toLowerCase())}
                  className="self-start font-semibold underline underline-offset-2 hover:text-red-900 cursor-pointer"
                >
                  Masuk dengan email ini
                </button>
              )}
            </FormAlert>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={isSignUpSubmitting}
              disabled={isSignUpSubmitting}
              className="rounded-xl min-h-[44px] text-caption font-semibold shadow-xs mt-1"
            >
              {isSignUpSubmitting
                ? 'Mendaftarkan…'
                : selectedRole === 'pemilik_toko'
                  ? 'Daftarkan Toko'
                  : 'Daftar Akun Penitip'}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
