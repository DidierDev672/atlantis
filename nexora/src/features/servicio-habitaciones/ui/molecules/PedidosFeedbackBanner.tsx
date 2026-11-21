import { memo, useCallback } from 'react'
import {
  PlanetAlert,
  type StatusCodeValidationResult,
} from '../../../../shared/lib/status-code-validator'

export interface PedidosFeedbackBannerProps {
  feedback: StatusCodeValidationResult | null
  onDismiss: () => void
}

/**
 * Molécula: Banner de retroalimentación para el Historial de Ventas.
 * Delega el renderizado a `PlanetAlert` respetando las variantes `success`, `warning` y `danger`
 * de `status-code-validator.ts`.
 */
export const PedidosFeedbackBanner = memo(function PedidosFeedbackBanner({
  feedback,
  onDismiss,
}: PedidosFeedbackBannerProps) {
  const handleClose = useCallback(() => {
    try {
      onDismiss()
    } catch (error) {
      console.error('Error al cerrar alerta del historial de ventas:', error)
    }
  }, [onDismiss])

  if (!feedback) return null

  if (feedback.alertProps) {
    return (
      <PlanetAlert
        {...feedback.alertProps}
        dismissible
        onClose={handleClose}
      />
    )
  }

  if (!feedback.message) return null

  const fallbackVariant = feedback.isValid
    ? 'success'
    : feedback.status >= 500
      ? 'danger'
      : 'warning'

  return (
    <PlanetAlert
      variant={fallbackVariant}
      title={
        feedback.title ||
        (feedback.isValid ? 'Pedido actualizado' : 'Error en Historial de Ventas')
      }
      message={feedback.message}
      dismissible
      onClose={handleClose}
    />
  )
})
