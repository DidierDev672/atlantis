import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircle } from '@fortawesome/free-solid-svg-icons'
import { SATURN_PALETTE } from '../lib/colors'
import { cn } from '../../lib/cn'

export interface SaturnBadgeProps {
  label: string
  active?: boolean
  className?: string
}

/**
 * Átomo: Insignia / Píldora de estado con temática saturniana.
 */
export function SaturnBadge({ label, active = true, className }: SaturnBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors',
        active ? 'opacity-100' : 'opacity-60',
        className
      )}
      style={{
        backgroundColor: `${SATURN_PALETTE.goldenOchre}18`,
        color: SATURN_PALETTE.deepUmber,
        border: `1px solid ${SATURN_PALETTE.goldenOchre}33`,
      }}
    >
      <FontAwesomeIcon
        icon={faCircle}
        className="size-1.5 animate-pulse"
        style={{ color: SATURN_PALETTE.goldenOchre }}
      />
      <span className="font-sans font-medium">{label}</span>
    </span>
  )
}

