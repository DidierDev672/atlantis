import { useEffect, useState, useMemo } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCalendarDays,
  faUsers,
  faDollarSign,
  faXmark,
  faArrowRight,
  faCircleInfo,
  faClock,
} from '@fortawesome/free-solid-svg-icons'
import {
  validateStatusCode,
  type StatusCodeValidationResult,
} from '../../../../shared/lib/status-code-validator'
import type { ReservaViewItem } from '../../domain/reserva-list-types'
import { fetchReservaDetailFromApi } from '../../infrastructure/api-reserva-detail-repository'
import { executeBalancedRequest } from '../../infrastructure/api-load-balancer'
import { Loading } from '../../../../shared/loading'
import { ReservaStateBadge } from '../atoms/reserva-state-badge'
import { ReservaHuespedCard } from './reserva-huesped-card'
import {
  ReservaHuespedesStackedCards,
  type StackedGuestCardItem,
} from './reserva-huespedes-stacked-cards'
import { useHuespedesRegistradosStore } from '../../application/use-huespedes-registrados-store'
import { api } from '../../../../lib/api'
import { cn } from '../../../../shared/lib/cn'

interface PersonDetailData {
  id?: string
  name?: string
  document_type?: string
  document_number?: string
  email?: string
  phone_number?: string
}

/** Mapa de acompañantes realistas para reservas demostrativas */
const DEMO_COMPANIONS_MAP: Record<
  string,
  Array<{
    name: string
    document_number?: string
    document_type?: string
    email?: string
    phone_number?: string
  }>
> = {
  '88b2342cac6a4f1b': [
    {
      name: 'Valeria Gómez Restrepo',
      document_number: '1032456789',
      document_type: 'CC',
      email: 'valeria.gomez@correo.com',
      phone_number: '+57 311 234 5678',
    },
  ],
  per_carlos_mendoza: [
    {
      name: 'Elena Silva',
      document_number: '72345678',
      document_type: 'CC',
      email: 'elena.silva@empresa.com',
      phone_number: '+57 312 987 6543',
    },
    {
      name: 'Mateo Mendoza Silva',
      document_number: '83456789',
      document_type: 'TI',
      email: 'contacto.familia@empresa.com',
    },
  ],
  per_valentina_rios: [
    {
      name: 'Santiago Ríos Gómez',
      document_number: '10293847',
      document_type: 'CC',
      email: 'santiago.rios@correo.com',
      phone_number: '+57 310 987 6543',
    },
    {
      name: 'Camila Ríos Gómez',
      document_number: '10293848',
      document_type: 'TI',
      email: 'camila.rios@correo.com',
    },
  ],
  per_mariana_gomez: [
    {
      name: 'Andrés Gómez Restrepo',
      document_number: '98711223',
      document_type: 'CC',
      email: 'andres.gomez@correo.com',
      phone_number: '+57 315 223 3445',
    },
  ],
  per_felipe_torres: [
    {
      name: 'Diana Cárdenas',
      document_number: '55443322',
      document_type: 'CC',
      email: 'diana.cardenas@empresa.com',
    },
    {
      name: 'Lucas Torres Cárdenas',
      document_number: '11223344',
      document_type: 'TI',
    },
    {
      name: 'Sofía Torres Cárdenas',
      document_number: '11223355',
      document_type: 'TI',
    },
  ],
  per_camila_duque: [
    {
      name: 'Nicolás Morales',
      document_number: '77665544',
      document_type: 'CC',
      email: 'nicolas.morales@correo.com',
    },
  ],
  per_lucia_castro: [
    {
      name: 'Daniel Montoya',
      document_number: '88990011',
      document_type: 'CC',
      email: 'daniel.montoya@correo.com',
    },
  ],
}

interface ReservaDetalleModalProps {
  isOpen: boolean
  reservaId: string | null
  onClose: () => void
}

export function ReservaDetalleModal({
  isOpen,
  reservaId,
  onClose,
}: ReservaDetalleModalProps) {
  const [detail, setDetail] = useState<ReservaViewItem | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingGuests, setLoadingGuests] = useState(false)
  const [feedback, setFeedback] = useState<StatusCodeValidationResult | null>(null)
  const [personsDataMap, setPersonsDataMap] = useState<Record<string, PersonDetailData>>({})
  const [guestsBySlot, setGuestsBySlot] = useState<Record<number, PersonDetailData>>({})
  const [guestViewMode, setGuestViewMode] = useState<'stacked' | 'grid'>('stacked')
  const storeHuespedes = useHuespedesRegistradosStore((s) => s.huespedes)

  // 1. Efecto ModalPresentationStyle iOS: Contrae #root con scale(0.93) y rounded-[24px]
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

  // Sincronización en fase de render cuando se abre/cierra el modal o cambia la reserva seleccionada
  const [prevIsOpen, setPrevIsOpen] = useState<boolean>(isOpen)
  const [prevReservaId, setPrevReservaId] = useState<string | null>(reservaId)

  if (isOpen !== prevIsOpen || reservaId !== prevReservaId) {
    setPrevIsOpen(isOpen)
    setPrevReservaId(reservaId)
    if (!isOpen || !reservaId) {
      setDetail(null)
      setFeedback(null)
      setPersonsDataMap({})
      setGuestsBySlot({})
      setLoading(false)
      setLoadingGuests(false)
    } else {
      setLoading(true)
      setLoadingGuests(true)
    }
  }

  // 3. Cargar detalle de la reserva al abrir y consultar datos de cada huésped mediante balanceo y validación de status
  useEffect(() => {
    if (!isOpen || !reservaId) {
      return
    }

    let isMounted = true

    fetchReservaDetailFromApi(reservaId)
      .then(async (res) => {
        if (!isMounted) return
        setDetail(res.item)
        setFeedback(res.validation.message ? res.validation : null)

        if (!res.item) {
          if (isMounted) {
            setLoading(false)
            setLoadingGuests(false)
          }
          return
        }

        const totalGuests = Math.max(1, res.item.numberOfGuests || res.item.personIds?.length || 1)

        // 1. Recolectar la lista ordenada de IDs de personas para cada slot (titular + acompañantes)
        const slotPersonIds: (string | null)[] = []

        // Slot 0: Titular
        const titularId =
          (Array.isArray(res.item.personIds) && res.item.personIds.length > 0
            ? res.item.personIds[0]
            : null) ||
          res.item.personId ||
          null
        slotPersonIds.push(titularId)

        // Slots 1..totalGuests - 1: Acompañantes
        const storeCompanions = storeHuespedes.filter((h) => !h.isTitular)
        for (let i = 1; i < totalGuests; i++) {
          const idFromReservation = res.item.personIds?.[i]
          const idFromStore = storeCompanions[i - 1]?.id || storeHuespedes[i]?.id
          const idFromGuests = res.item.guests?.[i]?.id
          const resolvedId = idFromReservation || idFromStore || idFromGuests || null
          slotPersonIds.push(resolvedId)
        }

        // Si faltan IDs y hay más de 1 huésped, intentar obtener personas asociadas a la estadía
        if (slotPersonIds.some((id, idx) => idx > 0 && !id)) {
          try {
            const stayPersonsRes = await executeBalancedRequest(
              async () => {
                try {
                  return await api.get<PersonDetailData[]>(`/stays_person/${reservaId}`, {
                    validateStatus: () => true,
                  })
                } catch {
                  return await api.get<PersonDetailData[]>(`/stay_person/${reservaId}`, {
                    validateStatus: () => true,
                  })
                }
              },
              { maxRetries: 1 }
            )
            const spVal = validateStatusCode(stayPersonsRes?.status ?? 0)
            if (spVal.isValid && Array.isArray(stayPersonsRes?.data)) {
              stayPersonsRes.data.forEach((sp) => {
                if (sp.id && !slotPersonIds.includes(sp.id)) {
                  const emptyIdx = slotPersonIds.findIndex((id, idx) => idx > 0 && !id)
                  if (emptyIdx !== -1) {
                    slotPersonIds[emptyIdx] = sp.id
                  } else if (slotPersonIds.length < totalGuests) {
                    slotPersonIds.push(sp.id)
                  }
                }
              })
            }
          } catch {
            // Silencioso: fallback a datos en memoria o demo
          }
        }

        // 2. Consumir el endpoint /persons/${id} (con fallback a /person/${id}) por cada huésped
        // utilizando executeBalancedRequest y validateStatusCode
        const fetchedMap: Record<string, PersonDetailData> = {}
        const fetchedSlotMap: Record<number, PersonDetailData> = {}

        const fetchPromises = slotPersonIds.map(async (pid, slotIndex) => {
          if (!pid || pid.trim() === '') return

          try {
            const pRes = await executeBalancedRequest(
              async () => {
                try {
                  return await api.get<PersonDetailData | PersonDetailData[]>(
                    `/persons/${pid}`,
                    { validateStatus: () => true }
                  )
                } catch {
                  return await api.get<PersonDetailData | PersonDetailData[]>(
                    `/person/${pid}`,
                    { validateStatus: () => true }
                  )
                }
              },
              { maxRetries: 1 }
            )

            const validation = validateStatusCode(pRes?.status ?? 0)
            if (validation.isValid && pRes?.data) {
              const data = Array.isArray(pRes.data) ? pRes.data[0] : pRes.data
              if (data) {
                fetchedMap[pid] = data
                fetchedSlotMap[slotIndex] = data
              }
            }
          } catch {
            // Silencioso: fallback a storeHuespedes o DEMO_COMPANIONS_MAP
          }
        })

        await Promise.allSettled(fetchPromises)

        if (isMounted) {
          setPersonsDataMap(fetchedMap)
          setGuestsBySlot(fetchedSlotMap)
        }
      })
      .catch((err) => {
        const status = (err as { response?: { status?: number } })?.response?.status ?? 0
        const val = validateStatusCode(status)
        if (isMounted) {
          setFeedback(val)
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false)
          setLoadingGuests(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [isOpen, reservaId, storeHuespedes])

  // 4. Construcción de tarjetas individuales para cada uno de los huéspedes según numberOfGuests
  const guestCards: StackedGuestCardItem[] = useMemo(() => {
    if (!detail) return []
    const total = Math.max(1, detail.numberOfGuests || 1)
    const cards: StackedGuestCardItem[] = []

    // Huésped 1: Titular
    const titularData =
      guestsBySlot[0] ||
      (detail.personId ? personsDataMap[detail.personId] : null) ||
      (detail.personIds?.[0] ? personsDataMap[detail.personIds[0]] : null)

    const titularName = titularData?.name || detail.personDisplayName
    const titularDocType = titularData?.document_type || 'CC'
    const titularDoc = titularData?.document_number || undefined
    const titularEmail = titularData?.email
    const titularPhone = titularData?.phone_number

    cards.push({
      id: detail.personId || titularData?.id || 'titular',
      title: titularName,
      description: 'Huésped titular principal',
      bgClass: 'border-line/80 bg-panel/95 dark:bg-surface/70 text-ink',
      index: 1,
      isTitular: true,
      name: titularName,
      roomName: '',
      documentType: titularDocType,
      documentNumber: titularDoc,
      email: titularEmail,
      phoneNumber: titularPhone,
      statusLabel: 'Titular confirmado',
    })

    // Huéspedes 2..N: Acompañantes
    for (let i = 1; i < total; i++) {
      const slotCompanionData = guestsBySlot[i]
      const companionPersonId = detail.personIds?.[i]
      const companionData =
        slotCompanionData ||
        (companionPersonId ? personsDataMap[companionPersonId] : null)

      const storeCompanion =
        storeHuespedes.filter((h) => !h.isTitular)[i - 1] || storeHuespedes[i]
      const demoCompanion = DEMO_COMPANIONS_MAP[detail.personId]?.[i - 1]

      const companionName =
        companionData?.name ||
        storeCompanion?.name ||
        demoCompanion?.name ||
        detail.guests?.[i]?.name ||
        `Acompañante #${i}`

      const companionDoc =
        companionData?.document_number ||
        storeCompanion?.document_number ||
        demoCompanion?.document_number

      const companionDocType =
        companionData?.document_type ||
        storeCompanion?.document_type ||
        demoCompanion?.document_type ||
        'Doc'

      const companionEmail =
        companionData?.email ||
        storeCompanion?.email ||
        demoCompanion?.email

      const companionPhone =
        companionData?.phone_number ||
        storeCompanion?.phone_number ||
        demoCompanion?.phone_number

      cards.push({
        id: companionData?.id || storeCompanion?.id || `comp-${detail.id}-${i}`,
        title: companionName,
        description: `Acompañante #${i} asignado`,
        bgClass: 'border-line/80 bg-panel/95 dark:bg-surface/70 text-ink',
        index: i + 1,
        isTitular: false,
        name: companionName,
        roomName: '',
        documentType: companionDocType,
        documentNumber: companionDoc,
        email: companionEmail,
        phoneNumber: companionPhone,
        statusLabel: 'Acompañante registrado',
      })
    }

    return cards
  }, [detail, personsDataMap, guestsBySlot, storeHuespedes])

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="detalle-reserva-title"
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
        >
          {/* Fondo oscuro con desenfoque (Backdrop estilo iOS) */}
          <motion.div
            key="backdrop-reserva-detalle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            aria-hidden="true"
          />

          {/* Tarjeta Modal estilo iOS Card Sheet (desliza desde abajo con física Spring) */}
          <motion.div
            key="modal-reserva-detalle-content"
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
            {/* Tirador superior característico de iOS sheet */}
            <div className="flex justify-center mb-3 sm:hidden">
              <div className="h-1.5 w-12 rounded-full bg-line/80" />
            </div>

            {/* Encabezado del modal */}
            <div className="flex items-start justify-between border-b border-line/60 pb-4">
              <div>
                <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                  <FontAwesomeIcon icon={faCircleInfo} className="size-3" />
                  <span>Estadía confirmada</span>
                </p>
                <h2 id="detalle-reserva-title" className="mt-1 text-xl font-bold text-ink sm:text-2xl">
                  Detalle de la estadía
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar detalle"
                className="rounded-xl border border-line bg-surface/50 p-2 text-ink-muted hover:bg-surface hover:text-ink transition-colors"
              >
                <FontAwesomeIcon icon={faXmark} className="size-4" />
              </button>
            </div>

            {/* Componente Loading reutilizable mientras se consumen los endpoints de la reserva y huéspedes */}
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="py-12"
              >
                <Loading
                  visible={loading}
                  variant="block"
                  size="md"
                  label="Consultando detalle de la estadía…"
                  description="Obteniendo información de la reserva y cargando datos de los huéspedes con balanceo preventivo…"
                  delay={0}
                />
              </motion.div>
            )}

            {/* Contenido del detalle de la reserva con fade in según prompt-fade-in.md */}
            {!loading && detail && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="mt-5 space-y-4"
              >
                {/* Fechas de entrada y salida con total de noches */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="rounded-2xl border border-line/70 bg-canvas/40 p-4 space-y-2.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-ink-muted">
                      <FontAwesomeIcon icon={faCalendarDays} className="size-3 text-neutral" />
                      <span>Fecha de entrada</span>
                    </span>
                    <span className="font-semibold text-ink">{detail.checkInFormatted}</span>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-[11px] text-neutral/70">
                    <div className="h-px flex-1 bg-line/60" />
                    <span className="flex items-center gap-1 font-medium text-primary">
                      <FontAwesomeIcon icon={faArrowRight} className="size-2.5" />
                      <span>{detail.nights} {detail.nights === 1 ? 'noche' : 'noches'}</span>
                    </span>
                    <div className="h-px flex-1 bg-line/60" />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-ink-muted">
                      <FontAwesomeIcon icon={faCalendarDays} className="size-3 text-neutral" />
                      <span>Fecha de salida</span>
                    </span>
                    <span className="font-semibold text-ink">{detail.checkOutFormatted}</span>
                  </div>
                </motion.div>

                {/* Sección de Huéspedes: Cards por cada uno de los huéspedes según el número de huéspedes */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-line/60 pb-2">
                    <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink">
                      <FontAwesomeIcon icon={faUsers} className="size-3.5 text-primary" />
                      <span>Huéspedes de la estadía</span>
                    </span>
                    <div className="flex items-center gap-2">
                      {detail.numberOfGuests > 1 && !loadingGuests && (
                        <div className="flex items-center rounded-lg border border-line bg-surface/60 p-0.5 text-[10px]">
                          <button
                            type="button"
                            onClick={() => setGuestViewMode('stacked')}
                            className={cn(
                              'rounded-md px-2 py-0.5 font-medium transition-colors',
                              guestViewMode === 'stacked'
                                ? 'bg-primary text-white shadow-2xs'
                                : 'text-ink-muted hover:text-ink'
                            )}
                          >
                            Pila deslizable
                          </button>
                          <button
                            type="button"
                            onClick={() => setGuestViewMode('grid')}
                            className={cn(
                              'rounded-md px-2 py-0.5 font-medium transition-colors',
                              guestViewMode === 'grid'
                                ? 'bg-primary text-white shadow-2xs'
                                : 'text-ink-muted hover:text-ink'
                            )}
                          >
                            Cuadrícula
                          </button>
                        </div>
                      )}
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[11px] font-bold text-primary">
                        <span>{detail.numberOfGuests} {detail.numberOfGuests === 1 ? 'huésped' : 'huéspedes'}</span>
                      </span>
                    </div>
                  </div>

                  {loadingGuests ? (
                    <div className="rounded-2xl border border-line/60 bg-surface/30 p-6">
                      <Loading
                        visible={loadingGuests}
                        variant="block"
                        size="sm"
                        label="Cargando huéspedes de la estadía…"
                        description="Consultando /persons por cada huésped asignado mediante balanceo preventivo de carga…"
                        delay={0}
                      />
                    </div>
                  ) : guestViewMode === 'stacked' ? (
                    <ReservaHuespedesStackedCards cards={guestCards} />
                  ) : (
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      {guestCards.map((guest) => (
                        <ReservaHuespedCard
                          key={guest.id}
                          index={guest.index ?? 1}
                          totalGuests={detail.numberOfGuests}
                          isTitular={guest.isTitular ?? false}
                          name={guest.name ?? guest.title}
                          roomName={detail.roomDisplayName}
                          documentType={guest.documentType}
                          documentNumber={guest.documentNumber}
                          email={guest.email}
                          phoneNumber={guest.phoneNumber}
                          statusLabel={guest.statusLabel}
                        />
                      ))}
                    </div>
                  )}
                </motion.div>

                {/* Estado y Valor a pagar */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="flex flex-col gap-3 rounded-2xl border border-line/70 bg-surface/30 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <span className="block text-xs text-ink-muted mb-1">Estado de la reserva</span>
                    <ReservaStateBadge label={detail.stateLabel} tone={detail.stateTone} size="md" />
                  </div>

                  <div className="border-t border-line/60 pt-2 text-left sm:border-0 sm:pt-0 sm:text-right">
                    <span className="block text-[11px] uppercase tracking-wider font-semibold text-ink-muted">
                      Valor a pagar
                    </span>
                    <p className="flex items-center sm:justify-end gap-1 text-base sm:text-lg font-bold text-primary">
                      <FontAwesomeIcon icon={faDollarSign} className="size-3.5" />
                      <span>{detail.totalPriceFormatted.replace('$', '').trim()}</span>
                    </p>
                  </div>
                </motion.div>

                {/* Fecha de registro (created_at) limpia, sin created_by */}
                {detail.createdAt && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="flex items-center justify-between px-1 text-xs text-ink-muted"
                  >
                    <span className="flex items-center gap-1.5">
                      <FontAwesomeIcon icon={faClock} className="size-3 text-neutral" />
                      <span>Fecha de registro</span>
                    </span>
                    <span className="font-medium text-ink">
                      {new Date(detail.createdAt).toLocaleDateString('es-CO', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </motion.div>
                )}

                {/* Feedback empático si aplica */}
                {feedback && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300"
                  >
                    {feedback.message}
                  </motion.p>
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
                Cerrar detalle
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
