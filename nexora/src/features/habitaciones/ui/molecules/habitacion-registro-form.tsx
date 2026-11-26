import { Suspense, lazy, memo, type ComponentType } from 'react'
import { MotionConfig } from 'motion/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBed,
  faDollarSign,
  faUsers,
} from '@fortawesome/free-solid-svg-icons'
import { customEasing } from '../../../../design-tokens/motion'
import { useDeviceResourceProfile } from '../../../../shared/lib/use-device-resource-profile'
import { Input } from '../../../../shared/ui/Input'
import type { RecursosDropdownProps } from '../../../recursos/ui/molecules/recursos-dropdown'
import { useHabitacionRegistroForm } from '../../application/use-habitacion-registro-form'
import {
  CAPACITY_MAX,
  CAPACITY_MIN,
  NAME_MAX,
  type HabitacionInput,
} from '../../domain/habitacion'
import { Button } from '../atoms/button'
import { FadeIn } from '../atoms/fade-in'
import { HabitacionPlanetAlert } from '../atoms/habitacion-planet-alert'
import type { HabitacionEdificioFieldProps } from './habitacion-edificio-field'

const LazyRecursosDropdown = lazy<ComponentType<RecursosDropdownProps>>(
  async () => {
    try {
      const mod = await import(
        '../../../recursos/ui/molecules/recursos-dropdown'
      )
      return { default: mod.RecursosDropdown }
    } catch (error) {
      console.error('Error al cargar RecursosDropdown:', error)
      const Fallback: ComponentType<RecursosDropdownProps> = () => null
      return { default: Fallback }
    }
  }
)

const LazyHabitacionEdificioField = lazy<
  ComponentType<HabitacionEdificioFieldProps>
>(async () => {
  try {
    const mod = await import('./habitacion-edificio-field')
    return { default: mod.HabitacionEdificioField }
  } catch (error) {
    console.error('Error al cargar HabitacionEdificioField:', error)
    const Fallback: ComponentType<HabitacionEdificioFieldProps> = () => null
    return { default: Fallback }
  }
})

export interface HabitacionRegistroFormProps {
  submitting: boolean
  submitError: string | null
  submitErrorStatus?: number | null
  onSubmit: (values: HabitacionInput) => void
}

/**
 * Molécula: Formulario para registrar tipos de habitación con autodetección de
 * Edificio (`auth_user`, `isDisabled` por defecto + botón icon-only FontAwesome).
 */
export const HabitacionRegistroForm = memo(function HabitacionRegistroForm({
  submitting,
  submitError,
  submitErrorStatus = null,
  onSubmit,
}: HabitacionRegistroFormProps) {
  const { policy } = useDeviceResourceProfile()
  const {
    name,
    edificioId,
    mergedEdificios,
    edificiosLoading,
    loadingAutoEdificio,
    isManualEdificio,
    autoEdificioValidation,
    estado,
    capacity,
    basePrice,
    errors,
    estadoOptions,
    handleNameChange,
    handleCapacityChange,
    handleBasePriceChange,
    handleEdificioChange,
    handleToggleManualEdificio,
    handleEstadoChange,
    submit,
  } = useHabitacionRegistroForm(onSubmit)

  const dropdownFallback = (
    <div className="h-[68px] animate-pulse rounded-xl border border-line bg-panel/60" />
  )

  return (
    <MotionConfig reducedMotion={policy.enableAnimations ? 'user' : 'always'}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <FadeIn duration={0.45} delay={0}>
          <Input
            label="Nombre"
            placeholder="Ej. Suite 101 con vista al mar"
            autoComplete="off"
            maxLength={NAME_MAX}
            autoFocus
            required
            disabled={submitting}
            value={name}
            onChange={handleNameChange}
            error={errors.name}
            hint="Un nombre que tus huéspedes reconozcan de un vistazo."
            icon={
              <FontAwesomeIcon
                icon={faBed}
                className="size-4"
                aria-hidden="true"
              />
            }
          />
        </FadeIn>

        <FadeIn
          duration={0.45}
          delay={0.06}
          className="relative z-20 has-[[aria-expanded='true']]:z-50"
        >
          <Suspense fallback={dropdownFallback}>
            <LazyHabitacionEdificioField
              edificios={mergedEdificios}
              edificiosLoading={isManualEdificio ? edificiosLoading : false}
              loadingAutoEdificio={loadingAutoEdificio}
              edificioId={edificioId}
              isManualEdificio={isManualEdificio}
              submitting={submitting}
              required={false}
              autoEdificioValidation={autoEdificioValidation}
              onChange={handleEdificioChange}
              onToggleManual={handleToggleManualEdificio}
            />
          </Suspense>
        </FadeIn>

        <div className="grid gap-4 sm:grid-cols-2">
          <FadeIn duration={0.45} delay={0.12}>
            <Input
              label="Capacidad"
              type="number"
              inputMode="numeric"
              min={CAPACITY_MIN}
              max={CAPACITY_MAX}
              step={1}
              placeholder="Ej. 2"
              required
              disabled={submitting}
              value={capacity}
              onChange={handleCapacityChange}
              error={errors.capacity}
              hint={`Personas que pueden alojarse (${CAPACITY_MIN} a ${CAPACITY_MAX}).`}
              icon={
                <FontAwesomeIcon
                  icon={faUsers}
                  className="size-4"
                  aria-hidden="true"
                />
              }
            />
          </FadeIn>

          <FadeIn duration={0.45} delay={0.2}>
            <Input
              label="Precio base"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              placeholder="Ej. 250000"
              required
              disabled={submitting}
              value={basePrice}
              onChange={handleBasePriceChange}
              error={errors.basePrice}
              hint="Monto por noche, en la moneda de tu hotel."
              icon={
                <FontAwesomeIcon
                  icon={faDollarSign}
                  className="size-3.5"
                  aria-hidden="true"
                />
              }
            />
          </FadeIn>
        </div>

        <FadeIn
          duration={0.45}
          delay={0.26}
          className="relative z-10 has-[[aria-expanded='true']]:z-50"
        >
          <Suspense fallback={dropdownFallback}>
            <LazyRecursosDropdown
              label="Estado"
              options={estadoOptions}
              value={estado}
              onChange={handleEstadoChange}
              error={errors.estado}
              isDisabled={submitting}
              disabled={submitting}
              direction="auto"
              searchable={false}
            />
          </Suspense>
        </FadeIn>

        <FadeIn
          duration={0.45}
          delay={0.32}
          className="flex items-center justify-end border-t border-line pt-4"
        >
          <Button
            type="submit"
            disabled={submitting}
            className="w-full shadow-sm sm:w-auto"
            whileHover={
              submitting || !policy.enableAnimations
                ? undefined
                : {
                    scale: 1.03,
                    y: -1,
                    transition: { duration: 0.22, ease: customEasing },
                  }
            }
            whileTap={
              submitting || !policy.enableAnimations
                ? undefined
                : {
                    scale: 0.97,
                    y: 0,
                    transition: { duration: 0.12, ease: customEasing },
                  }
            }
          >
            {submitting ? (
              <>
                <span
                  className={`inline-block size-4 rounded-full border-2 border-white/30 border-t-white ${
                    policy.enableAnimations ? 'animate-spin' : ''
                  }`}
                  aria-hidden="true"
                />
                Guardando…
              </>
            ) : (
              'Registrar habitación'
            )}
          </Button>
        </FadeIn>

        {submitError ? (
          <HabitacionPlanetAlert
            variant="error"
            planet="mars"
            title="No pudimos guardar el registro"
            message={submitError}
            error={submitErrorStatus ? { status: submitErrorStatus } : undefined}
          />
        ) : null}
      </form>
    </MotionConfig>
  )
})

export default HabitacionRegistroForm
