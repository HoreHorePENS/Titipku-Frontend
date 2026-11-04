import type React from 'react'

export type ToastType = 'success' | 'info' | 'error' | 'default'
export type ToastSurface = 'default' | 'inverse'

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface ToastOptions {
  id?: string
  title: string
  description?: string
  type?: ToastType
  surface?: ToastSurface
  action?: ToastAction
  duration?: number
  icon?: React.ReactNode
}

export interface ToastItem extends ToastOptions {
  id: string
  createdAt: number
  remainingMs: number
  isPaused: boolean
}

type ToastListener = () => void

let toasts: ToastItem[] = []
const listeners = new Set<ToastListener>()

function emitChange() {
  for (const listener of listeners) {
    listener()
  }
}

export const toastStore = {
  subscribe(listener: ToastListener) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  getSnapshot() {
    return toasts
  },
  add(options: ToastOptions): string {
    const id = options.id || `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const duration = options.duration ?? (options.action ? 8000 : 4000)

    const newItem: ToastItem = {
      ...options,
      id,
      duration,
      createdAt: Date.now(),
      remainingMs: duration,
      isPaused: false,
    }

    toasts = [...toasts, newItem]
    emitChange()
    return id
  },
  dismiss(id: string) {
    toasts = toasts.filter((t) => t.id !== id)
    emitChange()
  },
  dismissAll() {
    toasts = []
    emitChange()
  },
  pause(id: string) {
    toasts = toasts.map((t) => (t.id === id ? { ...t, isPaused: true } : t))
    emitChange()
  },
  resume(id: string) {
    toasts = toasts.map((t) => (t.id === id ? { ...t, isPaused: false } : t))
    emitChange()
  },
  tick(elapsedMs: number) {
    let changed = false
    const nextToasts: ToastItem[] = []

    const activeToasts = toasts.slice(0, 3)
    const queuedToasts = toasts.slice(3)

    for (const item of activeToasts) {
      if (item.isPaused) {
        nextToasts.push(item)
        continue
      }
      const newRemaining = item.remainingMs - elapsedMs
      if (newRemaining <= 0) {
        changed = true
      } else {
        if (newRemaining !== item.remainingMs) changed = true
        nextToasts.push({ ...item, remainingMs: newRemaining })
      }
    }

    if (changed || queuedToasts.length > 0) {
      toasts = [...nextToasts, ...queuedToasts]
      emitChange()
    }
  },
}

export const toast = {
  show: (options: ToastOptions) => toastStore.add(options),
  success: (options: Omit<ToastOptions, 'type'>) =>
    toastStore.add({ ...options, type: 'success' }),
  info: (options: Omit<ToastOptions, 'type'>) =>
    toastStore.add({ ...options, type: 'info' }),
  error: (options: Omit<ToastOptions, 'type'>) =>
    toastStore.add({ ...options, type: 'error' }),
  dismiss: (id: string) => toastStore.dismiss(id),
  dismissAll: () => toastStore.dismissAll(),
}

export function useToast() {
  return toast
}
