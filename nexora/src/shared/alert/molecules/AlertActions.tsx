import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export interface AlertActionsProps {
  children: ReactNode
  className?: string
}

/**
 * Molécula: Barra de acciones opcionales dentro de la alerta (ej: Reintentar, Deshacer, Ver más)
 */
export function AlertActions({ children, className }: AlertActionsProps) {
  if (!children) return null

  return (
    <div className={cn('mt-3.5 flex flex-wrap items-center gap-2 pt-1 border-t border-inherit/30', className)}>
      {children}
    </div>
  )
}
