import { memo, useCallback, useEffect } from 'react'
import { motion } from 'motion/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowRight,
  faTriangleExclamation,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'
import { fadeUp } from '../../../../design-tokens/motion'
import { useDeviceResourceProfile } from '../../../../shared/lib/use-device-resource-profile'
import type { RoleRedirectDecision } from '../../../roles/domain/role-router'

export interface RoleIssueModalProps {
  isOpen: boolean
  decision: RoleRedirectDecision
  rawRole: string
  onContinue?: () => void
  onClose: () => void
}

/**
 * Molécula: Modal informativo cuando el rol requiere aviso previo al ingreso.
 * Cargado con `React.lazy`, envuelto en `React.memo`, con cierre accesible por `Escape` y backdrop.
 */
export const RoleIssueModal = memo(function RoleIssueModal({
  isOpen,
  decision,
  rawRole,
  onContinue,
  onClose,
}: RoleIssueModalProps) {
  const {
    policy: { enableBackdropBlur, enableAnimations, tier },
  } = useDeviceResourceProfile()

  const handleSafeClose = useCallback(() => {
    try {
      onClose()
    } catch (error) {
      console.error('Error al cerrar modal de rol:', error)
    }
  }, [onClose])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleSafeClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleSafeClose, isOpen])

  if (!isOpen) return null

  const allowMotion = enableAnimations && tier !== 'ultra-light'
  const displayRole = rawRole?.trim() || decision.roleName || 'No especificado'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="role-issue-modal-title"
      onClick={handleSafeClose}
      className={`bg-canvas/80 fixed inset-0 z-50 flex items-center justify-center p-4 ${
        enableBackdropBlur ? 'backdrop-blur-xs' : ''
      }`}
    >
      <motion.div
        variants={allowMotion ? fadeUp : undefined}
        initial={allowMotion ? 'hidden' : false}
        animate="visible"
        onClick={(event) => event.stopPropagation()}
        className="border-line bg-panel relative flex w-full max-w-md flex-col items-center gap-5 rounded-3xl border p-6 text-center shadow-2xl sm:p-8"
      >
        <button
          type="button"
          onClick={handleSafeClose}
          aria-label="Cerrar aviso de rol"
          className="text-ink-muted hover:text-ink hover:bg-canvas/60 focus-visible:ring-primary/40 absolute top-4 right-4 grid size-8 cursor-pointer place-items-center rounded-xl transition-colors outline-none focus-visible:ring-2"
        >
          <FontAwesomeIcon icon={faXmark} className="size-4" aria-hidden="true" />
        </button>

        <div className="ring-amber-500/30 bg-amber-500/10 grid size-14 place-items-center rounded-2xl text-amber-600 shadow-xs ring-1 dark:text-amber-400">
          <FontAwesomeIcon
            icon={faTriangleExclamation}
            className="size-6"
            aria-hidden="true"
          />
        </div>

        <div className="space-y-2">
          <h3
            id="role-issue-modal-title"
            className="text-ink text-xl font-bold tracking-tight"
          >
            Aviso de Identificación de Rol
          </h3>

          <div className="flex justify-center">
            <span className="border-line bg-canvas/60 text-ink-muted inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold">
              <span className="size-1.5 rounded-full bg-amber-500" />
              Rol detectado:{' '}
              <strong className="text-ink capitalize">{displayRole}</strong>
            </span>
          </div>

          <p className="text-ink-muted text-sm leading-relaxed">
            {decision.issueMessage ||
              'Se presentó un inconveniente para identificar el rol del usuario que está iniciando sesión. No te preocupes: tus credenciales son válidas y tus datos están seguros.'}
          </p>

          <p className="text-ink-soft text-xs leading-relaxed">
            Avanzarás a la página que normalmente se utiliza al iniciar sesión en
            el hotel. Próximamente se incorporarán las vistas especializadas para
            más roles.
          </p>
        </div>

        <div className="mt-2 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => onContinue?.()}
            className="bg-primary hover:bg-primary/90 focus-visible:ring-primary/40 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all outline-none focus-visible:ring-2 active:scale-[0.97] sm:w-auto"
          >
            <span>Continuar al panel principal</span>
            <FontAwesomeIcon
              icon={faArrowRight}
              className="size-3.5"
              aria-hidden="true"
            />
          </button>

          <button
            type="button"
            onClick={handleSafeClose}
            className="border-line text-ink-muted hover:bg-canvas/60 hover:text-ink focus-visible:ring-primary/30 inline-flex w-full cursor-pointer items-center justify-center rounded-xl border px-4 py-2.5 text-sm font-medium transition-all outline-none focus-visible:ring-2 active:scale-[0.97] sm:w-auto"
          >
            Cerrar aviso
          </button>
        </div>
      </motion.div>
    </div>
  )
})
