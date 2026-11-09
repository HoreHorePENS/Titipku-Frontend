import { describe, it, expect } from 'vitest'
import { paymentRecordSchema } from './schema'

describe('paymentRecordSchema validation', () => {
  it('valid jika input lengkap dan benar', () => {
    const valid = {
      partnerId: 'warung-1',
      amount: 50000,
      method: 'cash' as const,
      paidAtDate: '2026-11-04',
      note: 'Titip uang',
    }
    const result = paymentRecordSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('gagal jika amount <= 0 atau bukan bilangan bulat', () => {
    const zeroAmount = {
      partnerId: 'warung-1',
      amount: 0,
      method: 'cash' as const,
      paidAtDate: '2026-11-04',
    }
    const resZero = paymentRecordSchema.safeParse(zeroAmount)
    expect(resZero.success).toBe(false)
    if (!resZero.success) {
      expect(resZero.error.issues[0].message).toContain('lebih besar dari Rp0')
    }

    const floatAmount = {
      ...zeroAmount,
      amount: 1500.5,
    }
    const resFloat = paymentRecordSchema.safeParse(floatAmount)
    expect(resFloat.success).toBe(false)
  })

  it('gagal jika partnerId kosong', () => {
    const emptyPartner = {
      partnerId: '',
      amount: 25000,
      method: 'qris' as const,
      paidAtDate: '2026-11-04',
    }
    const res = paymentRecordSchema.safeParse(emptyPartner)
    expect(res.success).toBe(false)
    if (!res.success) {
      expect(res.error.issues[0].message).toContain('Pilih warung mitra')
    }
  })
})
