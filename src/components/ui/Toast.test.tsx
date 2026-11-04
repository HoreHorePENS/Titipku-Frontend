import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { ToastProvider } from './Toast'
import { toast, toastStore } from './toast-store'

describe('Toast Store & Behavior', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    toastStore.dismissAll()
  })

  afterEach(() => {
    toastStore.dismissAll()
    vi.useRealTimers()
  })

  it('toast tanpa aksi berdurasi 4000ms dan hilang otomatis', () => {
    toast.success({ title: 'Pembayaran dicatat' })
    expect(toastStore.getSnapshot().length).toBe(1)
    expect(toastStore.getSnapshot()[0].duration).toBe(4000)

    // Maju 3900ms (masih ada)
    toastStore.tick(3900)
    expect(toastStore.getSnapshot().length).toBe(1)

    // Lewat 4000ms -> terhapus
    toastStore.tick(200)
    expect(toastStore.getSnapshot().length).toBe(0)
  })

  it('toast dengan aksi bertahan 8000ms secara default', () => {
    const handleAction = vi.fn()
    toast.info({
      title: 'Warung diarsipkan',
      action: { label: 'Urungkan', onClick: handleAction },
    })

    const item = toastStore.getSnapshot()[0]
    expect(item.duration).toBe(8000)
    expect(item.remainingMs).toBe(8000)

    // Maju 5000ms
    toastStore.tick(5000)
    expect(toastStore.getSnapshot().length).toBe(1)

    // Maju 3100ms lagi -> total 8100ms -> terhapus
    toastStore.tick(3100)
    expect(toastStore.getSnapshot().length).toBe(0)
  })

  it('berhenti menghitung mundur saat paused (hover/fokus) dan berlanjut saat resume', () => {
    const id = toast.show({ title: 'Data sinkron' })

    // Berjalan 2000ms
    toastStore.tick(2000)
    expect(toastStore.getSnapshot()[0].remainingMs).toBe(2000)

    // Pause (simulasi hover / fokus)
    toastStore.pause(id)
    toastStore.tick(5000)
    // Sisa waktu tetap 2000ms, tidak berkurang!
    expect(toastStore.getSnapshot()[0].remainingMs).toBe(2000)
    expect(toastStore.getSnapshot().length).toBe(1)

    // Resume (simulasi unhover / blur)
    toastStore.resume(id)
    toastStore.tick(2100)
    // Sekarang baru selesai dan terhapus
    expect(toastStore.getSnapshot().length).toBe(0)
  })

  it('maksimal 3 toast aktif dieksekusi timer-nya, sisanya mengantre', () => {
    toast.show({ title: '1' })
    toast.show({ title: '2' })
    toast.show({ title: '3' })
    toast.show({ title: '4' })
    toast.show({ title: '5' })

    expect(toastStore.getSnapshot().length).toBe(5)

    // Tick 4100ms: hanya 3 toast pertama yang waktu countdown-nya berkurang
    toastStore.tick(4100)

    // 3 toast pertama selesai, sekarang sisa 2 toast yang tadinya mengantre
    expect(toastStore.getSnapshot().length).toBe(2)
    expect(toastStore.getSnapshot()[0].title).toBe('4')
    expect(toastStore.getSnapshot()[1].title).toBe('5')
  })

  it('tombol dismiss menghapus toast seketika', () => {
    const id = toast.info({ title: 'Tutup Segera' })
    expect(toastStore.getSnapshot().length).toBe(1)

    toastStore.dismiss(id)
    expect(toastStore.getSnapshot().length).toBe(0)
  })

  it('toast error dirender dengan role="alert" dan toast lain role="status"', () => {
    toastStore.dismissAll()
    toast.error({ title: 'Gagal Simpan' })
    const htmlAlert = renderToStaticMarkup(<ToastProvider />)
    expect(htmlAlert).toContain('role="alert"')
    expect(htmlAlert).toContain('Gagal Simpan')

    toastStore.dismissAll()
    toast.success({ title: 'Sukses Simpan' })
    const htmlStatus = renderToStaticMarkup(<ToastProvider />)
    expect(htmlStatus).toContain('role="status"')
    expect(htmlStatus).toContain('Sukses Simpan')
  })
})
