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
import {
  type MenuCategoria,
  resolverNombreEntidad,
} from '../../domain/menu-categoria'

interface MenuCategoriaModalDetalleProps {
  categoria: MenuCategoria | null
  onClose: () => void
  onAgregarProducto?: (categoria: MenuCategoria) => void
}

/**
 * Modal para visualizar el detalle completo y ficha técnica de una categoría de menú.
 * Utiliza iconos de FontAwesome para todas las representaciones visuales.
 */
export function MenuCategoriaModalDetalle({
  categoria,
  onClose,
  onAgregarProducto,
}: MenuCategoriaModalDetalleProps) {
  if (!categoria) return null

  const nombreSede = resolverNombreEntidad(categoria.headquartes_id, 'Sede')
  const nombreSubsede = resolverNombreEntidad(categoria.sub_headquartes_id, 'Subsede')
  const nombreEdificio = resolverNombreEntidad(categoria.building_id, 'Edificio')

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
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
          className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-line bg-panel shadow-2xl z-10 my-8"
        >
          {/* Imagen de cabecera */}
          <div className="relative aspect-16/9 w-full overflow-hidden bg-black/10">
            <img
              src={categoria.asset}
              alt={categoria.name}
              className="size-full object-cover"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-black/30 pointer-events-none"
            />

            {/* Botón Cerrar con FontAwesome faXmark */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 grid size-9 place-items-center rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors backdrop-blur-md cursor-pointer border border-white/20"
              title="Cerrar ventana"
            >
              <FontAwesomeIcon icon={faXmark} className="size-4" />
            </button>

            {/* Número de orden en cabecera con FontAwesome faHashtag */}
            <div className="absolute top-4 left-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/90 px-3.5 py-1 text-xs font-mono font-bold text-white shadow-md backdrop-blur-md">
                <FontAwesomeIcon icon={faHashtag} className="size-3 text-white/90" />
                <span>Orden de Servicio #{categoria.order}</span>
              </span>
            </div>

            {/* Título en la base de la imagen */}
            <div className="absolute inset-x-0 bottom-0 p-6">
              <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white drop-shadow-sm">
                {categoria.name}
              </h2>
            </div>
          </div>

          {/* Cuerpo del detalle */}
          <div className="p-6 sm:p-8 space-y-6 max-h-[60vh] overflow-y-auto">
            {/* Descripción completa */}
            <div>
              <h4 className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">
                <FontAwesomeIcon icon={faUtensils} className="size-3 text-primary" />
                <span>Descripción del Servicio Gastronómico</span>
              </h4>
              <p className="text-sm text-ink leading-relaxed whitespace-pre-line bg-canvas/60 p-4 rounded-2xl border border-line/60">
                {categoria.description || 'Sin descripción registrada para esta categoría.'}
              </p>
            </div>

            {/* Parámetros de Ubicación Arquitectónica */}
            <div className="space-y-3">
              <h4 className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink-muted">
                <FontAwesomeIcon icon={faCircleInfo} className="size-3 text-primary" />
                <span>Parámetros de Despacho y Ubicación</span>
              </h4>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {/* Sede con FontAwesome faLocationDot */}
                <div className="rounded-2xl border border-line bg-canvas p-3.5 flex flex-col justify-between gap-2">
                  <div>
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                      <FontAwesomeIcon icon={faLocationDot} className="size-3" />
                      <span>Sede</span>
                    </span>
                    <p className="mt-1 text-xs font-semibold text-ink line-clamp-1">
                      {nombreSede}
                    </p>
                  </div>
                </div>

                {/* Subsede con FontAwesome faBuilding */}
                <div className="rounded-2xl border border-line bg-canvas p-3.5 flex flex-col justify-between gap-2">
                  <div>
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                      <FontAwesomeIcon icon={faBuilding} className="size-3" />
                      <span>Subsede</span>
                    </span>
                    <p className="mt-1 text-xs font-semibold text-ink line-clamp-1">
                      {nombreSubsede}
                    </p>
                  </div>
                </div>

                {/* Edificio con FontAwesome faDoorOpen */}
                <div className="rounded-2xl border border-line bg-canvas p-3.5 flex flex-col justify-between gap-2">
                  <div>
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                      <FontAwesomeIcon icon={faDoorOpen} className="size-3" />
                      <span>Edificio</span>
                    </span>
                    <p className="mt-1 text-xs font-semibold text-ink line-clamp-1">
                      {nombreEdificio}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pie del modal con botón de agregar producto a la izquierda de Entendido / Cerrar */}
          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-line bg-canvas/40 px-6 py-4">
            {onAgregarProducto && (
              <button
                type="button"
                onClick={() => {
                  onAgregarProducto(categoria)
                  onClose()
                }}
                className="inline-flex items-center gap-2 rounded-2xl border border-primary/40 bg-primary/10 px-5 py-2.5 text-xs font-bold text-primary shadow-xs transition-all hover:bg-primary hover:text-white active:scale-95 cursor-pointer"
                title={`Agregar producto a la categoría ${categoria.name}`}
              >
                <FontAwesomeIcon icon={faPlus} className="size-3.5" />
                <span>Agregar Producto</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-2.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-primary/90 cursor-pointer"
            >
              <FontAwesomeIcon icon={faCheck} className="size-3.5" />
              <span>Entendido / Cerrar</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
