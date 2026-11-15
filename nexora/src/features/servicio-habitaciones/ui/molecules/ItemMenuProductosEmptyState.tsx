import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBowlFood,
  faMagnifyingGlass,
  faPlus,
} from '@fortawesome/free-solid-svg-icons'

export interface ItemMenuProductosEmptyStateProps {
  totalProductos: number
  onAgregarNuevo?: () => void
}

/**
 * Molécula: Estado vacío cuando no existen productos o ningún ítem coincide con los filtros.
 */
export function ItemMenuProductosEmptyState({
  totalProductos,
  onAgregarNuevo,
}: ItemMenuProductosEmptyStateProps) {
  const sinRegistros = totalProductos === 0

  return (
    <div className="rounded-3xl border border-line bg-panel p-12 text-center shadow-xs">
      <div
        aria-hidden="true"
        className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary"
      >
        <FontAwesomeIcon
          icon={sinRegistros ? faBowlFood : faMagnifyingGlass}
          className="size-7"
        />
      </div>
      <h3 className="mt-4 font-serif text-xl font-bold text-ink">
        {sinRegistros
          ? 'No hay productos registrados aún'
          : 'Ningún producto coincide con el filtro'}
      </h3>
      <p className="mx-auto mt-2 max-w-md text-xs text-ink-muted leading-relaxed">
        {sinRegistros
          ? 'Comienza a dar de alta tus platillos, bebidas y amenidades de Room Service para visualizarlos aquí.'
          : 'Prueba ajustando los términos de búsqueda o cambiando la opción seleccionada.'}
      </p>
      {onAgregarNuevo && sinRegistros && (
        <button
          type="button"
          onClick={onAgregarNuevo}
          className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-primary/20 hover:bg-primary/90 transition-all cursor-pointer"
        >
          <FontAwesomeIcon icon={faPlus} className="size-3.5" aria-hidden="true" />
          <span>Agregar Primer Producto</span>
        </button>
      )}
    </div>
  )
}
