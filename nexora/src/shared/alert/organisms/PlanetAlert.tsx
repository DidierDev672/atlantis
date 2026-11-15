import { useMemo, useState, type CSSProperties } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { AlertGlowLine } from '../atoms/AlertGlowLine'
import { AlertDescription } from '../atoms/AlertDescription'
import { AlertHeader } from '../molecules/AlertHeader'
import { AlertErrorList } from '../molecules/AlertErrorList'
import { AlertActions } from '../molecules/AlertActions'
import { getPlanetTheme } from '../lib/colors'
import { parseApiError } from '../lib/error-parser'
import { VARIANT_DEFAULT_TITLES } from '../lib/constants'
import type { PlanetAlertProps } from '../lib/types'
import { cn } from '../../lib/cn'

/**
 * Organismo: PlanetAlert
 *
 * Alerta cósmica reutilizable construida con arquitectura Atomic Design.
 * Los colores y atmósferas corresponden a los planetas del sistema:
 * - Success -> Planeta Tierra
 * - Warning -> Planeta Júpiter
 * - Info    -> Planeta Neptuno
 * - Danger  -> Planeta Marte (también alias 'error')
 *
 * Características principales:
 * 1. Compatibilidad universal con mensajes: cortos (estilo inline), medianos (párrafos) o largos (logs, multi-línea).
 * 2. Soporte nativo para errores de endpoints: parsea automáticamente respuestas de APIs REST (ej. errores 400, 422 con arrays de campos).
 * 3. Animaciones fluidas de entrada y salida con Motion.
 * 4. Microinteracciones de colapsado y copiado rápido para soporte y depuración.
 */
export function PlanetAlert({
  variant = 'info',
  planet,
  title,
  message,
  children,
  error,
  errors,
  showPlanet = true,
  planetSizePx = 32,
  showBadge = true,
  showGlowLine = true,
  dismissible = false,
  onClose,
  actions,
  collapsibleDetails = true,
  defaultExpanded = false,
  className,
  role = 'alert',
}: PlanetAlertProps) {
  const [isVisible, setIsVisible] = useState(true)
  const theme = getPlanetTheme(variant, planet)

  // Normalizar errores de endpoints si se pasó la prop `error` o `errors`
  const parsedError = useMemo(() => {
    if (!error && !errors) return null

    if (error) {
      const parsed = parseApiError(error)
      // Si además se pasaron `errors` explícitos, combinarlos
      if (errors) {
        const extra = Array.isArray(errors)
          ? errors
          : Object.entries(errors).flatMap(([k, v]) =>
              Array.isArray(v) ? v.map((item) => `${k}: ${item}`) : [`${k}: ${v}`]
            )
        parsed.details = Array.from(new Set([...parsed.details, ...extra]))
      }
      return parsed
    }

    if (errors) {
      const details = Array.isArray(errors)
        ? errors
        : Object.entries(errors).flatMap(([k, v]) =>
            Array.isArray(v) ? v.map((item) => `${k}: ${item}`) : [`${k}: ${v}`]
          )
      return {
        title: VARIANT_DEFAULT_TITLES[variant],
        message: details[0] || 'Se encontraron observaciones en la solicitud.',
        details: details.length > 1 ? details : [],
      }
    }

    return null
  }, [error, errors, variant])

  const resolvedTitle = title ?? parsedError?.title ?? (message || children ? undefined : VARIANT_DEFAULT_TITLES[variant])
  const resolvedMessage = message ?? (children ? null : parsedError?.message)
  const resolvedDetails = parsedError?.details ?? []

  const handleDismiss = () => {
    setIsVisible(false)
    onClose?.()
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          role={role}
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.2 } }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className={cn(
            'group relative overflow-hidden rounded-2xl border p-4 sm:p-5 shadow-sm transition-all duration-300',
            'backdrop-blur-md',
            className
          )}
          style={
            {
              borderColor: theme.border,
              boxShadow: `0 4px 24px -2px ${theme.border}`,
              // Inyectamos variables para adaptación limpia claro/oscuro
              '--alert-details-bg': theme.detailsBgDark,
            } as CSSProperties
          }
        >
          {/* Fondo adaptativo claro y oscuro */}
          <div
            className="pointer-events-none absolute inset-0 -z-10 transition-opacity duration-300 dark:hidden"
            style={{ background: theme.bgLight }}
          />
          <div
            className="pointer-events-none absolute inset-0 -z-10 transition-opacity duration-300 not-dark:hidden"
            style={{ background: theme.bgDark }}
          />

          {/* Línea superior con resplandor planetario */}
          {showGlowLine && (
            <AlertGlowLine variant={variant} planet={planet} position="top" />
          )}

          {/* Cabecera: Avatar/Icono, Badge, Título y Botón Cerrar */}
          <AlertHeader
            title={resolvedTitle}
            variant={variant}
            planet={planet}
            showPlanet={showPlanet}
            planetSizePx={planetSizePx}
            showBadge={showBadge}
            dismissible={dismissible || Boolean(onClose)}
            onClose={handleDismiss}
          />

          {/* Cuerpo: Mensaje / Descripción (soporta corto, mediano o largo) */}
          {(resolvedMessage || children) && (
            <div className={cn('mt-2.5', showPlanet ? 'pl-[42px] sm:pl-[46px]' : 'pl-11')}>
              {resolvedMessage && (
                <AlertDescription variant={variant} planet={planet}>
                  {resolvedMessage}
                </AlertDescription>
              )}
              {children && <div className="mt-2">{children}</div>}
            </div>
          )}

          {/* Lista formateada de sub-errores de endpoints */}
          {resolvedDetails.length > 0 && (
            <div className={cn(showPlanet ? 'pl-[42px] sm:pl-[46px]' : 'pl-11')}>
              <AlertErrorList
                details={resolvedDetails}
                variant={variant}
                planet={planet}
                defaultExpanded={defaultExpanded}
                collapsible={collapsibleDetails}
              />
            </div>
          )}

          {/* Acciones opcionales */}
          {actions && (
            <div className={cn(showPlanet ? 'pl-[42px] sm:pl-[46px]' : 'pl-11')}>
              <AlertActions>{actions}</AlertActions>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
