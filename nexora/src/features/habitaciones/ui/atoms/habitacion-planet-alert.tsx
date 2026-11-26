import {
  Suspense,
  lazy,
  memo,
  useEffect,
  useState,
  type ComponentType,
} from 'react'
import type { PlanetAlertProps } from '../../../../shared/alert/lib/types'
import { useDeviceResourceProfile } from '../../../../shared/lib/use-device-resource-profile'

const LazyPlanetAlert = lazy<ComponentType<PlanetAlertProps>>(async () => {
  try {
    const mod = await import('../../../../shared/alert/organisms/PlanetAlert')
    return { default: mod.PlanetAlert }
  } catch (error) {
    console.error('Error al cargar PlanetAlert:', error)
    const Fallback: ComponentType<PlanetAlertProps> = ({
      title,
      message,
      actions,
      variant,
    }) => (
      <div
        role={variant === 'success' ? 'status' : 'alert'}
        className="border-line bg-panel space-y-2 rounded-xl border p-4 text-sm"
      >
        {title ? <p className="text-ink font-semibold">{title}</p> : null}
        {message ? <p className="text-ink-muted">{message}</p> : null}
        {actions ? <div>{actions}</div> : null}
      </div>
    )
    return { default: Fallback }
  }
})

export interface HabitacionPlanetAlertProps
  extends Omit<PlanetAlertProps, 'showPlanet'> {
  fallbackText?: string
  hidePlanetOnCompact?: boolean
  autoHideDurationMs?: number
  onAutoHide?: () => void
}

/**
 * Átomo compartido: Envoltorio perezoso de `PlanetAlert` (`React.lazy` + `memo`)
 * adaptado al perfil de hardware (`useDeviceResourceProfile`) con auto-ocultado opcional.
 */
export const HabitacionPlanetAlert = memo(function HabitacionPlanetAlert({
  fallbackText,
  hidePlanetOnCompact = false,
  autoHideDurationMs,
  onAutoHide,
  ...props
}: HabitacionPlanetAlertProps) {
  const { policy } = useDeviceResourceProfile()
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    if (!autoHideDurationMs || autoHideDurationMs <= 0) return
    const timerId = window.setTimeout(() => {
      setHidden(true)
      onAutoHide?.()
    }, autoHideDurationMs)
    return () => {
      window.clearTimeout(timerId)
    }
  }, [autoHideDurationMs, onAutoHide])

  if (hidden) return null

  return (
    <Suspense
      fallback={
        <div
          role={props.variant === 'success' ? 'status' : 'alert'}
          className="border-line bg-panel text-ink-muted rounded-2xl border p-4 text-sm font-medium"
        >
          {fallbackText ?? props.message ?? props.title}
        </div>
      }
    >
      <LazyPlanetAlert
        showBadge
        showGlowLine
        {...props}
        showPlanet={!hidePlanetOnCompact && policy.tier !== 'ultra-light'}
      />
    </Suspense>
  )
})
