import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faPlus,
  faCheck,
  faXmark,
  faCircleCheck,
  faCircleXmark,
  faLeaf,
  faSeedling,
  faClock,
  faStopwatch,
  faReceipt,
  faCartShopping,
  faTag,
} from '@fortawesome/free-solid-svg-icons'
import { fadeUp } from '../../../../design-tokens/motion'
import {
  type ItemMenuProducto,
  formatearMonedaCOP,
  resolverImagenProducto,
} from '../../domain/item-menu'
import { useCarritoStore, obtenerProductoKey } from '../../application/carrito-store'
import { useCategoriaServicio } from '../../application/use-categoria-servicio'
import { ItemMenuCategoriaServicioCard } from './ItemMenuCategoriaServicioCard'

export interface ItemMenuProductoModalDetalleProps {
  producto: ItemMenuProducto | null
  onClose: () => void
}

/**
 * Molécula Atomic Design: Modal de detalle de producto gastronómico
 * con iconografía completa de FontAwesome y separación de responsabilidades.
 */
export function ItemMenuProductoModalDetalle({
  producto,
  onClose,
}: ItemMenuProductoModalDetalleProps) {
  const [agregadoAnimado, setAgregadoAnimado] = useState(false)

  // Consulta desacoplada de categoría mediante Custom Hook (Application Layer)
  const { categoriaServicio, loadingCategoria } = useCategoriaServicio(producto?.category_id)

  // Zustand Store para carrito de pedidos
  const agregarProductoAlCarrito = useCarritoStore((s) => s.agregarProducto)
  const itemsEnCarrito = useCarritoStore((s) => s.items)

  const itemKey = producto ? obtenerProductoKey(producto) : ''
  const itemEnCarrito = itemsEnCarrito.find((i) => obtenerProductoKey(i.producto) === itemKey)
  const cantidadEnCarrito = itemEnCarrito?.cantidad ?? 0

  const handleAgregarAlCarrito = () => {
    if (!producto) return
    agregarProductoAlCarrito(producto, 1)
    setAgregadoAnimado(true)
    setTimeout(() => setAgregadoAnimado(false), 1600)
  }

  // Cierre con la tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!producto) return null

  const isVegetariano = Boolean(producto.isVegetarian ?? producto.is_vegetarian)
  const isVegano = Boolean(producto.isVegan ?? producto.is_vegan)
  const isDisponible = producto.available !== false
  const imagenUrl = resolverImagenProducto(producto)

  return (
    <AnimatePresence>
      <div
        data-id={producto.id}
        data-category-id={producto.category_id}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      >
        {/* Backdrop desenfocado */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-ink/60 backdrop-blur-xs transition-opacity"
          aria-hidden="true"
        />

        {/* Contenedor del Modal con animación fadeUp */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-line bg-panel shadow-2xl z-10 my-8 max-h-[90vh] flex flex-col"
        >
          {/* Cabecera: Fotografía ampliada del producto con badges de FontAwesome */}
          <div className="relative aspect-16/10 sm:aspect-16/9 w-full overflow-hidden bg-black/10 shrink-0">
            <img
              src={imagenUrl}
              alt={producto.name}
              className="size-full object-cover"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-linear-to-t from-black/85 via-black/35 to-black/30 pointer-events-none"
            />

            {/* Botón Cerrar con FontAwesome faXmark */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 grid size-9 place-items-center rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors backdrop-blur-md cursor-pointer border border-white/20 shadow-md"
              title="Cerrar ventana de detalle"
              aria-label="Cerrar detalle del producto"
            >
              <FontAwesomeIcon icon={faXmark} className="size-4" />
            </button>

            {/* Badge de Disponibilidad y Dietas con FontAwesome */}
            <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur-md ${
                  isDisponible
                    ? 'border border-emerald-400/40 bg-emerald-500/30 text-emerald-100'
                    : 'border border-rose-400/40 bg-rose-500/30 text-rose-100'
                }`}
              >
                <FontAwesomeIcon
                  icon={isDisponible ? faCircleCheck : faCircleXmark}
                  className={`size-3 ${isDisponible ? 'text-emerald-300' : 'text-rose-300'}`}
                />
                <span>{isDisponible ? 'Disponible para Room Service' : 'Temporalmente Agotado'}</span>
              </span>

              {isVegetariano && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-green-400/40 bg-green-950/70 px-2.5 py-1 text-xs font-semibold text-green-200 backdrop-blur-md">
                  <FontAwesomeIcon icon={faLeaf} className="size-3 text-green-400" />
                  <span>Vegetariano</span>
                </span>
              )}

              {isVegano && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-950/70 px-2.5 py-1 text-xs font-semibold text-emerald-200 backdrop-blur-md">
                  <FontAwesomeIcon icon={faSeedling} className="size-3 text-emerald-400" />
                  <span>Vegano</span>
                </span>
              )}
            </div>

            {/* Título en la base de la imagen */}
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-7">
              <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white drop-shadow-md">
                {producto.name}
              </h2>
            </div>
          </div>

          {/* Cuerpo con scroll optimizado */}
          <div className="p-6 sm:p-8 space-y-6 overflow-y-auto">
            {/* Tarjeta de Precio Destacado con FontAwesome faTag y faReceipt */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 sm:p-5">
              <div>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  <FontAwesomeIcon icon={faTag} className="size-3" />
                  <span>Tarifa de Carta al Huésped</span>
                </span>
                <p className="mt-0.5 text-xs text-ink-muted">
                  Precio final con cargo a la habitación del huésped.
                </p>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-4">
                <div className="sm:text-right">
                  <span className="font-sans text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight block">
                    {formatearMonedaCOP(producto.price)}
                  </span>
                  {producto.tax_percentage !== undefined && (
                    <p className="inline-flex items-center gap-1 text-[11px] text-ink-muted">
                      <FontAwesomeIcon icon={faReceipt} className="size-2.5 text-sky-500" />
                      <span>+ IVA del {producto.tax_percentage}% incluido en factura</span>
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleAgregarAlCarrito}
                  title="Agregar una unidad al carrito"
                  aria-label="Agregar una unidad al carrito"
                  className="grid size-11 place-items-center rounded-2xl bg-primary text-white shadow-md hover:bg-primary/90 active:scale-90 transition-all cursor-pointer shrink-0"
                >
                  <FontAwesomeIcon icon={agregadoAnimado ? faCheck : faPlus} className="size-4" />
                </button>
              </div>
            </div>

            {/* Descripción y notas gastronómicas */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">
                Descripción y Notas Gastronómicas
              </h4>
              <p className="text-sm text-ink leading-relaxed whitespace-pre-line bg-canvas/60 p-4 rounded-2xl border border-line/60">
                {producto.description || 'Sin notas descriptivas adicionales para este producto.'}
              </p>
            </div>

            {/* Grid de Parámetros de Servicio: Tiempos y Horarios con FontAwesome faStopwatch y faClock */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                Parámetros de Servicio y Despacho
              </h4>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {/* Tiempo de preparación */}
                <div className="rounded-2xl border border-line bg-canvas p-4">
                  <span className="block text-[11px] font-medium text-ink-muted">
                    Tiempo de cocina
                  </span>
                  <p className="mt-1 font-semibold text-ink text-sm sm:text-base flex items-center gap-2">
                    <FontAwesomeIcon icon={faStopwatch} className="size-3.5 text-amber-500" />
                    <span>
                      {producto.prep_time !== undefined
                        ? `${producto.prep_time} minutos`
                        : 'Estándar (15-20 min)'}
                    </span>
                  </p>
                </div>

                {/* Horario de despacho */}
                <div className="rounded-2xl border border-line bg-canvas p-4 sm:col-span-2">
                  <span className="block text-[11px] font-medium text-ink-muted">
                    Ventana de atención a habitación
                  </span>
                  <p className="mt-1 font-semibold text-ink text-sm sm:text-base flex items-center gap-2">
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

            {/* Sección Molecular: Servicio de Habitaciones al que pertenece */}
            <ItemMenuCategoriaServicioCard
              categoriaServicio={categoriaServicio}
              loadingCategoria={loadingCategoria}
              categoryId={producto.category_id}
            />
          </div>

          {/* Pie del modal con botón de cierre y botón con icono de plus para agregar al carrito */}
          <div className="border-t border-line bg-canvas/50 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-ink-muted flex items-center gap-2">
              {cantidadEnCarrito > 0 ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 font-semibold text-primary">
                  <FontAwesomeIcon icon={faCartShopping} className="size-3" />
                  <span>{cantidadEnCarrito} en la comanda del carrito</span>
                </span>
              ) : (
                <span>Listo para agregar al pedido del huésped</span>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl border border-line bg-panel px-5 py-2.5 text-xs font-bold text-ink hover:bg-canvas transition-colors cursor-pointer shadow-2xs inline-flex items-center gap-1.5"
              >
                <FontAwesomeIcon icon={faXmark} className="size-3 text-ink-muted" />
                <span>Cerrar detalle</span>
              </button>
              <button
                type="button"
                onClick={handleAgregarAlCarrito}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-primary/90 transition-all cursor-pointer active:scale-95"
              >
                <FontAwesomeIcon icon={agregadoAnimado ? faCheck : faPlus} className="size-3.5" />
                <span>{agregadoAnimado ? '¡Agregado al Carrito!' : 'Agregar al Carrito'}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default ItemMenuProductoModalDetalle
