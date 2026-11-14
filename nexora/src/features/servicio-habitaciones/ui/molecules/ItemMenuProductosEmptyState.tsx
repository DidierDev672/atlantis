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
  return (
    <div className="rounded-3xl border border-line bg-panel p-12 text-center shadow-xs">
      <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-3xl">
        🍲
      </div>
      <h3 className="mt-4 font-serif text-xl font-bold text-ink">
        {totalProductos === 0
          ? 'No hay productos registrados aún'
          : 'Ningún producto coincide con el filtro'}
      </h3>
      <p className="mx-auto mt-2 max-w-md text-xs text-ink-muted leading-relaxed">
        {totalProductos === 0
          ? 'Comienza a dar de alta tus platillos, bebidas y amenidades de Room Service para visualizarlos aquí.'
          : 'Prueba ajustando los términos de búsqueda o cambiando la opción seleccionada.'}
      </p>
      {onAgregarNuevo && totalProductos === 0 && (
        <button
          type="button"
          onClick={onAgregarNuevo}
          className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-primary/20 hover:bg-primary/90 transition-all cursor-pointer"
        >
          <span>+ Agregar Primer Producto</span>
        </button>
      )}
    </div>
  )
}
