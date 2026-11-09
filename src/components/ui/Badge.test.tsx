import { describe, it, expect } from 'vitest'
import React from 'react'
import { Badge } from './Badge'
import { HealthBadge } from '@/components/shared/HealthBadge'
import { PaymentBadge } from '@/components/shared/PaymentBadge'
import { ReasonChip } from '@/components/shared/ReasonChip'
import {
  healthTier,
  PAYMENT_STATUS_MAP,
  REASON_CONFIG_MAP,
} from '@/components/shared/badge-constants'

describe('healthTier boundary logic', () => {
  it('harus mengembalikan "bagus" untuk skor >= 80', () => {
    expect(healthTier(80)).toBe('bagus')
    expect(healthTier(81)).toBe('bagus')
    expect(healthTier(100)).toBe('bagus')
  })

  it('harus mengembalikan "pantau" untuk skor antara 60 dan 79', () => {
    expect(healthTier(79)).toBe('pantau')
    expect(healthTier(60)).toBe('pantau')
    expect(healthTier(65)).toBe('pantau')
  })

  it('harus mengembalikan "evaluasi" untuk skor < 60', () => {
    expect(healthTier(59)).toBe('evaluasi')
    expect(healthTier(0)).toBe('evaluasi')
    expect(healthTier(45)).toBe('evaluasi')
  })

  it('harus menolak skor di luar rentang 0-100 dan melempar Error eksplisit', () => {
    expect(() => healthTier(-1)).toThrow()
    expect(() => healthTier(101)).toThrow()
    expect(() => healthTier(NaN)).toThrow()
    expect(() => healthTier('80' as unknown as number)).toThrow()
  })
})

describe('PaymentBadge Domain Component', () => {
  it('harus memetakan status pembayaran ke tone dan label yang benar', () => {
    expect(PAYMENT_STATUS_MAP.lunas.label).toBe('Lunas')
    expect(PAYMENT_STATUS_MAP.lunas.tone).toBe('success')

    expect(PAYMENT_STATUS_MAP.sebagian.label).toBe('Sebagian')
    expect(PAYMENT_STATUS_MAP.sebagian.tone).toBe('warning')

    expect(PAYMENT_STATUS_MAP.belum_lunas.label).toBe('Belum Lunas')
    expect(PAYMENT_STATUS_MAP.belum_lunas.tone).toBe('danger')
  })

  it('harus merender elemen Badge dengan benar', () => {
    const el = React.createElement(PaymentBadge, { status: 'lunas' })
    expect(el.props.status).toBe('lunas')
  })
})

describe('ReasonChip Domain Component', () => {
  it('harus memetakan alasan prioritas kunjungan ke konfigurasi yang benar', () => {
    expect(REASON_CONFIG_MAP.stok_hampir_habis.tone).toBe('neutral')
    expect(REASON_CONFIG_MAP.hampir_kedaluwarsa.tone).toBe('danger')
    expect(REASON_CONFIG_MAP.piutang.tone).toBe('warning')
  })

  it('harus merender ReasonChip dengan label default dan custom children', () => {
    const el = React.createElement(ReasonChip, { reason: 'stok_hampir_habis' })
    expect(el.props.reason).toBe('stok_hampir_habis')
    const customEl = React.createElement(ReasonChip, { reason: 'piutang' }, 'Jatuh tempo 14 hari')
    expect(customEl.props.children).toBe('Jatuh tempo 14 hari')
  })
})

describe('Badge UI Accessibility & Non-interactive guarantees', () => {
  it('harus merupakan elemen span non-interaktif tanpa tabIndex secara default', () => {
    const el = React.createElement(Badge, null, 'Lunas')
    expect(el.props.tabIndex).toBeUndefined()
    expect(el.props['aria-hidden']).toBeUndefined()
  })

  it('HealthBadge harus menangani error secara aman dengan fallback "Tidak Valid"', () => {
    const fallbackEl = React.createElement(HealthBadge, { score: 150 })
    expect(fallbackEl.props.score).toBe(150)
  })
})
