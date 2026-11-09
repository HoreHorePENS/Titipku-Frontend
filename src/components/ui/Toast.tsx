import React, { useSyncExternalStore, useEffect } from 'react'
import {
  toastStore,
  type ToastType,
  type ToastSurface,
  type ToastAction,
  type ToastOptions,
  type ToastItem,
} from './toast-store'

export type { ToastType, ToastSurface, ToastAction, ToastOptions, ToastItem }

// ============================================================================
// IKON SVG INLINE TOAST
// ============================================================================

function CheckCircleIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className={className}>
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function SyncIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 21h5v-5" />
    </svg>
  )
}

function TrashIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  )
}

function CloseIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
    </svg>
  )
}

// ============================================================================
// SINGLE TOAST COMPONENT
// ============================================================================

interface ToastCardProps {
  item: ToastItem
  onDismiss: (id: string) => void
  onPause: (id: string) => void
  onResume: (id: string) => void
}

function ToastCard({ item, onDismiss, onPause, onResume }: ToastCardProps) {
  const isInverse = item.surface === 'inverse'
  const isError = item.type === 'error'

  // Default Icon berdasarkan tone
  let iconElement = item.icon
  if (!iconElement) {
    if (item.type === 'success') {
      iconElement = (
        <span className={isInverse ? 'text-green-400' : 'text-success'}>
          <CheckCircleIcon className="w-5 h-5" />
        </span>
      )
    } else if (item.type === 'info') {
      iconElement = (
        <span className="text-primary dark:text-primary">
          <SyncIcon className="w-5 h-5" />
        </span>
      )
    } else if (item.type === 'error') {
      iconElement = (
        <span className="text-danger dark:text-danger">
          <TrashIcon className="w-5 h-5" />
        </span>
      )
    }
  }

  return (
    <div
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      onMouseEnter={() => onPause(item.id)}
      onMouseLeave={() => onResume(item.id)}
      onFocus={() => onPause(item.id)}
      onBlur={() => onResume(item.id)}
      className={`toast-card pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl shadow-md border transition-all duration-200 motion-reduce:transition-none ${
        isInverse
          ? 'bg-slate-900 dark:bg-slate-800 text-white border-slate-800 dark:border-slate-700'
          : 'bg-surface text-ink border-line shadow-xs'
      }`}
    >
      {/* Ikon Toast */}
      {iconElement && <div className="shrink-0 mt-0.5">{iconElement}</div>}

      {/* Konten Teks */}
      <div className="flex-1 min-w-0 pr-1">
        <p className={`text-title-3 font-semibold leading-snug truncate ${isInverse ? 'text-white' : 'text-ink'}`}>
          {item.title}
        </p>
        {item.description && (
          <p
            className={`text-caption mt-0.5 leading-snug line-clamp-2 ${
              isInverse ? 'text-slate-300' : 'text-ink-soft'
            }`}
          >
            {item.description}
          </p>
        )}
      </div>

      {/* Tombol Aksi (Jika ada, contoh: "Lihat" / "Urungkan") */}
      {item.action && (
        <button
          type="button"
          onClick={() => {
            item.action?.onClick()
            onDismiss(item.id)
          }}
          className={`shrink-0 text-button font-bold px-2 py-1 min-h-[40px] rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-focus-ring ${
            isInverse
              ? 'text-teal-300 hover:text-white'
              : 'text-primary hover:text-primary-hover'
          }`}
        >
          {item.action.label}
        </button>
      )}

      {/* Tombol Tutup Manual (Dismiss) */}
      <button
        type="button"
        aria-label="Tutup notifikasi"
        onClick={() => onDismiss(item.id)}
        className={`shrink-0 p-1.5 -mr-1 rounded-lg transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center focus-visible:outline-2 focus-visible:outline-focus-ring ${
          isInverse
            ? 'text-slate-400 hover:text-white hover:bg-slate-800'
            : 'text-ink-soft hover:text-ink hover:bg-surface-raised'
        }`}
      >
        <CloseIcon className="w-4 h-4" />
      </button>
    </div>
  )
}

// ============================================================================
// TOAST PROVIDER & CONTAINER
// ============================================================================

export interface ToastProviderProps {
  children?: React.ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const currentToasts = useSyncExternalStore(
    toastStore.subscribe,
    toastStore.getSnapshot,
    toastStore.getSnapshot
  )

  // Interval timer tick setiap 100ms
  useEffect(() => {
    const timer = setInterval(() => {
      toastStore.tick(100)
    }, 100)
    return () => clearInterval(timer)
  }, [])

  // Hanya tampilkan maksimal 3 toast teratas
  const visibleToasts = currentToasts.slice(0, 3)

  return (
    <>
      {children}
      {/* Wadah Toast: di atas bottom nav lewat var(--bottom-offset, 16px), max-w-[480px] */}
      <aside
        aria-label="Notifikasi sistem"
        className="fixed left-0 right-0 z-[70] pointer-events-none flex flex-col items-center px-4"
        style={{
          bottom: 'calc(var(--bottom-offset, 16px) + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <div className="w-full max-w-[480px] flex flex-col gap-2.5">
          {visibleToasts.map((item) => (
            <ToastCard
              key={item.id}
              item={item}
              onDismiss={toastStore.dismiss}
              onPause={toastStore.pause}
              onResume={toastStore.resume}
            />
          ))}
        </div>
      </aside>
    </>
  )
}
