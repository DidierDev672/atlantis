import { useCallback, useEffect, useRef, useState } from 'react'
import type { PlanetAlertProps } from '../../../shared/alert'
import { sleep } from '../../reservas/infrastructure/api-load-balancer'
import type { CobroPaymentMethod } from '../domain/salida-cobro'
import type { SalidaHuespedItem } from '../domain/salida-huesped'
import { submitStayCheckout } from '../infrastructure/stay-checkout-api'

export interface CuentaCheckoutDetails {
  paymentMethod: CobroPaymentMethod
  keysReturned: boolean
  hasDamages: boolean
  observations: string
}

interface CheckoutFormState extends CuentaCheckoutDetails {
  guestKey: string
}

interface CheckoutAlertState {
  guestKey: string
  id: number
  ok: boolean
  details: CuentaCheckoutDetails
  alertProps: PlanetAlertProps
}

const DEFAULT_CHECKOUT_DETAILS: CuentaCheckoutDetails = {
  paymentMethod: 'tarjeta',
  keysReturned: false,
  hasDamages: false,
  observations: '',
}

const ALERT_VISIBLE_MS = 3000

/**
 * Hook de aplicación para el flujo de check-out de `CuentaHuespedDrawer`:
 * gestiona estado por huésped, overlay `Rocket`, envío a `/stay/{stay_id}/checkout`
 * y alerta `PlanetAlert` visible durante 3 segundos.
 */
export function useCuentaHuespedCheckout(params: {
  guest: SalidaHuespedItem | null
  enableAnimations: boolean
  onPay?: (guest: SalidaHuespedItem, details?: CuentaCheckoutDetails) => void
}) {
  const { guest, enableAnimations, onPay } = params
  const isMountedRef = useRef(true)
  const [isPaying, setIsPaying] = useState(false)
  const [checkoutAlert, setCheckoutAlert] = useState<CheckoutAlertState | null>(
    null
  )
  const [checkoutState, setCheckoutState] = useState<CheckoutFormState>({
    guestKey: '',
    ...DEFAULT_CHECKOUT_DETAILS,
  })

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!checkoutAlert) return
    const timer = window.setTimeout(() => {
      setCheckoutAlert(null)
      if (
        checkoutAlert.ok &&
        guest &&
        checkoutAlert.guestKey === guest.internalKey
      ) {
        onPay?.(guest, checkoutAlert.details)
      }
    }, ALERT_VISIBLE_MS)

    return () => {
      window.clearTimeout(timer)
    }
  }, [checkoutAlert, guest, onPay])

  const currentGuestKey = guest?.internalKey ?? ''
  const activeCheckout: CuentaCheckoutDetails =
    checkoutState.guestKey === currentGuestKey
      ? checkoutState
      : DEFAULT_CHECKOUT_DETAILS
  const activeAlert =
    checkoutAlert && checkoutAlert.guestKey === currentGuestKey
      ? checkoutAlert
      : null

  const updateCheckoutField = useCallback(
    <K extends keyof CuentaCheckoutDetails>(
      field: K,
      value: CuentaCheckoutDetails[K]
    ) => {
      setCheckoutState((prev) => {
        const base =
          prev.guestKey === currentGuestKey
            ? prev
            : { guestKey: currentGuestKey, ...DEFAULT_CHECKOUT_DETAILS }
        return {
          ...base,
          guestKey: currentGuestKey,
          [field]: value,
        }
      })
    },
    [currentGuestKey]
  )

  const handleSelectPaymentMethod = useCallback(
    (method: CobroPaymentMethod) =>
      updateCheckoutField('paymentMethod', method),
    [updateCheckoutField]
  )

  const handleToggleKeysReturned = useCallback(
    (checked: boolean) => updateCheckoutField('keysReturned', checked),
    [updateCheckoutField]
  )

  const handleToggleHasDamages = useCallback(
    (checked: boolean) => updateCheckoutField('hasDamages', checked),
    [updateCheckoutField]
  )

  const handleObservationsChange = useCallback(
    (value: string) => updateCheckoutField('observations', value),
    [updateCheckoutField]
  )

  const resetCheckoutState = useCallback(() => {
    setCheckoutAlert(null)
    setCheckoutState({ guestKey: '', ...DEFAULT_CHECKOUT_DETAILS })
  }, [])

  const handleDismissAlert = useCallback(() => {
    const current = activeAlert
    setCheckoutAlert(null)
    if (current?.ok && guest) {
      onPay?.(guest, current.details)
    }
  }, [activeAlert, guest, onPay])

  const handlePayClick = useCallback(async () => {
    if (!guest || isPaying) return

    const detailsSnapshot: CuentaCheckoutDetails = {
      paymentMethod: activeCheckout.paymentMethod,
      keysReturned: activeCheckout.keysReturned,
      hasDamages: activeCheckout.hasDamages,
      observations: activeCheckout.observations.trim(),
    }
    const grandTotal =
      guest.serviceRequestsTotal + guest.reservesTotal + guest.receptionsTotal

    setCheckoutAlert(null)
    setIsPaying(true)

    try {
      const [result] = await Promise.all([
        submitStayCheckout({
          guest,
          amount: grandTotal,
          paymentMethod: detailsSnapshot.paymentMethod,
          keysReturned: detailsSnapshot.keysReturned,
          hasDamages: detailsSnapshot.hasDamages,
          comments: detailsSnapshot.observations,
        }),
        enableAnimations ? sleep(1200) : Promise.resolve(),
      ])

      if (!isMountedRef.current) return
      setCheckoutAlert({
        guestKey: guest.internalKey,
        id: Date.now(),
        ok: result.ok,
        details: detailsSnapshot,
        alertProps: result.alertProps,
      })
    } finally {
      if (isMountedRef.current) {
        setIsPaying(false)
      }
    }
  }, [activeCheckout, enableAnimations, guest, isPaying])

  return {
    isPaying,
    activeCheckout,
    activeAlert,
    handleSelectPaymentMethod,
    handleToggleKeysReturned,
    handleToggleHasDamages,
    handleObservationsChange,
    resetCheckoutState,
    handleDismissAlert,
    handlePayClick,
  }
}
