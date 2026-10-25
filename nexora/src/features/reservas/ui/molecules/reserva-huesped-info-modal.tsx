import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUser,
  faIdCard,
  faHashtag,
  faCalendarDays,
  faVenusMars,
  faPhone,
  faGlobe,
  faXmark,
  faCircleInfo,
} from '@fortawesome/free-solid-svg-icons'
import type { StatusCodeValidationResult } from '../../../../shared/lib/status-code-validator'
import { formatDocumentType } from '../../../personas/domain/persona-list'
import {
  fetchPersonDetailFromApi,
  type PersonDetailDto,
} from '../../infrastructure/api-person-detail-repository'

export interface ReservaHuespedInfoModalProps {
  isOpen: boolean
  personId: string | null
  onClose: () => void
}

/** Formatea de manera legible la fecha de nacimiento en español */
function formatBirthDateText(dateStr?: string): { formatted: string; ageText: string } {
  if (!dateStr) return { formatted: 'No registrada', ageText: '' }
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return { formatted: dateStr, ageText: '' }
    const formatted = d.toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    })
    const today = new Date()
    let age = today.getUTCFullYear() - d.getUTCFullYear()
    const m = today.getUTCMonth() - d.getUTCMonth()
    if (m < 0 || (m === 0 && today.getUTCDate() < d.getUTCDate())) {
      age--
    }
    const ageText = age >= 0 && age < 125 ? `(${age} años)` : ''
    return { formatted, ageText }
  } catch {
    return { formatted: dateStr, ageText: '' }
  }
}

/** Formatea el género en una etiqueta amigable */
function formatGenderLabel(gender?: string): string {
  if (!gender) return 'No especificado'
  const g = gender.toUpperCase().trim()
  if (g === 'M' || g === 'MASCULINO' || g === 'MALE') return 'Masculino'
  if (g === 'F' || g === 'FEMENINO' || g === 'FEMALE') return 'Femenino'
  return gender
}

export function ReservaHuespedInfoModal({
  isOpen,
  personId,
  onClose,
}: ReservaHuespedInfoModalProps) {
  const [guest, setGuest] = useState<PersonDetailDto | null>(null)
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<StatusCodeValidationResult | null>(null)

  // 1. Efecto ModalPresentationStyle estilo iOS: escala de profundidad en #root
  useEffect(() => {
    if (!isOpen) return
    const rootEl = document.getElementById('root')
    if (!rootEl) return

    const prevTransition = rootEl.style.transition
    const prevTransform = rootEl.style.transform
    const prevBorderRadius = rootEl.style.borderRadius
    const prevTransformOrigin = rootEl.style.transformOrigin
    const prevOverflow = rootEl.style.overflow
    const prevBodyOverflow = document.body.style.overflow
    const prevBodyBg = document.body.style.backgroundColor

    rootEl.style.transition =
      'transform 0.4s cubic-bezier(0.32, 0.72, 0, 1), border-radius 0.4s cubic-bezier(0.32, 0.72, 0, 1)'
    rootEl.style.transformOrigin = 'bottom center'
    rootEl.style.transform = 'scale(0.93)'
    rootEl.style.borderRadius = '24px'
    rootEl.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    document.body.style.backgroundColor = '#000000'

    return () => {
      rootEl.style.transition = prevTransition
      rootEl.style.transform = prevTransform
      rootEl.style.borderRadius = prevBorderRadius
      rootEl.style.transformOrigin = prevTransformOrigin
      rootEl.style.overflow = prevOverflow
      document.body.style.overflow = prevBodyOverflow
      document.body.style.backgroundColor = prevBodyBg
    }
  }, [isOpen])

  // 2. Cerrar con la tecla Escape
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // 3. Cargar información del huésped al abrir consumiendo GET /persons/{id}
  useEffect(() => {
    if (!isOpen || !personId) {
      setGuest(null)
      setFeedback(null)
      return
    }

    let isMounted = true
    setLoading(true)

    fetchPersonDetailFromApi(personId)
      .then((res) => {
        if (!isMounted) return
        setGuest(res.data)
        setFeedback(res.validation.message ? res.validation : null)
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [isOpen, personId])

  // Iniciales del huésped para el avatar
  const initials = guest?.name
    ? guest.name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase())
        .join('')
    : 'HT'

  const birthDateInfo = formatBirthDateText(guest?.date_of_birth)

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="detalle-huesped-title"
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
        >
          {/* Fondo oscuro con desenfoque (Backdrop iOS) */}
          <motion.div
            key="backdrop-huesped-detalle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            aria-hidden="true"
          />

          {/* Tarjeta Modal estilo iOS Sheet (desliza desde abajo con física Spring) */}
          <motion.div
            key="modal-huesped-detalle-content"
            initial={{ y: '100%', opacity: 0.9 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0.8 }}
            transition={{
              type: 'spring',
              damping: 28,
              stiffness: 280,
              mass: 0.85,
            }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-t-[32px] sm:rounded-3xl border border-line bg-panel p-6 shadow-2xl transition-all sm:p-8"
          >
            {/* Tirador superior característico de tarjeta modal iOS */}
            <div className="flex justify-center mb-3 sm:hidden">
              <div className="h-1.5 w-12 rounded-full bg-line/80" />
            </div>

            {/* Encabezado del modal */}
            <div className="flex items-start justify-between border-b border-line/60 pb-4">
              <div className="flex items-center gap-3">
                <div
                  className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/15 text-sm font-bold text-primary border border-primary/25 shadow-2xs select-none"
                  aria-hidden="true"
                >
                  {initials}
                </div>
                <div>
                  <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                    <FontAwesomeIcon icon={faCircleInfo} className="size-3" />
                    <span>Información del Huésped</span>
                  </p>
                  <h2 id="detalle-huesped-title" className="mt-0.5 text-lg font-bold text-ink sm:text-xl">
                    Ficha del Huésped
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar modal de información del huésped"
                className="rounded-xl border border-line bg-surface/50 p-2 text-ink-muted hover:bg-surface hover:text-ink transition-colors"
              >
                <FontAwesomeIcon icon={faXmark} className="size-4" />
              </button>
            </div>

            {/* Estado de carga */}
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center justify-center py-12 text-center"
              >
                <span className="size-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
                <p className="mt-3 text-sm font-semibold text-ink">Consultando huésped...</p>
                <p className="text-xs text-ink-muted">Obteniendo los datos más recientes del sistema.</p>
              </motion.div>
            )}

            {/* Contenido con la información del huésped */}
            {!loading && guest && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="mt-5 space-y-4"
              >
                {/* 1. Nombre completo */}
                <div className="rounded-2xl border border-line/70 bg-canvas/60 p-4">
                  <span className="flex items-center gap-2 text-xs font-medium text-ink-muted">
                    <FontAwesomeIcon icon={faUser} className="size-3.5 text-primary" />
                    <span>Nombre completo</span>
                  </span>
                  <p className="mt-1.5 text-base font-bold text-ink sm:text-lg">
                    {guest.name || 'Sin nombre registrado'}
                  </p>
                </div>

                {/* Grid con Tipo y Número de Documento */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {/* 2. Tipo documento */}
                  <div className="rounded-2xl border border-line/70 bg-canvas/40 p-4">
                    <span className="flex items-center gap-2 text-xs font-medium text-ink-muted">
                      <FontAwesomeIcon icon={faIdCard} className="size-3.5 text-primary" />
                      <span>Tipo documento</span>
                    </span>
                    <p className="mt-1.5 text-sm font-semibold text-ink">
                      {formatDocumentType(guest.document_type)}
                    </p>
                  </div>

                  {/* 3. Número de documento */}
                  <div className="rounded-2xl border border-line/70 bg-canvas/40 p-4">
                    <span className="flex items-center gap-2 text-xs font-medium text-ink-muted">
                      <FontAwesomeIcon icon={faHashtag} className="size-3.5 text-primary" />
                      <span>Número de documento</span>
                    </span>
                    <p className="mt-1.5 text-sm font-bold text-ink">
                      {guest.document_number || 'Sin registrar'}
                    </p>
                  </div>
                </div>

                {/* Grid con Fecha de Nacimiento y Género */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {/* 4. Fecha de nacimiento */}
                  <div className="rounded-2xl border border-line/70 bg-canvas/40 p-4">
                    <span className="flex items-center gap-2 text-xs font-medium text-ink-muted">
                      <FontAwesomeIcon icon={faCalendarDays} className="size-3.5 text-primary" />
                      <span>Fecha de nacimiento</span>
                    </span>
                    <p className="mt-1.5 text-sm font-semibold text-ink">
                      <span>{birthDateInfo.formatted}</span>{' '}
                      {birthDateInfo.ageText && (
                        <span className="text-xs text-ink-muted font-normal">
                          {birthDateInfo.ageText}
                        </span>
                      )}
                    </p>
                  </div>

                  {/* 5. Género */}
                  <div className="rounded-2xl border border-line/70 bg-canvas/40 p-4">
                    <span className="flex items-center gap-2 text-xs font-medium text-ink-muted">
                      <FontAwesomeIcon icon={faVenusMars} className="size-3.5 text-primary" />
                      <span>Género</span>
                    </span>
                    <p className="mt-1.5 text-sm font-semibold text-ink">
                      {formatGenderLabel(guest.gender)}
                    </p>
                  </div>
                </div>

                {/* Grid con Teléfono y Nacionalidad */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {/* 6. Número de teléfono */}
                  <div className="rounded-2xl border border-line/70 bg-canvas/40 p-4">
                    <span className="flex items-center gap-2 text-xs font-medium text-ink-muted">
                      <FontAwesomeIcon icon={faPhone} className="size-3.5 text-primary" />
                      <span>Número de teléfono</span>
                    </span>
                    <p className="mt-1.5 text-sm font-semibold text-ink">
                      {guest.phone_number || 'No registrado'}
                    </p>
                  </div>

                  {/* 7. Nacionalidad */}
                  <div className="rounded-2xl border border-line/70 bg-canvas/40 p-4">
                    <span className="flex items-center gap-2 text-xs font-medium text-ink-muted">
                      <FontAwesomeIcon icon={faGlobe} className="size-3.5 text-primary" />
                      <span>Nacionalidad</span>
                    </span>
                    <p className="mt-1.5 text-sm font-semibold text-ink">
                      {guest.nationality || 'No especificada'}
                    </p>
                  </div>
                </div>

                {/* Feedback empático si aplica algún código de estado HTTP */}
                {feedback && (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
                    {feedback.message}
                  </div>
                )}
              </motion.div>
            )}

            {/* Pie del modal con botón de cierre */}
            <div className="mt-6 flex justify-end border-t border-line/60 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-primary-hover active:scale-98 transition-all focus-visible:outline-2 focus-visible:outline-primary"
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
