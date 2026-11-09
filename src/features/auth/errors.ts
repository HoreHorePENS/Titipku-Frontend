import { describeApiError, type FriendlyApiError } from '@/lib/api-errors'
import { AUTH_MESSAGES as M } from './validation'
import type { LoginFormData, RegisterFormData } from './schema'

type RegisterField = keyof RegisterFormData
type LoginField = keyof LoginFormData

export const EMAIL_TAKEN_MESSAGE = 'Email ini sudah terdaftar. Silakan masuk atau gunakan email lain.'
export const WHATSAPP_TAKEN_MESSAGE = 'Nomor WhatsApp ini sudah terdaftar. Silakan masuk atau gunakan nomor lain.'
export const INVALID_CREDENTIALS_MESSAGE = 'Email atau kata sandi salah.'

/** Urutan field di form daftar, untuk memfokuskan field error pertama. */
export const REGISTER_FIELD_ORDER: RegisterField[] = [
  'businessName',
  'storeName',
  'storeCategory',
  'storeAddress',
  'storeLat',
  'storeLng',
  'ownerName',
  'whatsapp',
  'email',
  'password',
  'confirmPassword',
]

export const LOGIN_FIELD_ORDER: LoginField[] = ['email', 'password']

export function describeRegisterError(err: unknown): FriendlyApiError<RegisterField> {
  const friendly = describeApiError<RegisterField>(err, {
    fieldMap: {
      business_name: 'businessName',
      owner_name: 'ownerName',
      email: 'email',
      whatsapp: 'whatsapp',
      password: 'password',
      store: 'storeName',
      store_name: 'storeName',
      store_category: 'storeCategory',
      store_address: 'storeAddress',
      store_latitude: 'storeLat',
      store_longitude: 'storeLng',
      store_whatsapp: 'whatsapp',
    },
    fieldMessages: {
      businessName: { required: M.businessNameRequired, default: M.businessNameLength },
      ownerName: { required: M.ownerNameRequired, default: M.ownerNameLength },
      email: { required: M.emailRequired, default: M.emailInvalid },
      whatsapp: { required: M.whatsappRequired, default: M.whatsappInvalid },
      password: { required: M.passwordRequired, default: M.passwordLength },
      storeName: { required: M.storeNameRequired, default: M.storeNameLength },
      storeCategory: M.storeCategoryInvalid,
      storeAddress: M.storeAddressLength,
      storeLat: M.storeLocationInvalid,
      storeLng: M.storeLocationInvalid,
    },
    codeMessages: {
      EMAIL_TAKEN: EMAIL_TAKEN_MESSAGE,
      WHATSAPP_TAKEN: WHATSAPP_TAKEN_MESSAGE,
    },
  })

  // Tandai field terkait juga, supaya pengguna tahu bagian mana yang perlu diubah.
  if (friendly.code === 'EMAIL_TAKEN') friendly.fieldErrors.email = 'Email ini sudah terdaftar.'
  if (friendly.code === 'WHATSAPP_TAKEN') friendly.fieldErrors.whatsapp = 'Nomor WhatsApp ini sudah terdaftar.'
  return friendly
}

export function describeLoginError(err: unknown): FriendlyApiError<LoginField> {
  return describeApiError<LoginField>(err, {
    fieldMap: { email: 'email', password: 'password' },
    fieldMessages: {
      email: { required: M.emailRequired, default: M.emailInvalid },
      password: M.passwordRequired,
    },
    unauthorizedMessage: INVALID_CREDENTIALS_MESSAGE,
  })
}
