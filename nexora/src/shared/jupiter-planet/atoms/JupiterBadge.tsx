import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMeteor } from '@fortawesome/free-solid-svg-icons'
import { JUPITER_PALETTE } from '../lib/colors'

export interface JupiterBadgeProps {
  label: string
  active?: boolean
  className?: string
}

/**
 * Átomo: Insignia / Pill temática de Júpiter con borde áureo y tipografía contrastada.
 */
export function JupiterBadge({ label, active = false, className = '' }: JupiterBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide transition-all ${className}`}
      style={{
        backgroundColor: active
          ? `${JUPITER_PALETTE.amberGold}22`
          : `${JUPITER_PALETTE.lightCream}25`,
        color: active ? JUPITER_PALETTE.amberGold : JUPITER_PALETTE.darkBrown,
        border: `1px solid ${active ? JUPITER_PALETTE.amberGold : JUPITER_PALETTE.mutedOchre}55`,
        boxShadow: active ? `0 0 8px ${JUPITER_PALETTE.amberGold}33` : undefined,
      }}
    >
      <FontAwesomeIcon
        icon={faMeteor}
        className="size-2.5"
        style={{ color: JUPITER_PALETTE.terracotta }}
      />
      <span>{label}</span>
    </span>
  )
}

