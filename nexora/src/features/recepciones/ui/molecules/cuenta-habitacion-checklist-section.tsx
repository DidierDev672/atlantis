import { memo, useId } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCheck,
  faDoorOpen,
  faKey,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons'
import { Textarea } from '../../../../shared/ui/Textarea'

export interface CuentaHabitacionChecklistSectionProps {
  keysReturned: boolean
  hasDamages: boolean
  observations: string
  onToggleKeysReturned: (checked: boolean) => void
  onToggleHasDamages: (checked: boolean) => void
  onObservationsChange: (value: string) => void
}

/**
 * Molécula: Sección "Habitación" con verificación de entrega (Llaves devueltas, Daños)
 * y campo reutilizable `Textarea` para observaciones.
 */
export const CuentaHabitacionChecklistSection = memo(
  function CuentaHabitacionChecklistSection({
    keysReturned,
    hasDamages,
    observations,
    onToggleKeysReturned,
    onToggleHasDamages,
    onObservationsChange,
  }: CuentaHabitacionChecklistSectionProps) {
    const keysId = useId()
    const damagesId = useId()
    const observationsId = useId()

    return (
      <section aria-label="Inspección de habitación" className="space-y-3.5 pt-1">
        <div className="border-line flex items-center gap-2.5 border-b pb-3">
          <span className="bg-primary/10 text-primary grid size-7 shrink-0 place-items-center rounded-lg">
            <FontAwesomeIcon
              icon={faDoorOpen}
              className="size-3.5"
              aria-hidden="true"
            />
          </span>
          <h3 className="text-ink text-sm font-bold sm:text-base">Habitación</h3>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {/* Checkbox: Llaves devueltas */}
          <label
            htmlFor={keysId}
            className={`flex cursor-pointer items-center justify-between gap-3 rounded-2xl border px-3.5 py-3 transition-all select-none focus-within:ring-2 focus-within:ring-primary/40 ${
              keysReturned
                ? 'border-primary bg-primary/10 text-ink ring-primary/20 shadow-2xs ring-1'
                : 'border-line/80 bg-canvas/50 text-ink hover:border-primary/40 hover:bg-canvas'
            }`}
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <span
                className={`grid size-8 shrink-0 place-items-center rounded-xl transition-colors ${
                  keysReturned
                    ? 'bg-primary text-white'
                    : 'bg-primary/10 text-primary'
                }`}
              >
                <FontAwesomeIcon
                  icon={faKey}
                  className="size-3.5"
                  aria-hidden="true"
                />
              </span>
              <span className="truncate text-xs font-bold sm:text-sm">
                Llaves devueltas
              </span>
            </span>

            <input
              id={keysId}
              type="checkbox"
              checked={keysReturned}
              onChange={(e) => onToggleKeysReturned(e.target.checked)}
              className="sr-only"
            />
            <span
              aria-hidden="true"
              className={`grid size-5 shrink-0 place-items-center rounded-md border transition-colors ${
                keysReturned
                  ? 'border-primary bg-primary text-white'
                  : 'border-line bg-panel text-transparent'
              }`}
            >
              <FontAwesomeIcon icon={faCheck} className="size-3" />
            </span>
          </label>

          {/* Checkbox: Daños */}
          <label
            htmlFor={damagesId}
            className={`flex cursor-pointer items-center justify-between gap-3 rounded-2xl border px-3.5 py-3 transition-all select-none focus-within:ring-2 focus-within:ring-danger/40 ${
              hasDamages
                ? 'border-danger/60 bg-danger/10 text-ink ring-danger/20 shadow-2xs ring-1'
                : 'border-line/80 bg-canvas/50 text-ink hover:border-danger/40 hover:bg-canvas'
            }`}
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <span
                className={`grid size-8 shrink-0 place-items-center rounded-xl transition-colors ${
                  hasDamages
                    ? 'bg-danger text-white'
                    : 'bg-danger/10 text-danger'
                }`}
              >
                <FontAwesomeIcon
                  icon={faTriangleExclamation}
                  className="size-3.5"
                  aria-hidden="true"
                />
              </span>
              <span className="truncate text-xs font-bold sm:text-sm">
                Daños
              </span>
            </span>

            <input
              id={damagesId}
              type="checkbox"
              checked={hasDamages}
              onChange={(e) => onToggleHasDamages(e.target.checked)}
              className="sr-only"
            />
            <span
              aria-hidden="true"
              className={`grid size-5 shrink-0 place-items-center rounded-md border transition-colors ${
                hasDamages
                  ? 'border-danger bg-danger text-white'
                  : 'border-line bg-panel text-transparent'
              }`}
            >
              <FontAwesomeIcon icon={faCheck} className="size-3" />
            </span>
          </label>
        </div>

        <Textarea
          id={observationsId}
          label="Observaciones"
          value={observations}
          onChange={(e) => onObservationsChange(e.target.value)}
          rows={3}
          autoResize
          minHeight={88}
          maxLength={400}
          showCount
          required={hasDamages}
          placeholder={
            hasDamages
              ? 'Describe los daños detectados en la habitación…'
              : 'Registra novedades de entrega, estado de la habitación o comentarios…'
          }
          helperText={
            hasDamages
              ? 'Documenta el detalle del daño para respaldar el cierre de cuenta.'
              : 'Puedes añadir notas relevantes sobre la entrega de la habitación.'
          }
        />
      </section>
    )
  }
)
