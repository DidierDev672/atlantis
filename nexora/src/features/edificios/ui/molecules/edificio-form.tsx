import {
  Suspense,
  lazy,
  memo,
  useCallback,
  useMemo,
  useState,
  type ComponentType,
  type FormEvent,
} from 'react'
import { motion } from 'motion/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBuilding, faLayerGroup } from '@fortawesome/free-solid-svg-icons'
import { fadeUp } from '../../../../design-tokens/motion'
import type { StatusCodeValidationResult } from '../../../../shared/lib/status-code-validator'
import { Input } from '../../../../shared/ui/Input'
import {
  RecursosDropdown,
  type DropdownOption,
} from '../../../recursos/ui/molecules/recursos-dropdown'
import {
  EDIFICIO_ESTADOS,
  EDIFICIO_ESTADO_LABELS,
  NOMBRE_MAX,
  PISOS_MIN,
  validateEdificioInput,
  type EdificioEstado,
  type EdificioInput,
  type EdificioValidationErrors,
} from '../../domain/edificio'
import type {
  EdificioSedeInfo,
  EdificioSubSedeInfo,
} from '../../infrastructure/api-ubicacion-edificio-repository'
import { Button } from '../atoms/button'
import { FadeIn } from '../atoms/fade-in'
import type { EdificioUbicacionFieldsProps } from './edificio-ubicacion-fields'

export type Option = DropdownOption

const LazyEdificioUbicacionFields = lazy<
  ComponentType<EdificioUbicacionFieldsProps>
>(async () => {
  try {
    const mod = await import('./edificio-ubicacion-fields')
    return { default: mod.EdificioUbicacionFields }
  } catch (error) {
    console.error('Error al cargar EdificioUbicacionFields:', error)
    const Fallback: ComponentType<EdificioUbicacionFieldsProps> = () => null
    return { default: Fallback }
  }
})

export interface EdificioFormProps {
  sedes: ReadonlyArray<Option>
  sedesLoading: boolean
  subSedes: ReadonlyArray<Option>
  subSedesLoading: boolean
  autoSedeId?: string
  autoSubSedeId?: string
  locationVersion?: number
  isUbicacionBloqueada?: boolean
  detectedHeadquarter?: EdificioSedeInfo | null
  detectedSubHeadquarter?: EdificioSubSedeInfo | null
  locationValidation?: StatusCodeValidationResult | null
  submitting: boolean
  submitError: string | null
  onSedeChange: (sedeId: string) => void
  onToggleEdicionManual?: () => void
  onSubmit: (values: EdificioInput) => void
}

const estadoOptions: ReadonlyArray<Option> = EDIFICIO_ESTADOS.map((value) => ({
  value,
  label: EDIFICIO_ESTADO_LABELS[value],
}))

export const EdificioForm = memo(function EdificioForm({
  sedes,
  sedesLoading,
  subSedes,
  subSedesLoading,
  autoSedeId = '',
  autoSubSedeId = '',
  locationVersion = 0,
  isUbicacionBloqueada = false,
  detectedHeadquarter = null,
  detectedSubHeadquarter = null,
  locationValidation = null,
  submitting,
  submitError,
  onSedeChange,
  onToggleEdicionManual,
  onSubmit,
}: EdificioFormProps) {
  const [nombre, setNombre] = useState('')
  const [numPisos, setNumPisos] = useState('')
  const [manualOverride, setManualOverride] = useState<{
    version: number
    sedeId?: string
    subSedeId?: string
  }>({ version: locationVersion })
  const [estado, setEstado] = useState<EdificioEstado>('disponible')
  const [errors, setErrors] = useState<EdificioValidationErrors>({})

  const sedeId = useMemo(() => {
    if (
      isUbicacionBloqueada ||
      manualOverride.version !== locationVersion ||
      manualOverride.sedeId === undefined
    ) {
      return autoSedeId
    }
    return manualOverride.sedeId
  }, [autoSedeId, isUbicacionBloqueada, locationVersion, manualOverride])

  const subSedeId = useMemo(() => {
    if (
      isUbicacionBloqueada ||
      manualOverride.version !== locationVersion ||
      manualOverride.subSedeId === undefined
    ) {
      return autoSubSedeId
    }
    return manualOverride.subSedeId
  }, [autoSubSedeId, isUbicacionBloqueada, locationVersion, manualOverride])

  const clearError = useCallback((field: keyof EdificioValidationErrors) => {
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev))
  }, [])

  const handleSedeChange = useCallback(
    (value: string) => {
      try {
        setManualOverride({
          version: locationVersion,
          sedeId: value,
          subSedeId: '',
        })
        clearError('sedeId')
        clearError('subSedeId')
        onSedeChange(value)
      } catch (error) {
        console.error('Error al seleccionar sede:', error)
      }
    },
    [clearError, locationVersion, onSedeChange]
  )

  const handleSubSedeChange = useCallback(
    (value: string) => {
      try {
        setManualOverride((prev) => ({
          version: locationVersion,
          sedeId:
            prev.version === locationVersion && prev.sedeId !== undefined
              ? prev.sedeId
              : autoSedeId,
          subSedeId: value,
        }))
        clearError('subSedeId')
      } catch (error) {
        console.error('Error al seleccionar sub sede:', error)
      }
    },
    [autoSedeId, clearError, locationVersion]
  )

  const handleToggleManual = useCallback(() => {
    try {
      clearError('sedeId')
      clearError('subSedeId')
      onToggleEdicionManual?.()
    } catch (error) {
      console.error('Error al cambiar modo de edición de ubicación:', error)
    }
  }, [clearError, onToggleEdicionManual])

  const handleEstadoChange = useCallback(
    (value: string) => {
      try {
        setEstado((value || 'disponible') as EdificioEstado)
        clearError('estado')
      } catch (error) {
        console.error('Error al cambiar estado del edificio:', error)
      }
    },
    [clearError]
  )

  const submit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      try {
        const values: EdificioInput = {
          nombre,
          numPisos,
          sedeId,
          subSedeId,
          estado,
        }
        const nextErrors = validateEdificioInput(values)
        setErrors(nextErrors)
        if (Object.keys(nextErrors).length === 0) {
          onSubmit(values)
        }
      } catch (error) {
        console.error('Error al validar formulario de edificio:', error)
      }
    },
    [estado, nombre, numPisos, onSubmit, sedeId, subSedeId]
  )

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <FadeIn duration={0.45} delay={0}>
          <Input
            label="Nombre"
            placeholder="Ej. Torre Alfa"
            autoComplete="off"
            maxLength={NOMBRE_MAX}
            autoFocus
            required
            value={nombre}
            onChange={(event) => {
              setNombre(event.target.value)
              clearError('nombre')
            }}
            error={errors.nombre}
            hint="Un nombre que lo identifique dentro de la sede."
            icon={
              <FontAwesomeIcon
                icon={faBuilding}
                className="size-4"
                aria-hidden="true"
              />
            }
          />
        </FadeIn>

        <FadeIn duration={0.45} delay={0.07}>
          <Input
            label="Número de pisos"
            type="number"
            inputMode="numeric"
            min={PISOS_MIN}
            step={1}
            placeholder="Ej. 5"
            required
            value={numPisos}
            onChange={(event) => {
              setNumPisos(event.target.value)
              clearError('numPisos')
            }}
            error={errors.numPisos}
            hint="Cuántas plantas forman el edificio."
            icon={
              <FontAwesomeIcon
                icon={faLayerGroup}
                className="size-4"
                aria-hidden="true"
              />
            }
          />
        </FadeIn>
      </div>

      <Suspense
        fallback={
          <div className="border-line/70 bg-canvas/50 h-28 animate-pulse rounded-2xl border" />
        }
      >
        <LazyEdificioUbicacionFields
          sedes={sedes}
          sedesLoading={sedesLoading}
          subSedes={subSedes}
          subSedesLoading={subSedesLoading}
          sedeId={sedeId}
          subSedeId={subSedeId}
          sedeError={errors.sedeId}
          subSedeError={errors.subSedeId}
          isUbicacionBloqueada={isUbicacionBloqueada}
          submitting={submitting}
          detectedHeadquarter={detectedHeadquarter}
          detectedSubHeadquarter={detectedSubHeadquarter}
          locationValidation={locationValidation}
          onSedeChange={handleSedeChange}
          onSubSedeChange={handleSubSedeChange}
          onToggleEdicionManual={handleToggleManual}
        />
      </Suspense>

      <FadeIn
        duration={0.45}
        delay={0.28}
        className="relative z-20 has-[[aria-expanded='true']]:z-50"
      >
        <RecursosDropdown
          label="Estado"
          options={estadoOptions}
          value={estado}
          onChange={handleEstadoChange}
          error={errors.estado}
          searchable={false}
          direction="auto"
          required
        />
      </FadeIn>

      <FadeIn
        duration={0.45}
        delay={0.35}
        className="border-line flex items-center justify-end border-t pt-4"
      >
        <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
          {submitting ? (
            <>
              <span
                className="inline-block size-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                aria-hidden="true"
              />
              Creando…
            </>
          ) : (
            'Crear edificio'
          )}
        </Button>
      </FadeIn>

      {submitError ? (
        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          role="alert"
          className="border-danger/25 bg-danger/10 text-danger rounded-xl border px-4 py-3 text-sm font-medium"
        >
          {submitError}
        </motion.p>
      ) : null}
    </form>
  )
})
