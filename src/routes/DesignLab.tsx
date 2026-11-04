import React, { useState, useEffect, useRef } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { MoneyInput } from '@/components/ui/MoneyInput'
import { Badge } from '@/components/ui/Badge'
import { Stepper } from '@/components/ui/Stepper'
import { StepperField } from '@/components/ui/StepperField'
import { PaymentBadge } from '@/components/shared/PaymentBadge'
import { HealthBadge } from '@/components/shared/HealthBadge'
import { ReasonChip } from '@/components/shared/ReasonChip'
import { CatalogSkeleton } from '@/features/catalog/components/CatalogSkeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { QueryState } from '@/components/shared/QueryState'
import { toast } from '@/components/ui/toast-store'
import { getContrastRatio, checkWcag } from '@/lib/contrast'

// ============================================================================
// CONFIGURATION SECTIONS (Memudahkan ekspansi komponen baru ke Design Lab)
// ============================================================================
interface LabSectionConfig {
  id: string
  title: string
  description: string
  render: () => React.ReactNode
}

// Skema Zod untuk formulir uji di Design Lab
const sampleFormSchema = z
  .object({
    outletName: z.string().min(1, 'Nama warung wajib diisi'),
    depositPrice: z.number({ message: 'Harga titip wajib diisi' }).min(100, 'Harga titip minimal Rp100'),
    sellingPrice: z.number({ message: 'Harga jual wajib diisi' }).min(100, 'Harga jual minimal Rp100'),
    receiptCode: z.string(),
  })
  .refine((data) => data.sellingPrice > data.depositPrice, {
    message: 'Harga jual harus lebih tinggi dari harga titip',
    path: ['sellingPrice'],
  })

type SampleFormValues = z.infer<typeof sampleFormSchema>

function SampleProductForm() {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SampleFormValues>({
    resolver: zodResolver(sampleFormSchema),
    defaultValues: {
      outletName: 'Warung Bu Sri',
      depositPrice: 3000,
      sellingPrice: 2500, // Sengaja < depositPrice untuk memperlihatkan error langsung
      receiptCode: 'TJ-20261027-014',
    },
  })

  const [submittedData, setSubmittedData] = useState<SampleFormValues | null>(null)

  const onSubmit = (data: SampleFormValues) => {
    setSubmittedData(data)
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-surface border border-line rounded-2xl p-4 flex flex-col gap-3.5 shadow-xs"
    >
      <div className="border-b border-line pb-2">
        <h4 className="text-title-3 text-ink">Form Uji Validasi (RHF + Zod)</h4>
        <p className="text-caption text-ink-soft">
          Harga titip Rp3.000, Harga jual Rp2.500 (memicu error bisnis).
        </p>
      </div>

      <Input
        label="Nama warung"
        placeholder="Contoh: Warung Bu Sri"
        required
        {...register('outletName')}
        error={errors.outletName?.message}
      />

      <Controller
        name="depositPrice"
        control={control}
        render={({ field }) => (
          <MoneyInput
            label="Harga titip"
            required
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            error={errors.depositPrice?.message}
          />
        )}
      />

      <Controller
        name="sellingPrice"
        control={control}
        render={({ field }) => (
          <MoneyInput
            label="Harga jual"
            required
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            error={errors.sellingPrice?.message}
          />
        )}
      />

      <Input
        label="Kode nota"
        readOnly
        hint="Dibuat otomatis oleh sistem (read-only dapat disalin)"
        {...register('receiptCode')}
      />

      <div className="pt-2">
        <Button type="submit" fullWidth variant="primary">
          Simpan Produk
        </Button>
      </div>

      {submittedData && (
        <div className="p-3 bg-success-soft text-on-success text-caption rounded-xl mt-2">
          Form berhasil disimpan! Data valid.
        </div>
      )}
    </form>
  )
}

export default function DesignLab() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    return (sessionStorage.getItem('titipku-theme-choice') as 'light' | 'dark' | 'system') || 'system'
  })
  const [frameWidth, setFrameWidth] = useState<'360' | '480' | 'full'>('360')
  const [computedColors, setComputedColors] = useState<Record<string, string>>({})
  const [badgeGrayscale, setBadgeGrayscale] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Interactive MoneyInput state test
  const [moneyEmpty, setMoneyEmpty] = useState<number | undefined>(undefined)
  const [moneyLarge, setMoneyLarge] = useState<number | undefined>(12500000)

  // Interactive Stepper states
  const [stepper1, setStepper1] = useState(6)
  const [stepper2, setStepper2] = useState(0)
  const [stepper3, setStepper3] = useState(22)
  const [interactiveStepper, setInteractiveStepper] = useState(10)

  // Interactive States Test
  const [simState, setSimState] = useState<'loading' | 'success' | 'empty' | 'error'>('success')
  const [overlaySkeleton, setOverlaySkeleton] = useState(false)
  const [stateGrayscale, setStateGrayscale] = useState(false)
  const [stateReducedMotion, setStateReducedMotion] = useState(false)

  // Effect tema: manipulasi class .dark di <html> dan simpan di sessionStorage
  useEffect(() => {
    sessionStorage.setItem('titipku-theme-choice', theme)
    const root = document.documentElement

    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (prefersDark) {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    } else if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }

    // Baca getComputedStyle setelah DOM update
    const timer = setTimeout(() => {
      const style = getComputedStyle(root)
      const tokenKeys = [
        '--color-page',
        '--color-surface',
        '--color-surface-raised',
        '--color-line',
        '--color-line-strong',
        '--color-ink',
        '--color-ink-soft',
        '--color-ink-disabled',
        '--color-primary',
        '--color-primary-hover',
        '--color-primary-soft',
        '--color-on-primary',
        '--color-on-primary-soft',
        '--color-accent',
        '--color-accent-soft',
        '--color-on-accent',
        '--color-success',
        '--color-success-soft',
        '--color-on-success',
        '--color-danger',
        '--color-danger-soft',
        '--color-on-danger',
        '--color-focus-ring',
      ]

      const colorsMap: Record<string, string> = {}
      tokenKeys.forEach((key) => {
        colorsMap[key] = style.getPropertyValue(key).trim()
      })
      setComputedColors(colorsMap)
    }, 50)

    return () => clearTimeout(timer)
  }, [theme])

  // Helper lebar container frame
  const getFrameWidthClass = () => {
    if (frameWidth === '360') return 'max-w-[360px]'
    if (frameWidth === '480') return 'max-w-[480px]'
    return 'w-full'
  }

  // ============================================================================
  // DEFINISI SEKSI-SEKSI UJI DESAIN
  // ============================================================================

  const sections: LabSectionConfig[] = [
    {
      id: 'colors',
      title: '1. Palet Warna Semantik',
      description: 'Nilai dibaca langsung dari CSS Computed Style saat tema aktif.',
      render: () => (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Object.entries(computedColors).map(([token, val]) => (
            <div
              key={token}
              className="bg-surface border border-line rounded-xl p-3 flex flex-col gap-2 shadow-xs"
            >
              <div
                className="h-10 rounded-lg border border-line flex items-center justify-center"
                style={{ backgroundColor: `var(${token})` }}
              />
              <div>
                <p className="text-[11px] font-mono font-semibold text-ink truncate">
                  {token.replace('--color-', '')}
                </p>
                <p className="text-[10px] font-mono text-ink-soft uppercase">{val || '-'}</p>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'typography',
      title: '2. Hirarki Tipografi',
      description: 'Contoh teks antarmuka Indonesia dengan token ukuran & pemotongan baris.',
      render: () => (
        <div className="flex flex-col gap-5 bg-surface border border-line rounded-2xl p-4">
          <div>
            <span className="text-[11px] font-mono text-ink-soft block">text-display (clamp 30px-40px / 800)</span>
            <h1 className="text-display text-ink">Uang tidak lagi nyangkut</h1>
          </div>

          <div>
            <span className="text-[11px] font-mono text-ink-soft block">text-title-1 (clamp 22px-28px / 800)</span>
            <h2 className="text-title-1 text-ink">Dashboard Pemilik Warung</h2>
          </div>

          <div>
            <span className="text-[11px] font-mono text-ink-soft block">text-title-2 (20px / 800)</span>
            <h3 className="text-title-2 text-ink">Prioritas Kunjungan Hari Ini</h3>
          </div>

          <div>
            <span className="text-[11px] font-mono text-ink-soft block">text-title-3 (16px / 700)</span>
            <h4 className="text-title-3 text-ink">Warung Bu Sri - Rungkut Madya</h4>
          </div>

          <div>
            <span className="text-[11px] font-mono text-ink-soft block">text-body (15px / 400)</span>
            <p className="text-body text-ink">
              Hitung sisa di rak warung dengan teliti sebelum menambahkan stok baru hari ini.
            </p>
          </div>

          <div>
            <span className="text-[11px] font-mono text-ink-soft block">text-caption (13px / 500)</span>
            <p className="text-caption text-ink-soft">
              Rungkut Madya · 2,1 km · Terakhir dikunjungi 21 Okt
            </p>
          </div>

          <div>
            <span className="text-[11px] font-mono text-ink-soft block">text-amount (34px / 800 / tabular)</span>
            <p className="text-amount text-primary tabular-nums">Rp1.240.000</p>
          </div>

          <div className="pt-3 border-t border-line">
            <span className="text-[11px] font-mono text-ink-soft block mb-1">
              Uji Pemotongan Teks Panjang (line-clamp-2)
            </span>
            <div className="p-3 bg-surface-raised rounded-xl border border-line max-w-[280px]">
              <p className="text-title-3 text-ink line-clamp-2">
                Keripik Pisang Aneka Rasa Manis Gurih Renyah Khas Lampung Kemasan Jumbo Ekstra 500 Gram
              </p>
              <p className="text-caption text-ink-soft mt-1">Harus terpotong rapi maksimal 2 baris</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'buttons',
      title: '3. Komponen Tombol',
      description: 'Matriks varian, ukuran, state (default, disabled, loading), dan icon-only.',
      render: () => (
        <div className="flex flex-col gap-6">
          <div className="bg-surface border border-line rounded-2xl p-4 flex flex-col gap-3">
            <h4 className="text-caption font-semibold text-ink-soft">Varian Tombol (Ukuran Sedang / md - 48px)</h4>
            <div className="flex flex-wrap gap-2.5">
              <Button variant="primary">Mulai Kunjungan</Button>
              <Button variant="secondary">Sekunder</Button>
              <Button variant="outline">Salin Link</Button>
              <Button variant="accent">Coba Akun Demo</Button>
              <Button variant="danger">Hapus Warung</Button>
              <Button variant="ghost">Tombol Ghost</Button>
            </div>
          </div>

          <div className="bg-surface border border-line rounded-2xl p-4 flex flex-col gap-3">
            <h4 className="text-caption font-semibold text-ink-soft">State: Default, Loading, Disabled</h4>
            <div className="flex flex-wrap gap-2.5">
              <Button variant="primary">Default</Button>
              <Button variant="primary" loading>Menyimpan…</Button>
              <Button variant="primary" disabled>Nonaktif</Button>
            </div>
          </div>

          <div className="bg-surface border border-line rounded-2xl p-4 flex flex-col gap-3">
            <h4 className="text-caption font-semibold text-ink-soft">Ukuran: Besar (52px), Sedang (48px), Kecil (40px)</h4>
            <div className="flex items-center flex-wrap gap-2.5">
              <Button size="lg" variant="primary">Besar (52px)</Button>
              <Button size="md" variant="primary">Sedang (48px)</Button>
              <Button size="sm" variant="primary">Kecil (40px)</Button>
            </div>
          </div>

          <div className="bg-surface border border-line rounded-2xl p-4 flex flex-col gap-3">
            <h4 className="text-caption font-semibold text-ink-soft">Icon-Only (Aria-Label Wajib)</h4>
            <div className="flex items-center gap-2.5">
              <Button iconOnly size="lg" aria-label="Tambah Produk">
                <span className="text-xl leading-none">+</span>
              </Button>
              <Button iconOnly size="md" variant="secondary" aria-label="Navigasi">
                <span className="text-lg leading-none">→</span>
              </Button>
              <Button iconOnly size="sm" variant="outline" aria-label="Pengaturan">
                <span className="text-sm leading-none">⚙</span>
              </Button>
            </div>
          </div>

          <div className="bg-surface border border-line rounded-2xl p-4 flex flex-col gap-3">
            <h4 className="text-caption font-semibold text-ink-soft">Full Width & Tombol Aksi Berdampingan</h4>
            <Button fullWidth size="lg" variant="primary">
              + Catat Kunjungan Baru
            </Button>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Button variant="outline" fullWidth>Batal</Button>
              <Button variant="primary" fullWidth>Simpan & Kirim</Button>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'inputs',
      title: '4. Komponen Input & Form',
      description: 'Matriks state input, MoneyInput, perbandingan Opsi A vs B, dan form validasi.',
      render: () => (
        <div className="flex flex-col gap-6">
          <div className="bg-surface border border-line rounded-2xl p-4 flex flex-col gap-4">
            <h4 className="text-caption font-semibold text-ink-soft">Matriks State Komponen Input</h4>

            <Input
              label="Nama warung (Default)"
              placeholder="Contoh: Warung Bu Sri"
              hint="Masukkan nama warung sesuai plang depan"
            />

            <Input
              label="Nama warung (Terisi)"
              defaultValue="Warung Bu Sri Rungkut"
            />

            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-caption font-bold text-ink">
                Harga titip (Fokus Statis) <span className="ml-1 text-ink-soft font-normal text-[11px]">(wajib)</span>
              </label>
              <div className="flex items-center h-14 min-h-[56px] px-3.5 rounded-[14px] border border-primary ring-2 ring-focus-ring/25 bg-surface">
                <span className="pr-2 font-bold text-ink-soft select-none">Rp</span>
                <span className="text-[16px] text-ink font-medium">3.000</span>
                <span className="animate-pulse ml-0.5 text-primary">|</span>
              </div>
              <p className="text-caption text-ink-soft">Tampilan saat kursor aktif di dalam field</p>
            </div>

            <Input
              label="Harga jual (Error)"
              prefix="Rp"
              defaultValue="2.500"
              error="Harga jual harus lebih tinggi dari harga titip"
            />

            <Input
              label="Kode nota (ReadOnly - dapat disalin)"
              readOnly
              defaultValue="TJ-20261027-014"
              hint="Klik untuk menyeleksi dan menyalin nomor nota"
            />

            <Input
              label="Status kemitraan (Disabled)"
              disabled
              defaultValue="Menunggu Verifikasi"
              hint="Field tidak dapat diubah oleh pemilik warung"
            />
          </div>

          <div className="bg-surface border border-line rounded-2xl p-4 flex flex-col gap-4">
            <h4 className="text-caption font-semibold text-ink-soft">MoneyInput (Pemisah Ribuan & Nilai Integer)</h4>

            <MoneyInput
              label="Nilai Awal (Rp3.000)"
              value={3000}
              hint="Ketik angka untuk melihat pemisah ribuan otomatis"
            />

            <MoneyInput
              label="Nilai Kosong (Undefined)"
              value={moneyEmpty}
              onChange={setMoneyEmpty}
              placeholder="0"
              hint="Nilai internal: undefined (bukan 0)"
            />

            <MoneyInput
              label="Nilai Sangat Besar (Rp12.500.000)"
              value={moneyLarge}
              onChange={setMoneyLarge}
              hint="Uji keterbacaan & tidak terjadi overflow lebar kontainer"
            />
          </div>

          <div className="bg-surface border border-line rounded-2xl p-4 flex flex-col gap-4">
            <h4 className="text-caption font-semibold text-ink-soft">Uji Teks Panjang (Label & Error Overflow)</h4>

            <Input
              label="Nama Lengkap Pemilik Warung atau Penanggung Jawab Konsinyasi di Lapangan"
              required
              placeholder="Ketik nama lengkap..."
              error="Peringatan sistem: Jumlah nominal harga jual tidak boleh lebih rendah dari harga titip konsinyasi warung mitra ini"
            />
          </div>

          <div className="bg-surface border border-line rounded-2xl p-4 flex flex-col gap-4">
            <div>
              <h4 className="text-caption font-semibold text-ink">Perbandingan Kontras Border: Opsi A vs Opsi B</h4>
              <p className="text-caption text-ink-soft">
                Pilih dengan melihat langsung kontras visual batas kotak input.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 bg-surface-raised rounded-xl border border-line flex flex-col gap-2">
                <span className="text-[11px] font-bold text-success uppercase">
                  Opsi A (Rekomendasi - Kontras 2,56:1 s.d. 4,76:1)
                </span>
                <p className="text-[12px] text-ink-soft">
                  Memakai border tegas (line-strong). Batas kotak tampak jelas di bawah sinar matahari.
                </p>
                <Input
                  contrastMode="a"
                  label="Contoh Input Opsi A"
                  placeholder="Placeholder abu-abu tegas"
                />
              </div>

              <div className="p-3 bg-surface-raised rounded-xl border border-line flex flex-col gap-2">
                <span className="text-[11px] font-bold text-ink-soft uppercase">
                  Opsi B (Border Tipis + Latar Kontras)
                </span>
                <p className="text-[12px] text-ink-soft">
                  Memakai border slate-200 tipis dengan latar belakang permukaan sedikit berwarna.
                </p>
                <Input
                  contrastMode="b"
                  label="Contoh Input Opsi B"
                  placeholder="Placeholder abu-abu lembut"
                />
              </div>
            </div>
          </div>

          <SampleProductForm />
        </div>
      ),
    },
    {
      id: 'badges',
      title: '5. Komponen Badge Status',
      description: 'Lencana status berbentuk pil dengan bahasa bentuk penanda yang konsisten.',
      render: () => (
        <div className={`flex flex-col gap-6 ${badgeGrayscale ? 'grayscale' : ''}`}>
          {/* Tombol Uji Grayscale */}
          <div className="flex items-center justify-between p-3 bg-surface-raised rounded-xl border border-line">
            <div>
              <p className="text-caption font-semibold text-ink">Simulasi Aksesibilitas: Tes Buta Warna / Hitam-Putih</p>
              <p className="text-[12px] text-ink-soft">
                Periksa apakah status tetap dapat dibedakan hanya lewat teks dan bentuk penanda.
              </p>
            </div>
            <Button
              size="sm"
              variant={badgeGrayscale ? 'primary' : 'outline'}
              onClick={() => setBadgeGrayscale(!badgeGrayscale)}
            >
              {badgeGrayscale ? '✓ Mode Hitam-Putih Aktif' : 'Aktifkan Tes Hitam-Putih'}
            </Button>
          </div>

          {/* Kelompok 1: Status Pembayaran */}
          <div className="bg-surface border border-line rounded-2xl p-4 flex flex-col gap-3">
            <h4 className="text-caption font-semibold text-ink-soft">1. Status Pembayaran (PaymentBadge)</h4>
            <div className="flex flex-wrap items-center gap-2.5">
              <PaymentBadge status="lunas" />
              <PaymentBadge status="sebagian" />
              <PaymentBadge status="belum_lunas" />
            </div>
          </div>

          {/* Kelompok 2: Skor Kesehatan Warung */}
          <div className="bg-surface border border-line rounded-2xl p-4 flex flex-col gap-3">
            <h4 className="text-caption font-semibold text-ink-soft">2. Skor Kesehatan Warung (HealthBadge)</h4>
            <div className="flex flex-col gap-2.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-caption text-ink-soft w-28">Dengan Rentang:</span>
                <HealthBadge score={91} showRange />
                <HealthBadge score={74} showRange />
                <HealthBadge score={52} showRange />
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-caption text-ink-soft w-28">Dengan Skor:</span>
                <HealthBadge score={91} showRange={false} />
                <HealthBadge score={74} showRange={false} />
                <HealthBadge score={52} showRange={false} />
              </div>
            </div>
          </div>

          {/* Kelompok 3: Alasan Prioritas Kunjungan */}
          <div className="bg-surface border border-line rounded-2xl p-4 flex flex-col gap-3">
            <h4 className="text-caption font-semibold text-ink-soft">3. Alasan Prioritas Kunjungan (ReasonChip)</h4>
            <div className="flex flex-wrap items-center gap-2.5">
              <ReasonChip reason="stok_hampir_habis" />
              <ReasonChip reason="hampir_kedaluwarsa" />
              <ReasonChip reason="piutang">Piutang 14 hari</ReasonChip>
            </div>
          </div>

          {/* Matriks Tone x Marker x Size */}
          <div className="bg-surface border border-line rounded-2xl p-4 flex flex-col gap-3">
            <h4 className="text-caption font-semibold text-ink-soft">Matriks Tone & Penanda Bentuk (Ukuran sm & md)</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-mono text-ink-soft">Success (Circle)</span>
                <Badge tone="success" size="sm">Ukuran SM</Badge>
                <Badge tone="success" size="md">Ukuran MD</Badge>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-mono text-ink-soft">Warning (Square)</span>
                <Badge tone="warning" size="sm">Ukuran SM</Badge>
                <Badge tone="warning" size="md">Ukuran MD</Badge>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-mono text-ink-soft">Danger (Triangle)</span>
                <Badge tone="danger" size="sm">Ukuran SM</Badge>
                <Badge tone="danger" size="md">Ukuran MD</Badge>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-mono text-ink-soft">Neutral (Ring)</span>
                <Badge tone="neutral" size="sm">Ukuran SM</Badge>
                <Badge tone="neutral" size="md">Ukuran MD</Badge>
              </div>
            </div>
          </div>

          {/* Uji Teks Sangat Panjang (Truncation dengan title) */}
          <div className="bg-surface border border-line rounded-2xl p-4 flex flex-col gap-2">
            <h4 className="text-caption font-semibold text-ink-soft">Uji Teks Panjang (Maksimal Lebar & Elipsis)</h4>
            <div className="max-w-[240px]">
              <Badge tone="warning">
                Piutang Jatuh Tempo Melebihi Batas 30 Hari Kerja Warung Mitra
              </Badge>
            </div>
            <p className="text-[11px] text-ink-soft">
              Teks otomatis terpotong elipsis dan menyimpan atribut title untuk hover/long-press.
            </p>
          </div>

          {/* Baris Contoh Kartu Warung pada Lebar 360px */}
          <div className="bg-surface border border-line rounded-2xl p-4 flex flex-col gap-2">
            <h4 className="text-caption font-semibold text-ink-soft">Uji Integrasi Kartu Warung (Simulasi 360px)</h4>
            <div className="p-3.5 bg-surface-raised rounded-xl border border-line flex items-center justify-between gap-2 max-w-[360px]">
              <div className="min-w-0">
                <h5 className="text-title-3 text-ink truncate">Warung Bu Sri Rungkut Madya</h5>
                <p className="text-caption text-ink-soft truncate">2,1 km · Terakhir 21 Okt</p>
              </div>
              <div className="shrink-0 flex flex-col items-end gap-1">
                <PaymentBadge status="sebagian" />
                <ReasonChip reason="stok_hampir_habis">Stok tipis</ReasonChip>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'steppers',
      title: '6. Komponen Stepper Kuantitas',
      description: 'Kontrol kuantitas dengan tombol 48×48px, angka 22px tabular, dan fitur tekan lama untuk ±5.',
      render: () => (
        <div className="flex flex-col gap-6">
          {/* Tiga State Sesuai Gambar Desain */}
          <div className="bg-surface border border-line rounded-2xl p-4 flex flex-col divide-y divide-line/40">
            <StepperField
              label="Sisa di rak"
              hint="Default"
              value={stepper1}
              onChange={setStepper1}
              min={0}
            />

            <StepperField
              label="Retur/basi"
              hint="Batas bawah: tombol – redup"
              value={stepper2}
              onChange={setStepper2}
              min={0}
            />

            <StepperField
              label="Sisa di rak"
              error="Error: melebihi titipan"
              value={stepper3}
              onChange={setStepper3}
              min={0}
            />
          </div>

          {/* Area Uji Interaktif & Tekan Lama (Long-Press) */}
          <div className="bg-surface border border-line rounded-2xl p-4 flex flex-col gap-3">
            <div>
              <h4 className="text-caption font-semibold text-ink">Uji Interaktif: Tekan Lama untuk ±5</h4>
              <p className="text-caption text-ink-soft">
                Coba tahan tombol minus atau plus selama lebih dari 400ms untuk melihat lompatan angka bertahap per 5 unit.
              </p>
            </div>

            <div className="p-4 bg-surface-raised rounded-xl border border-line flex items-center justify-between gap-4 max-w-[360px]">
              <div>
                <span className="text-[16px] font-bold text-ink block">Kuantitas Titipan</span>
                <span className="text-caption text-ink-soft">Lompatan: ±1 (klik) / ±5 (tahan)</span>
              </div>
              <Stepper
                value={interactiveStepper}
                onChange={setInteractiveStepper}
                min={0}
                max={100}
                longPressStep={5}
                aria-label="Kuantitas Titipan"
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'states',
      title: '7. Empat Keadaan Layar Data (Loading, Kosong, Error, Sukses)',
      description:
        'Komponen untuk empat keadaan layar data (mobile & desktop) dengan simulasi interaktif, uji lompatan tata letak, dan sistem toast.',
      render: () => {
        // Objek query tiruan untuk simulasi QueryState
        const mockQueryData =
          simState === 'success'
            ? [
                { id: '1', name: 'Warung Bu Sri', items: 12, debt: 45000 },
                { id: '2', name: 'Toko Berkah Mandiri', items: 8, debt: 0 },
              ]
            : simState === 'empty'
            ? []
            : undefined

        const mockQuery = {
          data: mockQueryData,
          isPending: simState === 'loading',
          isLoading: simState === 'loading',
          isError: simState === 'error',
          error: simState === 'error' ? new Error('Network connection lost') : null,
          refetch: () => setSimState('success'),
        }

        return (
          <div
            className={`flex flex-col gap-8 ${
              stateGrayscale ? 'grayscale' : ''
            } ${stateReducedMotion ? '[&_*]:!transition-none [&_*]:!animate-none' : ''}`}
          >
            {/* Toolbar Pengendali Aksesibilitas Khusus Seksi State */}
            <div className="bg-surface border border-line rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
              <div>
                <h4 className="text-caption font-bold text-ink">Simulasi Lingkungan Lapangan</h4>
                <p className="text-caption text-ink-soft">
                  Uji keterbacaan di bawah terik matahari (hitam-putih) dan preferensi reduced motion.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant={stateGrayscale ? 'primary' : 'outline'}
                  onClick={() => setStateGrayscale(!stateGrayscale)}
                >
                  {stateGrayscale ? '✓ Hitam-Putih Aktif' : 'Tes Hitam-Putih'}
                </Button>
                <Button
                  size="sm"
                  variant={stateReducedMotion ? 'primary' : 'outline'}
                  onClick={() => setStateReducedMotion(!stateReducedMotion)}
                >
                  {stateReducedMotion ? '✓ Gerak Dimatikan' : 'Kurangi Gerak'}
                </Button>
              </div>
            </div>

            {/* BAGIAN A: EMPAT KEADAAN BERDAMPINGAN SESUAI DESAIN ASLI */}
            <div>
              <div className="mb-3">
                <h3 className="text-title-2 text-ink font-bold">1. Tampilan Asli Desain (Empat Keadaan)</h3>
                <p className="text-caption text-ink-soft">
                  Komposisi empat layar data penting yang dipakai ulang di mobile dan desktop.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Loading Skeleton */}
                <div className="bg-surface border border-line rounded-2xl p-4 flex flex-col shadow-xs">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-line">
                    <span className="w-5 h-5 rounded-full bg-surface-raised border border-line text-[11px] font-bold flex items-center justify-center text-ink">
                      1
                    </span>
                    <span className="text-caption font-bold text-ink">Loading · skeleton</span>
                  </div>
                  <CatalogSkeleton />
                  <p className="text-[11px] text-ink-soft mt-3 pt-2 border-t border-line italic">
                    Bentuk skeleton meniru tata letak asli agar tidak ada lompatan saat data masuk.
                  </p>
                </div>

                {/* 2. Kosong Empty State */}
                <div className="bg-surface border border-line rounded-2xl p-4 flex flex-col justify-between shadow-xs">
                  <div>
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-line">
                      <span className="w-5 h-5 rounded-full bg-surface-raised border border-line text-[11px] font-bold flex items-center justify-center text-ink">
                        2
                      </span>
                      <span className="text-caption font-bold text-ink">Kosong · empty state</span>
                    </div>
                    <EmptyState
                      size="page"
                      title="Belum ada warung mitra"
                      description="Tambahkan warung pertama untuk mulai mencatat titipan dan menagih dengan rapi."
                      action={{
                        label: 'Tambah Warung',
                        onClick: () =>
                          toast.info({
                            title: 'Buka form warung',
                            description: 'Navigasi ke tambah mitra baru',
                          }),
                      }}
                      secondaryAction={{
                        label: 'Impor dari daftar kontak',
                        onClick: () =>
                          toast.info({
                            title: 'Fitur Kontak',
                            description: 'Akan membuka kontak peramban jika didukung perangkat',
                          }),
                      }}
                    />
                  </div>
                  <p className="text-[11px] text-ink-soft mt-3 pt-2 border-t border-line italic">
                    Selalu ada satu aksi utama yang menjelaskan langkah berikutnya.
                  </p>
                </div>

                {/* 3. Error State + Input Error */}
                <div className="bg-surface border border-line rounded-2xl p-4 flex flex-col justify-between shadow-xs">
                  <div>
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-line">
                      <span className="w-5 h-5 rounded-full bg-surface-raised border border-line text-[11px] font-bold flex items-center justify-center text-ink">
                        3
                      </span>
                      <span className="text-caption font-bold text-ink">Error · gagal memuat</span>
                    </div>

                    <ErrorState
                      type="network"
                      size="inline"
                      title="Gagal memuat tagihan"
                      lastUpdatedAt="2026-10-28T00:12:00.000Z"
                      onRetry={() =>
                        toast.info({
                          title: 'Mencoba kembali...',
                          description: 'Mengirim ulang permintaan data ke server',
                        })
                      }
                      onViewCachedData={() =>
                        toast.success({
                          title: 'Menampilkan data lama',
                          description: 'Data dari cache lokal 07.12 dimuat',
                        })
                      }
                    />

                    {/* Contoh Error Pada Isian (Input Nominal Dibayar) */}
                    <div className="mt-4 pt-3 border-t border-line">
                      <Input
                        label="Nominal dibayar"
                        prefix="Rp"
                        defaultValue="250.000"
                        error="Melebihi sisa tagihan Rp186.000"
                      />
                    </div>
                  </div>

                  <p className="text-[11px] text-ink-soft mt-3 pt-2 border-t border-line italic">
                    Error menjelaskan penyebab + jalan keluar, ditempatkan dekat sumber masalah.
                  </p>
                </div>

                {/* 4. Sukses Toast (4 Contoh Bertumpuk) */}
                <div className="bg-surface border border-line rounded-2xl p-4 flex flex-col justify-between shadow-xs">
                  <div>
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-line">
                      <span className="w-5 h-5 rounded-full bg-surface-raised border border-line text-[11px] font-bold flex items-center justify-center text-ink">
                        4
                      </span>
                      <span className="text-caption font-bold text-ink">Sukses · toast</span>
                    </div>

                    <div className="flex flex-col gap-3">
                      {/* Toast 1: Inverse */}
                      <div className="bg-slate-900 text-white rounded-2xl p-3.5 shadow-md flex items-start gap-3">
                        <span className="text-green-400 shrink-0 mt-0.5">
                          <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-title-3 font-semibold text-white">Pembayaran dicatat</p>
                          <p className="text-caption text-slate-300">Rp86.000 · Warung Bu Sri · Lunas</p>
                        </div>
                      </div>

                      {/* Toast 2: Standar + Aksi Lihat */}
                      <div className="bg-surface border border-line rounded-2xl p-3.5 shadow-xs flex items-center justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <span className="text-success shrink-0 mt-0.5">
                            <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </span>
                          <div className="min-w-0">
                            <p className="text-title-3 font-semibold text-ink">Produk ditambahkan</p>
                            <p className="text-caption text-ink-soft truncate">Keripik Pisang Keju 100g</p>
                          </div>
                        </div>
                        <button type="button" className="text-button text-primary font-bold shrink-0">
                          Lihat
                        </button>
                      </div>

                      {/* Toast 3: Standar + Ikon Sinkron */}
                      <div className="bg-surface border border-line rounded-2xl p-3.5 shadow-xs flex items-start gap-3">
                        <span className="text-primary shrink-0 mt-0.5">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                            <path d="M3 3v5h5" />
                            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                            <path d="M16 21h5v-5" />
                          </svg>
                        </span>
                        <div className="min-w-0">
                          <p className="text-title-3 font-semibold text-ink">2 kunjungan tersinkron</p>
                          <p className="text-caption text-ink-soft">Sinyal kembali, data aman di server</p>
                        </div>
                      </div>

                      {/* Toast 4: Standar + Ikon Hapus + Aksi Urungkan */}
                      <div className="bg-surface border border-line rounded-2xl p-3.5 shadow-xs flex items-center justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <span className="text-danger shrink-0 mt-0.5">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                            </svg>
                          </span>
                          <div className="min-w-0">
                            <p className="text-title-3 font-semibold text-ink">Warung diarsipkan</p>
                          </div>
                        </div>
                        <button type="button" className="text-button text-primary font-bold shrink-0">
                          Urungkan
                        </button>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-ink-soft mt-3 pt-2 border-t border-line italic">
                    Toast muncul 4 detik di atas bottom nav; aksi berisiko selalu bisa diurungkan.
                  </p>
                </div>
              </div>
            </div>

            {/* BAGIAN B: SIMULASI LAYAR DATA DINAMIS DENGAN QUERYSTATE */}
            <div className="bg-surface border border-line rounded-2xl p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-line">
                <div>
                  <h3 className="text-title-2 text-ink font-bold">2. Simulasi Layar Data (QueryState)</h3>
                  <p className="text-caption text-ink-soft">
                    Beralih keadaan secara langsung tanpa jaringan untuk menguji integrasi TanStack Query.
                  </p>
                </div>

                {/* Tombol Pemilih State */}
                <div className="flex flex-wrap items-center gap-1.5 bg-surface-raised p-1 rounded-xl border border-line">
                  <Button
                    size="sm"
                    variant={simState === 'loading' ? 'primary' : 'ghost'}
                    onClick={() => setSimState('loading')}
                  >
                    Memuat
                  </Button>
                  <Button
                    size="sm"
                    variant={simState === 'success' ? 'primary' : 'ghost'}
                    onClick={() => setSimState('success')}
                  >
                    Ada Data
                  </Button>
                  <Button
                    size="sm"
                    variant={simState === 'empty' ? 'primary' : 'ghost'}
                    onClick={() => setSimState('empty')}
                  >
                    Kosong
                  </Button>
                  <Button
                    size="sm"
                    variant={simState === 'error' ? 'primary' : 'ghost'}
                    onClick={() => setSimState('error')}
                  >
                    Error
                  </Button>
                </div>
              </div>

              {/* Uji Lompatan Tata Letak (Zero Layout Shift) */}
              <div className="mb-4 flex items-center justify-between bg-surface-raised p-3 rounded-xl border border-line">
                <div>
                  <span className="text-caption font-semibold text-ink block">
                    Uji Lompatan Tata Letak (Layout Shift Inspector)
                  </span>
                  <span className="text-caption text-ink-soft">
                    Menumpuk skeleton dengan transparansi di atas kartu data asli untuk memeriksa kesamaan dimensi.
                  </span>
                </div>
                <Button
                  size="sm"
                  variant={overlaySkeleton ? 'primary' : 'outline'}
                  onClick={() => setOverlaySkeleton(!overlaySkeleton)}
                >
                  {overlaySkeleton ? '✓ Tumpukan Aktif' : 'Tumpuk Skeleton'}
                </Button>
              </div>

              {/* Kontainer Layar QueryState */}
              <div className="relative border border-line rounded-2xl p-4 bg-page min-h-[380px]">
                {/* Overlay Skeleton jika tombol tumpukan aktif */}
                {overlaySkeleton && (
                  <div className="absolute inset-0 z-20 pointer-events-none p-4 bg-primary-soft/30 backdrop-blur-[1px]">
                    <div className="opacity-80">
                      <CatalogSkeleton />
                    </div>
                  </div>
                )}

                <QueryState
                  query={mockQuery}
                  delayMs={0}
                  loadingComponent={<CatalogSkeleton />}
                  emptyComponent={
                    <EmptyState
                      title="Belum ada warung mitra"
                      description="Tambahkan warung pertama untuk mulai mencatat titipan dan menagih dengan rapi."
                      action={{
                        label: 'Tambah Warung',
                        onClick: () => setSimState('success'),
                      }}
                    />
                  }
                  errorProps={{
                    lastUpdatedAt: '2026-10-28T00:12:00.000Z',
                    onRetry: () => setSimState('loading'),
                    onViewCachedData: () => setSimState('success'),
                  }}
                >
                  {(data) => (
                    <div className="flex flex-col gap-4">
                      {/* Judul Asli */}
                      <div className="flex flex-col">
                        <h4 className="text-title-1 font-bold text-ink">Katalog & Mitra</h4>
                        <p className="text-caption text-ink-soft">Daftar warung dan stok aktif konsinyasi</p>
                      </div>

                      {/* Dua Kotak Statistik */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-surface border border-line rounded-2xl p-3.5 shadow-xs">
                          <span className="text-caption text-ink-soft block">Total Warung</span>
                          <span className="text-amount-md font-bold text-ink tabular-nums">2 Mitra</span>
                        </div>
                        <div className="bg-surface border border-line rounded-2xl p-3.5 shadow-xs">
                          <span className="text-caption text-ink-soft block">Piutang Aktif</span>
                          <span className="text-amount-md font-bold text-ink tabular-nums">Rp45.000</span>
                        </div>
                      </div>

                      <span className="text-title-3 font-semibold text-ink mt-1">Daftar Warung</span>

                      {/* Kartu Daftar Warung Asli */}
                      {data.map((outlet) => (
                        <div
                          key={outlet.id}
                          className="bg-surface border border-line rounded-2xl p-4 flex flex-col gap-3 shadow-xs"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-primary-soft text-primary font-bold flex items-center justify-center shrink-0 border border-primary/20">
                              {outlet.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="text-title-3 font-bold text-ink truncate">{outlet.name}</h5>
                              <p className="text-caption text-ink-soft">{outlet.items} jenis produk dititipkan</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-badge font-semibold bg-success-soft text-on-success">
                              Aktif
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-badge font-semibold bg-surface-raised text-ink">
                              Sisa 8 pcs
                            </span>
                          </div>
                          <div className="pt-2 border-t border-line flex items-center justify-between text-caption text-ink-soft">
                            <span>Tagihan: <strong className="text-ink tabular-nums">Rp{outlet.debt.toLocaleString('id-ID')}</strong></span>
                            <Button size="sm" variant="ghost">Kelola</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </QueryState>
              </div>
            </div>

            {/* BAGIAN C: PENGUJIAN TOAST DI BINGKAI PONSEL DENGAN BOTTOM NAV */}
            <div className="bg-surface border border-line rounded-2xl p-5 shadow-xs">
              <div className="mb-4 pb-3 border-b border-line">
                <h3 className="text-title-2 text-ink font-bold">3. Sistem Toast & Simulasi Bottom Nav</h3>
                <p className="text-caption text-ink-soft">
                  Toast muncul di atas bottom navigation (--bottom-offset), menghormati jeda timer saat di-hover/difokus, dan mengantre jika lebih dari 3.
                </p>
              </div>

              {/* Tombol Pemicu Toast */}
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    toast.success({
                      surface: 'inverse',
                      title: 'Pembayaran dicatat',
                      description: 'Rp86.000 · Warung Bu Sri · Lunas',
                    })
                  }
                >
                  Picu Toast Inverse (Gelap)
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    toast.success({
                      title: 'Produk ditambahkan',
                      description: 'Keripik Pisang Keju 100g',
                      action: {
                        label: 'Lihat',
                        onClick: () => alert('Aksi Lihat diklik!'),
                      },
                    })
                  }
                >
                  Picu Toast + Aksi Lihat (8 dtk)
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    toast.info({
                      title: '2 kunjungan tersinkron',
                      description: 'Sinyal kembali, data aman di server',
                    })
                  }
                >
                  Picu Toast Sinkron
                </Button>

                <Button
                  size="sm"
                  variant="danger"
                  onClick={() =>
                    toast.error({
                      title: 'Warung diarsipkan',
                      action: {
                        label: 'Urungkan',
                        onClick: () => alert('Pengarsipan diurungkan!'),
                      },
                    })
                  }
                >
                  Picu Toast Bahaya + Urungkan
                </Button>

                <Button
                  size="sm"
                  variant="accent"
                  onClick={() => {
                    toast.success({ surface: 'inverse', title: 'Toast #1 (Pembayaran)' })
                    toast.success({ title: 'Toast #2 (Produk)' })
                    toast.info({ title: 'Toast #3 (Sinkron)' })
                    toast.error({ title: 'Toast #4 (Antre di belakang)' })
                  }}
                >
                  🚀 Tumpuk 4 Toast Sekaligus
                </Button>
              </div>

              {/* Bingkai Mockup Ponsel dengan Bottom Nav */}
              <div className="relative mx-auto max-w-[360px] h-[340px] rounded-3xl border-4 border-line-strong/40 bg-page overflow-hidden flex flex-col justify-between shadow-md">
                <div className="p-3 bg-surface border-b border-line text-caption font-bold text-center text-ink flex items-center justify-between">
                  <span>09.41</span>
                  <span>Titipku Mobile</span>
                  <span>Sinyal 4G</span>
                </div>

                <div className="p-4 text-center">
                  <p className="text-caption text-ink-soft">
                    Area konten layar ponsel. Coba klik tombol pemicu toast di atas untuk melihat toast melayang tepat di atas bar navigasi.
                  </p>
                </div>

                {/* Bottom Nav Tiruan */}
                <div className="bg-surface border-t border-line p-2.5 flex justify-around text-nav font-medium text-ink z-10 shadow-xs">
                  <span className="text-primary font-bold">Beranda</span>
                  <span>Kunjungan</span>
                  <span>Tagihan</span>
                  <span>Katalog</span>
                </div>
              </div>
            </div>

            {/* BAGIAN D: UKURAN PAGE VS INLINE UNTUK EMPTY & ERROR */}
            <div className="bg-surface border border-line rounded-2xl p-5 shadow-xs">
              <div className="mb-4 pb-3 border-b border-line">
                <h3 className="text-title-2 text-ink font-bold">4. Perbandingan Ukuran: Page vs Inline</h3>
                <p className="text-caption text-ink-soft">
                  Komponen dapat mengisi layar penuh (page) atau berada di dalam kartu ringkas (inline).
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <span className="text-caption font-bold text-ink">EmptyState Inline (di dalam kartu)</span>
                  <EmptyState
                    size="inline"
                    title="Belum ada riwayat tagihan"
                    description="Tagihan yang telah lunas akan muncul di sini."
                    action={{
                      label: 'Muat Ulang',
                      onClick: () => alert('Muat ulang'),
                    }}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-caption font-bold text-ink">ErrorState Inline (di dalam kartu)</span>
                  <ErrorState
                    size="inline"
                    type="server"
                    onRetry={() => alert('Coba lagi')}
                  />
                </div>
              </div>
            </div>
          </div>
        )
      },
    },
    {
      id: 'spacing',
      title: '7. Sistem Spasi (Spacing Scale)',
      description: 'Skala spasi desain: 4, 8, 12, 16, 24, 32, 48px selaras dengan standar Tailwind CSS.',
      render: () => {
        const spacingSteps = [
          { px: 4, token: '4px / gap-1 / p-1', h: 'h-1 w-1' },
          { px: 8, token: '8px / gap-2 / p-2', h: 'h-2 w-2' },
          { px: 12, token: '12px / gap-3 / p-3', h: 'h-3 w-3' },
          { px: 16, token: '16px / gap-4 / p-4', h: 'h-4 w-4' },
          { px: 24, token: '24px / gap-6 / p-6', h: 'h-6 w-6' },
          { px: 32, token: '32px / gap-8 / p-8', h: 'h-8 w-8' },
          { px: 48, token: '48px / gap-12 / p-12', h: 'h-12 w-12' },
        ]

        return (
          <div className="bg-surface border border-line rounded-2xl p-4 flex flex-col gap-4">
            <div className="flex items-end gap-3 overflow-x-auto pb-2">
              {spacingSteps.map((s) => (
                <div key={s.px} className="flex flex-col items-center gap-2 shrink-0">
                  <div
                    style={{ width: `${s.px}px`, height: `${s.px}px` }}
                    className="bg-primary/40 rounded-xs border border-primary"
                  />
                  <span className="text-[12px] font-mono font-bold text-ink">{s.px}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-line text-caption">
              {spacingSteps.map((s) => (
                <div key={s.px} className="p-2 bg-surface-raised rounded-lg font-mono text-[11px] text-ink">
                  <strong>{s.px}px</strong>: {s.token}
                </div>
              ))}
            </div>
          </div>
        )
      },
    },
    {
      id: 'contrast-inspector',
      title: '8. Pemeriksa Kontras WCAG Otomatis',
      description: 'Menghitung rasio langsung dari warna komputasi aktif di browser.',
      render: () => {
        const checkItems = [
          { name: 'Teks Utama di Page', fg: computedColors['--color-ink'] || '#0F172A', bg: computedColors['--color-page'] || '#F8FAFC', isLarge: false },
          { name: 'Teks Utama di Surface', fg: computedColors['--color-ink'] || '#0F172A', bg: computedColors['--color-surface'] || '#FFFFFF', isLarge: false },
          { name: 'Teks Keterangan di Surface', fg: computedColors['--color-ink-soft'] || '#64748B', bg: computedColors['--color-surface'] || '#FFFFFF', isLarge: false },
          { name: 'Placeholder Input di Surface', fg: computedColors['--color-ink-soft'] || '#64748B', bg: computedColors['--color-surface'] || '#FFFFFF', isLarge: false },
          { name: 'Border Input Opsi A di Surface', fg: computedColors['--color-line-strong'] || '#94A3B8', bg: computedColors['--color-surface'] || '#FFFFFF', isLarge: true },
          { name: 'Border Input Opsi B di Surface', fg: computedColors['--color-line'] || '#E2E8F0', bg: computedColors['--color-surface'] || '#FFFFFF', isLarge: true },
          { name: 'Pesan Error Input di Surface', fg: computedColors['--color-danger'] || '#B91C1C', bg: computedColors['--color-surface'] || '#FFFFFF', isLarge: false },
          { name: 'Teks di Tombol Primary', fg: computedColors['--color-on-primary'] || '#FFFFFF', bg: computedColors['--color-primary'] || '#0F766E', isLarge: false },
          { name: 'Teks di Tombol Secondary', fg: computedColors['--color-on-primary-soft'] || '#0F766E', bg: computedColors['--color-primary-soft'] || '#F0FDFA', isLarge: false },
          { name: 'Teks Badge Sukses di Latar Badge', fg: computedColors['--color-on-success'] || '#15803D', bg: computedColors['--color-success-soft'] || '#DCFCE7', isLarge: false },
          { name: 'Penanda Badge Sukses (currentColor)', fg: computedColors['--color-on-success'] || '#15803D', bg: computedColors['--color-success-soft'] || '#DCFCE7', isLarge: true },
          { name: 'Teks Badge Sebagian di Latar Badge', fg: computedColors['--color-on-accent'] || '#78350F', bg: computedColors['--color-accent-soft'] || '#FEF3C7', isLarge: false },
          { name: 'Penanda Badge Sebagian (currentColor)', fg: computedColors['--color-on-accent'] || '#78350F', bg: computedColors['--color-accent-soft'] || '#FEF3C7', isLarge: true },
          { name: 'Teks Badge Bahaya di Latar Badge', fg: computedColors['--color-on-danger'] || '#B91C1C', bg: computedColors['--color-danger-soft'] || '#FEE2E2', isLarge: false },
          { name: 'Penanda Badge Bahaya (currentColor)', fg: computedColors['--color-on-danger'] || '#B91C1C', bg: computedColors['--color-danger-soft'] || '#FEE2E2', isLarge: true },
          { name: 'Teks Badge Netral di Latar Badge', fg: computedColors['--color-ink'] || '#0F172A', bg: computedColors['--color-surface-raised'] || '#F1F5F9', isLarge: false },
          { name: 'Penanda Badge Netral (currentColor)', fg: computedColors['--color-ink'] || '#0F172A', bg: computedColors['--color-surface-raised'] || '#F1F5F9', isLarge: true },
          // State Elemen & Toast
          { name: 'Teks Toast Standard Judul di Surface', fg: computedColors['--color-ink'] || '#0F172A', bg: computedColors['--color-surface'] || '#FFFFFF', isLarge: false },
          { name: 'Teks Toast Standard Deskripsi di Surface', fg: computedColors['--color-ink-soft'] || '#64748B', bg: computedColors['--color-surface'] || '#FFFFFF', isLarge: false },
          { name: 'Teks Toast Inverse Judul di Slate-900', fg: '#FFFFFF', bg: '#0F172A', isLarge: false },
          { name: 'Teks Toast Inverse Deskripsi di Slate-900', fg: '#CBD5E1', bg: '#0F172A', isLarge: false },
          { name: 'Ikon Sukses di Toast Inverse (3:1)', fg: '#4ADE80', bg: '#0F172A', isLarge: true },
          { name: 'Ikon Sukses di Toast Standard (3:1)', fg: computedColors['--color-success'] || '#15803D', bg: computedColors['--color-surface'] || '#FFFFFF', isLarge: true },
          { name: 'Ikon Info di Toast Standard (3:1)', fg: computedColors['--color-primary'] || '#0F766E', bg: computedColors['--color-surface'] || '#FFFFFF', isLarge: true },
          { name: 'Ikon Danger di Toast Standard (3:1)', fg: computedColors['--color-danger'] || '#B91C1C', bg: computedColors['--color-surface'] || '#FFFFFF', isLarge: true },
          { name: 'Tautan Aksi Toast di Surface', fg: computedColors['--color-primary'] || '#0F766E', bg: computedColors['--color-surface'] || '#FFFFFF', isLarge: false },
          { name: 'Tautan Impor Kontak di Surface', fg: computedColors['--color-primary'] || '#0F766E', bg: computedColors['--color-surface'] || '#FFFFFF', isLarge: false },
          { name: 'Ikon Error di Lingkaran Merah Muda (3:1)', fg: computedColors['--color-danger'] || '#B91C1C', bg: computedColors['--color-danger-soft'] || '#FEE2E2', isLarge: true },
          { name: 'Border Kartu Error di Page (3:1)', fg: '#F87171', bg: computedColors['--color-page'] || '#F8FAFC', isLarge: true },
        ]

        return (
          <div className="bg-surface border border-line rounded-2xl overflow-hidden">
            <table className="w-full text-left text-caption border-collapse">
              <thead>
                <tr className="bg-surface-raised border-b border-line text-ink-soft">
                  <th className="p-3">Pasangan</th>
                  <th className="p-3">Rasio</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {checkItems.map((item, idx) => {
                  const ratio = getContrastRatio(item.fg, item.bg)
                  const passes = checkWcag(ratio, item.isLarge)
                  return (
                    <tr key={idx} className="hover:bg-surface-raised/50">
                      <td className="p-3 font-medium text-ink">{item.name}</td>
                      <td className="p-3 tabular-nums font-mono font-semibold text-ink">
                        {ratio}:1
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-bold ${
                            passes
                              ? 'bg-success-soft text-on-success'
                              : 'bg-danger-soft text-on-danger'
                          }`}
                        >
                          {passes ? 'LOLOS' : 'GAGAL'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      },
    },
    {
      id: 'card-example',
      title: '9. Contoh Gabungan (Kartu Produk)',
      description: 'Integrasi token warna, tipografi, tombol, dan badge pada kartu komponen nyata.',
      render: () => (
        <div className="bg-surface border border-line rounded-2xl p-4 flex flex-col gap-3 shadow-xs">
          <div className="flex items-start justify-between gap-2">
            <div>
              <PaymentBadge status="lunas" className="mb-1.5" />
              <h3 className="text-title-3 text-ink line-clamp-1">
                Keripik Pisang Cokelat 150g
              </h3>
            </div>
            <span className="text-amount-md text-ink tabular-nums font-bold shrink-0">
              Rp45.000
            </span>
          </div>

          <div className="flex items-center justify-between text-caption text-ink-soft pt-1">
            <span>Harga: Rp15.000 / pcs</span>
            <span>Stok kemarin: 5 pcs</span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-line">
            <span className="text-caption text-ink-soft">Sisa di rak: <strong className="text-ink tabular-nums">2 pcs</strong></span>
            <Button size="sm" variant="secondary">
              Perbarui Stok
            </Button>
          </div>
        </div>
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-page text-ink pb-16 font-sans">
      {/* Sticky Top Control Toolbar */}
      <header className="sticky top-0 z-50 bg-surface/90 backdrop-blur-md border-b border-line px-4 py-3">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-title-3 text-ink flex items-center gap-2">
              🧪 Design Lab <span className="text-caption font-normal text-ink-soft">(DEV Mode)</span>
            </h1>
          </div>

          {/* Toolbar Controls */}
          <div className="flex items-center gap-2">
            {/* Pilihan Lebar Bingkai */}
            <div className="inline-flex rounded-lg border border-line p-0.5 bg-surface-raised text-[12px]">
              {(['360', '480', 'full'] as const).map((w) => (
                <button
                  key={w}
                  onClick={() => setFrameWidth(w)}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    frameWidth === w
                      ? 'bg-surface text-ink shadow-xs'
                      : 'text-ink-soft hover:text-ink'
                  }`}
                >
                  {w === 'full' ? 'Penuh' : `${w}px`}
                </button>
              ))}
            </div>

            {/* Pilihan Tema */}
            <div className="inline-flex rounded-lg border border-line p-0.5 bg-surface-raised text-[12px]">
              {(['light', 'dark', 'system'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`px-2.5 py-1 rounded-md font-medium capitalize transition-colors ${
                    theme === t
                      ? 'bg-surface text-ink shadow-xs'
                      : 'text-ink-soft hover:text-ink'
                  }`}
                >
                  {t === 'light' ? 'Terang' : t === 'dark' ? 'Gelap' : 'Auto'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Frame */}
      <main className="p-4 flex justify-center">
        <div
          ref={containerRef}
          className={`w-full transition-all duration-200 flex flex-col gap-8 ${getFrameWidthClass()}`}
        >
          {sections.map((sec) => (
            <section key={sec.id} className="flex flex-col gap-2">
              <div className="border-b border-line pb-1">
                <h2 className="text-title-2 text-ink">{sec.title}</h2>
                <p className="text-caption text-ink-soft">{sec.description}</p>
              </div>
              <div className="pt-2">{sec.render()}</div>
            </section>
          ))}
        </div>
      </main>
    </div>
  )
}
