import { describe, it, expect } from 'vitest'
import {
  calculateNiceMax,
  formatYTick,
  calculateChartPoints,
  selectXAxisTicks,
  DEFAULT_DIMENSIONS,
} from './SalesChart.calc'

describe('SalesChart Calculation & Scaling', () => {
  describe('calculateNiceMax', () => {
    it('harus membulatkan nilai maksimum ke kelipatan rapi', () => {
      expect(calculateNiceMax(350_000)).toBe(500_000)
      expect(calculateNiceMax(450_000)).toBe(500_000)
      expect(calculateNiceMax(600_000)).toBe(1_000_000)
      expect(calculateNiceMax(1_200_000)).toBe(2_500_000)
    })

    it('harus memiliki nilai minimum floor 500.000 jika data 0 atau sangat kecil', () => {
      expect(calculateNiceMax(0)).toBe(500_000)
      expect(calculateNiceMax(-100)).toBe(500_000)
      expect(calculateNiceMax(10_000)).toBe(500_000)
    })
  })

  describe('formatYTick', () => {
    it('harus memformat angka ke notasi rb dan jt khas Indonesia', () => {
      expect(formatYTick(0)).toBe('0')
      expect(formatYTick(250_000)).toBe('250 rb')
      expect(formatYTick(500_000)).toBe('500 rb')
      expect(formatYTick(1_000_000)).toBe('1 jt')
      expect(formatYTick(2_500_000)).toBe('2,5 jt')
    })
  })

  describe('calculateChartPoints', () => {
    it('harus menangani data kosong dengan aman tanpa error', () => {
      const res = calculateChartPoints([])
      expect(res.points).toEqual([])
      expect(res.pathD).toBe('')
      expect(res.maxAmount).toBe(500_000)
      expect(res.midAmount).toBe(250_000)
    })

    it('harus memetakan koordinat titik di dalam batas dimensi SVG', () => {
      const mockData = [
        { date: '28 Sep', amount: 0 },
        { date: '29 Sep', amount: 250_000 },
        { date: '30 Sep', amount: 500_000 },
      ]

      const res = calculateChartPoints(mockData, DEFAULT_DIMENSIONS)
      expect(res.points.length).toBe(3)

      // Titik 1: 0 amount harus tepat di baseY (165)
      expect(res.points[0].x).toBe(DEFAULT_DIMENSIONS.startX)
      expect(res.points[0].y).toBe(DEFAULT_DIMENSIONS.baseY)

      // Titik 2: 250.000 (tengah) harus berada di y tengah
      const midY = (DEFAULT_DIMENSIONS.topY + DEFAULT_DIMENSIONS.baseY) / 2
      expect(res.points[1].y).toBe(midY)

      // Titik 3: 500.000 (maksimum) harus tepat di topY (30) dan endX (530)
      expect(res.points[2].x).toBe(DEFAULT_DIMENSIONS.endX)
      expect(res.points[2].y).toBe(DEFAULT_DIMENSIONS.topY)

      // Pastikan path SVG valid
      expect(res.pathD).toMatch(/^M 55,\d+(\.\d+)? L \d+(\.\d+)?,\d+(\.\d+)? L 530,\d+(\.\d+)?$/)
    })

    it('harus membatasi titik ekstrem agar tidak pernah overflow di luar batas kanvas', () => {
      const mockData = [
        { date: '1 Okt', amount: -50_000 }, // Negatif
        { date: '2 Okt', amount: 2_000_000 }, // Melebihi batas
      ]

      const res = calculateChartPoints(mockData, DEFAULT_DIMENSIONS)
      res.points.forEach((p) => {
        expect(p.x).toBeGreaterThanOrEqual(DEFAULT_DIMENSIONS.startX)
        expect(p.x).toBeLessThanOrEqual(DEFAULT_DIMENSIONS.endX)
        expect(p.y).toBeGreaterThanOrEqual(DEFAULT_DIMENSIONS.topY)
        expect(p.y).toBeLessThanOrEqual(DEFAULT_DIMENSIONS.baseY)
      })
    })
  })

  describe('selectXAxisTicks', () => {
    it('harus memilih tepat 5 label tanggal yang terdistribusi merata dari 30 hari', () => {
      const dummyPoints = Array.from({ length: 30 }, (_, i) => ({
        x: 55 + i * 16.3,
        y: 100,
        date: `Hari ${i + 1}`,
        amount: 100_000,
      }))

      const ticks = selectXAxisTicks(dummyPoints)
      expect(ticks.length).toBe(5)
      expect(ticks[0].date).toBe('Hari 1')
      expect(ticks[0].anchor).toBe('start')
      expect(ticks[ticks.length - 1].date).toBe('Hari 30')
      expect(ticks[ticks.length - 1].anchor).toBe('end')
    })
  })
})
