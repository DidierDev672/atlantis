import { memo, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faXmark,
  faHashtag,
  faLocationDot,
  faBuilding,
  faDoorOpen,
  faCheck,
  faUtensils,
  faCircleInfo,
  faPlus,
} from '@fortawesome/free-solid-svg-icons'
import { fadeUp } from '../../../../design-tokens/motion'
import { useDeviceResourceProfile } from '../../../../shared/lib/use-device-resource-profile'
import { Skeleton } from '../../../../shared/loading'
import { useBalancedProductImage } from '../../application/use-balanced-product-image'
import {
  type MenuCategoria,
  resolverNombreEntidad,
} from '../../domain/menu-categoria'

export interface MenuCategoriaModalDetalleProps {
  categoria: MenuCategoria | null
  onClose: () => void
  onAgregarProducto?: (categoria: MenuCategoria) => void
}

const FALLBACK_FOOD_IMG =
  'https://images.pexels.com/photos/1855214/pexels-photo-1855214.jpeg?auto=compress&cs=tinysrgb&w=800'

/**
 * Modal para visualizar el detalle completo y ficha técnica de una categoría de menú.
 * Adaptado al perfil de hardware (`useDeviceResourceProfile`) y carga de imagen
 * balanceada (`useBalancedProductImage`) sin capas `backdrop-blur-md` apiladas.
 */
export const MenuCategoriaModalDetalle = memo(
  function MenuCategoriaModalDetalle({
    categoria,
    onClose,
    onAgregarProducto,
  }: MenuCategoriaModalDetalleProps) {
    const {
      policy: { enableBackdropBlur, enableAnimations, tier },
    } = useDeviceResourceProfile()

    const primaryUrl = categoria
      ? categoria.asset?.trim() || FALLBACK_FOOD_IMG
      : ''
    const { activeSrc, isImageReady, handleImageError } =
      useBalancedProductImage(primaryUrl, FALLBACK_FOOD_IMG, 768)

    useEffect(() => {
      if (!categoria) return
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose()
      }
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }, [categoria, onClose])

    const handleAgregarProductoClick = useCallback(() => {
      if (!categoria || !onAgregarProducto) return
      try {
        onAgregarProducto(categoria)
        onClose()
      } catch (error) {
        console.error(
          'Error al abrir alta de producto desde detalle de categoría:',
          error,
        )
      }
    }, [categoria, onAgregarProducto, onClose])

    if (!categoria) return null

    const nombreSede = resolverNombreEntidad(categoria.headquartes_id, 'Sede')
    const nombreSubsede = resolverNombreEntidad(
      categoria.sub_headquartes_id,
      'Subsede',
    )
    const nombreEdificio = resolverNombreEntidad(categoria.building_id, 'Edificio')
    const animateModal = enableAnimations && tier !== 'ultra-light'

    return (
      <AnimatePresence initial={animateModal}>
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 sm:p-6">
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

          {/* Contenedor del Modal sin backdrop-blur-md en elementos internos */}
          <motion.div
            role="dialog"
            aria-modal="true"
            variants={animateModal ? fadeUp : undefined}
            initial={animateModal ? 'hidden' : false}
            animate="visible"
            exit={animateModal ? 'exit' : undefined}
            className="relative z-10 my-8 w-full max-w-2xl overflow-hidden rounded-3xl border border-line bg-panel shadow-2xl"
          >
            {/* Imagen de cabecera balanceada */}
            <div className="relative aspect-16/9 w-full overflow-hidden bg-black/10">
              {!isImageReady && (
                <Skeleton
                  variant="rectangular"
                  animation="none"
                  className="absolute inset-0 size-full"
                />
              )}
              {activeSrc && (
                <img
                  src={activeSrc}
                  alt={categoria.name}
                  onError={handleImageError}
                  loading="lazy"
                  decoding="async"
                  className={`size-full object-cover transition-opacity duration-200 ${
                    isImageReady ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              )}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-black/30"
              />

              {/* Botón Cerrar con superficie sólida de alto contraste (sin backdrop-blur-md) */}
              <button
                type="button"
                onClick={onClose}
                className="absolute top-4 right-4 grid size-9 cursor-pointer place-items-center rounded-full border border-white/25 bg-black/75 text-white transition-colors hover:bg-black/90"
                title="Cerrar ventana"
                aria-label="Cerrar detalle de categoría"
              >
                <FontAwesomeIcon icon={faXmark} className="size-4" />
              </button>

              {/* Número de orden con superficie sólida (sin backdrop-blur-md) */}
              <div className="absolute top-4 left-4">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1 font-mono text-xs font-bold text-white shadow-md">
                  <FontAwesomeIcon
                    icon={faHashtag}
                    className="size-3 text-white/90"
                  />
                  <span>Orden de Servicio #{categoria.order}</span>
                </span>
              </div>

              <div className="absolute inset-x-0 bottom-0 p-6">
                <h2 className="font-serif text-2xl font-bold tracking-tight text-white drop-shadow-sm sm:text-3xl">
                  {categoria.name}
                </h2>
              </div>
            </div>

            {/* Cuerpo del detalle */}
            <div className="max-h-[60vh] space-y-6 overflow-y-auto p-6 sm:p-8">
              <div>
                <h4 className="mb-2 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink-muted">
                  <FontAwesomeIcon icon={faUtensils} className="size-3 text-primary" />
                  <span>Descripción del Servicio Gastronómico</span>
                </h4>
                <p className="whitespace-pre-line rounded-2xl border border-line/60 bg-canvas/60 p-4 text-sm leading-relaxed text-ink">
                  {categoria.description ||
                    'Sin descripción registrada para esta categoría.'}
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink-muted">
                  <FontAwesomeIcon
                    icon={faCircleInfo}
                    className="size-3 text-primary"
                  />
                  <span>Parámetros de Despacho y Ubicación</span>
                </h4>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="flex flex-col justify-between gap-2 rounded-2xl border border-line bg-canvas p-3.5">
                    <div>
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                        <FontAwesomeIcon icon={faLocationDot} className="size-3" />
                        <span>Sede</span>
                      </span>
                      <p className="mt-1 line-clamp-1 text-xs font-semibold text-ink">
                        {nombreSede}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between gap-2 rounded-2xl border border-line bg-canvas p-3.5">
                    <div>
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                        <FontAwesomeIcon icon={faBuilding} className="size-3" />
                        <span>Subsede</span>
                      </span>
                      <p className="mt-1 line-clamp-1 text-xs font-semibold text-ink">
                        {nombreSubsede}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between gap-2 rounded-2xl border border-line bg-canvas p-3.5">
                    <div>
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                        <FontAwesomeIcon icon={faDoorOpen} className="size-3" />
                        <span>Edificio</span>
                      </span>
                      <p className="mt-1 line-clamp-1 text-xs font-semibold text-ink">
                        {nombreEdificio}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-line bg-canvas/40 px-6 py-4">
              {onAgregarProducto && (
                <button
                  type="button"
                  onClick={handleAgregarProductoClick}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-primary/40 bg-primary/10 px-5 py-2.5 text-xs font-bold text-primary shadow-xs transition-all hover:bg-primary hover:text-white active:scale-95"
                  title={`Agregar producto a la categoría ${categoria.name}`}
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
                <span>Entendido / Cerrar</span>
              </button>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>
    )
  },
)

export default MenuCategoriaModalDetalle
