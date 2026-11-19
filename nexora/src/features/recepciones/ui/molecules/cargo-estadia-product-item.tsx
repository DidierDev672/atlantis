import { motion } from 'motion/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUtensils } from '@fortawesome/free-solid-svg-icons'
import {
  formatCurrencyAmount,
  type GuestServiceRequestProduct,
} from '../../domain/salida-huesped'

export interface CargoEstadiaProductItemProps {
  product: GuestServiceRequestProduct
}

/**
 * Ítem de producto del servicio a la habitación dentro de "Cargo de la estadía".
 * Implementa exactamente el Fade In de `prompt/prompt-fade-in.md`.
 */
export function CargoEstadiaProductItem({
  product,
}: CargoEstadiaProductItemProps) {
  return (
    <motion.li
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="border-line/70 bg-canvas/60 flex items-start justify-between gap-3 rounded-xl border px-3.5 py-3 transition-colors hover:border-primary/25"
    >
      <div className="flex min-w-0 items-start gap-3">
        <span className="bg-secondary/15 text-secondary mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg">
          <FontAwesomeIcon
            icon={faUtensils}
            className="size-3.5"
            aria-hidden="true"
          />
        </span>

        <div className="min-w-0 space-y-0.5">
          <p className="text-ink truncate text-sm font-semibold">
            {product.name}
          </p>
          <p className="text-ink-muted text-xs">
            Cantidad: <span className="text-ink font-medium">{product.amount}</span>{' '}
            · Precio unitario:{' '}
            <span className="text-ink font-medium">
              {formatCurrencyAmount(product.unitPrice, product.currency)}
            </span>
          </p>
          {product.note && (
            <p className="text-ink-soft text-[11px] italic">{product.note}</p>
          )}
        </div>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-ink font-mono text-sm font-bold">
          {formatCurrencyAmount(product.lineTotal, product.currency)}
        </p>
        {product.statusLabel && (
          <span className="text-ink-muted text-[11px]">
            {product.statusLabel}
          </span>
        )}
      </div>
    </motion.li>
  )
}
