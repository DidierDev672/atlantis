import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircle } from '@fortawesome/free-solid-svg-icons'
import { URANUS_PALETTE } from '../lib/colors'
import { cn } from '../../lib/cn'

export interface UranusBadgeProps {
  label: string
  active?: boolean
  className?: string
}

/**
 * Átomo: Insignia / Píldora de estado con temática uraniana.
 */
export function UranusBadge({ label, active = true, className }: UranusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors',
        active ? 'opacity-100' : 'opacity-60',
        className
      )}
      style={{
        backgroundColor: `${URANUS_PALETTE.cyanBlue}18`,
        color: URANUS_PALETTE.slateNavy,
        border: `1px solid ${URANUS_PALETTE.cyanBlue}33`,
      }}
    >
      <FontAwesomeIcon
        icon={faCircle}
        className="size-1.5 animate-pulse"
        style={{ color: URANUS_PALETTE.cyanBlue }}
      />
      <span className="font-sans font-medium">{label}</span>
    </span>
  )
}

