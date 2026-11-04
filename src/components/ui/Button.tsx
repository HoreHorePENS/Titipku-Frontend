import React, { forwardRef } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'outline-primary' | 'accent' | 'danger' | 'ghost'
export type ButtonSize = 'lg' | 'md' | 'sm'

interface BaseButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  fullWidth?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

interface StandardButtonProps extends BaseButtonProps {
  iconOnly?: false
  children: React.ReactNode
  'aria-label'?: string
}

interface IconButtonProps extends BaseButtonProps {
  iconOnly: true
  children: React.ReactNode
  /** Wajib diberikan untuk tombol icon-only demi aksesibilitas */
  'aria-label': string
}

export type ButtonProps = StandardButtonProps | IconButtonProps

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-on-primary hover:bg-primary-hover active:brightness-90 border border-transparent',
  secondary:
    'bg-primary-soft text-on-primary-soft hover:brightness-95 active:brightness-90 border border-transparent',
  outline:
    'bg-surface text-ink border border-line hover:bg-surface-raised active:bg-slate-100 dark:active:bg-slate-800',
  'outline-primary':
    'bg-surface text-primary border border-primary hover:bg-primary-soft active:brightness-95',
  accent:
    'bg-amber-50 dark:bg-accent-soft text-accent dark:text-on-accent border border-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900 active:brightness-90',
  danger:
    'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 border border-transparent',
  ghost:
    'bg-transparent text-primary hover:bg-primary-soft active:bg-primary-soft/80 border border-transparent',
}

const sizeStyles: Record<ButtonSize, { standard: string; iconOnly: string }> = {
  lg: {
    standard: 'h-[52px] min-h-[52px] px-6 text-button gap-2.5',
    iconOnly: 'h-[52px] w-[52px] min-h-[52px] min-w-[52px] p-0 text-button',
  },
  md: {
    standard: 'h-12 min-h-[48px] px-5 text-button gap-2',
    iconOnly: 'h-12 w-12 min-h-[48px] min-w-[48px] p-0 text-button',
  },
  sm: {
    standard: 'h-10 min-h-[40px] px-3.5 text-caption gap-1.5',
    iconOnly: 'h-10 w-10 min-h-[40px] min-w-[40px] p-0 text-caption',
  },
}

function Spinner({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      className={`animate-spin shrink-0 ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      iconOnly = false,
      leftIcon,
      rightIcon,
      disabled,
      type = 'button',
      className = '',
      children,
      onClick,
      ...props
    },
    ref
  ) => {
    const isActuallyDisabled = disabled || loading

    const baseClasses =
      'inline-flex items-center justify-center font-semibold rounded-xl select-none transition-colors duration-150 relative overflow-hidden'
    const focusClasses =
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface'
    const disabledClasses =
      'disabled:bg-slate-200 disabled:text-slate-500 disabled:border-transparent dark:disabled:bg-slate-800 dark:disabled:text-slate-500 disabled:cursor-not-allowed disabled:pointer-events-none'
    const widthClass = fullWidth ? 'w-full' : ''

    const currentVariant = variantStyles[variant] || variantStyles.primary
    const currentSize = iconOnly
      ? sizeStyles[size].iconOnly
      : sizeStyles[size].standard

    const combinedClasses = [
      baseClasses,
      focusClasses,
      currentVariant,
      currentSize,
      disabledClasses,
      widthClass,
      className,
    ]
      .filter(Boolean)
      .join(' ')

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (isActuallyDisabled) {
        e.preventDefault()
        return
      }
      onClick?.(e)
    }

    return (
      <button
        ref={ref}
        type={type}
        disabled={isActuallyDisabled}
        aria-busy={loading ? 'true' : undefined}
        aria-disabled={isActuallyDisabled ? 'true' : undefined}
        onClick={handleClick}
        className={combinedClasses}
        {...props}
      >
        {loading ? (
          <>
            <Spinner className={iconOnly ? 'h-5 w-5' : 'h-4 w-4 mr-2'} />
            {!iconOnly && children}
          </>
        ) : (
          <>
            {!iconOnly && leftIcon && <span className="shrink-0">{leftIcon}</span>}
            {children}
            {!iconOnly && rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'
