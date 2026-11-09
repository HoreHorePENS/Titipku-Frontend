import React, { forwardRef, useId } from 'react'

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string
  hideLabel?: boolean
  inputSize?: 'sm' | 'md' | 'lg'
  hint?: string
  error?: string
  prefix?: React.ReactNode
  suffix?: React.ReactNode
  /** Opsi border kontras: 'a' (default Opsi A: kontras terverifikasi) atau 'b' (Opsi B: border tipis + kontras latar) */
  contrastMode?: 'a' | 'b'
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label = '',
      hideLabel = false,
      inputSize = 'lg',
      hint,
      error,
      prefix,
      suffix,
      required,
      disabled,
      readOnly,
      id,
      className = '',
      contrastMode = 'a',
      ...props
    },
    ref
  ) => {
    const generatedId = useId()
    const inputId = id || `input-${generatedId}`
    const hintId = `${inputId}-hint`
    const errorId = `${inputId}-error`

    const isError = Boolean(error)
    const isActuallyDisabled = disabled

    // Styling container luar
    const baseBorderClasses =
      contrastMode === 'a'
        ? 'border-line-strong' // Opsi A: Memakai slate-400/slate-500 terverifikasi
        : 'border-line bg-surface-raised/40' // Opsi B: Border slate-200 dengan latar sedikit kontras

    const borderFocusClasses = isError
      ? 'border-danger ring-2 ring-danger/20'
      : 'focus-within:border-primary focus-within:ring-2 focus-within:ring-focus-ring/25'

    const stateClasses = isActuallyDisabled
      ? 'bg-slate-100 dark:bg-slate-900 border-line opacity-75 cursor-not-allowed'
      : readOnly
      ? 'bg-slate-50 dark:bg-slate-900/60 border-line cursor-default'
      : // Saat error, jangan pasang border netral: kelas itu menimpa border-danger.
        `${isError ? '' : baseBorderClasses} ${borderFocusClasses} bg-surface`

    const sizeClasses =
      inputSize === 'sm'
        ? 'h-9 min-h-[36px] px-3 rounded-lg text-sm'
        : inputSize === 'md'
        ? 'h-10 min-h-[40px] px-3.5 rounded-lg text-sm'
        : 'h-14 min-h-[56px] px-3.5 rounded-[14px]'

    return (
      <div className={`flex flex-col gap-1.5 w-full font-sans ${className}`}>
        {/* Label Atas */}
        {label && (
          <div className={hideLabel ? 'sr-only' : 'flex items-center justify-between'}>
            <label htmlFor={inputId} className="text-caption font-bold text-ink cursor-pointer">
              {label}
              {required && (
                <span className="ml-1 text-ink-soft font-normal text-[11px]">(wajib)</span>
              )}
            </label>
          </div>
        )}

        {/* Kotak Input */}
        <div
          className={`flex items-center border transition-all duration-150 ${sizeClasses} ${stateClasses}`}
        >
          {/* Prefix (misal: "Rp" atau icon) */}
          {prefix && (
            <div className="flex items-center pr-2 shrink-0 select-none text-ink-soft font-bold">
              {prefix}
            </div>
          )}

          {/* Elemen <input> Asli (font 16px wajib di iOS agar tidak auto-zoom) */}
          <input
            ref={ref}
            id={inputId}
            disabled={isActuallyDisabled}
            readOnly={readOnly}
            required={required}
            aria-invalid={isError ? 'true' : undefined}
            aria-describedby={[isError ? errorId : '', hint ? hintId : ''].filter(Boolean).join(' ') || undefined}
            className={`w-full h-full bg-transparent text-ink placeholder:text-ink-soft text-[16px] leading-normal outline-none ${
              readOnly ? 'cursor-default select-all' : ''
            } ${isActuallyDisabled ? 'cursor-not-allowed text-ink-disabled' : ''} ${className}`}
            {...props}
          />

          {/* Suffix (satuan, aksi, icon) */}
          {suffix && (
            <div className="flex items-center pl-2 shrink-0 select-none text-ink-soft">
              {suffix}
            </div>
          )}
        </div>

        {/* Teks Bawah: Hint selalu tampil (mis. syarat kata sandi), pesan error di bawahnya */}
        {hint ? (
          <p id={hintId} className="text-caption text-ink-soft">
            {hint}
          </p>
        ) : null}
        {/* Live region selalu ada agar pesan baru dibacakan screen reader (polite;
            ringkasan form memakai role="alert"). */}
        <div aria-live="polite" className={isError ? undefined : 'sr-only'}>
        {isError ? (
          <div
            id={errorId}
            className="flex items-center gap-1.5 text-caption text-danger font-medium animate-fadeIn"
          >
            {/* Ikon Alert Inline (tanpa emoji, tanpa dependensi eksternal) */}
            <svg
              className="w-4 h-4 shrink-0 text-danger"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span>{error}</span>
          </div>
        ) : null}
        </div>
      </div>
    )
  }
)

Input.displayName = 'Input'
