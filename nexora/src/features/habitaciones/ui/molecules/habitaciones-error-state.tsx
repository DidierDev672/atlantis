import { Suspense, lazy, memo, type ComponentType } from 'react'
import type { PlanetAlertProps } from '../../../../shared/alert/lib/types'
import type { HabitacionesErrorInfo } from '../../application/habitaciones-error-resolver'
import { useDeviceResourceProfile } from '../../application/use-device-resource-profile'

const LazyPlanetAlert = lazy<ComponentType<PlanetAlertProps>>(async () => {
  try {
    const mod = await import('../../../../shared/alert/organisms/PlanetAlert')
    return { default: mod.PlanetAlert }
  } catch (err) {
    console.error('Error al cargar PlanetAlert:', err)
    const Fallback: ComponentType<PlanetAlertProps> = ({
      title,
      message,
      actions,
    }) => (
      <div
        role="alert"
        className="border-danger/30 bg-panel flex flex-col gap-3 rounded-2xl border p-4 text-sm"
      >
        {title ? <p className="text-ink font-semibold">{title}</p> : null}
        {message ? <p className="text-danger">{message}</p> : null}
        {actions ? <div>{actions}</div> : null}
      </div>
    )
    return { default: Fallback }
  }
})

export interface HabitacionesErrorStateProps {
  message: string
  errorInfo?: HabitacionesErrorInfo | null
  actionLabel?: string
  onRetry: () => void
  compact?: boolean
}

/**
 * Molécula: Estado de error al listar habitaciones renderizado con `PlanetAlert`
 * mediante carga perezosa y perfil adaptativo de hardware.
 */
export const HabitacionesErrorState = memo(function HabitacionesErrorState({
  message,
  errorInfo = null,
  actionLabel = 'Reintentar',
  onRetry,
  compact = false,
}: HabitacionesErrorStateProps) {
  const { policy } = useDeviceResourceProfile()
  const resolvedMessage = errorInfo?.message ?? message
  const resolvedTitle =
    errorInfo?.title ??
    (compact
      ? 'No pudimos cargar este piso'
      : 'No pudimos obtener las habitaciones')

  return (
    <Suspense
      fallback={
        <div
          role="alert"
          className="border-line bg-panel rounded-2xl border p-4 text-xs font-medium text-ink-muted"
        >
          {resolvedMessage}
        </div>
      }
    >
      <LazyPlanetAlert
        variant={errorInfo?.variant ?? 'error'}
        planet={errorInfo?.planet ?? 'mars'}
        title={resolvedTitle}
        message={resolvedMessage}
        error={errorInfo?.rawError}
        showPlanet={!compact && policy.tier !== 'ultra-light'}
        showBadge={!compact}
        showGlowLine={!compact}
        className={compact ? 'p-3.5 sm:p-4' : undefined}
        actions={
          <button
            type="button"
            onClick={onRetry}
            className="border-line bg-panel text-ink hover:border-primary/40 hover:text-primary cursor-pointer rounded-xl border px-4 py-2 text-xs font-semibold shadow-2xs transition"
          >
            {actionLabel}
          </button>
        }
      />
    </Suspense>
  )
})
