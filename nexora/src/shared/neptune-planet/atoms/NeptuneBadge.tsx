import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircle } from '@fortawesome/free-solid-svg-icons'
import { NEPTUNE_PALETTE } from '../lib/colors'
import { cn } from '../../lib/cn'

export interface NeptuneBadgeProps {
  label: string
  active?: boolean
  className?: string
}

/**
 * Átomo: Insignia / Píldora de estado con temática neptuniana.
 */
export function NeptuneBadge({ label, active = true, className }: NeptuneBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors',
        active ? 'opacity-100' : 'opacity-60',
        className
      )}
      style={{
        backgroundColor: `${NEPTUNE_PALETTE.azureVivid}18`,
        color: NEPTUNE_PALETTE.abyssalNavy,
        border: `1px solid ${NEPTUNE_PALETTE.azureVivid}33`,
      }}
    >
      <FontAwesomeIcon
        icon={faCircle}
        className="size-1.5 animate-pulse"
        style={{ color: NEPTUNE_PALETTE.azureVivid }}
      />
      <span className="font-sans font-medium">{label}</span>
    </span>
  )
}

