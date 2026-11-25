import { memo } from 'react'
import {
  StatusCodeAlert,
  type StatusCodeValidationResult,
} from '../../../../shared/lib/status-code-validator'
import { Loading } from '../../../../shared/loading'
import {
  RecursosDropdown,
  type DropdownOption,
} from '../../../recursos/ui/molecules/recursos-dropdown'

export interface ProductoCategoriaFieldProps {
  loadingCategorias: boolean
  categoriaValidation: StatusCodeValidationResult | null
  onDismissValidation: () => void
  onRetryCategorias: () => void
  canRetry: boolean
  categoriaSeleccionada: string
  onCategoriaChange: (val: string) => void
  categoriaOptions: DropdownOption[]
  categoriaError?: string
}

/**
 * Molécula: Campo selector de categoría del menú con indicador `/shared/loading`
 * y validación empática de status codes para `GET /menu-category`.
 */
export const ProductoCategoriaField = memo(function ProductoCategoriaField({
  loadingCategorias,
  categoriaValidation,
  onDismissValidation,
  onRetryCategorias,
  canRetry,
  categoriaSeleccionada,
  onCategoriaChange,
  categoriaOptions,
  categoriaError,
}: ProductoCategoriaFieldProps) {
  return (
    <div className="space-y-2.5">
      <Loading
        visible={loadingCategorias}
        variant="inline"
        size="sm"
        delay={0}
        minDuration={300}
        label="Cargando categorías del menú…"
        description="Consultando y balanceando el catálogo en /menu-category"
        className="border-line bg-canvas/70 w-full rounded-2xl border px-3.5 py-2"
      />

      {categoriaValidation && (
        <StatusCodeAlert
          validation={categoriaValidation}
          dismissible
          onClose={onDismissValidation}
          actions={
            !categoriaValidation.isValid && canRetry ? (
              <button
                type="button"
                onClick={onRetryCategorias}
                disabled={loadingCategorias}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-current/25 bg-white/80 px-3 py-1.5 text-xs font-bold transition-colors hover:bg-white disabled:opacity-50 dark:bg-black/25 dark:hover:bg-black/40"
              >
                Reintentar carga
              </button>
            ) : undefined
          }
        />
      )}

      <RecursosDropdown
        label="Categoría del menú asignada"
        placeholder={
          loadingCategorias
            ? 'Cargando categorías…'
            : 'Selecciona una categoría…'
        }
        value={categoriaSeleccionada}
        onChange={onCategoriaChange}
        options={categoriaOptions}
        error={categoriaError}
        required
        isLoading={loadingCategorias}
        disabled={loadingCategorias}
        emptyLabel="No hay categorías disponibles."
      />
    </div>
  )
})
