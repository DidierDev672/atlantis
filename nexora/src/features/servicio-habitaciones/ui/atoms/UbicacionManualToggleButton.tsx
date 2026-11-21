import { memo, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faLock,
  faPenToSquare,
} from '@fortawesome/free-solid-svg-icons'

export interface UbicacionManualToggleButtonProps {
  isManualMode: boolean
  disabled?: boolean
  onToggle: () => void
}

/**
 * Átomo: Botón compacto para alternar entre ubicación asignada
 * y selección manual de sede, sub-sede y edificio.
 */
export const UbicacionManualToggleButton = memo(
  function UbicacionManualToggleButton({
    isManualMode,
    disabled = false,
    onToggle,
  }: UbicacionManualToggleButtonProps) {
    const handleClick = useCallback(() => {
      try {
        if (!disabled) onToggle()
      } catch (error) {
        console.error('Error al alternar selección manual de ubicación:', error)
      }
    }, [disabled, onToggle])

    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        aria-pressed={isManualMode}
        title={
          isManualMode
            ? 'Volver a tu ubicación asignada'
            : 'Elegir otra sede, sub sede o edificio'
        }
        className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1.5 font-sans text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
          isManualMode
            ? 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/15'
            : 'border-line bg-canvas text-ink hover:border-primary/40 hover:text-primary'
        }`}
      >
        <FontAwesomeIcon
          icon={isManualMode ? faLock : faPenToSquare}
          className="size-3.5 shrink-0"
          aria-hidden="true"
        />
        <span>{isManualMode ? 'Usar mi ubicación' : 'Cambiar ubicación'}</span>
      </button>
    )
  },
)
