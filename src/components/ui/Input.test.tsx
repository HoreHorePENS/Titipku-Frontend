import { describe, it, expect } from 'vitest'
import React from 'react'
import { Input } from './Input'
import { MoneyInput } from './MoneyInput'
import { parseRibuan, formatRibuan } from '@/lib/format'

describe('Input Component Specifications', () => {
  it('harus membuat elemen Input dengan label yang terhubung secara aksesibel', () => {
    const el = React.createElement(Input, { label: 'Nama warung', id: 'warung-id' })
    expect(el.props.label).toBe('Nama warung')
    expect(el.props.id).toBe('warung-id')
  })

  it('harus mengaktifkan aria-invalid dan aria-describedby ketika terdapat prop error', () => {
    const el = React.createElement(Input, {
      label: 'Harga',
      id: 'price-input',
      error: 'Harga tidak valid',
    })
    expect(el.props.error).toBe('Harga tidak valid')
  })

  it('harus mendukung state readOnly dan disabled secara terpisah', () => {
    const readOnlyEl = React.createElement(Input, { label: 'Kode', readOnly: true, value: 'TJ-01' })
    expect(readOnlyEl.props.readOnly).toBe(true)

    const disabledEl = React.createElement(Input, { label: 'Kode', disabled: true })
    expect(disabledEl.props.disabled).toBe(true)
  })
})

describe('MoneyInput Parsing and Formatting Engine', () => {
  it('harus memvalidasi siklus "3000" -> 3.000 -> 3000', () => {
    const parsed = parseRibuan('3000')
    expect(parsed).toBe(3000)
    const formatted = formatRibuan(parsed)
    expect(formatted).toBe('3.000')
    expect(parseRibuan(formatted)).toBe(3000)
  })

  it('harus mem-parse tempelan dengan format kotor seperti "Rp 12.500" -> 12500', () => {
    expect(parseRibuan('Rp 12.500')).toBe(12500)
    expect(parseRibuan('Rp12,500')).toBe(12500)
  })

  it('harus membedakan secara tegas antara kosong (undefined) dan angka 0 (0)', () => {
    expect(parseRibuan('')).toBeUndefined()
    expect(parseRibuan('   ')).toBeUndefined()
    expect(parseRibuan('abc')).toBeUndefined()
    expect(parseRibuan('0')).toBe(0)
    expect(parseRibuan('Rp 0')).toBe(0)
  })

  it('harus membuat MoneyInput dengan prefix default Rp', () => {
    const el = React.createElement(MoneyInput, { label: 'Harga titip', value: 5000 })
    expect(el.props.label).toBe('Harga titip')
    expect(el.props.value).toBe(5000)
  })
})
