import React, { forwardRef, useState, useEffect, useRef } from 'react'
import { Input, type InputProps } from './Input'
import { formatRibuan, parseRibuan } from '@/lib/format'

export interface MoneyInputProps extends Omit<InputProps, 'value' | 'onChange' | 'prefix'> {
  value?: number
  onChange?: (value: number | undefined) => void
  prefix?: React.ReactNode
}

export const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(
  (
    {
      value,
      onChange,
      prefix = 'Rp',
      className = '',
      placeholder = '0',
      onBlur,
      ...props
    },
    ref
  ) => {
    // State tampilan lokal (string berformat titik)
    const [displayValue, setDisplayValue] = useState<string>(() => formatRibuan(value))
    const internalInputRef = useRef<HTMLInputElement | null>(null)

    // Sinkronisasi saat value prop dari luar berubah
    useEffect(() => {
      const formatted = formatRibuan(value)
      setDisplayValue(formatted)
    }, [value])

    const handleCombinedRef = (node: HTMLInputElement | null) => {
      internalInputRef.current = node
      if (typeof ref === 'function') {
        ref(node)
      } else if (ref) {
        ref.current = node
      }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawInput = e.target.value
      const cursorPos = e.target.selectionStart || 0

      // Hitung digit sebelum kursor untuk menjaga posisi kursor tidak melompat
      const rawBeforeCursor = rawInput.slice(0, cursorPos)
      const digitsBeforeCursor = rawBeforeCursor.replace(/[^\d]/g, '').length

      // Parse ke integer Rupiah
      const parsed = parseRibuan(rawInput)
      const formatted = formatRibuan(parsed)
      setDisplayValue(formatted)

      // Emit bilangan bulat ke parent / react-hook-form
      onChange?.(parsed)

      // Kembalikan kursor ke posisi angka yang tepat setelah re-format
      requestAnimationFrame(() => {
        const input = internalInputRef.current
        if (!input) return

        let targetPos = 0
        let countedDigits = 0
        for (let i = 0; i < formatted.length; i++) {
          if (/[\d]/.test(formatted[i])) {
            countedDigits++
          }
          if (countedDigits === digitsBeforeCursor) {
            targetPos = i + 1
            break
          }
        }

        // Jika kursor berada di akhir atau string kosong
        if (targetPos === 0 && digitsBeforeCursor > 0) {
          targetPos = formatted.length
        }

        input.setSelectionRange(targetPos, targetPos)
      })
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      // Pastikan tampilan selalu terformat sempurna saat blur
      setDisplayValue(formatRibuan(value))
      onBlur?.(e)
    }

    return (
      <Input
        ref={handleCombinedRef}
        type="text"
        inputMode="numeric"
        prefix={prefix}
        value={displayValue}
        placeholder={placeholder}
        onChange={handleChange}
        onBlur={handleBlur}
        className={`tabular-nums font-medium ${className}`}
        {...props}
      />
    )
  }
)

MoneyInput.displayName = 'MoneyInput'
