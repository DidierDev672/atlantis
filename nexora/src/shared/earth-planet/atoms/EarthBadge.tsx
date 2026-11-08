import { EARTH_PALETTE } from '../lib/colors'

interface EarthBadgeProps {
  label: string
  active?: boolean
  className?: string
}

/**
 * Átomo: Insignia terrestre para categorizar estados, tipos de dato o unidades.
 */
export function EarthBadge({ label, active = false, className = '' }: EarthBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-mono font-medium tracking-wide border transition-colors ${
        active
          ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30'
          : 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20'
      } ${className}`}
      style={{
        borderColor: active ? `${EARTH_PALETTE.oceanShallow}66` : undefined,
        color: active ? EARTH_PALETTE.oceanShallow : undefined,
      }}
    >
      {label}
    </span>
  )
}
