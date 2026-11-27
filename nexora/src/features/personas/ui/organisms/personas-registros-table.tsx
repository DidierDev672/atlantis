import { memo, useCallback, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUsers } from '@fortawesome/free-solid-svg-icons'
import { useDeviceResourceProfile } from '../../../../shared/lib/use-device-resource-profile'
import { Loading } from '../../../../shared/loading'
import {
  InfiniteScroll,
  InfiniteScrollEnd,
} from '../../../../shared/ui/InfiniteScroll'
import type { DatosEmpresaFacturacion } from '../../domain/facturacion-empresa-storage'
import {
  isRegistroCheckedOut,
  type RegistroHuespedItem,
} from '../../domain/registro-huesped'
import { PersonaRegistroMobileCard } from '../molecules/persona-registro-mobile-card'
import { PersonaRegistroTableRow } from '../molecules/persona-registro-table-row'

export interface PersonasRegistrosTableProps {
  rows: RegistroHuespedItem[]
  loading: boolean
  isDesktopTable: boolean
  checkedOutKeys: ReadonlySet<string>
  companiesByPerson: Record<string, DatosEmpresaFacturacion>
  onOpenInvoiceModal: (guest: RegistroHuespedItem) => void
  onSelectAccount: (internalKey: string) => void
  onResetFilters: () => void
}

/**
 * Organismo: Listado de registros en escritorio (tabla) y móvil/tablet (tarjetas)
 * con paginación incremental mediante `InfiniteScroll` para evitar exceso de nodos DOM.
 */
export const PersonasRegistrosTable = memo(function PersonasRegistrosTable({
  rows,
  loading,
  isDesktopTable,
  checkedOutKeys,
  companiesByPerson,
  onOpenInvoiceModal,
  onSelectAccount,
  onResetFilters,
}: PersonasRegistrosTableProps) {
  const {
    policy: { personsPageLimit },
  } = useDeviceResourceProfile()
  const batchSize = Math.max(12, personsPageLimit || 18)

  const [visibleCount, setVisibleCount] = useState(batchSize)
  const [prevRows, setPrevRows] = useState(rows)

  if (prevRows !== rows) {
    setPrevRows(rows)
    setVisibleCount(batchSize)
  }

  const visibleSlice = rows.slice(0, visibleCount)
  const hasMore = visibleCount < rows.length

  const handleLoadMore = useCallback(() => {
    if (!hasMore) return
    setVisibleCount((prev) => Math.min(prev + batchSize, rows.length))
  }, [batchSize, hasMore, rows.length])

  if (loading && rows.length === 0) {
    return (
      <div className="border-line bg-panel rounded-2xl border p-8 shadow-xs">
        <Loading
          visible
          variant="block"
          size="md"
          label="Cargando registros de huéspedes…"
          description="Sincronizando estancias, reservas y consumos de tienda."
          delay={0}
          minDuration={400}
        />
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="border-line bg-panel flex flex-col items-center justify-center rounded-2xl border px-6 py-14 text-center shadow-2xs">
        <span className="bg-primary/10 text-primary mb-3 grid size-12 place-items-center rounded-2xl">
          <FontAwesomeIcon
            icon={faUsers}
            className="size-5"
            aria-hidden="true"
          />
        </span>
        <p className="text-ink text-sm font-bold">
          No encontramos registros con los filtros actuales
        </p>
        <p className="text-ink-muted mt-1 max-w-md text-xs">
          Prueba limpiando el buscador o cambiando el filtro operativo para ver
          todos los huéspedes.
        </p>
        <button
          type="button"
          onClick={onResetFilters}
          className="border-line bg-canvas text-primary hover:bg-panel mt-4 cursor-pointer rounded-xl border px-4 py-2 text-xs font-semibold transition"
        >
          Ver todos los registros
        </button>
      </div>
    )
  }

  return (
    <InfiniteScroll
      onLoadMore={handleLoadMore}
      hasMore={hasMore}
      isLoading={false}
      endMessage={
        rows.length > batchSize ? (
          <InfiniteScrollEnd label="Todos los registros cargados" />
        ) : undefined
      }
    >
      {!isDesktopTable ? (
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          {visibleSlice.map((guest) => {
            const isCheckedOut = isRegistroCheckedOut(guest, checkedOutKeys)
            const lodgingDebt = isCheckedOut
              ? 0
              : guest.receptionsTotal + guest.reservesTotal
            const storeDebt = isCheckedOut ? 0 : guest.serviceRequestsTotal

            return (
              <PersonaRegistroMobileCard
                key={guest.internalKey}
                guest={guest}
                isCheckedOut={isCheckedOut}
                lodgingDebt={lodgingDebt}
                storeDebt={storeDebt}
                grandTotal={lodgingDebt + storeDebt}
                companyData={companiesByPerson[guest.internalKey]}
                onOpenInvoiceModal={onOpenInvoiceModal}
                onSelectAccount={onSelectAccount}
              />
            )
          })}
        </div>
      ) : (
        <div className="border-line bg-panel overflow-hidden rounded-2xl border shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-line bg-canvas/70 text-ink-muted border-b text-[11px] font-bold tracking-wide uppercase">
                  <th className="px-4 py-3.5">Persona / Huésped</th>
                  <th className="px-3.5 py-3.5">Habitación</th>
                  <th className="px-3.5 py-3.5">Ingreso (Día y Hora)</th>
                  <th className="px-3.5 py-3.5">Salida (Día y Hora)</th>
                  <th className="px-3.5 py-3.5 text-right">
                    Deuda Alojamiento
                  </th>
                  <th className="px-3.5 py-3.5 text-right">Deuda Tienda</th>
                  <th className="px-3.5 py-3.5 text-right">Total Deuda</th>
                  <th className="px-4 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-line divide-y">
                {visibleSlice.map((guest) => {
                  const isCheckedOut = isRegistroCheckedOut(
                    guest,
                    checkedOutKeys
                  )
                  const lodgingDebt = isCheckedOut
                    ? 0
                    : guest.receptionsTotal + guest.reservesTotal
                  const storeDebt = isCheckedOut
                    ? 0
                    : guest.serviceRequestsTotal

                  return (
                    <PersonaRegistroTableRow
                      key={guest.internalKey}
                      guest={guest}
                      isCheckedOut={isCheckedOut}
                      lodgingDebt={lodgingDebt}
                      storeDebt={storeDebt}
                      grandTotal={lodgingDebt + storeDebt}
                      companyData={companiesByPerson[guest.internalKey]}
                      onOpenInvoiceModal={onOpenInvoiceModal}
                      onSelectAccount={onSelectAccount}
                    />
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </InfiniteScroll>
  )
})
