import { useSyncExternalStore } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBowlFood,
  faCheck,
  faMagnifyingGlass,
  faPlus,
  faRotateRight,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'
import { fadeUp } from '../../../../design-tokens/motion'
import { Loading, useDelayVisibility } from '../../../../shared/loading'
import { StatusCodeAlert } from '../../../../shared/lib/status-code-validator'
import { Input } from '../../../../shared/ui/Input'
import {
  getImageLoadBalancerSnapshot,
  subscribeImageLoadBalancer,
} from '../../infrastructure/image-load-balancer'
import { useProductosPorCategoria } from '../../application/use-productos-por-categoria'
import type { MenuCategoria } from '../../domain/menu-categoria'
import { CategoriaProductoFilaItem } from '../molecules/CategoriaProductoFilaItem'

export interface MenuCategoriaModalProductosProps {
  categoria: MenuCategoria | null
  onClose: () => void
  onAgregarProducto?: (categoria: MenuCategoria) => void
}

/**
 * Organismo: Modal que muestra los productos vinculados a una categoría del menú,
 * con búsqueda en tiempo real (`Input`), carga (`/shared/loading`), balanceo de carga
 * y validación de status codes (`StatusCodeAlert`).
 */
export function MenuCategoriaModalProductos({
  categoria,
  onClose,
  onAgregarProducto,
}: MenuCategoriaModalProductosProps) {
  const {
    productosVinculados,
    productosFiltrados,
    busqueda,
    setBusqueda,
    loading,
    feedback,
    recargar,
  } = useProductosPorCategoria(categoria)

  const imageBalancer = useSyncExternalStore(
    subscribeImageLoadBalancer,
    getImageLoadBalancerSnapshot
  )
  const showImageBalancerLoading = useDelayVisibility(
    Boolean(categoria) && imageBalancer.isRunning && !loading,
    { delay: 0, minDuration: 350 }
  )

  if (!categoria) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-ink/60 backdrop-blur-xs transition-opacity"
          aria-hidden="true"
        />

        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-productos-categoria-titulo"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="relative z-10 my-8 flex w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-line bg-panel shadow-2xl"
        >
          {/* Cabecera */}
          <header className="flex items-center justify-between gap-3 border-b border-line bg-canvas/60 px-6 py-4">
            <div className="flex min-w-0 items-center gap-3">
              <img
                src={categoria.asset}
                alt={categoria.name}
                className="size-11 shrink-0 rounded-2xl border border-line object-cover"
              />
              <div className="min-w-0">
                <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-primary">
                  <FontAwesomeIcon icon={faBowlFood} className="size-3" />
                  <span>Productos de la categoría</span>
                </span>
                <h3
                  id="modal-productos-categoria-titulo"
                  className="truncate font-serif text-lg font-bold text-ink sm:text-xl"
                >
                  {categoria.name}
                </h3>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {!loading && (
                <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 font-mono text-xs font-bold text-primary">
                  {busqueda.trim()
                    ? `${productosFiltrados.length}/${productosVinculados.length}`
                    : `${productosVinculados.length} ${
                        productosVinculados.length === 1 ? 'producto' : 'productos'
                      }`}
                </span>
              )}
              <button
                type="button"
                onClick={onClose}
                className="grid size-9 cursor-pointer place-items-center rounded-full border border-line bg-panel text-ink-muted transition-colors hover:bg-canvas hover:text-ink"
                title="Cerrar ventana"
                aria-label="Cerrar ventana"
              >
                <FontAwesomeIcon icon={faXmark} className="size-4" />
              </button>
            </div>
          </header>

          {/* Barra de búsqueda en tiempo real */}
          {!loading && productosVinculados.length > 0 && (
            <div className="border-b border-line/70 bg-canvas/30 px-6 py-3">
              <Input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar producto por nombre o descripción..."
                aria-label="Buscar productos en la categoría"
                icon={<FontAwesomeIcon icon={faMagnifyingGlass} className="size-3.5" />}
                action={
                  busqueda ? (
                    <button
                      type="button"
                      onClick={() => setBusqueda('')}
                      aria-label="Limpiar búsqueda"
                      title="Limpiar búsqueda"
                      className="grid size-6 cursor-pointer place-items-center rounded-lg text-ink-muted transition-colors hover:bg-canvas hover:text-ink"
                    >
                      <FontAwesomeIcon icon={faXmark} className="size-3" />
                    </button>
                  ) : undefined
                }
              />
            </div>
          )}

          {/* Cuerpo con estado de carga, validación HTTP y listado */}
          <div className="max-h-[55vh] space-y-4 overflow-y-auto p-6">
            {showImageBalancerLoading && (
              <div className="flex items-center justify-center rounded-2xl border border-line bg-canvas/70 px-4 py-2 shadow-2xs">
                <Loading
                  visible={true}
                  variant="inline"
                  size="sm"
                  label={`Balanceando carga de imágenes (${imageBalancer.activeCount} activas · ${imageBalancer.queuedCount} en cola)…`}
                  delay={0}
                  minDuration={350}
                />
              </div>
            )}

            <StatusCodeAlert
              validation={feedback}
              dismissible
              actions={
                <button
                  type="button"
                  onClick={() => void recargar()}
                  disabled={loading}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-line bg-panel px-3 py-1.5 text-xs font-bold text-ink transition-colors hover:border-primary/40 disabled:opacity-60"
                >
                  <FontAwesomeIcon icon={faRotateRight} className="size-3" />
                  <span>Reintentar</span>
                </button>
              }
            />

            {loading ? (
              <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-line/60 bg-canvas/40">
                <Loading
                  visible={true}
                  variant="block"
                  size="md"
                  label="Cargando productos vinculados…"
                  delay={0}
                  minDuration={300}
                />
              </div>
            ) : productosFiltrados.length > 0 ? (
              <ul className="space-y-3">
                {productosFiltrados.map((producto, idx) => (
                  <CategoriaProductoFilaItem
                    key={producto.id ?? `${producto.name}-${idx}`}
                    producto={producto}
                    index={idx}
                  />
                ))}
              </ul>
            ) : productosVinculados.length > 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line bg-canvas/40 px-6 py-10 text-center">
                <FontAwesomeIcon
                  icon={faMagnifyingGlass}
                  className="size-6 text-ink-muted"
                />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-ink">
                    Sin coincidencias para "{busqueda}"
                  </p>
                  <p className="text-xs text-ink-muted">
                    Intenta con otro nombre o descripción del producto.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setBusqueda('')}
                  className="mt-1 cursor-pointer rounded-xl border border-line bg-panel px-4 py-2 text-xs font-bold text-ink transition-colors hover:border-primary/40"
                >
                  Limpiar búsqueda
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line bg-canvas/40 px-6 py-10 text-center">
                <div className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <FontAwesomeIcon icon={faBowlFood} className="size-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-ink">
                    Sin productos vinculados aún
                  </p>
                  <p className="max-w-sm text-xs text-ink-muted">
                    Esta categoría todavía no tiene platillos o bebidas asociadas en el catálogo.
                  </p>
                </div>
                {onAgregarProducto && (
                  <button
                    type="button"
                    onClick={() => {
                      onAgregarProducto(categoria)
                      onClose()
                    }}
                    className="mt-1 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-primary/90 active:scale-95"
                  >
                    <FontAwesomeIcon icon={faPlus} className="size-3" />
                    <span>Agregar primer producto</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Pie */}
          <footer className="flex flex-wrap items-center justify-end gap-3 border-t border-line bg-canvas/40 px-6 py-4">
            {onAgregarProducto && (
              <button
                type="button"
                onClick={() => {
                  onAgregarProducto(categoria)
                  onClose()
                }}
                className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-primary/40 bg-primary/10 px-5 py-2.5 text-xs font-bold text-primary shadow-xs transition-all hover:bg-primary hover:text-white active:scale-95"
              >
                <FontAwesomeIcon icon={faPlus} className="size-3.5" />
                <span>Agregar Producto</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-primary px-6 py-2.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-primary/90"
            >
              <FontAwesomeIcon icon={faCheck} className="size-3.5" />
              <span>Cerrar</span>
            </button>
          </footer>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
