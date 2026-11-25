import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faPlus,
  faCheck,
  faXmark,
  faClock,
  faStopwatch,
  faReceipt,
  faCartShopping,
  faTag,
} from '@fortawesome/free-solid-svg-icons'
import { fadeUp } from '../../../../design-tokens/motion'
import { useDeviceResourceProfile } from '../../../../shared/lib/use-device-resource-profile'
import {
  type ItemMenuProducto,
  formatearMonedaCOP,
  resolverImagenProducto,
} from '../../domain/item-menu'
import { useCarritoStore, obtenerProductoKey } from '../../application/carrito-store'
import { useCategoriaServicio } from '../../application/use-categoria-servicio'
import { ItemMenuCategoriaServicioCard } from './ItemMenuCategoriaServicioCard'
import { ItemMenuProductoModalHero } from './ItemMenuProductoModalHero'

export interface ItemMenuProductoModalDetalleProps {
  producto: ItemMenuProducto | null
  onClose: () => void
}

/**
 * Molécula Atomic Design: Modal de detalle de producto gastronómico
 * adaptado al perfil de hardware (`useDeviceResourceProfile`) y delegando
 * la cabecera multimedia optimizada a `ItemMenuProductoModalHero`.
 */
export const ItemMenuProductoModalDetalle = memo(
  function ItemMenuProductoModalDetalle({
    producto,
    onClose,
  }: ItemMenuProductoModalDetalleProps) {
    const [agregadoAnimado, setAgregadoAnimado] = useState(false)
    const timerRef = useRef<number | null>(null)
    const {
      policy: { enableBackdropBlur, enableAnimations, tier },
    } = useDeviceResourceProfile()

    const { categoriaServicio, loadingCategoria } = useCategoriaServicio(
      producto?.category_id,
    )

    const agregarProductoAlCarrito = useCarritoStore((s) => s.agregarProducto)
    const itemKey = producto ? obtenerProductoKey(producto) : ''
    const cantidadEnCarrito = useCarritoStore((s) =>
      itemKey ? (s.cantidadPorKey[itemKey] ?? 0) : 0,
    )

    useEffect(() => {
      return () => {
        if (timerRef.current !== null) {
          window.clearTimeout(timerRef.current)
        }
      }
    }, [])

    useEffect(() => {
      if (!producto) return
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose()
      }
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }, [onClose, producto])

    const handleAgregarAlCarrito = useCallback(() => {
      if (!producto) return
      try {
        agregarProductoAlCarrito(producto, 1)
        setAgregadoAnimado(true)
        if (timerRef.current !== null) {
          window.clearTimeout(timerRef.current)
        }
        timerRef.current = window.setTimeout(() => {
          setAgregadoAnimado(false)
          timerRef.current = null
        }, 1600)
      } catch (error) {
        console.error('Error al agregar producto al carrito desde detalle:', error)
      }
    }, [agregarProductoAlCarrito, producto])

    if (!producto) return null

    const isVegetariano = Boolean(producto.isVegetarian ?? producto.is_vegetarian)
    const isVegano = Boolean(producto.isVegan ?? producto.is_vegan)
    const isDisponible = producto.available !== false
    const primaryUrl = resolverImagenProducto(producto)
    const animateModal = enableAnimations && tier !== 'ultra-light'

    return (
      <AnimatePresence initial={animateModal}>
        <div
          data-id={producto.id}
          data-category-id={producto.category_id}
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 sm:p-6"
        >
          {/* Backdrop único condicionado al perfil de GPU */}
          <motion.div
            initial={animateModal ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            exit={animateModal ? { opacity: 0 } : undefined}
            onClick={onClose}
            className={`fixed inset-0 bg-ink/60 transition-opacity ${
              enableBackdropBlur ? 'backdrop-blur-xs' : ''
            }`}
            aria-hidden="true"
          />

          {/* Contenedor del Modal sin capas backdrop-blur-md apiladas */}
          <motion.div
            role="dialog"
            aria-modal="true"
            variants={animateModal ? fadeUp : undefined}
            initial={animateModal ? 'hidden' : false}
            animate="visible"
            exit={animateModal ? 'exit' : undefined}
            className="relative z-10 my-8 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-line bg-panel shadow-2xl"
          >
            <ItemMenuProductoModalHero
              name={producto.name}
              primaryUrl={primaryUrl}
              isDisponible={isDisponible}
              isVegetariano={isVegetariano}
              isVegano={isVegano}
              onClose={onClose}
            />

            {/* Cuerpo con scroll */}
            <div className="space-y-6 overflow-y-auto p-6 sm:p-8">
              <div className="flex flex-col justify-between gap-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 sm:flex-row sm:items-center sm:p-5">
                <div>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    <FontAwesomeIcon icon={faTag} className="size-3" />
                    <span>Tarifa de Carta al Huésped</span>
                  </span>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    Precio final con cargo a la habitación del huésped.
                  </p>
                </div>
                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <div className="sm:text-right">
                    <span className="block font-sans text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400 sm:text-3xl">
                      {formatearMonedaCOP(producto.price)}
                    </span>
                    {producto.tax_percentage !== undefined && (
                      <p className="inline-flex items-center gap-1 text-[11px] text-ink-muted">
                        <FontAwesomeIcon
                          icon={faReceipt}
                          className="size-2.5 text-sky-500"
                        />
                        <span>
                          + IVA del {producto.tax_percentage}% incluido en factura
                        </span>
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleAgregarAlCarrito}
                    title="Agregar una unidad al carrito"
                    aria-label="Agregar una unidad al carrito"
                    className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-2xl bg-primary text-white shadow-md transition-all hover:bg-primary/90 active:scale-90"
                  >
                    <FontAwesomeIcon
                      icon={agregadoAnimado ? faCheck : faPlus}
                      className="size-4"
                    />
                  </button>
                </div>
              </div>

              <div>
                <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-muted">
                  Descripción y Notas Gastronómicas
                </h4>
                <p className="whitespace-pre-line rounded-2xl border border-line/60 bg-canvas/60 p-4 text-sm leading-relaxed text-ink">
                  {producto.description ||
                    'Sin notas descriptivas adicionales para este producto.'}
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                  Parámetros de Servicio y Despacho
                </h4>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-line bg-canvas p-4">
                    <span className="block text-[11px] font-medium text-ink-muted">
                      Tiempo de cocina
                    </span>
                    <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-ink sm:text-base">
                      <FontAwesomeIcon
                        icon={faStopwatch}
                        className="size-3.5 text-amber-500"
                      />
                      <span>
                        {producto.prep_time !== undefined
                          ? `${producto.prep_time} minutos`
                          : 'Estándar (15-20 min)'}
                      </span>
                    </p>
                  </div>

                  <div className="rounded-2xl border border-line bg-canvas p-4 sm:col-span-2">
                    <span className="block text-[11px] font-medium text-ink-muted">
                      Ventana de atención a habitación
                    </span>
                    <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-ink sm:text-base">
                      <FontAwesomeIcon icon={faClock} className="size-3.5 text-primary" />
                      <span>
                        {producto.start_time && producto.end_time
                          ? `De ${producto.start_time} a ${producto.end_time}`
                          : 'Disponible en horario regular de cocina'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <ItemMenuCategoriaServicioCard
                categoriaServicio={categoriaServicio}
                loadingCategoria={loadingCategoria}
                categoryId={producto.category_id}
              />
            </div>

            {/* Pie del modal */}
            <div className="flex flex-col items-center justify-between gap-3 border-t border-line bg-canvas/50 px-6 py-4 sm:flex-row">
              <div className="flex items-center gap-2 text-xs text-ink-muted">
                {cantidadEnCarrito > 0 ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 font-semibold text-primary">
                    <FontAwesomeIcon icon={faCartShopping} className="size-3" />
                    <span>{cantidadEnCarrito} en la comanda del carrito</span>
                  </span>
                ) : (
                  <span>Listo para agregar al pedido del huésped</span>
                )}
              </div>

              <div className="flex w-full items-center justify-end gap-3 sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-2xl border border-line bg-panel px-5 py-2.5 text-xs font-bold text-ink shadow-2xs transition-colors hover:bg-canvas"
                >
                  <FontAwesomeIcon icon={faXmark} className="size-3 text-ink-muted" />
                  <span>Cerrar detalle</span>
                </button>
                <button
                  type="button"
                  onClick={handleAgregarAlCarrito}
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-primary/90 active:scale-95"
                >
                  <FontAwesomeIcon
                    icon={agregadoAnimado ? faCheck : faPlus}
                    className="size-3.5"
                  />
                  <span>
                    {agregadoAnimado ? '¡Agregado al Carrito!' : 'Agregar al Carrito'}
                  </span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>
    )
  },
)

export default ItemMenuProductoModalDetalle
