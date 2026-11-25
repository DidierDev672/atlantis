import { memo, useCallback, useState, type FormEvent } from 'react'
import { motion } from 'motion/react'
import { fadeUp } from '../../../../design-tokens/motion'
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
import { Button } from '../atoms/button'
import { FadeIn } from '../atoms/fade-in'

export type Option = DropdownOption

export interface EdificioFormProps {
  sedes: ReadonlyArray<Option>
  sedesLoading: boolean
  subSedes: ReadonlyArray<Option>
  subSedesLoading: boolean
  submitting: boolean
  submitError: string | null
  onSedeChange: (sedeId: string) => void
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
  submitting,
  submitError,
  onSedeChange,
  onSubmit,
}: EdificioFormProps) {
  const [nombre, setNombre] = useState('')
  const [numPisos, setNumPisos] = useState('')
  const [sedeId, setSedeId] = useState('')
  const [subSedeId, setSubSedeId] = useState('')
  const [estado, setEstado] = useState<EdificioEstado>('disponible')
  const [errors, setErrors] = useState<EdificioValidationErrors>({})

  const clearError = useCallback((field: keyof EdificioValidationErrors) => {
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev))
  }, [])

  const handleSedeChange = useCallback(
    (value: string) => {
      try {
        setSedeId(value)
        setSubSedeId('')
        clearError('sedeId')
        clearError('subSedeId')
        onSedeChange(value)
      } catch (error) {
        console.error('Error al seleccionar sede:', error)
      }
    },
    [clearError, onSedeChange],
  )

  const handleSubSedeChange = useCallback(
    (value: string) => {
      try {
        setSubSedeId(value)
        clearError('subSedeId')
      } catch (error) {
        console.error('Error al seleccionar sub sede:', error)
      }
    },
    [clearError],
  )

  const handleEstadoChange = useCallback(
    (value: string) => {
      try {
        setEstado((value || 'disponible') as EdificioEstado)
        clearError('estado')
      } catch (error) {
        console.error('Error al cambiar estado del edificio:', error)
      }
    },
    [clearError],
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
    [estado, nombre, numPisos, onSubmit, sedeId, subSedeId],
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
            icon={<BuildingIcon />}
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
            icon={<FloorsIcon />}
          />
        </FadeIn>
      </div>

      <div className="relative z-30 grid gap-4 has-[[aria-expanded='true']]:z-50 sm:grid-cols-2">
        <FadeIn
          duration={0.45}
          delay={0.14}
          className="relative z-30 has-[[aria-expanded='true']]:z-50"
        >
          <RecursosDropdown
            label="Sede"
            placeholder={sedesLoading ? 'Cargando sedes…' : 'Elige una sede…'}
            searchPlaceholder="Buscar sede…"
            searchable
            options={sedes}
            value={sedeId}
            onChange={handleSedeChange}
            error={errors.sedeId}
            required
            disabled={sedesLoading}
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
            onChange={handleSubSedeChange}
            disabled={!sedeId || subSedesLoading}
            isLoading={subSedesLoading}
            error={errors.subSedeId}
            direction="auto"
            placeholder={
              subSedesLoading
                ? 'Cargando sub sedes…'
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

function BuildingIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
      aria-hidden="true"
    >
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01" />
    </svg>
  )
}

function FloorsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
      aria-hidden="true"
    >
      <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
      <path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65" />
      <path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65" />
    </svg>
  )
}
