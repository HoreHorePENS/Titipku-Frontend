import { z } from 'zod'

export const visitItemSchema = z
  .object({
    productId: z.string().min(1, 'Product ID wajib ada'),
    productName: z.string().min(1, 'Nama produk wajib ada'),
    consignPrice: z.number().int().nonnegative(),
    prevStock: z.number().int().nonnegative(),
    remaining: z.number().int('Harus bilangan bulat').nonnegative('Sisa stok tidak boleh negatif'),
    returned: z.number().int('Harus bilangan bulat').nonnegative('Retur tidak boleh negatif'),
    newDrop: z.number().int('Harus bilangan bulat').nonnegative('Titip baru tidak boleh negatif'),
  })
  .superRefine((item, ctx) => {
    if (item.remaining + item.returned > item.prevStock) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Sisa (${item.remaining}) + retur (${item.returned}) melebihi stok kemarin (${item.prevStock})`,
        path: ['remaining'],
      })
    }
  })

export const visitFormSchema = z.object({
  partnerId: z.string().min(1, 'Pilih warung mitra terlebih dahulu'),
  receivedBy: z.string().trim().min(1, 'Nama penerima barang wajib diisi'),
  items: z.array(visitItemSchema).min(1, 'Minimal harus ada satu produk yang dicatat'),
  payment: z
    .object({
      status: z.enum(['lunas', 'sebagian', 'nanti', 'tempo']),
      amount: z.number().int().nonnegative(),
      method: z.enum(['cash', 'transfer', 'qris', 'other']),
    })
    .optional(),
})

export type VisitItemFormData = z.infer<typeof visitItemSchema>
export type VisitFormData = z.infer<typeof visitFormSchema>
