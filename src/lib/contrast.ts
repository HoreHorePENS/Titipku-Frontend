/**
 * Utilitas murni untuk menghitung rasio kontras WCAG 2.1
 * Menggunakan rumus standar relatif luminansi WCAG: (L1 + 0.05) / (L2 + 0.05)
 */

export function hexToRgb(hex: string): [number, number, number] {
  let clean = hex.replace('#', '').trim()
  if (clean.length === 3) {
    clean = clean
      .split('')
      .map((c) => c + c)
      .join('')
  }
  const num = parseInt(clean, 16)
  if (isNaN(num)) return [0, 0, 0]
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255]
}

export function parseColor(colorStr: string): [number, number, number] {
  const trimmed = colorStr.trim()
  if (trimmed.startsWith('#')) {
    return hexToRgb(trimmed)
  }
  const match = trimmed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i)
  if (match) {
    return [parseInt(match[1], 10), parseInt(match[2], 10), parseInt(match[3], 10)]
  }
  return [0, 0, 0]
}

export function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((val) => {
    const s = val / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

export function getContrastRatio(foreground: string, background: string): number {
  const [r1, g1, b1] = parseColor(foreground)
  const [r2, g2, b2] = parseColor(background)
  const l1 = relativeLuminance(r1, g1, b1)
  const l2 = relativeLuminance(r2, g2, b2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2))
}

export function checkWcag(ratio: number, isLargeTextOrUiBoundary = false): boolean {
  const threshold = isLargeTextOrUiBoundary ? 3.0 : 4.5
  return ratio >= threshold
}
