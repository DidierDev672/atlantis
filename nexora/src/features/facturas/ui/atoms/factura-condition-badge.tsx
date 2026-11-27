import { memo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCircleCheck,
  faClock,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons'
import type { FacturaConditionTone } from '../../domain/factura-checkout'

export interface FacturaConditionBadgeProps {
  label: string
  tone: FacturaConditionTone
}

const TONE_STYLES: Record<FacturaConditionTone, string> = {
  success:
    'border-emerald-500/30 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300',
  warning:
    'border-amber-500/30 bg-amber-500/12 text-amber-700 dark:text-amber-300',
  danger: 'border-danger/30 bg-danger/12 text-danger',
}

const TONE_ICONS = {
  success: faCircleCheck,
  warning: faClock,
  danger: faTriangleExclamation,
} as const

export const FacturaConditionBadge = memo(function FacturaConditionBadge({
  label,
  tone,
}: FacturaConditionBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${TONE_STYLES[tone]}`}
    >
      <FontAwesomeIcon
        icon={TONE_ICONS[tone]}
        className="size-3 shrink-0"
        aria-hidden="true"
      />
      <span className="truncate">{label}</span>
    </span>
  )
})
