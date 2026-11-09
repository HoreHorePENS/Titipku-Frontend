import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email wajib diisi').email('Format email tidak valid'),
  password: z.string().min(1, 'Kata sandi wajib diisi'),
})

export type LoginFormData = z.infer<typeof loginSchema>

export const registerSchema = z
  .object({
    accountType: z.enum(['penitip', 'pemilik_toko']).default('penitip').optional(),
    businessName: z.string().trim().optional(),
    storeName: z.string().trim().optional(),
    storeCategory: z.string().optional(),
    storeAddress: z.string().trim().optional(),
    storePhotoUrl: z.string().trim().optional(),
    storeLat: z.number().optional(),
    storeLng: z.number().optional(),
    ownerName: z
      .string()
      .trim()
      .min(2, 'Nama pemilik minimal 2 karakter')
      .max(120, 'Nama pemilik maksimal 120 karakter'),
    email: z
      .string()
      .trim()
      .min(1, 'Email wajib diisi')
      .email('Format email tidak valid'),
    whatsapp: z
      .string()
      .trim()
      .min(1, 'Nomor WhatsApp wajib diisi')
      .refine((val) => {
        const digits = val.replace(/\D/g, '')
        return digits.length >= 9 && digits.length <= 16
      }, 'Nomor WhatsApp minimal 9 digit angka'),
    password: z
      .string()
      .min(8, 'Kata sandi minimal 8 karakter')
      .max(72, 'Kata sandi maksimal 72 karakter'),
    confirmPassword: z.string().min(1, 'Konfirmasi kata sandi wajib diisi'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Konfirmasi kata sandi tidak cocok',
    path: ['confirmPassword'],
  })
  .superRefine((data, ctx) => {
    const isPemilik = data.accountType === 'pemilik_toko'

    if (isPemilik) {
      if (!data.storeName || data.storeName.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Nama toko minimal 2 karakter',
          path: ['storeName'],
        })
      }
      if (!data.storeAddress || data.storeAddress.trim().length < 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Alamat toko wajib diisi minimal 3 karakter',
          path: ['storeAddress'],
        })
      }
      if (typeof data.storeLat === 'number' && (data.storeLat < -90 || data.storeLat > 90)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Latitude harus berada di antara -90 dan 90',
          path: ['storeLat'],
        })
      }
      if (typeof data.storeLng === 'number' && (data.storeLng < -180 || data.storeLng > 180)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Longitude harus berada di antara -180 dan 180',
          path: ['storeLng'],
        })
      }
    } else {
      if (!data.businessName || data.businessName.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Nama usaha minimal 2 karakter',
          path: ['businessName'],
        })
      }
    }
  })

export type RegisterFormData = z.infer<typeof registerSchema>
