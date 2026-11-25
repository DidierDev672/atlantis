import { Suspense, lazy, memo, useCallback, useEffect, useMemo, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBed,
  faCashRegister,
  faCircleCheck,
  faMoon,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'
import { StatusCodeAlert } from '../../../../shared/lib/status-code-validator'
import { useBalancedPostLoading } from '../../../../shared/loading'
import { Drawer } from '../../../../shared/ui/Drawer'
import {
  computeCobroTotals,
  computeStayDurationInfo,
  formatDepositAppliedPhrase,
  formatRoomStatusBadge,
  formatShortStayDate,
  type CobroPaymentMethod,
  type CobroPaymentSubmissionResult,
  type CobroRoomDetails,
} from '../../domain/salida-cobro'
import type { SalidaHuespedItem } from '../../domain/salida-huesped'
import {
  fetchCobroRoomDetails,
  submitCobroSalidaPago,
} from '../../infrastructure/salida-cobro-api'
import { CobroChargesSection } from '../molecules/cobro-charges-section'
import { CobroPaymentForm } from '../molecules/cobro-payment-form'

const LazyCobroRocketOverlay = lazy(
  () => import('../molecules/cobro-rocket-overlay')
)

export interface CobroSalidaDrawerProps {
  guest: SalidaHuespedItem
  isOpen: boolean
  onClose: () => void
  onPaymentRegistered?: (result: CobroPaymentSubmissionResult) => void
}

/**
 * Organismo perezoso: Drawer de cobro de salida para el recepcionista.
 * Consulta llaves en `GET /stay/reception/{room_id}`, muestra `Rocket.tsx`
 * mientras construye el folio y transmite el registro a `POST /folios`.
 */
export const CobroSalidaDrawer = memo(function CobroSalidaDrawer({
  guest,
  isOpen,
  onClose,
  onPaymentRegistered,
}: CobroSalidaDrawerProps) {
  const defaultStatus = formatRoomStatusBadge('occupied')
  const [roomDetails, setRoomDetails] = useState<CobroRoomDetails>({
    roomId: guest.primaryRoomId || '',
    roomNumber: guest.primaryRoomId ? '…' : 'Por asignar',
    roomStatusRaw: 'occupied',
    roomStatusLabel: defaultStatus.label,
    roomStatusToneClass: defaultStatus.toneClass,
    nightlyRate: 0,
  })
  const [selectedMethod, setSelectedMethod] =
    useState<CobroPaymentMethod>('tarjeta')
  const [customAmount, setCustomAmount] = useState<string | null>(null)
  const [amountError, setAmountError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitResult, setSubmitResult] =
    useState<CobroPaymentSubmissionResult | null>(null)

  const { isBalancedVisible, stage } = useBalancedPostLoading({
    active: submitting,
    preparingDuration: 650,
    transmittingMinDuration: 600,
    confirmingDuration: 450,
  })

  useEffect(() => {
    let cancelled = false
    async function loadRoom() {
      try {
        const resolved = await fetchCobroRoomDetails(guest.primaryRoomId)
        if (!cancelled) setRoomDetails(resolved)
      } catch (err) {
        console.warn('[CobroSalidaDrawer] Error cargando habitación:', err)
      }
    }
    void loadRoom()
    return () => {
      cancelled = true
    }
  }, [guest.primaryRoomId])

  const durationInfo = useMemo(
    () => computeStayDurationInfo(guest.checkInDateRaw, guest.checkOutDateRaw),
    [guest.checkInDateRaw, guest.checkOutDateRaw]
  )

  const totals = useMemo(
    () =>
      computeCobroTotals(
        guest,
        durationInfo.nights,
        roomDetails.nightlyRate
      ),
    [durationInfo.nights, guest, roomDetails.nightlyRate]
  )

  const amountValue =
    customAmount !== null
      ? customAmount
      : totals.totalToPay > 0
        ? String(Math.round(totals.totalToPay))
        : ''

  const handleAmountChange = useCallback((digitsOnly: string) => {
    setCustomAmount(digitsOnly)
    setAmountError(null)
    setSubmitResult(null)
  }, [])

  const handleUseFullAmount = useCallback(() => {
    setCustomAmount(
      totals.totalToPay > 0 ? String(Math.round(totals.totalToPay)) : '0'
    )
    setAmountError(null)
    setSubmitResult(null)
  }, [totals.totalToPay])

  const handleRegisterPayment = useCallback(async () => {
    try {
      const parsed = Number(amountValue || '0')
      if (!amountValue || Number.isNaN(parsed) || parsed <= 0) {
        setAmountError(
          'Ingresa un monto numérico mayor a 0 para registrar el pago.'
        )
        return
      }
      setAmountError(null)
      setSubmitResult(null)
      setSubmitting(true)
      const res = await submitCobroSalidaPago({
        guest,
        roomId: roomDetails.roomId,
        roomNumber: roomDetails.roomNumber,
        accommodationAmount: totals.accommodationAmount,
        roomServiceAmount: totals.roomServiceAmount,
        paidAmount: parsed,
        method: selectedMethod,
      })
      setSubmitResult(res)
      if (res.ok) {
        onPaymentRegistered?.(res)
      }
    } catch (err) {
      console.error('[CobroSalidaDrawer] Error al registrar pago:', err)
      setAmountError(
        'No fue posible procesar el cobro. Verifica el monto e inténtalo de nuevo.'
      )
    } finally {
      setSubmitting(false)
    }
  }, [
    amountValue,
    guest,
    onPaymentRegistered,
    roomDetails.roomId,
    roomDetails.roomNumber,
    selectedMethod,
    totals.accommodationAmount,
    totals.roomServiceAmount,
  ])

  const checkInShort = formatShortStayDate(guest.checkInDateRaw)
  const checkOutShort = formatShortStayDate(guest.checkOutDateRaw)
  const depositPhrase = formatDepositAppliedPhrase(guest.depositPaymentMethod)

  return (
    <>
      {(submitting || isBalancedVisible) && (
        <Suspense fallback={null}>
          <LazyCobroRocketOverlay
            visible={submitting || isBalancedVisible}
            stage={stage}
          />
        </Suspense>
      )}

      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        position="right"
        size="lg"
        icon={faBed}
        title={`Habitación ${roomDetails.roomNumber}`}
        headerActions={
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${roomDetails.roomStatusToneClass}`}
          >
            {roomDetails.roomStatusLabel}
          </span>
        }
        description={
          <span className="inline-flex min-w-0 items-center gap-2">
            <span className="border-primary/25 bg-primary/10 text-primary inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold">
              <FontAwesomeIcon
                icon={faMoon}
                className="size-2.5"
                aria-hidden="true"
              />
              <span>{durationInfo.label}</span>
            </span>
            <span className="truncate">
              {guest.name} · {checkInShort} → {checkOutShort}
            </span>
          </span>
        }
        footer={
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting || isBalancedVisible}
              className="border-line bg-panel text-ink hover:bg-canvas inline-flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition disabled:opacity-60"
            >
              <FontAwesomeIcon
                icon={faXmark}
                className="size-3.5"
                aria-hidden="true"
              />
              <span>Cerrar</span>
            </button>

            <button
              type="button"
              onClick={() => void handleRegisterPayment()}
              disabled={submitting || isBalancedVisible}
              className="bg-primary inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
            >
              <FontAwesomeIcon
                icon={submitResult?.ok ? faCircleCheck : faCashRegister}
                className="size-3.5"
                aria-hidden="true"
              />
              <span>
                {submitting || isBalancedVisible
                  ? 'Registrando pago…'
                  : 'Registrar pago'}
              </span>
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <CobroChargesSection
            durationLabel={durationInfo.label}
            accommodationAmount={totals.accommodationAmount}
            deliveredOrdersCount={totals.deliveredOrdersCount}
            roomServiceAmount={totals.roomServiceAmount}
            depositAppliedPhrase={depositPhrase}
            securityDeposit={totals.securityDeposit}
            totalToPay={totals.totalToPay}
          />

          <CobroPaymentForm
            selectedMethod={selectedMethod}
            amountValue={amountValue}
            totalToPay={totals.totalToPay}
            submitting={submitting || isBalancedVisible}
            amountError={amountError}
            onSelectMethod={setSelectedMethod}
            onAmountChange={handleAmountChange}
            onUseFullAmount={handleUseFullAmount}
          />

          {submitResult && !submitResult.ok && submitResult.validation && (
            <StatusCodeAlert validation={submitResult.validation} dismissible />
          )}

          {submitResult && (
            <div
              role="status"
              className={`flex items-start gap-2.5 rounded-xl border p-3.5 text-xs ${
                submitResult.ok
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
                  : 'border-danger/30 bg-danger/10 text-danger'
              }`}
            >
              <FontAwesomeIcon
                icon={faCircleCheck}
                className="mt-0.5 size-4 shrink-0"
                aria-hidden="true"
              />
              <div className="space-y-0.5">
                <p className="font-bold">
                  {submitResult.ok
                    ? `Folio registrado · ${submitResult.receiptCode}`
                    : 'No fue posible completar el cobro'}
                </p>
                <p>{submitResult.message}</p>
              </div>
            </div>
          )}
        </div>
      </Drawer>
    </>
  )
})

export default CobroSalidaDrawer
