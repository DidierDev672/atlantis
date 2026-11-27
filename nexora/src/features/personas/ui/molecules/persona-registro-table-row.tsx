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
import type { DatosEmpresaFacturacion } from '../../domain/facturacion-empresa-storage'
import {
  formatCurrencyAmount,
  getGuestInitials,
  type RegistroHuespedItem,
} from '../../domain/registro-huesped'

export interface PersonaRegistroTableRowProps {
  guest: RegistroHuespedItem
  isCheckedOut: boolean
  lodgingDebt: number
  storeDebt: number
  grandTotal: number
  companyData?: DatosEmpresaFacturacion
  onOpenInvoiceModal: (guest: RegistroHuespedItem) => void
  onSelectAccount: (internalKey: string) => void
}

/**
 * Molécula: Fila memoizada de la tabla de registros para evitar re-renders
 * por lambdas en cada render del listado.
 */
export const PersonaRegistroTableRow = memo(function PersonaRegistroTableRow({
  guest,
  isCheckedOut,
  lodgingDebt,
  storeDebt,
  grandTotal,
  companyData,
  onOpenInvoiceModal,
  onSelectAccount,
}: PersonaRegistroTableRowProps) {
  return (
    <tr className="hover:bg-primary/[0.03] transition-colors">
      {/* 1. Persona / Huésped */}
      <td className="px-4 py-3.5 align-middle">
        <div className="flex items-start gap-3">
          <span className="bg-primary/12 text-primary mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl text-xs font-bold">
            {getGuestInitials(guest.name)}
          </span>
          <div className="min-w-0">
            <p className="text-ink font-bold">{guest.name}</p>
            {guest.documentNumber && (
              <p
                title={guest.documentTypeLabel || undefined}
                className="text-ink-muted text-[11px] font-medium"
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
            {companyData && (
              <div className="mt-1">
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
          </div>
        </div>
      </td>

      {/* 2. Habitación */}
      <td className="px-3.5 py-3.5 align-middle">
        {guest.roomNumber && !isCheckedOut ? (
          <div className="space-y-1">
            <span
              title={`Habitación ${guest.roomNumber.replace(/^Hab\.?\s*/i, '')}`}
              className="bg-primary/10 text-primary border-primary/25 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold tabular-nums"
            >
              <FontAwesomeIcon
                icon={faBed}
                className="size-3"
                aria-hidden="true"
              />
              <span>{guest.roomNumber.replace(/^Hab\.?\s*/i, '')}</span>
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
            <span>Check-out entregado</span>
          </span>
        ) : (
          <span className="text-ink-muted bg-canvas border-line inline-flex items-center rounded-lg border px-2.5 py-1 text-[11px]">
            {guest.sourceLabel}
          </span>
        )}
      </td>

      {/* 3. Día y Hora de Ingreso */}
      <td className="px-3.5 py-3.5 align-middle">
        <div className="space-y-0.5">
          <p className="text-ink font-semibold">
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
      </td>

      {/* 4. Día y Hora de Salida */}
      <td className="px-3.5 py-3.5 align-middle">
        <div className="space-y-1">
          <p className="text-ink font-semibold">
            {guest.checkOutDateFormatted || 'Por definir'}
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-ink-muted inline-flex items-center gap-1 text-[11px]">
              <FontAwesomeIcon
                icon={faClock}
                className="size-2.5"
                aria-hidden="true"
              />
              <span>{guest.checkOutTimeFormatted || '01:00 p. m.'}</span>
            </span>
            {guest.departureWindow === 'hoy' && !isCheckedOut && (
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                Sale hoy
              </span>
            )}
            {guest.departureWindow === 'manana' && !isCheckedOut && (
              <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-[10px] font-bold">
                Sale mañana
              </span>
            )}
          </div>
        </div>
      </td>

      {/* 5. Deuda Alojamiento */}
      <td className="px-3.5 py-3.5 text-right align-middle">
        <span
          className={`font-semibold ${
            lodgingDebt > 0 ? 'text-ink' : 'text-ink-muted'
          }`}
        >
          {formatCurrencyAmount(lodgingDebt)}
        </span>
        {guest.receptionCount > 0 && (
          <span className="text-ink-muted block text-[10px]">
            {guest.receptionCount}{' '}
            {guest.receptionCount === 1 ? 'estancia' : 'estancias'}
          </span>
        )}
      </td>

      {/* 6. Deuda Tienda */}
      <td className="px-3.5 py-3.5 text-right align-middle">
        <span
          className={`font-semibold ${
            storeDebt > 0
              ? 'text-amber-700 dark:text-amber-300'
              : 'text-ink-muted'
          }`}
        >
          {formatCurrencyAmount(storeDebt)}
        </span>
        <span className="text-ink-muted block text-[10px]">
          {guest.serviceRequestCount}{' '}
          {guest.serviceRequestCount === 1 ? 'consumo' : 'consumos'}
        </span>
      </td>

      {/* 7. Total Deuda */}
      <td className="px-3.5 py-3.5 text-right align-middle">
        <span
          className={`inline-block rounded-lg px-2.5 py-1 text-xs font-bold ${
            grandTotal > 0
              ? 'bg-primary/10 text-primary'
              : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
          }`}
        >
          {formatCurrencyAmount(grandTotal)}
        </span>
      </td>

      {/* 8. Acciones */}
      <td className="px-4 py-3.5 text-right align-middle">
        <div className="flex items-center justify-end gap-2">
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
            className={`focus-visible:ring-primary/40 relative inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border transition focus-visible:ring-2 focus-visible:outline-none active:scale-95 ${
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
            className={`focus-visible:ring-primary/40 inline-flex size-9 shrink-0 items-center justify-center rounded-xl shadow-2xs transition focus-visible:ring-2 focus-visible:outline-none ${
              isCheckedOut
                ? 'cursor-not-allowed border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 opacity-70 dark:text-emerald-300'
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
      </td>
    </tr>
  )
})
