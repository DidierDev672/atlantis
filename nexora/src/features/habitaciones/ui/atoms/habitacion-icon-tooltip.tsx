import { memo, type ReactNode } from 'react'
import { cn } from '../lib/cn'

export interface HabitacionIconTooltipProps {
  label: string
  children: ReactNode
  className?: string
}

export const HabitacionIconTooltip = memo(function HabitacionIconTooltip({
  label,
  children,
  className,
}: HabitacionIconTooltipProps) {
  return (
    <div className={cn('group/tooltip relative inline-flex', className)}>
      {children}
      <span
        role="tooltip"
        className="bg-ink text-panel pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-lg px-2.5 py-1 text-[11px] font-medium opacity-0 shadow-md transition-all duration-150 group-focus-within/tooltip:translate-y-0 group-focus-within/tooltip:opacity-100 group-hover/tooltip:translate-y-0 group-hover/tooltip:opacity-100"
      >
        {label}
      </span>
    </div>
  )
})
