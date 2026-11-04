export type PaymentStatus = 'lunas' | 'sebagian' | 'belum_lunas'
export type HealthTier = 'bagus' | 'pantau' | 'evaluasi'
export type PriorityReason = 'stok_hampir_habis' | 'hampir_kedaluwarsa' | 'piutang'

export const PAYMENT_STATUS_MAP: Record<
  PaymentStatus,
  { tone: 'success' | 'warning' | 'danger'; label: string }
> = {
  lunas: {
    tone: 'success',
    label: 'Lunas',
  },
  sebagian: {
    tone: 'warning',
    label: 'Sebagian',
  },
  belum_lunas: {
    tone: 'danger',
    label: 'Belum Lunas',
  },
}

export function healthTier(score: number): HealthTier {
  if (typeof score !== 'number' || isNaN(score) || score < 0 || score > 100) {
    throw new Error(`Skor kesehatan tidak valid: "${score}". Skor harus berupa angka antara 0 dan 100.`)
  }

  if (score >= 80) return 'bagus'
  if (score >= 60) return 'pantau'
  return 'evaluasi'
}

export const HEALTH_TIER_MAP: Record<
  HealthTier,
  {
    tone: 'success' | 'warning' | 'danger'
    label: string
    range: string
  }
> = {
  bagus: {
    tone: 'success',
    label: 'Bagus',
    range: '80-100',
  },
  pantau: {
    tone: 'warning',
    label: 'Pantau',
    range: '60-79',
  },
  evaluasi: {
    tone: 'danger',
    label: 'Evaluasi',
    range: '<60',
  },
}

export const REASON_CONFIG_MAP: Record<
  PriorityReason,
  {
    tone: 'neutral' | 'danger' | 'warning'
    defaultLabel: string
  }
> = {
  stok_hampir_habis: {
    tone: 'neutral',
    defaultLabel: 'Stok hampir habis',
  },
  hampir_kedaluwarsa: {
    tone: 'danger',
    defaultLabel: 'Hampir kedaluwarsa',
  },
  piutang: {
    tone: 'warning',
    defaultLabel: 'Piutang 14 hari',
  },
}
