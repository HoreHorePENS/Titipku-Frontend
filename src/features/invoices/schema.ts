import { z } from 'zod'

export const paymentRecordSchema = z.object({
  partnerId: z.string().min(1, 'Pilih warung mitra terlebih dahulu'),
  amount: z
    .number({ message: 'Nominal pembayaran wajib diisi' })
    .int('Nominal harus bilangan bulat Rupiah')
    .positive('Nominal pembayaran harus lebih besar dari Rp0'),
  method: z.enum(['cash', 'transfer', 'qris', 'other']),
  paidAtDate: z.string().min(1, 'Tanggal pembayaran wajib diisi'),
  note: z.string().optional(),
})

export type PaymentRecordFormData = z.infer<typeof paymentRecordSchema>
