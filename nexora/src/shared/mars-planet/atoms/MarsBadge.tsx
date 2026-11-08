import { MARS_PALETTE } from '../lib/colors'

interface MarsBadgeProps {
  label: string
  active?: boolean
  className?: string
}

/**
 * Átomo: Insignia marciana para resaltar estados, tipos de dato o unidades.
 */
export function MarsBadge({ label, active = false, className = '' }: MarsBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-mono font-medium tracking-wide border transition-colors ${
        active
          ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30'
          : 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20'
      } ${className}`}
      style={{
        borderColor: active ? `${MARS_PALETTE.rust}66` : undefined,
        color: active ? MARS_PALETTE.rust : undefined,
      }}
    >
      {label}
    </span>
  )
}
