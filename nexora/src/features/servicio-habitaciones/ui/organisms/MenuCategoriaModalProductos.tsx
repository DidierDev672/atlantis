import {
  Suspense,
  lazy,
  memo,
  useCallback,
  useEffect,
  type ChangeEvent,
  type ComponentType,
} from 'react'
import { motion } from 'motion/react'
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
import { Skeleton, type LoadingProps } from '../../../../shared/loading'
import { StatusCodeAlert } from '../../../../shared/lib/status-code-validator'
import { Input } from '../../../../shared/ui/Input'
import { useBalancedProductImage } from '../../application/use-balanced-product-image'
import { useProductosPorCategoria } from '../../application/use-productos-por-categoria'
import type { MenuCategoria } from '../../domain/menu-categoria'
import { ImageBalancerStatusBanner } from '../molecules/ImageBalancerStatusBanner'
import { MenuCategoriaModalProductosLista } from '../molecules/MenuCategoriaModalProductosLista'

const LazySharedLoading = lazy<ComponentType<LoadingProps>>(async () => {
  try {
    const mod = await import('../../../../shared/loading')
    return { default: mod.Loading }
  } catch (error) {
    console.error('Error al cargar Loading en MenuCategoriaModalProductos:', error)
    const Fallback: ComponentType<LoadingProps> = () => null
    return { default: Fallback }
  }
})

const FALLBACK_CATEGORY_IMG =
  'https://images.pexels.com/photos/1855214/pexels-photo-1855214.jpeg?auto=compress&cs=tinysrgb&w=400'

export interface MenuCategoriaModalProductosProps {
  categoria: MenuCategoria | null
  onClose: () => void
  onAgregarProducto?: (categoria: MenuCategoria) => void
}

/**
 * Organismo: Modal optimizado con los productos vinculados a una categoría del menú.
 * Aísla el balanceador de imágenes en `ImageBalancerStatusBanner`, evita `backdrop-blur-xs`,
 * virtualiza/pagina la lista de productos y carga `Loading` de forma perezosa.
 */
export const MenuCategoriaModalProductos = memo(function MenuCategoriaModalProductos({
  categoria,
  onClose,
  onAgregarProducto,
}: MenuCategoriaModalProductosProps) {
  const {
    productosVinculados,
    productosFiltrados,
    visibleProductos,
    hasMore,
    busqueda,
    setBusqueda,
    loading,
    feedback,
    recargar,
    handleLoadMore,
    mostrarCincoMas,
  } = useProductosPorCategoria(categoria)

  const headerPrimaryUrl = categoria?.asset?.trim() || ''
  const {
    activeSrc: headerImgSrc,
    isImageReady: isHeaderImgReady,
    handleImageError: handleHeaderImgError,
  } = useBalancedProductImage(headerPrimaryUrl, FALLBACK_CATEGORY_IMG, 160)

  const handleSafeClose = useCallback(() => {
    try {
      onClose()
    } catch (error) {
      console.error('Error al cerrar modal de productos por categoría:', error)
    }
  }, [onClose])

  useEffect(() => {
    if (!categoria) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleSafeClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [categoria, handleSafeClose])

  const handleBusquedaChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setBusqueda(e.target.value)
    },
    [setBusqueda],
  )

  const handleLimpiarBusqueda = useCallback(() => {
    setBusqueda('')
  }, [setBusqueda])

  const handleRecargar = useCallback(() => {
    void recargar().catch((error) => {
      console.error('Error al reintentar carga de productos de la categoría:', error)
    })
  }, [recargar])

  const handleAgregarDesdeModal = useCallback(() => {
    if (!categoria || !onAgregarProducto) return
    try {
      onAgregarProducto(categoria)
      onClose()
    } catch (error) {
      console.error('Error al abrir alta de producto desde el modal de categoría:', error)
    }
  }, [categoria, onAgregarProducto, onClose])

  if (!categoria) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 sm:p-6">
      <div
        onClick={handleSafeClose}
        className="bg-ink/60 fixed inset-0 transition-opacity"
        aria-hidden="true"
      />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-productos-categoria-titulo"
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="border-line bg-panel relative z-10 my-8 flex w-full max-w-2xl flex-col overflow-hidden rounded-3xl border shadow-2xl"
      >
        <header className="border-line bg-canvas/60 flex items-center justify-between gap-3 border-b px-6 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="border-line bg-primary/10 text-primary relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-2xl border">
              {headerPrimaryUrl ? (
                <>
                  {!isHeaderImgReady && (
                    <Skeleton
                      variant="rectangular"
                      animation="none"
                      className="absolute inset-0 size-full"
                    />
                  )}
                  {headerImgSrc && (
                    <img
                      src={headerImgSrc}
                      alt={categoria.name}
                      onError={handleHeaderImgError}
                      loading="lazy"
                      decoding="async"
                      className={`size-full object-cover transition-opacity duration-200 ${
                        isHeaderImgReady ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                  )}
                </>
              ) : (
                <FontAwesomeIcon icon={faBowlFood} className="size-4" aria-hidden="true" />
              )}
            </div>

            <div className="min-w-0">
              <span className="text-primary inline-flex items-center gap-1.5 font-mono text-[10px] font-bold tracking-wider uppercase">
                <FontAwesomeIcon icon={faBowlFood} className="size-3" />
                <span>Productos de la categoría</span>
              </span>
              <h3
                id="modal-productos-categoria-titulo"
                className="text-ink truncate font-serif text-lg font-bold sm:text-xl"
              >
                {categoria.name}
              </h3>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {!loading && (
              <span className="border-primary/20 bg-primary/10 text-primary rounded-full border px-3 py-1 font-mono text-xs font-bold">
                {busqueda.trim()
                  ? `${productosFiltrados.length}/${productosVinculados.length}`
                  : `${productosVinculados.length} ${
                      productosVinculados.length === 1 ? 'producto' : 'productos'
                    }`}
              </span>
            )}
            <button
              type="button"
              onClick={handleSafeClose}
              className="border-line bg-panel text-ink-muted hover:bg-canvas hover:text-ink grid size-9 cursor-pointer place-items-center rounded-full border transition-colors"
              title="Cerrar ventana"
              aria-label="Cerrar ventana"
            >
              <FontAwesomeIcon icon={faXmark} className="size-4" />
            </button>
          </div>
        </header>

        {!loading && productosVinculados.length > 0 && (
          <div className="border-line/70 bg-canvas/30 border-b px-6 py-3">
            <Input
              value={busqueda}
              onChange={handleBusquedaChange}
              placeholder="Buscar producto por nombre o descripción..."
              aria-label="Buscar productos en la categoría"
              icon={<FontAwesomeIcon icon={faMagnifyingGlass} className="size-3.5" />}
              action={
                busqueda ? (
                  <button
                    type="button"
                    onClick={handleLimpiarBusqueda}
                    aria-label="Limpiar búsqueda"
                    title="Limpiar búsqueda"
                    className="text-ink-muted hover:bg-canvas hover:text-ink grid size-6 cursor-pointer place-items-center rounded-lg transition-colors"
                  >
                    <FontAwesomeIcon icon={faXmark} className="size-3" />
                  </button>
                ) : undefined
              }
            />
          </div>
        )}

        <div className="max-h-[55vh] space-y-4 overflow-y-auto p-6">
          <ImageBalancerStatusBanner suppressed={loading} />

          <StatusCodeAlert
            validation={feedback}
            dismissible
            actions={
              <button
                type="button"
                onClick={handleRecargar}
                disabled={loading}
                className="border-line bg-panel text-ink hover:border-primary/40 inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors disabled:opacity-60"
              >
                <FontAwesomeIcon icon={faRotateRight} className="size-3" />
                <span>Reintentar</span>
              </button>
            }
          />

          {loading ? (
            <div className="border-line/60 bg-canvas/40 flex min-h-[200px] items-center justify-center rounded-2xl border">
              <Suspense
                fallback={
                  <span className="text-ink-muted text-xs font-medium">
                    Cargando productos vinculados…
                  </span>
                }
              >
                <LazySharedLoading
                  visible={true}
                  variant="block"
                  size="md"
                  label="Cargando productos vinculados…"
                  delay={0}
                  minDuration={250}
                />
              </Suspense>
            </div>
          ) : (
            <MenuCategoriaModalProductosLista
              visibleProductos={visibleProductos}
              totalFiltrados={productosFiltrados.length}
              totalVinculados={productosVinculados.length}
              busqueda={busqueda}
              hasMore={hasMore}
              onLoadMore={handleLoadMore}
              onMostrarCincoMas={mostrarCincoMas}
              onLimpiarBusqueda={handleLimpiarBusqueda}
              onAgregarPrimerProducto={onAgregarProducto ? handleAgregarDesdeModal : undefined}
            />
          )}
        </div>

        <footer className="border-line bg-canvas/40 flex flex-wrap items-center justify-end gap-3 border-t px-6 py-4">
          {onAgregarProducto && (
            <button
              type="button"
              onClick={handleAgregarDesdeModal}
              className="border-primary/40 bg-primary/10 text-primary hover:bg-primary inline-flex cursor-pointer items-center gap-2 rounded-2xl border px-5 py-2.5 text-xs font-bold shadow-xs transition-colors hover:text-white active:scale-95"
            >
              <FontAwesomeIcon icon={faPlus} className="size-3.5" />
              <span>Agregar Producto</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSafeClose}
            className="bg-primary hover:bg-primary/90 inline-flex cursor-pointer items-center gap-2 rounded-2xl px-6 py-2.5 text-xs font-bold text-white shadow-xs transition-colors"
          >
            <FontAwesomeIcon icon={faCheck} className="size-3.5" />
            <span>Cerrar</span>
          </button>
        </footer>
      </motion.div>
    </div>
  )
})
