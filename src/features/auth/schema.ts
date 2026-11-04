import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email wajib diisi').email('Format email tidak valid'),
  password: z.string().min(1, 'Kata sandi wajib diisi'),
})

export type LoginFormData = z.infer<typeof loginSchema>

export const registerSchema = z
  .object({
    businessName: z
      .string()
      .trim()
      .min(2, 'Nama usaha minimal 2 karakter')
      .max(120, 'Nama usaha maksimal 120 karakter'),
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

export type RegisterFormData = z.infer<typeof registerSchema>
