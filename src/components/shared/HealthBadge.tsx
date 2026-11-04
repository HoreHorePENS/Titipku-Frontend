import { Badge, type BadgeSize } from '@/components/ui/Badge'
import { healthTier, HEALTH_TIER_MAP, type HealthTier } from './badge-constants'

export type { HealthTier }

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
  let tier: HealthTier = 'evaluasi'

  try {
    tier = healthTier(score)
  } catch {
    tier = 'evaluasi'
  }

  const config = HEALTH_TIER_MAP[tier]

  const shapeIcon = (() => {
    switch (tier) {
      case 'bagus':
        return (
          <span
            className="inline-block w-2 h-2 rounded-full bg-current shrink-0"
            aria-hidden="true"
          />
        )
      case 'pantau':
        return (
          <span
            className="inline-block w-2 h-2 rounded-xs bg-current shrink-0"
            aria-hidden="true"
          />
        )
      case 'evaluasi':
        return (
          <span
            className="inline-block w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[7px] border-b-current shrink-0"
            aria-hidden="true"
          />
        )
    }
  })()

  return (
    <Badge
      tone={config.tone}
      size={size}
      className={`inline-flex items-center gap-1.5 ${className}`}
      aria-label={`Status kesehatan warung: ${config.label} (${score}/100)`}
    >
      {shapeIcon}
      <span>{config.label}</span>
      {showRange && (
        <span className="opacity-75 font-normal text-[10px]">({config.range})</span>
      )}
    </Badge>
  )
}

export default HealthBadge
