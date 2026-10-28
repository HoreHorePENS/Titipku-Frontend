import { Stepper, type StepperProps } from './Stepper'

export interface StepperFieldProps extends Omit<StepperProps, 'isError' | 'aria-label'> {
  label: string
  hint?: string
  error?: string
  className?: string
}

export function StepperField({
  label,
  hint,
  error,
  className = '',
  ...stepperProps
}: StepperFieldProps) {
  const isError = Boolean(error)

  return (
    <div
      className={`flex items-center justify-between gap-4 py-2 w-full font-sans border-b border-line/40 last:border-b-0 ${className}`}
    >
      {/* Kolom Kiri: Label dan Keterangan/Error */}
      <div className="flex flex-col gap-0.5 min-w-0 pr-2">
        <span className="text-[16px] font-bold text-ink truncate leading-tight">
          {label}
        </span>
        {error ? (
          <span className="text-caption text-danger font-medium animate-fadeIn leading-tight">
            {error}
          </span>
        ) : hint ? (
          <span className="text-caption text-ink-soft leading-tight">
            {hint}
          </span>
        ) : null}
      </div>

      {/* Kolom Kanan: Widget Stepper */}
      <div className="shrink-0">
        <Stepper
          isError={isError}
          aria-label={label}
          {...stepperProps}
        />
      </div>
    </div>
  )
}
