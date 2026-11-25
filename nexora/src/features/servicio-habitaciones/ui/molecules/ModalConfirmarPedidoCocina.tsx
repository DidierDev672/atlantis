import { Suspense, memo, useState, useEffect, useId, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCheck,
  faXmark,
  faHashtag,
  faClock,
  faCircleExclamation,
} from '@fortawesome/free-solid-svg-icons'
import { fadeUp } from '../../../../design-tokens/motion'
import { Input, Textarea } from '../../../../shared/ui'
import { Loading } from '../../../../shared/loading'
import { useDeviceResourceProfile } from '../../../../shared/lib/use-device-resource-profile'
import { api } from '../../../../lib/api'
import { validateStatusCode } from '../../../../shared/lib/status-code-validator'
import { executeBalancedRequest } from '../../../reservas/infrastructure/api-load-balancer'
import {
  RecursosDropdown,
  type DropdownOption,
} from '../../../recursos/ui/molecules/recursos-dropdown'
import { useCarritoStore } from '../../application/carrito-store'
import { lazyWithFallback } from '../../application/lazy-with-fallback'
import { readAuthTokenEmail } from '../../../../shared/auth-storage'
import { formatearMonedaCOP } from '../../domain/item-menu'
import {
  OPCIONES_CANAL,
  OPCIONES_METODO_PAGO,
  generarNumeroOrdenAleatorio,
} from '../../domain/confirmar-pedido-cocina.constants'
import { type RawStayApi } from './ModalSeleccionarRecepcion'
import { obtenerPersonsCatalogoShared } from '../../infrastructure/api-estadias-recepcion-repository'
import { MartilloJuezAnimado } from '../atoms/MartilloJuezAnimado'
import type { ServicioHabitacionRocketOverlayProps } from './ServicioHabitacionRocketOverlay'

const LazyServicioHabitacionRocketOverlay =
  lazyWithFallback<ServicioHabitacionRocketOverlayProps>(
    () =>
      import('./ServicioHabitacionRocketOverlay').then(
        (m) => m.ServicioHabitacionRocketOverlay
      ),
    'ServicioHabitacionRocketOverlay en ModalConfirmarPedidoCocina'
  )

/**
 * Extrae el email del creador desde localStorage bajo el JSON auth_token (campo Email o email)
 */
function obtenerCreatedBy(): string {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem('auth_token')
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as Record<string, unknown>
          if (typeof parsed?.Email === 'string' && parsed.Email.trim()) {
            return parsed.Email.trim()
          }
          if (typeof parsed?.email === 'string' && parsed.email.trim()) {
            return parsed.email.trim()
          }
        } catch {
          // No es JSON directo
        }
      }
    }
  } catch {
    // LocalStorage no disponible
  }

  const fallback = readAuthTokenEmail()
  return fallback && fallback.includes('@') ? fallback : 'ariasdev672@gmail.com'
}

export interface DatosOrdenCocina {
  numeroOrden: string
  recepcion: string
  canal: string
  metodoPago: string
  propina: number
  horarioEntrega: string
  instruccionesDelivery: string
  notasGenerales: string
}

function generarUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16)
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export interface ServiceRequestItemPayload {
  id: string
  order_id: string
  item_menu_id: string
  name_snapshot: string
  price_unit: number
  tax_rate: number
  amount: number
  note: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface ServiceRequestHistoryPayload {
  id: string
  order_id: string
  previous_state: string
  status_new: string
  actor_type: string
  actor_id: string
  comment: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface ServiceRequestPayload {
  id: string
  order_number: string
  stay_id: string
  person_id: string
  status: string
  channel: string
  general_notes: string
  delivery_instructions: string
  scheduled_for: string
  currency: string
  subtotal: number
  taxes: number
  total: number
  created_by: string
  items: ServiceRequestItemPayload[]
  history: ServiceRequestHistoryPayload[]
  created_at: string
  updated_at: string
}

export interface ModalConfirmarPedidoCocinaProps {
  isOpen: boolean
  onClose: () => void
  onConfirmar: (datos: DatosOrdenCocina) => void
  totalArticulos: number
  totalGeneral: number
  recepcionInicial?: string
}

/**
 * Contrato de habitación retornado por GET /room/{id}
 */
export interface RoomApi {
  id: string
  number: string
  floor: number
  room_types_id?: string
  building_id: string
  price_override?: number
  status: string
  has_reception?: boolean
  created_by?: string
  created_at?: string
  updated_at?: string
}

/**
 * Contrato de edificio retornado por GET /building/{id}
 */
export interface BuildingApi {
  id: string
  name: string
  floor_number?: number
  headquarters_id?: string
  sub_headquarters_id?: string
  status?: string
  created_by?: string
  created_at?: string
  updated_at?: string
}

/**
 * Contrato de persona / huésped retornado por GET /persons
 */
export interface PersonApi {
  id: string
  document_type: string
  document_number: string
  name: string
  phone_number: string
  email: string
  date_of_birth: string
  gender: string
  nationality: string
  roles: string[]
  created_by: string
}

/**
 * Genera la fecha y hora por defecto (momento actual + 35 minutos de elaboración y despacho)
 */
function calcularHorarioEntregaPorDefecto(): string {
  const d = new Date()
  d.setMinutes(d.getMinutes() + 35)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

export interface RecepcionMetadata {
  stay_id: string
  room_id: string
  person_id: string
}

export const ModalConfirmarPedidoCocina = memo(
  function ModalConfirmarPedidoCocina({
    isOpen,
    onClose,
    onConfirmar,
    totalArticulos,
    totalGeneral,
    recepcionInicial,
  }: ModalConfirmarPedidoCocinaProps) {
    const horarioEntregaId = useId()
    const {
      policy: { enableBackdropBlur },
    } = useDeviceResourceProfile()

  // Estados del Formulario
  const [numeroOrden, setNumeroOrden] = useState(generarNumeroOrdenAleatorio)
  const [opcionesHuespedes, setOpcionesHuespedes] = useState<ReadonlyArray<DropdownOption>>([])
  const [huespedIdMap, setHuespedIdMap] = useState<Map<string, string>>(() => new Map())
  const [loadingHuespedes, setLoadingHuespedes] = useState(false)
  const [errorHuespedes, setErrorHuespedes] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const [huespedSeleccionado, setHuespedSeleccionado] = useState('')
  const huespedActual =
    huespedSeleccionado.trim() ||
    opcionesHuespedes[0]?.value ||
    recepcionInicial?.trim() ||
    ''
  const [canal, setCanal] = useState(OPCIONES_CANAL[0].value)
  const [horarioEntrega, setHorarioEntrega] = useState(calcularHorarioEntregaPorDefecto)
  const [instruccionesDelivery, setInstruccionesDelivery] = useState('')
  const [notasGenerales, setNotasGenerales] = useState('')

  /**
   * Carga la lista de huéspedes reutilizando la caché compartida del catálogo /persons
   * para evitar peticiones duplicadas cuando ya se consultó en otras vistas.
   */
  const cargarOpcionesHuespedes = useCallback(async () => {
    setLoadingHuespedes(true)
    setErrorHuespedes(null)

    try {
      const dataArr = await obtenerPersonsCatalogoShared()
      const opcionesMap = new Map<string, DropdownOption>()
      const idMap = new Map<string, string>()

      for (const person of dataArr) {
        const nombre = person?.name?.trim()
        if (!nombre) continue
        const docNumero = person?.document_number?.trim() || ''

        if (!opcionesMap.has(nombre)) {
          opcionesMap.set(nombre, {
            id: person.id,
            value: nombre,
            label: nombre,
            rawName: docNumero ? `${nombre} ${docNumero}` : nombre,
          })
          if (person.id) {
            idMap.set(nombre, person.id)
          }
        }
      }

      setHuespedIdMap(idMap)
      setOpcionesHuespedes(Array.from(opcionesMap.values()))
    } catch {
      const errorValidation = validateStatusCode(500)
      setOpcionesHuespedes([])
      setErrorHuespedes(
        errorValidation.message || 'Error de conexión al cargar los huéspedes.'
      )
    } finally {
      setLoadingHuespedes(false)
    }
  }, [])

  // Cargar huéspedes al abrir el modal
  useEffect(() => {
    if (!isOpen) return
    let active = true
    const run = async () => {
      await Promise.resolve()
      if (active) {
        await cargarOpcionesHuespedes()
      }
    }
    void run()
    return () => {
      active = false
    }
  }, [isOpen, cargarOpcionesHuespedes])

  // Cierre con la tecla Escape (bloqueado durante el envío para proteger la animación Rocket)
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isSubmitting, onClose])

  if (!isOpen) return null

  const handleNumeroOrdenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Permite únicamente números y restringe a un máximo de 2 dígitos
    const soloDigitos = e.target.value.replace(/\D/g, '').slice(0, 2)
    setNumeroOrden(soloDigitos)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return
    setSubmitError(null)
    setIsSubmitting(true)

    const ordenFinal = numeroOrden.trim()
      ? numeroOrden.trim().padStart(2, '0').slice(-2)
      : generarNumeroOrdenAleatorio()

    const recepcionFinal = huespedActual
    const personIdFinal =
      huespedIdMap.get(huespedActual) || 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'

    try {
      // Resolver stay_id en segundo plano consultando GET /stays balanceado
      let stayIdFinal = 'c7a8b9d0-1234-5678-90ab-cdef12345678'
      try {
        const staysRes = await executeBalancedRequest(() =>
          api.get<RawStayApi[] | { data?: RawStayApi[] }>('/stays', {
            validateStatus: () => true,
          })
        )
        const staysValidation = validateStatusCode(staysRes.status)
        if (staysValidation.isValid) {
          const raw = staysRes.data
          const staysArr = Array.isArray(raw)
            ? raw
            : raw && typeof raw === 'object' && 'data' in raw && Array.isArray(raw.data)
              ? raw.data
              : []
          const matchedStay =
            staysArr.find(
              (s) => Array.isArray(s.person_ids) && s.person_ids.includes(personIdFinal)
            ) || staysArr[0]
          if (matchedStay?.id) {
            stayIdFinal = matchedStay.id
          }
        }
      } catch {
        // Respaldo si /stays no responde
      }

      // Identificadores y marcas temporales ISO 8601 para la orden, ítems e historial
      const orderId = generarUuid()
      const nowIso = new Date().toISOString()
      const parsedScheduled = horarioEntrega ? new Date(horarioEntrega) : null
      const scheduledForIso =
        parsedScheduled && !Number.isNaN(parsedScheduled.getTime())
          ? parsedScheduled.toISOString()
          : nowIso

      // Creador obtenido desde localStorage (auth_token -> Email)
      const createdBy = obtenerCreatedBy()

      // Ítems obtenidos desde la store de Zustand del carrito adaptados al contrato del endpoint
      const cartItems = useCarritoStore.getState().items
      const itemsPayload: ServiceRequestItemPayload[] = cartItems.map((ci) => ({
        id: generarUuid(),
        order_id: orderId,
        item_menu_id: ci.producto.id ?? '',
        name_snapshot: ci.producto.name,
        price_unit: Number(ci.producto.price) || 0,
        tax_rate: Number(ci.producto.tax_percentage ?? 0) || 0,
        amount: Number(ci.cantidad) || 1,
        note: ci.notas?.trim() || '',
        created_by: createdBy,
        created_at: nowIso,
        updated_at: nowIso,
      }))

      // Cálculo de subtotal, impuestos y total exacto
      const subtotalBruto = itemsPayload.reduce(
        (acc, item) => acc + item.price_unit * item.amount,
        0
      )
      const taxesBruto = itemsPayload.reduce(
        (acc, item) => acc + item.price_unit * item.amount * (item.tax_rate / 100),
        0
      )
      const subtotal = Number(subtotalBruto.toFixed(2))
      const taxes = Number(taxesBruto.toFixed(2))
      const total = Number((subtotal + taxes).toFixed(2))

      // Historial inicial de creación de la orden
      const historyPayload: ServiceRequestHistoryPayload[] = [
        {
          id: generarUuid(),
          order_id: orderId,
          previous_state: '',
          status_new: 'pending',
          actor_type: 'guest',
          actor_id: personIdFinal,
          comment: 'Order created',
          created_by: createdBy,
          created_at: nowIso,
          updated_at: nowIso,
        },
      ]

      const metodoPagoDefault = OPCIONES_METODO_PAGO[0].value

      // Construcción en segundo plano del payload exacto para POST /service-request
      const payload: ServiceRequestPayload = {
        id: orderId,
        order_number: ordenFinal,
        stay_id: stayIdFinal,
        person_id: personIdFinal,
        status: 'pending',
        channel: canal,
        general_notes: notasGenerales.trim(),
        delivery_instructions: instruccionesDelivery.trim(),
        scheduled_for: scheduledForIso,
        currency: 'COP',
        subtotal,
        taxes,
        total,
        created_by: createdBy,
        items: itemsPayload,
        history: historyPayload,
        created_at: nowIso,
        updated_at: nowIso,
      }

      // Garantizamos una duración mínima de 1.8s para que la animación Rocket sea visible durante el POST
      const [response] = await Promise.all([
        executeBalancedRequest(() =>
          api.post('/service-request', payload, {
            validateStatus: () => true,
          })
        ),
        new Promise((resolve) => setTimeout(resolve, 1800)),
      ])

      const validation = validateStatusCode(response.status)

      if (validation.isValid) {
        onConfirmar({
          numeroOrden: ordenFinal,
          recepcion: recepcionFinal,
          canal,
          metodoPago: metodoPagoDefault,
          propina: 0,
          horarioEntrega,
          instruccionesDelivery: instruccionesDelivery.trim(),
          notasGenerales: notasGenerales.trim(),
        })
      } else {
        setSubmitError(
          validation.message ||
            `No fue posible transmitir la comanda a cocina (Código ${response.status}). Por favor, verifica e intenta de nuevo.`
        )
      }
    } catch (err) {
      console.error('Error al enviar la comanda a /service-request:', err)
      const errorValidation = validateStatusCode(500)
      setSubmitError(
        errorValidation.message ||
          'No se pudo conectar con el servidor de cocina. Por favor verifica la red y vuelve a intentar.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {isSubmitting && (
        <Suspense fallback={null}>
          <LazyServicioHabitacionRocketOverlay
            visible={isSubmitting}
            zIndexClass="z-60"
            title="Enviando Pedido"
            description="Confirmando y enviando tu pedido a cocina, por favor espera un momento…"
          />
        </Suspense>
      )}

      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop adaptado al perfil de GPU */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (!isSubmitting) onClose()
            }}
            className={`fixed inset-0 bg-ink/60 transition-opacity ${
              enableBackdropBlur ? 'backdrop-blur-xs' : ''
            }`}
            aria-hidden="true"
          />

        {/* Contenedor del Modal */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-line bg-panel shadow-2xl z-10 my-8 max-h-[92vh] flex flex-col"
        >
          {/* Cabecera del Modal */}
          <div className="relative border-b border-line bg-canvas/60 px-6 py-5 sm:px-8 sm:py-6 shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                  <span>Solicitud de Pedido</span>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <MartilloJuezAnimado />
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-ink">
                    Confirmar y Enviar Pedido
                  </h3>
                </div>
                <p className="mt-1 text-xs sm:text-sm text-ink-muted">
                  Completa los datos para registrar los {totalArticulos} artículos del pedido.
                </p>
              </div>

              {/* Botón Cerrar */}
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="grid size-9 place-items-center rounded-full bg-canvas text-ink-muted hover:text-ink hover:bg-line/40 transition-colors border border-line/60 shadow-2xs cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Cerrar ventana"
              >
                <FontAwesomeIcon icon={faXmark} className="size-4" />
              </button>
            </div>

            {/* Resumen rápido de totales */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-2.5 text-xs">
              <span className="font-sans font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                Total a Facturar: {formatearMonedaCOP(totalGeneral)}
              </span>
            </div>
          </div>

          {/* Formulario con Scroll */}
          <form onSubmit={handleSubmit} className="overflow-y-auto p-6 sm:p-8 space-y-5">
            {submitError && (
              <div
                role="alert"
                className="rounded-2xl border border-danger/30 bg-danger/10 p-4 text-xs text-danger flex items-start justify-between gap-3 animate-fade-in"
              >
                <div className="flex items-start gap-2.5">
                  <FontAwesomeIcon icon={faCircleExclamation} className="size-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Aviso en el envío</p>
                    <p className="mt-0.5 text-danger/90">{submitError}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSubmitError(null)}
                  className="text-danger/70 hover:text-danger p-1 rounded-lg transition-colors cursor-pointer"
                  title="Descartar aviso"
                >
                  <FontAwesomeIcon icon={faXmark} className="size-3.5" />
                </button>
              </div>
            )}

            {/* 1. Número de Orden y Horario de Entrega en 2 columnas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Campo: Número de Orden (restringido a 2 dígitos) */}
              <Input
                label="Número de orden"
                value={numeroOrden}
                onChange={handleNumeroOrdenChange}
                placeholder="17"
                maxLength={2}
                inputMode="numeric"
                pattern="[0-9]{2}"
                icon={<FontAwesomeIcon icon={faHashtag} className="size-3.5" />}
                required
                hint="Código numérico de 2 dígitos."
              />

              {/* Campo: Horario de Entrega (Datetime) */}
              <div className="w-full">
                <label
                  htmlFor={horarioEntregaId}
                  className="mb-1.5 block text-sm font-medium text-ink"
                >
                  Horario de entrega <span className="text-danger ml-0.5">*</span>
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-ink-soft">
                    <FontAwesomeIcon icon={faClock} className="size-3.5" />
                  </span>
                  <input
                    id={horarioEntregaId}
                    type="datetime-local"
                    value={horarioEntrega}
                    onChange={(e) => setHorarioEntrega(e.target.value)}
                    required
                    className="w-full rounded-xl border border-line bg-panel pl-10 pr-4 py-2.5 text-sm text-ink shadow-xs outline-none transition-colors hover:border-ink-soft focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <p className="mt-1.5 text-xs text-ink-soft">
                  Fecha y hora programada de entrega.
                </p>
              </div>
            </div>

            {/* 2. Huéspedes -> RecursosDropdown */}
            <div className="w-full">
              <RecursosDropdown
                label="Huéspedes"
                value={huespedActual}
                onChange={(val) => setHuespedSeleccionado(val)}
                options={opcionesHuespedes}
                searchable
                searchPlaceholder="Buscar por nombre o documento…"
                isLoading={loadingHuespedes}
                placeholder={
                  loadingHuespedes
                    ? 'Cargando huéspedes…'
                    : 'Selecciona un huésped…'
                }
                error={errorHuespedes ?? undefined}
                required
              />
              {loadingHuespedes && (
                <div className="mt-2">
                  <Loading
                    variant="inline"
                    size="sm"
                    label="Cargando huéspedes…"
                    delay={0}
                    visible={loadingHuespedes}
                  />
                </div>
              )}
              <p className="mt-1.5 text-xs text-ink-soft">
                Huésped que solicita el pedido.
              </p>
            </div>

            {/* 3. Canal de Pedido -> RecursosDropdown */}
            <div className="w-full">
              <RecursosDropdown
                label="Canal de pedido"
                value={canal}
                onChange={(val) => setCanal(val)}
                options={OPCIONES_CANAL}
                placeholder="Selecciona el canal…"
                required
              />
              <p className="mt-1.5 text-xs text-ink-soft">
                Medio de solicitud.
              </p>
            </div>

            {/* 4. Instrucciones para el delivery */}
            <Textarea
              label="Instrucciones para el delivery"
              value={instruccionesDelivery}
              onChange={(e) => setInstruccionesDelivery(e.target.value)}
              placeholder="Ej: Llamar antes de entregar."
              rows={2}
              resize="none"
              maxLength={200}
              showCount
            />

            {/* 5. Notas generales */}
            <Textarea
              label="Notas generales"
              value={notasGenerales}
              onChange={(e) => setNotasGenerales(e.target.value)}
              placeholder="Ej: Cubiertos adicionales o indicaciones."
              rows={2}
              resize="none"
              hint="Observaciones adicionales del pedido."
              maxLength={300}
              showCount
            />

            {/* Barra de botones de acción */}
            <div className="pt-4 border-t border-line flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="w-full sm:w-auto rounded-xl border border-line bg-panel px-5 py-2.5 text-xs font-bold text-ink hover:bg-canvas transition-colors cursor-pointer shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-primary/90 transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FontAwesomeIcon icon={faCheck} className="size-3.5" />
                <span>{isSubmitting ? 'Enviando...' : 'Confirmar y Enviar Pedido'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
      </AnimatePresence>
    </>
  )
})
