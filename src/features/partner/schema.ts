import { z } from 'zod'

export const partnerFormSchema = z.object({
  name: z.string().trim().min(1, 'Nama warung wajib diisi'),
  ownerName: z.string().trim().min(1, 'Nama pemilik/penjaga wajib diisi'),
  whatsapp: z
    .string()
    .trim()
    .min(1, 'Nomor WhatsApp wajib diisi')
    .refine((val) => {
      const digits = val.replace(/\D/g, '')
      return digits.length >= 9 && digits.length <= 16
    }, 'Nomor WhatsApp minimal 9 digit angka'),
  address: z.string().trim().min(1, 'Alamat/daerah warung wajib diisi'),
  isActive: z.boolean(),
})

export type PartnerFormData = z.infer<typeof partnerFormSchema>
