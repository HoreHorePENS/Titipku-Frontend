import { Badge, type BadgeSize } from '@/components/ui/Badge'

export type HealthTier = 'bagus' | 'pantau' | 'evaluasi'

/**
 * Fungsi murni penentu tier kesehatan warung mitra.
 * Batas skor:
 * - >= 80  : 'bagus' (lingkaran hijau)
 * - 60 - 79: 'pantau' (kotak amber)
 * - < 60   : 'evaluasi' (segitiga merah)
 *
 * Skor di luar 0 - 100 atau NaN akan melempar Error.
 */
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

export interface HealthBadgeProps {
  score: number
  showRange?: boolean
  size?: BadgeSize
  className?: string
}

export function HealthBadge({
  score,
  showRange = true,
  size = 'sm',
  className = '',
}: HealthBadgeProps) {
  let tier: HealthTier

  try {
    tier = healthTier(score)
  } catch {
    // Fallback aman untuk UI jika data backend corrupt/salah
    return (
      <Badge tone="neutral" size={size} className={className}>
        Tidak Valid
      </Badge>
    )
  }

  const config = HEALTH_TIER_MAP[tier]
  const text = showRange
    ? `${config.label} · ${config.range}`
    : `${config.label} · ${score}`

  return (
    <Badge tone={config.tone} size={size} className={className}>
      {text}
    </Badge>
  )
}
