import { motion } from 'motion/react'
import { fadeIn } from '../../../../design-tokens/motion'

export interface MenuCategoriasEmptyStateProps {
  totalCategorias: number
  loading: boolean
  onNuevoRegistro?: () => void
  onRecargar: () => void
  onResetFiltros: () => void
}

/**
 * Molécula: Estado vacío del catálogo de categorías cuando no hay registros
 * o cuando ningún elemento coincide con los filtros aplicados.
 */
export function MenuCategoriasEmptyState({
  totalCategorias,
  loading,
  onNuevoRegistro,
  onRecargar,
  onResetFiltros,
}: MenuCategoriasEmptyStateProps) {
  const sinRegistros = totalCategorias === 0

  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="border-line bg-panel/70 mx-auto max-w-lg space-y-4 rounded-3xl border border-dashed p-10 text-center shadow-xs sm:p-14"
    >
      <div className="bg-primary/10 text-primary border-primary/20 mx-auto grid size-16 place-items-center rounded-2xl border text-2xl">
        🍽️
      </div>

      <div className="space-y-1.5">
        <h3 className="text-ink font-serif text-base font-bold sm:text-lg">
          {sinRegistros
            ? 'No se encuentran registros del menú de servicio de habitaciones'
            : 'Sin categorías que coincidan'}
        </h3>
        <p className="text-ink-muted mx-auto max-w-md text-xs leading-relaxed">
          {sinRegistros
            ? 'Actualmente no se encuentran registros en el catálogo del menú de servicio de habitaciones para las sedes y edificios. Puedes dar de alta una nueva categoría para comenzar a estructurar la carta gastronómica.'
            : 'No se encontraron opciones gastronómicas con los filtros aplicados. Intenta restablecer los filtros para volver a ver todas las categorías.'}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        {sinRegistros ? (
          <>
            {onNuevoRegistro && (
              <button
                type="button"
                onClick={onNuevoRegistro}
                className="bg-primary hover:bg-primary/90 cursor-pointer rounded-xl px-4 py-2 text-xs font-bold text-white shadow-xs transition-all"
              >
                + Registrar Categoría de Menú
              </button>
            )}
            <button
              type="button"
              onClick={onRecargar}
              className="border-line bg-canvas text-ink hover:bg-panel inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all"
              title="Volver a consultar el endpoint /menu-category"
            >
              <span className={loading ? 'animate-spin' : ''}>🔄</span>
              <span>Consultar Nuevamente</span>
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onResetFiltros}
            className="border-line bg-canvas text-ink hover:bg-panel cursor-pointer rounded-xl border px-4 py-2 text-xs font-semibold transition-colors"
          >
            Restablecer filtros
          </button>
        )}
      </div>
    </motion.div>
  )
}

