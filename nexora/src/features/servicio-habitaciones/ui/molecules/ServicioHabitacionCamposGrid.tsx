import { memo, useCallback, type ChangeEvent } from 'react'
import { Input } from '../../../../shared/ui/Input'
import { Textarea } from '../../../../shared/ui/Textarea'
import {
  RecursosDropdown,
  type DropdownOption,
} from '../../../recursos/ui/molecules/recursos-dropdown'

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
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <Input
            label="Order (Código de orden)"
            value={order}
            onChange={handleOrderInput}
            placeholder="Ej: 17"
            maxLength={2}
            inputMode="numeric"
            required
            hint="Código numérico de 2 dígitos generado automáticamente."
          />
        </div>

        <div>
          <RecursosDropdown
            label="Sede"
            placeholder={loadingSedes ? 'Consultando sedes…' : 'Selecciona una sede…'}
            value={sedeId}
            onChange={onSedeChange}
            options={sedeOptions}
            required
            isLoading={loadingSedes}
            disabled={loadingSedes}
            emptyLabel="No hay sedes disponibles."
          />
        </div>

        <div>
          <RecursosDropdown
            label="Sub sede"
            placeholder={
              !sedeId
                ? 'Primero selecciona una sede…'
                : loadingSubSedes
                  ? 'Consultando sub sedes…'
                  : 'Selecciona una sub sede…'
            }
            value={subSedeId}
            onChange={onSubSedeChange}
            options={subSedeOptions}
            required
            isLoading={loadingSubSedes}
            disabled={!sedeId || loadingSubSedes}
            emptyLabel={
              !sedeId
                ? 'Debes elegir una sede para consultar sus sub sedes'
                : 'No hay sub sedes disponibles para esta sede.'
            }
          />
        </div>

        <div>
          <RecursosDropdown
            label="Edificio"
            placeholder={
              loadingEdificios ? 'Consultando edificios…' : 'Selecciona un edificio…'
            }
            value={edificioId}
            onChange={onEdificioChange}
            options={edificioOptions}
            required
            isLoading={loadingEdificios}
            disabled={loadingEdificios}
            emptyLabel="No hay edificios disponibles."
          />
        </div>
      </div>

      <div>
        <Input
          label="Nombre del servicio"
          value={nombreServicio}
          onChange={handleNombreInput}
          placeholder="Ej: Bebidas y Cocteleria"
          required
          hint="Nombre de la categoría o servicio gastronómico."
        />
      </div>

      <div>
        <Textarea
          label="Descripción"
          rows={3}
          value={descripcion}
          onChange={handleDescripcionInput}
          placeholder="Describe los ingredientes, horarios de servicio o cocteles de autor..."
          hint="Detalla los ingredientes, horarios de servicio o notas destacadas de la categoría."
          autoResize
        />
      </div>
    </>
  )
})
