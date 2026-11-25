import { memo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBed,
  faBuilding,
  faCircleCheck,
  faClock,
  faFileInvoiceDollar,
  faPhone,
  faReceipt,
} from '@fortawesome/free-solid-svg-icons'
import {
  formatCurrencyAmount,
  getGuestInitials,
  type SalidaHuespedItem,
} from '../../../recepciones/domain/salida-huesped'
import type { DatosEmpresaFacturacion } from './facturacion-electronica-empresa-modal'

export interface PersonaRegistroMobileCardProps {
  guest: SalidaHuespedItem
  isCheckedOut: boolean
  lodgingDebt: number
  storeDebt: number
  grandTotal: number
  companyData?: DatosEmpresaFacturacion
  onOpenInvoiceModal: (guest: SalidaHuespedItem) => void
  onSelectAccount: (internalKey: string) => void
}

/**
 * Molécula: Tarjeta compacta de registro y cuenta de huésped para teléfono, tablet e iPad (< 1280px).
 * Replica las reglas UX de recepción: documento sin prefijo, habitación sin "Hab." y acciones solo-icono.
 */
export const PersonaRegistroMobileCard = memo(
  function PersonaRegistroMobileCard({
    guest,
    isCheckedOut,
    lodgingDebt,
    storeDebt,
    grandTotal,
    companyData,
    onOpenInvoiceModal,
    onSelectAccount,
  }: PersonaRegistroMobileCardProps) {
    const roomNumberOnly = guest.roomNumber
      ? guest.roomNumber.replace(/^Hab\.?\s*/i, '')
      : ''

    return (
      <article className="border-line bg-panel flex flex-col justify-between gap-3.5 rounded-2xl border p-4 shadow-xs transition-colors hover:border-primary/30">
        {/* Cabecera: Huésped + Habitación */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="bg-primary/12 text-primary mt-0.5 grid size-10 shrink-0 place-items-center rounded-xl text-xs font-bold">
              {getGuestInitials(guest.name)}
            </span>

            <div className="min-w-0">
              <p className="text-ink truncate text-sm font-bold">{guest.name}</p>
              {guest.documentNumber && (
                <p
                  title={guest.documentTypeLabel || undefined}
                  className="text-ink-muted text-xs font-medium"
                >
                  {guest.documentNumber}
                </p>
              )}
              {guest.phoneNumber && (
                <p className="text-ink-muted mt-0.5 inline-flex items-center gap-1 text-[11px]">
                  <FontAwesomeIcon
                    icon={faPhone}
                    className="text-primary size-2.5"
                    aria-hidden="true"
                  />
                  <span>{guest.phoneNumber}</span>
                </p>
              )}
            </div>
          </div>

          <div className="shrink-0 text-right">
            {roomNumberOnly && !isCheckedOut ? (
              <div className="space-y-0.5">
                <span
                  title={`Habitación ${roomNumberOnly}`}
                  className="bg-primary/10 text-primary border-primary/25 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold tabular-nums"
                >
                  <FontAwesomeIcon
                    icon={faBed}
                    className="size-3"
                    aria-hidden="true"
                  />
                  <span>{roomNumberOnly}</span>
                </span>
                {guest.roomFloor && (
                  <span className="text-ink-muted block text-[11px]">
                    {guest.roomFloor}
                  </span>
                )}
              </div>
            ) : isCheckedOut ? (
              <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                <FontAwesomeIcon
                  icon={faCircleCheck}
                  className="size-3"
                  aria-hidden="true"
                />
                <span>Entregado</span>
              </span>
            ) : (
              <span className="text-ink-muted bg-canvas border-line inline-flex items-center rounded-lg border px-2.5 py-1 text-[11px]">
                {guest.sourceLabel}
              </span>
            )}
          </div>
        </div>

        {companyData && (
          <div>
            <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
              <FontAwesomeIcon
                icon={faBuilding}
                className="size-2.5"
                aria-hidden="true"
              />
              <span>
                FE: {companyData.razonSocial} (NIT {companyData.nit}
                {companyData.digitoVerificacion
                  ? `-${companyData.digitoVerificacion}`
                  : ''}
                )
              </span>
            </span>
          </div>
        )}

        {/* Ingreso y Salida */}
        <div className="border-line bg-canvas/50 grid grid-cols-2 gap-3 rounded-xl border p-2.5 text-xs">
          <div>
            <span className="text-ink-muted block text-[10px] font-bold tracking-wide uppercase">
              Ingreso
            </span>
            <p className="text-ink mt-0.5 font-semibold">
              {guest.checkInDateFormatted || 'Registrado'}
            </p>
            <p className="text-ink-muted inline-flex items-center gap-1 text-[11px]">
              <FontAwesomeIcon
                icon={faClock}
                className="size-2.5"
                aria-hidden="true"
              />
              <span>{guest.checkInTimeFormatted || '02:00 p. m.'}</span>
            </p>
          </div>

          <div>
            <span className="text-ink-muted block text-[10px] font-bold tracking-wide uppercase">
              Salida
            </span>
            <p className="text-ink mt-0.5 font-semibold">
              {guest.checkOutDateFormatted || 'Por definir'}
            </p>
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-ink-muted inline-flex items-center gap-1 text-[11px]">
                <FontAwesomeIcon
                  icon={faClock}
                  className="size-2.5"
                  aria-hidden="true"
                />
                <span>{guest.checkOutTimeFormatted || '01:00 p. m.'}</span>
              </span>
              {guest.departureWindow === 'hoy' && !isCheckedOut && (
                <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                  Sale hoy
                </span>
              )}
              {guest.departureWindow === 'manana' && !isCheckedOut && (
                <span className="bg-primary/10 text-primary rounded-full px-1.5 py-0.5 text-[10px] font-bold">
                  Sale mañana
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Saldos y Acciones */}
        <div className="border-line flex items-end justify-between gap-3 border-t pt-3">
          <div className="grid flex-1 grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-ink-muted block text-[10px]">Alojamiento</span>
              <span
                className={`font-semibold tabular-nums ${
                  lodgingDebt > 0 ? 'text-ink' : 'text-ink-muted'
                }`}
              >
                {formatCurrencyAmount(lodgingDebt)}
              </span>
            </div>

            <div>
              <span className="text-ink-muted block text-[10px]">Tienda</span>
              <span
                className={`font-semibold tabular-nums ${
                  storeDebt > 0
                    ? 'text-amber-700 dark:text-amber-300'
                    : 'text-ink-muted'
                }`}
              >
                {formatCurrencyAmount(storeDebt)}
              </span>
            </div>

            <div>
              <span className="text-ink-muted block text-[10px]">Total</span>
              <span
                className={`inline-block rounded-md px-1.5 py-0.5 text-xs font-bold tabular-nums ${
                  grandTotal > 0
                    ? 'bg-primary/10 text-primary'
                    : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                }`}
              >
                {formatCurrencyAmount(grandTotal)}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenInvoiceModal(guest)}
              aria-label={
                companyData
                  ? `Factura electrónica configurada (${companyData.razonSocial})`
                  : 'Factura electrónica'
              }
              title={
                companyData
                  ? `Factura electrónica: ${companyData.razonSocial} (editar)`
                  : 'Factura electrónica'
              }
              className={`relative inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border transition focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none active:scale-95 ${
                companyData
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300'
                  : 'border-line bg-canvas text-ink hover:border-primary/40 hover:text-primary'
              }`}
            >
              <FontAwesomeIcon
                icon={faFileInvoiceDollar}
                className="size-4"
                aria-hidden="true"
              />
              {companyData && (
                <span
                  aria-hidden="true"
                  className="ring-panel absolute -top-0.5 -right-0.5 size-2 rounded-full bg-emerald-500 ring-2"
                />
              )}
            </button>

            <button
              type="button"
              onClick={() => onSelectAccount(guest.internalKey)}
              disabled={isCheckedOut}
              aria-label={
                isCheckedOut ? 'Check-out liquidado' : 'Check-out / Cuenta'
              }
              title={
                isCheckedOut
                  ? 'Cuenta liquidada (Check-out entregado)'
                  : 'Check-out / Cuenta — Revisar estado de cuenta y cobrar'
              }
              className={`inline-flex size-9 shrink-0 items-center justify-center rounded-xl shadow-2xs transition focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none ${
                isCheckedOut
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 cursor-not-allowed border opacity-70 dark:text-emerald-300'
                  : 'bg-primary cursor-pointer text-white hover:opacity-90 active:scale-95'
              }`}
            >
              <FontAwesomeIcon
                icon={isCheckedOut ? faCircleCheck : faReceipt}
                className="size-4"
                aria-hidden="true"
              />
            </button>
          </div>
        </div>
      </article>
    )
  }
)
