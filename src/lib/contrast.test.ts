import { describe, it, expect } from 'vitest'
import { getContrastRatio, hexToRgb, checkWcag } from './contrast'

describe('Contrast Utility (WCAG 2.1)', () => {
  it('harus menghitung kontras hitam di atas putih tepat 21:1', () => {
    const ratio = getContrastRatio('#000000', '#ffffff')
    expect(ratio).toBe(21)
  })

  it('harus menghitung kontras putih di atas putih tepat 1:1', () => {
    const ratio = getContrastRatio('#ffffff', '#ffffff')
    expect(ratio).toBe(1)
  })

  it('harus memvalidasi teks primer teal-700 di atas putih lolos WCAG AA (>= 4.5:1)', () => {
    const ratio = getContrastRatio('#0F766E', '#ffffff')
    expect(ratio).toBeGreaterThanOrEqual(4.5)
    expect(checkWcag(ratio, false)).toBe(true)
  })

  it('harus mem-parsing shorthand 3-digit hex dengan benar', () => {
    const rgb = hexToRgb('#fff')
    expect(rgb).toEqual([255, 255, 255])
  })

  it('harus membedakan ambang batas teks biasa (4.5:1) dan batas komponen (3:1)', () => {
    expect(checkWcag(4.6, false)).toBe(true)
    expect(checkWcag(4.4, false)).toBe(false)
    expect(checkWcag(3.2, true)).toBe(true)
    expect(checkWcag(2.9, true)).toBe(false)
  })
})
