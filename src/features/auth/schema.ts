import { z } from 'zod'
import {
  ADDRESS_MAX,
  ADDRESS_MIN,
  AUTH_MESSAGES as M,
  PASSWORD_MAX_BYTES,
  STORE_CATEGORIES,
  charLength,
  isValidEmail,
  isValidName,
  normalizeEmail,
  normalizeName,
  normalizeWhatsApp,
  utf8ByteLength,
  PASSWORD_MIN_BYTES,
} from './validation'
import type { LoginInput, RegisterInput } from './types'

const emailField = z
  .string()
  .refine((v) => v.trim().length > 0, M.emailRequired)
  .refine((v) => v.trim().length === 0 || isValidEmail(v), M.emailInvalid)

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, M.passwordRequired),
})

export type LoginFormData = z.infer<typeof loginSchema>

export const registerSchema = z
  .object({
    accountType: z.enum(['penitip', 'pemilik_toko']).optional(),
    businessName: z.string().optional(),
    storeName: z.string().optional(),
    storeCategory: z.string().optional(),
    storeAddress: z.string().optional(),
    storeLat: z.number().optional(),
    storeLng: z.number().optional(),
    ownerName: z
      .string()
      .refine((v) => v.trim().length > 0, M.ownerNameRequired)
      .refine((v) => v.trim().length === 0 || isValidName(v), M.ownerNameLength),
    email: emailField,
    whatsapp: z
      .string()
      .refine((v) => v.trim().length > 0, M.whatsappRequired)
      .refine((v) => v.trim().length === 0 || normalizeWhatsApp(v) !== null, M.whatsappInvalid),
    password: z
      .string()
      .refine((v) => v.length > 0, M.passwordRequired)
      .refine((v) => v.length === 0 || utf8ByteLength(v) >= PASSWORD_MIN_BYTES, M.passwordLength)
      .refine((v) => utf8ByteLength(v) <= PASSWORD_MAX_BYTES, M.passwordTooLong),
    confirmPassword: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.confirmPassword.length === 0) {
      ctx.addIssue({ code: 'custom', message: M.confirmPasswordRequired, path: ['confirmPassword'] })
    } else if (data.password !== data.confirmPassword) {
      ctx.addIssue({ code: 'custom', message: M.confirmPasswordMismatch, path: ['confirmPassword'] })
    }

    if (data.accountType === 'pemilik_toko') {
      const storeName = data.storeName ?? ''
      if (storeName.trim().length === 0) {
        ctx.addIssue({ code: 'custom', message: M.storeNameRequired, path: ['storeName'] })
      } else if (!isValidName(storeName)) {
        ctx.addIssue({ code: 'custom', message: M.storeNameLength, path: ['storeName'] })
      }

      const addressLength = charLength((data.storeAddress ?? '').trim())
      if (addressLength < ADDRESS_MIN || addressLength > ADDRESS_MAX) {
        ctx.addIssue({ code: 'custom', message: M.storeAddressLength, path: ['storeAddress'] })
      }

      const category = data.storeCategory?.trim() || 'lainnya'
      if (!(STORE_CATEGORIES as readonly string[]).includes(category)) {
        ctx.addIssue({ code: 'custom', message: M.storeCategoryInvalid, path: ['storeCategory'] })
      }

      if (typeof data.storeLat === 'number' && (data.storeLat < -90 || data.storeLat > 90)) {
        ctx.addIssue({ code: 'custom', message: M.storeLocationInvalid, path: ['storeLat'] })
      }
      if (typeof data.storeLng === 'number' && (data.storeLng < -180 || data.storeLng > 180)) {
        ctx.addIssue({ code: 'custom', message: M.storeLocationInvalid, path: ['storeLng'] })
      }
    } else {
      const businessName = data.businessName ?? ''
      if (businessName.trim().length === 0) {
        ctx.addIssue({ code: 'custom', message: M.businessNameRequired, path: ['businessName'] })
      } else if (!isValidName(businessName)) {
        ctx.addIssue({ code: 'custom', message: M.businessNameLength, path: ['businessName'] })
      }
    }
  })

export type RegisterFormData = z.infer<typeof registerSchema>

const DEFAULT_LAT = -7.2575
const DEFAULT_LNG = 112.7521

/** Normalisasi isian login sebelum dikirim. */
export function toLoginPayload(data: LoginFormData): LoginInput {
  return { email: normalizeEmail(data.email), password: data.password }
}

/**
 * Normalisasi isian daftar sebelum dikirim: nama dirapikan, email huruf kecil,
 * WhatsApp dalam format 62… yang disimpan backend. Kata sandi tidak diubah.
 */
export function toRegisterPayload(data: RegisterFormData): RegisterInput {
  const isPemilik = data.accountType === 'pemilik_toko'
  const whatsapp = normalizeWhatsApp(data.whatsapp) ?? data.whatsapp.trim()
  const storeName = normalizeName(data.storeName ?? '')

  const lat = typeof data.storeLat === 'number' && !Number.isNaN(data.storeLat) ? data.storeLat : DEFAULT_LAT
  const lng = typeof data.storeLng === 'number' && !Number.isNaN(data.storeLng) ? data.storeLng : DEFAULT_LNG

  return {
    account_type: isPemilik ? 'pemilik_toko' : 'penitip',
    business_name: isPemilik ? storeName : normalizeName(data.businessName ?? ''),
    owner_name: normalizeName(data.ownerName),
    email: normalizeEmail(data.email),
    whatsapp,
    password: data.password,
    store: isPemilik
      ? {
          name: storeName,
          category: data.storeCategory?.trim() || 'lainnya',
          address: normalizeName(data.storeAddress ?? ''),
          whatsapp,
          latitude: lat,
          longitude: lng,
        }
      : undefined,
  }
}
