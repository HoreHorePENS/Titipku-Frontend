import { describe, it, expect } from 'vitest'
import { formatRibuan, parseRibuan, formatRupiah, formatJamWIB } from './format'

describe('Format & Parse Utility', () => {
  describe('formatJamWIB', () => {
    it('harus memformat waktu dengan pemisah titik', () => {
      // 00:12 UTC = 07:12 WIB
      const date = new Date('2026-10-28T00:12:00.000Z')
      expect(formatJamWIB(date)).toBe('07.12')
    })

    it('harus menangani string tanggal ISO', () => {
      const res = formatJamWIB('2026-10-28T00:12:00.000Z')
      expect(res).toBe('07.12')
    })
  })

  describe('formatRibuan', () => {
    it('harus memformat angka menjadi format ribuan bertitik', () => {
      expect(formatRibuan(3000)).toBe('3.000')
      expect(formatRibuan(1250000)).toBe('1.250.000')
      expect(formatRibuan(0)).toBe('0')
    })

    it('harus mengembalikan string kosong untuk undefined, null, atau NaN', () => {
      expect(formatRibuan(undefined)).toBe('')
      expect(formatRibuan(null)).toBe('')
      expect(formatRibuan(NaN)).toBe('')
    })
  })

  describe('parseRibuan', () => {
    it('harus mem-parsing string angka polos menjadi integer', () => {
      expect(parseRibuan('3000')).toBe(3000)
    })

    it('harus mem-parsing string berformat ribuan bertitik menjadi integer', () => {
      expect(parseRibuan('3.000')).toBe(3000)
      expect(parseRibuan('1.250.000')).toBe(1250000)
    })

    it('harus membersihkan awalan "Rp", spasi, dan koma', () => {
      expect(parseRibuan('Rp 12.500')).toBe(12500)
      expect(parseRibuan('Rp12,500')).toBe(12500)
      expect(parseRibuan('Rp 0')).toBe(0)
    })

    it('harus mengembalikan 0 untuk string "0"', () => {
      expect(parseRibuan('0')).toBe(0)
    })

    it('harus mengembalikan undefined untuk string kosong atau tanpa digit', () => {
      expect(parseRibuan('')).toBeUndefined()
      expect(parseRibuan('   ')).toBeUndefined()
      expect(parseRibuan('abc')).toBeUndefined()
      expect(parseRibuan(undefined)).toBeUndefined()
    })
  })

  describe('formatRupiah', () => {
    it('harus memformat angka dengan simbol Rp tanpa desimal', () => {
      const res = formatRupiah(12000)
      expect(res).toContain('12.000')
    })
  })
})
