import { memo } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowsRotate,
  faCircleCheck,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons'
import {
  StatusCodeAlert,
  type StatusCodeValidationResult,
} from '../../../../shared/lib/status-code-validator'

export interface PersonasFeedbackAlertsProps {
  validationResult: StatusCodeValidationResult | null
  serviceRequestValidation: StatusCodeValidationResult | null
  feedbackBanner: { tone: 'success' | 'error'; text: string } | null
  enableAnimations: boolean
  onReload: () => void
  onDismissFeedback: () => void
}

/**
 * Molécula: Alertas HTTP empáticas (`StatusCodeAlert`) y banner de confirmación
 * operativa para `PersonasPage`.
 */
export const PersonasFeedbackAlerts = memo(function PersonasFeedbackAlerts({
  validationResult,
  serviceRequestValidation,
  feedbackBanner,
  enableAnimations,
  onReload,
  onDismissFeedback,
}: PersonasFeedbackAlertsProps) {
  const retryAction = (
    <button
      type="button"
      onClick={onReload}
      className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold underline hover:opacity-80"
    >
      <FontAwesomeIcon
        icon={faArrowsRotate}
        className="size-3"
        aria-hidden="true"
      />
      <span>Reintentar</span>
    </button>
  )

  return (
    <>
      {validationResult && !validationResult.isValid && (
        <StatusCodeAlert
          validation={validationResult}
          dismissible
          actions={retryAction}
        />
      )}

      {serviceRequestValidation && !serviceRequestValidation.isValid && (
        <StatusCodeAlert
          validation={serviceRequestValidation}
          dismissible
          actions={retryAction}
        />
      )}

      <AnimatePresence>
        {feedbackBanner && (
          <motion.div
            role="status"
            initial={enableAnimations ? { opacity: 0, y: -6 } : false}
            animate={{ opacity: 1, y: 0 }}
            exit={enableAnimations ? { opacity: 0, y: -6 } : undefined}
            className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-xs font-medium shadow-2xs ${
              feedbackBanner.tone === 'error'
                ? 'border-danger/30 bg-danger/10 text-danger'
                : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
            }`}
          >
            <span className="flex items-center gap-2">
              <FontAwesomeIcon
                icon={
                  feedbackBanner.tone === 'error'
                    ? faTriangleExclamation
                    : faCircleCheck
                }
                className={`size-4 ${
                  feedbackBanner.tone === 'error'
                    ? 'text-danger'
                    : 'text-emerald-500'
                }`}
                aria-hidden="true"
              />
              <span>{feedbackBanner.text}</span>
            </span>
            <button
              type="button"
              onClick={onDismissFeedback}
              className="cursor-pointer text-xs font-bold underline opacity-80 hover:opacity-100"
            >
              Cerrar
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
})
