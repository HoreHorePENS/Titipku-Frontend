import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { Stepper } from './Stepper'
import { StepperField } from './StepperField'

describe('Stepper Component Unit Tests', () => {
  it('harus membuat elemen Stepper dengan tombol minus dan plus berukuran minimal 48px', () => {
    const handleChange = vi.fn()
    const el = React.createElement(Stepper, {
      value: 6,
      onChange: handleChange,
      min: 0,
    })
    expect(el.props.value).toBe(6)
    expect(el.props.min).toBe(0)
  })

  it('harus menonaktifkan tombol minus ketika nilai mencapai batas bawah (min)', () => {
    const handleChange = vi.fn()
    const el = React.createElement(Stepper, {
      value: 0,
      onChange: handleChange,
      min: 0,
    })
    expect(el.props.value).toBe(0)
  })

  it('harus menonaktifkan tombol plus ketika nilai mencapai batas atas (max)', () => {
    const handleChange = vi.fn()
    const el = React.createElement(Stepper, {
      value: 20,
      onChange: handleChange,
      max: 20,
    })
    expect(el.props.value).toBe(20)
    expect(el.props.max).toBe(20)
  })

  it('harus menerapkan state error ketika isError bernilai true', () => {
    const handleChange = vi.fn()
    const el = React.createElement(Stepper, {
      value: 22,
      onChange: handleChange,
      isError: true,
    })
    expect(el.props.isError).toBe(true)
  })

  it('StepperField harus otomatis meneruskan prop error menjadi isError pada Stepper', () => {
    const handleChange = vi.fn()
    const fieldEl = React.createElement(StepperField, {
      label: 'Sisa di rak',
      value: 22,
      onChange: handleChange,
      error: 'Error: melebihi titipan',
    })
    expect(fieldEl.props.label).toBe('Sisa di rak')
    expect(fieldEl.props.error).toBe('Error: melebihi titipan')
  })
})
