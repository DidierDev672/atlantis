import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

export interface SidebarNavItemProps {
  icon: ReactNode
  label: string
  active: boolean
  onClick: () => void
  collapsed?: boolean
}

export function SidebarNavItem({
  icon,
  label,
  active,
  onClick,
  collapsed = false,
}: SidebarNavItemProps) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      title={collapsed ? label : undefined}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'relative flex w-full items-center rounded-xl py-2.5 text-sm font-medium outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-cream/40 cursor-pointer overflow-hidden',
        collapsed ? 'justify-center px-2.5' : 'gap-3 px-3.5',
        active ? 'text-cream' : 'text-cream/65 hover:bg-sidebar-hover hover:text-cream',
      )}
    >
      {active && (
        <motion.span
          layoutId="sidebar-active-pill"
          className="absolute inset-0 rounded-xl bg-white/12"
          transition={{ type: 'spring', stiffness: 420, damping: 32 }}
        />
      )}
      <span className="relative shrink-0 grid size-5 place-items-center">{icon}</span>
      <span
        className={cn(
          'relative truncate whitespace-nowrap transition-all duration-200',
          collapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100 block',
        )}
      >
        {label}
      </span>
    </motion.button>
  )
}