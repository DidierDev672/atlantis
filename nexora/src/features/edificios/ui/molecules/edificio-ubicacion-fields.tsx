import { memo, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faLocationDot,
  faLock,
  faPenToSquare,
} from '@fortawesome/free-solid-svg-icons'
import {
  StatusCodeAlert,
  type StatusCodeValidationResult,
} from '../../../../shared/lib/status-code-validator'
import {
  RecursosDropdown,
  type DropdownOption,
} from '../../../recursos/ui/molecules/recursos-dropdown'
import type {
  EdificioSedeInfo,
  EdificioSubSedeInfo,
} from '../../infrastructure/api-ubicacion-edificio-repository'
import { FadeIn } from '../atoms/fade-in'

export interface EdificioUbicacionFieldsProps {
  sedes: ReadonlyArray<DropdownOption>
  sedesLoading: boolean
  subSedes: ReadonlyArray<DropdownOption>
  subSedesLoading: boolean
  sedeId: string
  subSedeId: string
  sedeError?: string
  subSedeError?: string
  isUbicacionBloqueada: boolean
  submitting: boolean
  detectedHeadquarter: EdificioSedeInfo | null
  detectedSubHeadquarter: EdificioSubSedeInfo | null
  locationValidation: StatusCodeValidationResult | null
  onSedeChange: (value: string) => void
  onSubSedeChange: (value: string) => void
  onToggleEdicionManual: () => void
}

/**
 * Molécula: Selector jerárquico de Sede y Sub sede con autodetección por sesión
 * (`auth_user`), campos bloqueados por defecto (`isDisabled`) y botón icon-only
 * para habilitar modificación manual.
 */
export const EdificioUbicacionFields = memo(function EdificioUbicacionFields({
  sedes,
  sedesLoading,
  subSedes,
  subSedesLoading,
  sedeId,
  subSedeId,
  sedeError,
  subSedeError,
  isUbicacionBloqueada,
  submitting,
  detectedHeadquarter,
  detectedSubHeadquarter,
  locationValidation,
  onSedeChange,
  onSubSedeChange,
  onToggleEdicionManual,
}: EdificioUbicacionFieldsProps) {
  const handleManualClick = useCallback(() => {
    try {
      onToggleEdicionManual()
    } catch (error) {
      console.error('Error al alternar edición manual de sede:', error)
    }
  }, [onToggleEdicionManual])

  const detectedSummary = detectedHeadquarter
    ? [
        detectedHeadquarter.name,
        detectedSubHeadquarter?.name,
        detectedHeadquarter.city,
      ]
        .filter(Boolean)
        .join(' · ')
    : null

  return (
    <div className="border-line/80 bg-canvas/50 relative z-30 space-y-3 rounded-2xl border p-4 has-[[aria-expanded='true']]:z-50">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          {detectedSummary ? (
            <p className="text-ink-muted flex items-center gap-1.5 truncate text-xs font-medium">
              <FontAwesomeIcon
                icon={faLocationDot}
                className="text-primary size-3.5 shrink-0"
                aria-hidden="true"
              />
              <span className="truncate">{detectedSummary}</span>
            </p>
          ) : (
            <span className="sr-only">Ubicación del edificio</span>
          )}
        </div>

        {/* Botón icon-only sin texto visible para alternar modificación manual */}
        <button
          type="button"
          onClick={handleManualClick}
          disabled={sedesLoading || submitting}
          aria-pressed={!isUbicacionBloqueada}
          aria-label={
            isUbicacionBloqueada
              ? 'Modificar sede y sub sede manualmente'
              : 'Bloquear sede y sub sede detectadas'
          }
          title={
            isUbicacionBloqueada
              ? 'Modificar sede y sub sede manualmente'
              : 'Bloquear ubicación detectada'
          }
          className={`focus-visible:ring-primary/40 grid size-8 shrink-0 cursor-pointer place-items-center rounded-xl border transition focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
            isUbicacionBloqueada
              ? 'border-line bg-panel text-ink-muted hover:border-primary/40 hover:text-primary'
              : 'border-primary/40 bg-primary/10 text-primary'
          }`}
        >
          <FontAwesomeIcon
            icon={isUbicacionBloqueada ? faPenToSquare : faLock}
            className="size-3.5"
            aria-hidden="true"
          />
        </button>
      </div>

      {locationValidation && !locationValidation.isValid ? (
        <StatusCodeAlert validation={locationValidation} />
      ) : null}

      <div className="relative z-30 grid gap-4 has-[[aria-expanded='true']]:z-50 sm:grid-cols-2">
        <FadeIn
          duration={0.45}
          delay={0.14}
          className="relative z-30 has-[[aria-expanded='true']]:z-50"
        >
          <RecursosDropdown
            label="Sede"
            placeholder={
              sedesLoading ? 'Detectando sede…' : 'Elige una sede…'
            }
            searchPlaceholder="Buscar sede…"
            searchable
            options={sedes}
            value={sedeId}
            onChange={onSedeChange}
            error={sedeError}
            required
            isDisabled={isUbicacionBloqueada || sedesLoading}
            disabled={isUbicacionBloqueada || sedesLoading}
            isLoading={sedesLoading}
            direction="auto"
            emptyLabel="Aún no hay sedes registradas."
          />
        </FadeIn>

        <FadeIn
          duration={0.45}
          delay={0.21}
          className="relative z-30 has-[[aria-expanded='true']]:z-50"
        >
          <RecursosDropdown
            label="Sub sede"
            searchable
            searchPlaceholder="Buscar sub sede…"
            options={subSedes}
            value={subSedeId}
            onChange={onSubSedeChange}
            isDisabled={isUbicacionBloqueada || !sedeId || subSedesLoading}
            disabled={isUbicacionBloqueada || !sedeId || subSedesLoading}
            isLoading={subSedesLoading}
            error={subSedeError}
            direction="auto"
            placeholder={
              subSedesLoading
                ? 'Detectando sub sede…'
                : 'Opcional: elige una sub sede'
            }
            emptyLabel={
              !sedeId
                ? 'Primero elige una sede para ver sus sub sedes.'
                : subSedesLoading
                  ? 'Cargando sub sedes…'
                  : 'Esta sede no tiene sub sedes.'
            }
          />
        </FadeIn>
      </div>
    </div>
  )
})
