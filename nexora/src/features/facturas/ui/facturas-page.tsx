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
import { faFileInvoiceDollar } from '@fortawesome/free-solid-svg-icons'
import { StatusCodeAlert } from '../../../shared/lib/status-code-validator'
import { useDeviceResourceProfile } from '../../../shared/lib/use-device-resource-profile'
import { Loading } from '../../../shared/loading'
import {
  InfiniteScroll,
  InfiniteScrollEnd,
} from '../../../shared/ui/InfiniteScroll'
import { useFacturasCheckout } from '../application/use-facturas-checkout'
import type { CheckoutInvoiceItem } from '../domain/factura-checkout'
import { printFacturaReceipt } from '../infrastructure/print-factura-receipt'
import { FacturaCard } from './molecules/factura-card'
import type { FacturaDetalleDrawerProps } from './molecules/factura-detalle-drawer'
import { FacturaToolbar } from './molecules/factura-toolbar'

const LazyFacturaDetalleDrawer = lazy<ComponentType<FacturaDetalleDrawerProps>>(
  async () => {
    try {
      const mod = await import('./molecules/factura-detalle-drawer')
      return { default: mod.FacturaDetalleDrawer }
    } catch (error) {
      console.error('Error cargando FacturaDetalleDrawer:', error)
      const Fallback: ComponentType<FacturaDetalleDrawerProps> = () => null
      return { default: Fallback }
    }
  }
)

const PAGE_BATCH_SIZE = 12

/**
 * Vista de Facturas y Constancias de salida de recepción (`GET /stay/all/checkout`).
 */
export const FacturasPage = memo(function FacturasPage() {
  const { policy } = useDeviceResourceProfile()
  const {
    filteredInvoices,
    loading,
    validationResult,
    searchQuery,
    setSearchQuery,
    conditionFilter,
    setConditionFilter,
    counts,
    reload,
  } = useFacturasCheckout()

  const [selectedInvoice, setSelectedInvoice] =
    useState<CheckoutInvoiceItem | null>(null)
  const [visibleCount, setVisibleCount] = useState(PAGE_BATCH_SIZE)
  const [prevFiltered, setPrevFiltered] = useState(filteredInvoices)

  if (prevFiltered !== filteredInvoices) {
    setPrevFiltered(filteredInvoices)
    setVisibleCount(PAGE_BATCH_SIZE)
  }

  const visibleInvoices = filteredInvoices.slice(0, visibleCount)
  const hasMore = visibleCount < filteredInvoices.length

  const handleLoadMore = useCallback(() => {
    if (!hasMore) return
    setVisibleCount((prev) =>
      Math.min(prev + PAGE_BATCH_SIZE, filteredInvoices.length)
    )
  }, [filteredInvoices.length, hasMore])

  const handleCloseDetail = useCallback(() => {
    setSelectedInvoice(null)
  }, [])

  const handlePrintInvoice = useCallback((invoice: CheckoutInvoiceItem) => {
    printFacturaReceipt(invoice)
  }, [])

  return (
    <MotionConfig reducedMotion={policy.enableAnimations ? 'user' : 'always'}>
      <div className="space-y-5">
        <FacturaToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          conditionFilter={conditionFilter}
          onFilterChange={setConditionFilter}
          counts={counts}
          loading={loading}
          onReload={() => void reload()}
        />

        {validationResult && !validationResult.isValid && (
          <StatusCodeAlert
            validation={validationResult}
            dismissible
            actions={
              <button
                type="button"
                onClick={() => void reload()}
                className="cursor-pointer text-xs font-semibold underline hover:opacity-80"
              >
                Reintentar consulta
              </button>
            }
          />
        )}

        {loading ? (
          <div className="border-line bg-panel rounded-2xl border p-6 shadow-xs">
            <Loading
              visible
              variant="block"
              size="md"
              label="Cargando facturas y constancias…"
              description="Consultando los registros de salida de recepción."
              delay={0}
              minDuration={350}
            />
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="border-line bg-panel flex flex-col items-center justify-center rounded-2xl border px-6 py-14 text-center shadow-xs">
            <span className="bg-primary/10 text-primary mb-3 grid size-12 place-items-center rounded-2xl">
              <FontAwesomeIcon
                icon={faFileInvoiceDollar}
                className="size-5"
                aria-hidden="true"
              />
            </span>
            <p className="text-ink text-sm font-bold">
              No hay facturas o constancias para mostrar
            </p>
            <p className="text-ink-muted mt-1 max-w-sm text-xs leading-relaxed">
              {searchQuery || conditionFilter !== 'todas'
                ? 'Ajusta los filtros o limpia la búsqueda para ver otras constancias registradas.'
                : 'Cuando se registren salidas de recepción desde Registros aparecerán aquí.'}
            </p>
          </div>
        ) : (
          <InfiniteScroll
            onLoadMore={handleLoadMore}
            hasMore={hasMore}
            isLoading={false}
            endMessage={
              filteredInvoices.length > 0 ? (
                <InfiniteScrollEnd label="Todas las constancias cargadas" />
              ) : undefined
            }
          >
            <div className="flex flex-col gap-3.5">
              {visibleInvoices.map((invoice) => (
                <FacturaCard
                  key={invoice.id}
                  invoice={invoice}
                  onSelect={setSelectedInvoice}
                  onPrint={handlePrintInvoice}
                />
              ))}
            </div>
          </InfiniteScroll>
        )}

        {selectedInvoice && (
          <Suspense fallback={null}>
            <LazyFacturaDetalleDrawer
              invoice={selectedInvoice}
              isOpen
              onClose={handleCloseDetail}
              onPrint={handlePrintInvoice}
            />
          </Suspense>
        )}
      </div>
    </MotionConfig>
  )
})
