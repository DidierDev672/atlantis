import { PlanetAlert } from './PlanetAlert'
import type { PlanetAlertProps } from '../lib/types'
import { cn } from '../../lib/cn'

export interface AlertItem extends PlanetAlertProps {
  id: string
}

export interface PlanetAlertStackProps {
  items: AlertItem[]
  onDismissItem?: (id: string) => void
  className?: string
}

/**
 * Organismo: PlanetAlertStack
 * Administra y renderiza una pila vertical de alertas planetarias con espaciado consistente.
 */
export function PlanetAlertStack({ items, onDismissItem, className }: PlanetAlertStackProps) {
  if (!items || items.length === 0) return null

  return (
    <div className={cn('flex flex-col gap-3 w-full', className)}>
      {items.map((item) => (
        <PlanetAlert
          key={item.id}
          {...item}
          onClose={() => {
            item.onClose?.()
            onDismissItem?.(item.id)
          }}
        />
      ))}
    </div>
  )
}
