import { Suspense, memo, useCallback, type ChangeEvent } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLocationDot } from '@fortawesome/free-solid-svg-icons'
import { Input } from '../../../../shared/ui/Input'
import { Textarea } from '../../../../shared/ui/Textarea'
import {
  RecursosDropdown,
  type DropdownOption,
} from '../../../recursos/ui/molecules/recursos-dropdown'
import { lazyWithFallback } from '../../application/lazy-with-fallback'
import {
  FORMULARIO_FIELD_IDS,
  type FormularioServicioErrors,
} from '../../domain/menu-categoria'
import type { UbicacionManualToggleButtonProps } from '../atoms/UbicacionManualToggleButton'

const LazyUbicacionManualToggleButton =
  lazyWithFallback<UbicacionManualToggleButtonProps>(
    () =>
      import('../atoms/UbicacionManualToggleButton').then(
        (m) => m.UbicacionManualToggleButton,
      ),
    'UbicacionManualToggleButton',
  )

export interface ServicioHabitacionCamposGridProps {
  order: string
  onOrderChange: (value: string) => void
  sedeId: string
  onSedeChange: (value: string) => void
  sedeOptions: DropdownOption[]
  loadingSedes: boolean
  subSedeId: string
  onSubSedeChange: (value: string) => void
  subSedeOptions: DropdownOption[]
  loadingSubSedes: boolean
  edificioId: string
  onEdificioChange: (value: string) => void
  edificioOptions: DropdownOption[]
  loadingEdificios: boolean
  nombreServicio: string
  onNombreServicioChange: (value: string) => void
  descripcion: string
  onDescripcionChange: (value: string) => void
  locationFieldsDisabled?: boolean
  onToggleManualLocation?: () => void
  errors?: FormularioServicioErrors
}

/**
 * Molécula: Agrupa los campos de ubicación, orden, nombre y descripción
 * del formulario de categorías/servicios con `React.memo` y handlers estables.
 */
export const ServicioHabitacionCamposGrid = memo(function ServicioHabitacionCamposGrid({
  order,
  onOrderChange,
  sedeId,
  onSedeChange,
  sedeOptions,
  loadingSedes,
  subSedeId,
  onSubSedeChange,
  subSedeOptions,
  loadingSubSedes,
  edificioId,
  onEdificioChange,
  edificioOptions,
  loadingEdificios,
  nombreServicio,
  onNombreServicioChange,
  descripcion,
  onDescripcionChange,
  locationFieldsDisabled = true,
  onToggleManualLocation,
  errors,
}: ServicioHabitacionCamposGridProps) {
  const handleOrderInput = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onOrderChange(e.target.value.replace(/\D/g, '').slice(0, 2))
    },
    [onOrderChange],
  )

  const handleNombreInput = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onNombreServicioChange(e.target.value)
    },
    [onNombreServicioChange],
  )

  const handleDescripcionInput = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      onDescripcionChange(e.target.value)
    },
    [onDescripcionChange],
  )

  return (
    <>
      {onToggleManualLocation && (
        <div className="border-line bg-canvas/60 flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border px-3.5 py-2">
          <span className="text-ink-muted inline-flex items-center gap-2 text-xs font-medium">
            <FontAwesomeIcon
              icon={faLocationDot}
              className="text-primary size-3.5 shrink-0"
              aria-hidden="true"
            />
            <span>
              {locationFieldsDisabled
                ? 'Ubicación asignada'
                : 'Selección manual'}
            </span>
          </span>

          <Suspense fallback={null}>
            <LazyUbicacionManualToggleButton
              isManualMode={!locationFieldsDisabled}
              disabled={loadingSedes || loadingSubSedes || loadingEdificios}
              onToggle={onToggleManualLocation}
            />
          </Suspense>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <Input
            id={FORMULARIO_FIELD_IDS.order}
            label="Código de orden"
            value={order}
            onChange={handleOrderInput}
            placeholder="Ej: 17"
            maxLength={2}
            inputMode="numeric"
            error={errors?.order}
            required
          />
        </div>

        <div>
          <RecursosDropdown
            id={FORMULARIO_FIELD_IDS.sedeId}
            label="Sede"
            placeholder={
              loadingSedes
                ? 'Cargando…'
                : locationFieldsDisabled
                  ? 'Sede asignada'
                  : 'Elige una sede'
            }
            value={sedeId}
            onChange={onSedeChange}
            options={sedeOptions}
            error={errors?.sedeId}
            required
            isLoading={loadingSedes}
            isDisabled={locationFieldsDisabled}
            emptyLabel="Sin sedes"
          />
        </div>

        <div>
          <RecursosDropdown
            id={FORMULARIO_FIELD_IDS.subSedeId}
            label="Sub sede"
            placeholder={
              loadingSubSedes
                ? 'Cargando…'
                : locationFieldsDisabled
                  ? 'Sub sede asignada'
                  : !sedeId
                    ? 'Elige una sede'
                    : 'Elige una sub sede'
            }
            value={subSedeId}
            onChange={onSubSedeChange}
            options={subSedeOptions}
            error={errors?.subSedeId}
            required
            isLoading={loadingSubSedes}
            isDisabled={locationFieldsDisabled || !sedeId}
            emptyLabel="Sin sub sedes"
          />
        </div>

        <div>
          <RecursosDropdown
            id={FORMULARIO_FIELD_IDS.edificioId}
            label="Edificio"
            placeholder={
              loadingEdificios
                ? 'Cargando…'
                : locationFieldsDisabled
                  ? 'Edificio asignado'
                  : !sedeId
                    ? 'Elige una sede'
                    : 'Elige un edificio'
            }
            value={edificioId}
            onChange={onEdificioChange}
            options={edificioOptions}
            error={errors?.edificioId}
            required
            isLoading={loadingEdificios}
            isDisabled={locationFieldsDisabled || !sedeId}
            emptyLabel="Sin edificios"
          />
        </div>
      </div>

      <div>
        <Input
          id={FORMULARIO_FIELD_IDS.nombreServicio}
          label="Nombre de la categoría"
          value={nombreServicio}
          onChange={handleNombreInput}
          placeholder="Ej: Bebidas y Coctelería"
          error={errors?.nombreServicio}
          required
        />
      </div>

      <div>
        <Textarea
          label="Descripción"
          rows={3}
          value={descripcion}
          onChange={handleDescripcionInput}
          placeholder="Ej: Bebidas frías, jugos y cocteles (opcional)"
          autoResize
        />
      </div>
    </>
  )
})
