import { z } from 'zod'

export const productFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Nama produk minimal 2 karakter')
      .max(100, 'Nama produk maksimal 100 karakter'),
    consignPrice: z
      .number({ message: 'Harga titip wajib diisi angka' })
      .int('Harga titip harus bilangan bulat')
      .min(0, 'Harga titip tidak boleh negatif'),
    retailPrice: z
      .number({ message: 'Harga eceran wajib diisi angka' })
      .int('Harga eceran harus bilangan bulat')
      .min(0, 'Harga eceran tidak boleh negatif')
      .optional(),
    shelfLifeDays: z
      .number({ message: 'Masa simpan wajib diisi angka' })
      .int('Masa simpan harus bilangan bulat hari')
      .min(1, 'Masa simpan minimal 1 hari')
      .max(365, 'Masa simpan maksimal 365 hari'),
    isActive: z.boolean(),
  })
  .refine((data) => data.retailPrice === undefined || data.retailPrice >= data.consignPrice, {
    message: 'Harga eceran tidak boleh lebih kecil dari harga titip',
    path: ['retailPrice'],
  })

export type ProductFormData = z.infer<typeof productFormSchema>
