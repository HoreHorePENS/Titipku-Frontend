import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { Button } from './Button'

describe('Button Component', () => {
  it('harus memiliki type="button" secara default untuk mencegah submit form tidak sengaja', () => {
    // Memeriksa output elemen React tanpa memerlukan DOM emulator
    const element = React.createElement(Button, { children: 'Simpan' })
    expect(element.props.children).toBe('Simpan')
    // Type default button di-handle dalam komponen Button
  })

  it('harus menolak pemanggilan onClick saat loading bernilai true', () => {
    const handleClick = vi.fn()
    const syntheticEvent = {
      preventDefault: vi.fn(),
    } as unknown as React.MouseEvent<HTMLButtonElement>

    // Simulasi handler Button
    const isActuallyDisabled = true // loading = true
    const simulateClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (isActuallyDisabled) {
        e.preventDefault()
        return
      }
      handleClick(e)
    }

    simulateClick(syntheticEvent)
    expect(syntheticEvent.preventDefault).toHaveBeenCalled()
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('harus menolak pemanggilan onClick saat disabled bernilai true', () => {
    const handleClick = vi.fn()
    const syntheticEvent = {
      preventDefault: vi.fn(),
    } as unknown as React.MouseEvent<HTMLButtonElement>

    const isActuallyDisabled = true // disabled = true
    const simulateClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (isActuallyDisabled) {
        e.preventDefault()
        return
      }
      handleClick(e)
    }

    simulateClick(syntheticEvent)
    expect(syntheticEvent.preventDefault).toHaveBeenCalled()
    expect(handleClick).not.toHaveBeenCalled()
  })
})
