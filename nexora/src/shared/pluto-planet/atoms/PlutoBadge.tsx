import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHeart } from '@fortawesome/free-solid-svg-icons'
import { PLUTO_PALETTE } from '../lib/colors'
import { cn } from '../../lib/cn'

export interface PlutoBadgeProps {
  label: string
  active?: boolean
  className?: string
}

/**
 * Átomo: Insignia / Píldora de estado con temática plutoniana y el icónico corazón.
 */
export function PlutoBadge({ label, active = true, className }: PlutoBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors',
        active ? 'opacity-100' : 'opacity-60',
        className
      )}
      style={{
        backgroundColor: `${PLUTO_PALETTE.mysticPurple}18`,
        color: PLUTO_PALETTE.kuiperViolet,
        border: `1px solid ${PLUTO_PALETTE.mysticPurple}33`,
      }}
    >
      <FontAwesomeIcon
        icon={faHeart}
        className="size-2 animate-pulse"
        style={{ color: PLUTO_PALETTE.mysticPurple }}
      />
      <span className="font-sans font-medium">{label}</span>
    </span>
  )
}

