import React, { useEffect, useId, useRef } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { useDeviceResourceProfile } from '../lib/use-device-resource-profile'

export type DrawerPosition = 'right' | 'left' | 'top' | 'bottom'
export type DrawerSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

export interface DrawerProps {
  /** Controla la visibilidad del drawer */
  isOpen: boolean
  /** Callback para cerrar el drawer */
  onClose: () => void
  /** Título principal de la cabecera */
  title?: React.ReactNode
  /** Subtítulo o descripción breve */
  description?: React.ReactNode
  /** Icono decorativo de FontAwesome en el título */
  icon?: IconDefinition
  /** Elemento visual personalizado en lugar del icono estático del título */
  iconElement?: React.ReactNode
  /** Contenido principal del cuerpo */
  children: React.ReactNode
  /** Acciones o contenido del pie de página */
  footer?: React.ReactNode
  /** Posición desde donde se despliega ('right' | 'left' | 'top' | 'bottom'). Por defecto 'right' */
  position?: DrawerPosition
  /** Ancho / tamaño del panel ('sm' | 'md' | 'lg' | 'xl' | 'full'). Por defecto 'md' */
  size?: DrawerSize
  /** Permite cerrar al hacer clic en el backdrop oscurecido (por defecto true) */
  closeOnBackdropClick?: boolean
  /** Permite cerrar al presionar la tecla Escape (por defecto true) */
  closeOnEscape?: boolean
  /** Muestra el botón de cierre con X (por defecto true) */
  showCloseButton?: boolean
  /** Clases CSS adicionales para el contenedor del panel */
  className?: string
  /** Acciones adicionales en la cabecera (junto al botón de cerrar) */
  headerActions?: React.ReactNode
  /** ID para atributos de accesibilidad */
  id?: string
}

const SIZE_CLASSES_HORIZONTAL: Record<DrawerSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-full',
}

const SIZE_CLASSES_VERTICAL: Record<DrawerSize, string> = {
  sm: 'max-h-[35vh]',
  md: 'max-h-[50vh]',
  lg: 'max-h-[70vh]',
  xl: 'max-h-[85vh]',
  full: 'max-h-full',
}

/**
 * Componente Reutilizable: Drawer (Menú lateral / Panel deslizante).
 * Accesible (WAI-ARIA Dialog), con bloqueo de scroll, soporte para tecla Escape,
 * cierre por backdrop y animaciones fluidas con Motion + Tailwind CSS.
 */
export function Drawer({
  isOpen,
  onClose,
  title,
  description,
  icon,
  iconElement,
  children,
  footer,
  position = 'right',
  size = 'md',
  closeOnBackdropClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  className = '',
  headerActions,
  id,
}: DrawerProps) {
  const autoId = useId()
  const drawerId = id ?? autoId
  const titleId = `${drawerId}-title`
  const descriptionId = `${drawerId}-description`
  const drawerRef = useRef<HTMLDivElement>(null)
  const {
    policy: { enableBackdropBlur },
  } = useDeviceResourceProfile()

  // 1. Cierre accesible con la tecla Escape
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, closeOnEscape, onClose])

  // 2. Bloqueo de scroll en el body mientras el drawer está abierto
  useEffect(() => {
    if (!isOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen])

  // 3. Foco inicial automático al abrir para accesibilidad
  useEffect(() => {
    if (isOpen && drawerRef.current) {
      drawerRef.current.focus()
    }
  }, [isOpen])

  // Configuración de animación y posición según la prop position
  const isHorizontal = position === 'left' || position === 'right'

  const panelMotionVariants = {
    initial: {
      x: position === 'right' ? '100%' : position === 'left' ? '-100%' : 0,
      y: position === 'bottom' ? '100%' : position === 'top' ? '-100%' : 0,
    },
    animate: {
      x: 0,
      y: 0,
    },
    exit: {
      x: position === 'right' ? '100%' : position === 'left' ? '-100%' : 0,
      y: position === 'bottom' ? '100%' : position === 'top' ? '-100%' : 0,
    },
  }

  const positionClasses = {
    right: 'inset-y-0 right-0',
    left: 'inset-y-0 left-0',
    bottom: 'inset-x-0 bottom-0',
    top: 'inset-x-0 top-0',
  }[position]

  const sizeClass = isHorizontal
    ? SIZE_CLASSES_HORIZONTAL[size]
    : SIZE_CLASSES_VERTICAL[size]

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? titleId : undefined}
          aria-describedby={description ? descriptionId : undefined}
          className="fixed inset-0 z-50 overflow-hidden"
        >
          {/* Fondo oscuro (Backdrop) desenfocado */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            onClick={() => {
              if (closeOnBackdropClick) onClose()
            }}
            className={`fixed inset-0 bg-black/60 transition-opacity ${
              enableBackdropBlur ? 'backdrop-blur-xs' : ''
            }`}
            aria-hidden="true"
          />

          {/* Panel deslizante animado */}
          <motion.div
            ref={drawerRef}
            tabIndex={-1}
            variants={panelMotionVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ type: 'spring', damping: 30, stiffness: 320, mass: 0.8 }}
            className={`fixed ${positionClasses} w-full ${sizeClass} z-10 flex flex-col border-line bg-panel text-ink shadow-2xl outline-none ${
              position === 'right'
                ? 'border-l'
                : position === 'left'
                  ? 'border-r'
                  : position === 'bottom'
                    ? 'border-t rounded-t-3xl'
                    : 'border-b rounded-b-3xl'
            } ${className}`}
          >
            {/* Cabecera del Drawer */}
            {(title || showCloseButton || headerActions) && (
              <div className="flex items-center justify-between gap-3 border-b border-line bg-canvas/60 px-6 py-4">
                <div className="flex items-center gap-3 min-w-0">
                  {iconElement ? (
                    <div className="shrink-0">{iconElement}</div>
                  ) : (
                    icon && (
                      <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                        <FontAwesomeIcon icon={icon} className="size-4" />
                      </div>
                    )
                  )}
                  <div className="min-w-0 flex-1">
                    {title && (
                      <h2
                        id={titleId}
                        className="truncate font-serif text-lg font-bold text-ink"
                      >
                        {title}
                      </h2>
                    )}
                    {description && (
                      <p
                        id={descriptionId}
                        className="truncate text-xs text-ink-muted"
                      >
                        {description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {headerActions}
                  {showCloseButton && (
                    <button
                      type="button"
                      onClick={onClose}
                      aria-label="Cerrar panel deslizante"
                      title="Cerrar panel (Esc)"
                      className="grid size-9 cursor-pointer place-items-center rounded-xl border border-line bg-panel text-ink-muted transition-colors hover:bg-canvas hover:text-ink shadow-2xs"
                    >
                      <FontAwesomeIcon icon={faXmark} className="size-4" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Cuerpo del Drawer con scroll propio */}
            <div className="flex-1 overflow-y-auto p-6">{children}</div>

            {/* Pie de página del Drawer */}
            {footer && (
              <div className="border-t border-line bg-canvas/70 px-6 py-4 shadow-xs">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default Drawer
