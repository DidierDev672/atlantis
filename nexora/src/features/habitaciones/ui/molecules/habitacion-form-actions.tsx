import { memo, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBed,
  faBuilding,
  faCheck,
  faEraser,
} from '@fortawesome/free-solid-svg-icons'
import { Button } from '../atoms/button'
import { HabitacionIconTooltip } from '../atoms/habitacion-icon-tooltip'

export interface HabitacionFormActionsProps {
  submitting: boolean
  onClear: () => void
  onCreateTipo?: () => void
  onCreateEdificio?: () => void
}

export const HabitacionFormActions = memo(function HabitacionFormActions({
  submitting,
  onClear,
  onCreateTipo,
  onCreateEdificio,
}: HabitacionFormActionsProps) {
  const handleSafeAction = useCallback((action?: () => void) => {
    try {
      action?.()
    } catch (error) {
      console.error('Error al ejecutar acción rápida del formulario:', error)
    }
  }, [])

  return (
    <div className="border-line/80 bg-canvas/40 flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3">
      <div className="flex items-center gap-2.5">
        <HabitacionIconTooltip label="Limpiar formulario">
          <Button
            type="button"
            variant="ghost"
            disabled={submitting}
            onClick={() => handleSafeAction(onClear)}
            aria-label="Limpiar formulario"
            title="Limpiar formulario"
            className="border-line bg-panel size-11 rounded-xl border p-0 shadow-2xs"
          >
            <FontAwesomeIcon
              icon={faEraser}
              className="size-4"
              aria-hidden="true"
            />
          </Button>
        </HabitacionIconTooltip>

        <HabitacionIconTooltip
          label={submitting ? 'Registrando habitación…' : 'Registrar habitación'}
        >
          <Button
            type="submit"
            variant="primary"
            disabled={submitting}
            aria-label={
              submitting ? 'Registrando habitación' : 'Registrar habitación'
            }
            title={
              submitting ? 'Registrando habitación…' : 'Registrar habitación'
            }
            className="size-11 rounded-xl p-0 shadow-sm"
          >
            {submitting ? (
              <span
                className="inline-block size-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                aria-hidden="true"
              />
            ) : (
              <FontAwesomeIcon
                icon={faCheck}
                className="size-4"
                aria-hidden="true"
              />
            )}
          </Button>
        </HabitacionIconTooltip>
      </div>

      {onCreateTipo || onCreateEdificio ? (
        <div className="flex items-center gap-2.5">
          <span className="text-ink-muted hidden text-[11px] font-medium sm:inline">
            Catálogos:
          </span>

          {onCreateTipo ? (
            <HabitacionIconTooltip label="Crear tipo de habitación">
              <Button
                type="button"
                variant="secondary"
                disabled={submitting}
                onClick={() => handleSafeAction(onCreateTipo)}
                aria-label="Crear tipo de habitación"
                title="Crear tipo de habitación"
                className="size-11 rounded-xl p-0 shadow-2xs"
              >
                <FontAwesomeIcon
                  icon={faBed}
                  className="size-4"
                  aria-hidden="true"
                />
              </Button>
            </HabitacionIconTooltip>
          ) : null}

          {onCreateEdificio ? (
            <HabitacionIconTooltip label="Crear edificio">
              <Button
                type="button"
                variant="secondary"
                disabled={submitting}
                onClick={() => handleSafeAction(onCreateEdificio)}
                aria-label="Crear edificio"
                title="Crear edificio"
                className="size-11 rounded-xl p-0 shadow-2xs"
              >
                <FontAwesomeIcon
                  icon={faBuilding}
                  className="size-4"
                  aria-hidden="true"
                />
              </Button>
            </HabitacionIconTooltip>
          ) : null}
        </div>
      ) : null}
    </div>
  )
})
