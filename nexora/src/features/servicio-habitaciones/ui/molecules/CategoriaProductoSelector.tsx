import { Loading } from '../../../../shared/loading'
import {
  StatusCodeAlert,
  type StatusCodeValidationResult,
} from '../../../../shared/lib/status-code-validator'
import {
  RecursosDropdown,
  type DropdownOption,
} from '../../../recursos/ui/molecules/recursos-dropdown'

export interface CategoriaProductoSelectorProps {
  categoryId: string
  onCategoryChange: (value: string) => void
  categoryError?: string
  categoriaOptions: DropdownOption[]
  loadingCategorias: boolean
  loadingCategoriaPorId: boolean
  categoriaActualNombre?: string | null
  categoriaValidation?: StatusCodeValidationResult | null
  onDismissCategoriaValidation?: () => void
}

/**
 * Molécula: Selector de categoría del menú para edición de producto.
 * Muestra el loader compartido mientras se resuelve `GET /menu-category/{id}`,
 * valida respuestas HTTP con `StatusCodeAlert` y conserva todas las categorías
 * disponibles en `RecursosDropdown` para que el recepcionista pueda cambiarla.
 */
export function CategoriaProductoSelector({
  categoryId,
  onCategoryChange,
  categoryError,
  categoriaOptions,
  loadingCategorias,
  loadingCategoriaPorId,
  categoriaActualNombre,
  categoriaValidation,
  onDismissCategoriaValidation,
}: CategoriaProductoSelectorProps) {
  const isConsultando = loadingCategoriaPorId || loadingCategorias

  return (
    <div className="space-y-2.5">
      <Loading
        visible={isConsultando}
        variant="inline"
        size="sm"
        delay={0}
        minDuration={300}
        label="Consultando categoría del producto…"
        description="Obteniendo nombre desde /menu-category/{id} y catálogo disponible"
        className="border-line bg-canvas/70 w-full rounded-2xl border px-3.5 py-2"
      />

      {categoriaValidation && !categoriaValidation.isValid && (
        <StatusCodeAlert
          validation={categoriaValidation}
          dismissible
          onClose={onDismissCategoriaValidation}
        />
      )}

      <RecursosDropdown
        label="Categoría del menú"
        placeholder={
          isConsultando
            ? 'Cargando categoría…'
            : categoriaActualNombre || 'Selecciona una categoría…'
        }
        value={categoryId}
        onChange={onCategoryChange}
        options={categoriaOptions}
        error={categoryError}
        required
        isLoading={isConsultando}
        disabled={isConsultando}
        emptyLabel="No hay categorías disponibles."
      />
    </div>
  )
}
