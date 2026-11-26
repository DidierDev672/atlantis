import {
  Suspense,
  lazy,
  memo,
  useCallback,
  useState,
  type ComponentType,
} from 'react'
import { MotionConfig } from 'motion/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPhone } from '@fortawesome/free-solid-svg-icons'
import type { PlanetAlertProps } from '../../../../shared/alert'
import { useDeviceResourceProfile } from '../../../../shared/lib/use-device-resource-profile'
import { Drawer } from '../../../../shared/ui/Drawer'
import {
  useCuentaHuespedCheckout,
  type CuentaCheckoutDetails,
} from '../../application/use-cuenta-huesped-checkout'
import { type SalidaHuespedItem } from '../../domain/salida-huesped'
import { PrintingReceiptIcon } from '../atoms/printing-receipt-icon'
import { CuentaCargoEstadiaSection } from '../molecules/cuenta-cargo-estadia-section'
import type { CuentaCheckoutRocketOverlayProps } from '../molecules/cuenta-checkout-rocket-overlay'
import { CuentaHuespedEstadiaMeta } from '../molecules/cuenta-huesped-estadia-meta'
import type { CuentaHuespedesAccordionProps } from '../molecules/cuenta-huespedes-accordion'
import type { CuentaPagoDepositosSectionProps } from '../molecules/cuenta-pago-depositos-section'
import type { CuentaHabitacionChecklistSectionProps } from '../molecules/cuenta-habitacion-checklist-section'
import { CuentaResumenFooter } from '../molecules/cuenta-resumen-footer'

function lazyNamed<P>(
  loader: () => Promise<ComponentType<P>>,
  label: string
) {
  return lazy<ComponentType<P>>(async () => {
    try {
      const Component = await loader()
      return { default: Component }
    } catch (error) {
      console.error(`Error cargando ${label}:`, error)
      const Fallback: ComponentType<P> = () => null
      return { default: Fallback }
    }
  })
}

const LazyCuentaHuespedesAccordion = lazyNamed<CuentaHuespedesAccordionProps>(
  async () =>
    (await import('../molecules/cuenta-huespedes-accordion'))
      .CuentaHuespedesAccordion,
  'CuentaHuespedesAccordion'
)

const LazyCuentaPagoDepositosSection =
  lazyNamed<CuentaPagoDepositosSectionProps>(
    async () =>
      (await import('../molecules/cuenta-pago-depositos-section'))
        .CuentaPagoDepositosSection,
    'CuentaPagoDepositosSection'
  )

const LazyCuentaHabitacionChecklistSection =
  lazyNamed<CuentaHabitacionChecklistSectionProps>(
    async () =>
      (await import('../molecules/cuenta-habitacion-checklist-section'))
        .CuentaHabitacionChecklistSection,
    'CuentaHabitacionChecklistSection'
  )

const LazyCuentaCheckoutRocketOverlay =
  lazyNamed<CuentaCheckoutRocketOverlayProps>(
    async () =>
      (await import('../molecules/cuenta-checkout-rocket-overlay'))
        .CuentaCheckoutRocketOverlay,
    'CuentaCheckoutRocketOverlay'
  )

const LazyPlanetAlert = lazyNamed<PlanetAlertProps>(
  async () =>
    (await import('../../../../shared/alert/organisms/PlanetAlert'))
      .PlanetAlert,
  'PlanetAlert'
)

export type { CuentaCheckoutDetails }

export interface CuentaHuespedDrawerProps {
  guest: SalidaHuespedItem | null
  isOpen: boolean
  onClose: () => void
  onPay?: (guest: SalidaHuespedItem, details?: CuentaCheckoutDetails) => void
}

export const CuentaHuespedDrawer = memo(function CuentaHuespedDrawer({
  guest,
  isOpen,
  onClose,
  onPay,
}: CuentaHuespedDrawerProps) {
  const { policy } = useDeviceResourceProfile()
  const [isHeaderReceiptHover, setIsHeaderReceiptHover] = useState(false)

  const {
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
  } = useCuentaHuespedCheckout({
    guest,
    enableAnimations: policy.enableAnimations,
    onPay,
  })

  const handleClose = useCallback(() => {
    if (isPaying) return
    resetCheckoutState()
    onClose()
  }, [isPaying, onClose, resetCheckoutState])

  if (!guest) return null

  const grandTotal =
    guest.serviceRequestsTotal + guest.reservesTotal + guest.receptionsTotal

  return (
    <MotionConfig reducedMotion={policy.enableAnimations ? 'user' : 'always'}>
      {isPaying && (
        <Suspense fallback={null}>
          <LazyCuentaCheckoutRocketOverlay
            visible={isPaying}
            guestName={guest.name}
          />
        </Suspense>
      )}

      {activeAlert && (
        <div className="fixed top-5 right-5 z-70 w-[calc(100vw-2rem)] max-w-md">
          <Suspense fallback={null}>
            <LazyPlanetAlert
              key={activeAlert.id}
              {...activeAlert.alertProps}
              dismissible
              onClose={handleDismissAlert}
            />
          </Suspense>
        </div>
      )}

      <Drawer
        isOpen={isOpen}
        onClose={handleClose}
        closeOnBackdropClick={!isPaying}
        closeOnEscape={!isPaying}
        position="right"
        size="full"
        className="drawer-tablet-45 sm:w-[45vw] sm:max-w-[45vw] md:w-[45vw] md:max-w-[45vw] lg:w-[45vw] lg:max-w-[45vw]"
        iconElement={
          <div
            onMouseEnter={() => setIsHeaderReceiptHover(true)}
            onMouseLeave={() => setIsHeaderReceiptHover(false)}
            className="bg-primary/10 text-primary grid size-10 place-items-center rounded-2xl transition-colors hover:bg-primary/15"
          >
            <PrintingReceiptIcon
              isPrinting={isHeaderReceiptHover}
              className="size-4"
            />
          </div>
        }
        title={guest.name}
        description={
          <span className="inline-flex items-center gap-1.5">
            <FontAwesomeIcon
              icon={faPhone}
              className="text-primary size-3"
              aria-hidden="true"
            />
            <span>{guest.phoneNumber || 'Teléfono no registrado'}</span>
          </span>
        }
        footer={
          <CuentaResumenFooter
            serviceRequestsTotal={guest.serviceRequestsTotal}
            reservesTotal={guest.reservesTotal}
            receptionsTotal={guest.receptionsTotal}
            grandTotal={grandTotal}
            showPayNotice={false}
            isPaying={isPaying}
            onClose={handleClose}
            onPay={() => void handlePayClick()}
          />
        }
      >
        <div className="space-y-5">
          {/* 1. Habitación (número + piso) y 2. Fecha de entrada del huésped */}
          <CuentaHuespedEstadiaMeta guest={guest} />

          {/* 3. Acordeón de huéspedes (carga perezosa) */}
          <Suspense fallback={null}>
            <LazyCuentaHuespedesAccordion guest={guest} />
          </Suspense>

          {/* 4. Cargo de la estadía */}
          <CuentaCargoEstadiaSection
            guestKey={guest.internalKey}
            products={guest.serviceRequestProducts}
          />

          {/* 5. Pago y Depósitos */}
          <Suspense fallback={null}>
            <LazyCuentaPagoDepositosSection
              selectedMethod={activeCheckout.paymentMethod}
              totalAmount={grandTotal}
              onSelectMethod={handleSelectPaymentMethod}
            />
          </Suspense>

          {/* 6. Habitación (Llaves devueltas, Daños y Observaciones) */}
          <Suspense fallback={null}>
            <LazyCuentaHabitacionChecklistSection
              keysReturned={activeCheckout.keysReturned}
              hasDamages={activeCheckout.hasDamages}
              observations={activeCheckout.observations}
              onToggleKeysReturned={handleToggleKeysReturned}
              onToggleHasDamages={handleToggleHasDamages}
              onObservationsChange={handleObservationsChange}
            />
          </Suspense>
        </div>
      </Drawer>
    </MotionConfig>
  )
})
