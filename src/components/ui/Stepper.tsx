import React, { useRef, useCallback, useEffect } from 'react'

export interface StepperProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  longPressStep?: number
  isError?: boolean
  disabled?: boolean
  'aria-label'?: string
  className?: string
}

export function Stepper({
  value = 0,
  onChange,
  min = 0,
  max,
  step = 1,
  longPressStep = 5,
  isError = false,
  disabled = false,
  'aria-label': ariaLabel = 'Kuantitas',
  className = '',
}: StepperProps) {
  const isMinReached = disabled || value <= min
  const isMaxReached = disabled || (max !== undefined && value >= max)

  // Ref untuk timer long-press
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isLongPressActive = useRef(false)

  // Fungsi pembersih timer
  const stopHold = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => stopHold()
  }, [stopHold])

  // Handler perubahan nilai dengan batas min/max
  const applyChange = useCallback(
    (delta: number) => {
      let next = value + delta
      if (min !== undefined && next < min) next = min
      if (max !== undefined && next > max) next = max
      onChange(next)
    },
    [value, min, max, onChange]
  )

  // Setup interaksi tombol (tekan biasa vs tekan lama ±5)
  const startHold = (delta: number) => {
    if (disabled) return
    isLongPressActive.current = false
    stopHold()

    // Timer awal sebelum mode tahan berulang aktif (400ms)
    timerRef.current = setTimeout(() => {
      isLongPressActive.current = true
      // Interval berulang tiap 150ms dengan lompatan longPressStep (±5)
      intervalRef.current = setInterval(() => {
        const stepDelta = delta < 0 ? -longPressStep : longPressStep
        applyChange(stepDelta)
      }, 150)
    }, 400)
  }

  const handlePointerUpOrLeave = (delta: number) => {
    // Jika tidak sempat masuk ke mode long-press, lakukan sekali klik standar (±step)
    if (!isLongPressActive.current && timerRef.current) {
      applyChange(delta)
    }
    stopHold()
  }

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
      e.preventDefault()
      applyChange(step)
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
      e.preventDefault()
      applyChange(-step)
    } else if (e.key === 'PageUp') {
      e.preventDefault()
      applyChange(longPressStep)
    } else if (e.key === 'PageDown') {
      e.preventDefault()
      applyChange(-longPressStep)
    }
  }

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
      className={`inline-flex items-center p-1 rounded-2xl transition-all duration-150 select-none ${
        isError
          ? 'border-2 border-danger bg-surface-raised'
          : 'border border-line bg-surface-raised'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {/* Tombol Kurang (-) 48x48px */}
      <button
        type="button"
        disabled={isMinReached}
        aria-label={`Kurangi ${ariaLabel}`}
        onPointerDown={() => startHold(-1)}
        onPointerUp={() => handlePointerUpOrLeave(-step)}
        onPointerLeave={() => stopHold()}
        onContextMenu={(e) => e.preventDefault()}
        className={`w-12 h-12 min-w-[48px] min-h-[48px] rounded-xl flex items-center justify-center font-bold text-xl transition-all duration-100 ${
          isMinReached
            ? 'bg-surface/50 text-ink-disabled border border-line/50 cursor-not-allowed opacity-30'
            : 'bg-surface text-ink border border-line hover:bg-surface-raised active:scale-95 shadow-2xs'
        }`}
      >
        <svg
          className="w-4 h-4 fill-current shrink-0"
          viewBox="0 0 16 16"
          aria-hidden="true"
        >
          <rect y="7" width="16" height="2.5" rx="1.25" />
        </svg>
      </button>

      {/* Tampilan Angka Tengah (22px tabular, min-width 52px untuk stabilitas) */}
      <div
        role="status"
        aria-live="polite"
        className={`min-w-[52px] px-2 text-center text-stepper font-bold tabular-nums select-none ${
          isError ? 'text-danger' : 'text-ink'
        }`}
      >
        {value}
      </div>

      {/* Tombol Tambah (+) 48x48px */}
      <button
        type="button"
        disabled={isMaxReached}
        aria-label={`Tambah ${ariaLabel}`}
        onPointerDown={() => startHold(1)}
        onPointerUp={() => handlePointerUpOrLeave(step)}
        onPointerLeave={() => stopHold()}
        onContextMenu={(e) => e.preventDefault()}
        className={`w-12 h-12 min-w-[48px] min-h-[48px] rounded-xl flex items-center justify-center font-bold text-xl transition-all duration-100 ${
          isMaxReached
            ? 'bg-primary/50 text-on-primary/50 cursor-not-allowed opacity-30'
            : 'bg-primary text-on-primary hover:bg-primary-hover active:scale-95 shadow-2xs'
        }`}
      >
        <svg
          className="w-4 h-4 fill-current shrink-0"
          viewBox="0 0 16 16"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M8 1.5a1.25 1.25 0 011.25 1.25V6.75h4a1.25 1.25 0 110 2.5h-4v4a1.25 1.25 0 11-2.5 0v-4h-4a1.25 1.25 0 110-2.5h4V2.75A1.25 1.25 0 018 1.5z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  )
}
