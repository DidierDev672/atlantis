import { memo, useEffect } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowRight,
  faCartShopping,
  faTrash,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'
import { useDeviceResourceProfile } from '../../../../shared/lib/use-device-resource-profile'
import { useCarritoStore } from '../../application/carrito-store'
import { formatearMonedaCOP } from '../../domain/item-menu'
import { CarritoModalItemRow } from '../molecules/CarritoModalItemRow'

export interface CarritoProductosModalProps {
  isOpen: boolean
  onClose: () => void
  onIrACarrito?: () => void
}

/**
 * Organismo: Modal que muestra la lista de productos agregados al carrito
 * desde el catálogo Masonry, permitiendo ajustar cantidades, vaciar o continuar al pedido.
 */
export const CarritoProductosModal = memo(function CarritoProductosModal({
  isOpen,
  onClose,
  onIrACarrito,
}: CarritoProductosModalProps) {
  const {
    policy: { enableBackdropBlur, enableAnimations },
  } = useDeviceResourceProfile()
  const items = useCarritoStore((s) => s.items)
  const incrementarCantidad = useCarritoStore((s) => s.incrementarCantidad)
  const decrementarCantidad = useCarritoStore((s) => s.decrementarCantidad)
  const removerProducto = useCarritoStore((s) => s.removerProducto)
  const vaciarCarrito = useCarritoStore((s) => s.vaciarCarrito)

  const totalArticulos = items.reduce((acc, curr) => acc + curr.cantidad, 0)
  const subtotalNeto = items.reduce(
    (acc, curr) => acc + curr.producto.price * curr.cantidad,
    0
  )
  const totalImpuestos = items.reduce((acc, curr) => {
    const rate = (curr.producto.tax_percentage ?? 0) / 100
    return acc + curr.producto.price * curr.cantidad * rate
  }, 0)
  const totalGeneral = subtotalNeto + totalImpuestos

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="carrito-modal-titulo"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        >
          <motion.div
            initial={enableAnimations ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            exit={enableAnimations ? { opacity: 0 } : undefined}
            onClick={onClose}
            className={`fixed inset-0 bg-black/60 ${
              enableBackdropBlur ? 'backdrop-blur-xs' : ''
            }`}
          />

          <motion.div
            initial={
              enableAnimations ? { opacity: 0, scale: 0.96, y: 12 } : false
            }
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={
              enableAnimations ? { opacity: 0, scale: 0.96, y: 12 } : undefined
            }
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="border-line bg-panel relative z-10 flex max-h-[88vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border shadow-2xl"
          >
            {/* Cabecera del modal */}
            <div className="border-line bg-canvas/60 flex items-center justify-between gap-3 border-b px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="bg-primary/15 text-primary grid size-10 place-items-center rounded-2xl">
                  <FontAwesomeIcon icon={faCartShopping} className="size-4" />
                </span>
                <div>
                  <h2
                    id="carrito-modal-titulo"
                    className="text-ink font-serif text-lg font-bold"
                  >
                    Productos en el Carrito
                  </h2>
                  <p className="text-ink-muted text-xs">
                    {totalArticulos}{' '}
                    {totalArticulos === 1 ? 'artículo agregado' : 'artículos agregados'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {items.length > 0 && (
                  <button
                    type="button"
                    onClick={vaciarCarrito}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-1.5 text-xs font-bold text-rose-500 transition-colors hover:bg-rose-500/20"
                  >
                    <FontAwesomeIcon icon={faTrash} className="size-3" />
                    <span>Vaciar</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Cerrar modal del carrito"
                  className="border-line bg-panel text-ink-muted hover:text-ink grid size-9 cursor-pointer place-items-center rounded-xl border transition-colors"
                >
                  <FontAwesomeIcon icon={faXmark} className="size-4" />
                </button>
              </div>
            </div>

            {/* Lista de productos agregados */}
            <div className="flex-1 space-y-3 overflow-y-auto p-5">
              {items.length === 0 ? (
                <div className="py-10 text-center">
                  <div className="bg-primary/10 text-primary mx-auto grid size-14 place-items-center rounded-2xl">
                    <FontAwesomeIcon icon={faCartShopping} className="size-6" />
                  </div>
                  <h3 className="text-ink mt-4 font-serif text-base font-bold">
                    Tu carrito está vacío
                  </h3>
                  <p className="text-ink-muted mx-auto mt-1.5 max-w-xs text-xs leading-relaxed">
                    Pasa el cursor sobre cualquier producto del menú y presiona el botón + para agregarlo aquí.
                  </p>
                </div>
              ) : (
                items.map((item, idx) => (
                  <CarritoModalItemRow
                    key={item.producto.id || `${item.producto.name}-${idx}`}
                    item={item}
                    onIncrement={incrementarCantidad}
                    onDecrement={decrementarCantidad}
                    onRemove={removerProducto}
                  />
                ))
              )}
            </div>

            {/* Resumen financiero y acciones */}
            <div className="border-line bg-canvas/70 space-y-3 border-t px-6 py-4">
              {items.length > 0 && (
                <div className="space-y-1 text-xs">
                  <div className="text-ink-muted flex justify-between">
                    <span>Subtotal neto</span>
                    <span>{formatearMonedaCOP(subtotalNeto)}</span>
                  </div>
                  <div className="text-ink-muted flex justify-between">
                    <span>Impuestos (IVA)</span>
                    <span>{formatearMonedaCOP(totalImpuestos)}</span>
                  </div>
                  <div className="border-line text-ink flex items-baseline justify-between border-t pt-2 text-sm font-extrabold">
                    <span>Total estimado</span>
                    <span className="text-primary text-base font-black">
                      {formatearMonedaCOP(totalGeneral)}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="border-line bg-panel text-ink hover:bg-canvas cursor-pointer rounded-2xl border px-4 py-2 text-xs font-bold transition-colors"
                >
                  Seguir explorando
                </button>
                {items.length > 0 && onIrACarrito && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose()
                      onIrACarrito()
                    }}
                    className="bg-primary hover:bg-primary/90 inline-flex cursor-pointer items-center gap-2 rounded-2xl px-4 py-2 text-xs font-bold text-white shadow-sm transition-all"
                  >
                    <span>Ir a confirmar pedido</span>
                    <FontAwesomeIcon icon={faArrowRight} className="size-3.5" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
})

