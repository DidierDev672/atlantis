import {
  Suspense,
  lazy,
  memo,
  useCallback,
  useEffect,
  useState,
  type ComponentType,
} from 'react'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { useDeviceResourceProfile } from '../../../shared/lib/use-device-resource-profile'
import { Loading, useDelayVisibility } from '../../../shared/loading'
import type { CuentaHuespedDrawerProps } from '../../recepciones/ui/organisms/cuenta-huesped-drawer'
import { usePersonasRegistros } from '../application/use-personas-registros'
import type { FacturacionElectronicaEmpresaModalProps } from './molecules/facturacion-electronica-empresa-modal'
import { PersonasFeedbackAlerts } from './molecules/personas-feedback-alerts'
import { PersonasKpiStrip } from './molecules/personas-kpi-strip'
import {
  PersonasRegistrosTabsBar,
  type PersonasPageTab,
} from './molecules/personas-registros-tabs-bar'
import { PersonasRegistrosToolbar } from './molecules/personas-registros-toolbar'
import type { RegistroPersonaPanelProps } from './organisms/registro-persona-panel'
import { PersonasRegistrosTable } from './organisms/personas-registros-table'

export type { PersonasPageTab }
export type { RegistrosFilterMode } from '../application/use-personas-registros'

function lazyNamed<P>(loader: () => Promise<ComponentType<P>>, label: string) {
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

const LazyFacturasPage = lazyNamed<Record<string, never>>(
  async () => (await import('../../facturas/ui/facturas-page')).FacturasPage,
  'FacturasPage'
)

const LazyRegistroPersonaPanel = lazyNamed<RegistroPersonaPanelProps>(
  async () =>
    (await import('./organisms/registro-persona-panel')).RegistroPersonaPanel,
  'RegistroPersonaPanel'
)

const LazyCuentaHuespedDrawer = lazyNamed<CuentaHuespedDrawerProps>(
  async () =>
    (await import('../../recepciones/ui/organisms/cuenta-huesped-drawer'))
      .CuentaHuespedDrawer,
  'CuentaHuespedDrawer'
)

const LazyFacturacionElectronicaEmpresaModal =
  lazyNamed<FacturacionElectronicaEmpresaModalProps>(
    async () =>
      (await import('./molecules/facturacion-electronica-empresa-modal'))
        .FacturacionElectronicaEmpresaModal,
    'FacturacionElectronicaEmpresaModal'
  )

/**
 * Módulo unificado de Registros (Control diario e histórico de huéspedes, saldos,
 * Check-out, Facturas y Facturación Electrónica).
 */
export const PersonasPage = memo(function PersonasPage() {
  const { policy } = useDeviceResourceProfile()
  const [activeTab, setActiveTab] = useState<PersonasPageTab>('registros')
  const [isDesktopTable, setIsDesktopTable] = useState<boolean>(() => {
    if (
      typeof window === 'undefined' ||
      typeof window.matchMedia !== 'function'
    ) {
      return true
    }
    return window.matchMedia('(min-width: 1280px)').matches
  })

  const {
    visibleRows,
    kpis,
    loading,
    loadingServiceRequests,
    validationResult,
    serviceRequestValidation,
    searchQuery,
    setSearchQuery,
    filterMode,
    setFilterMode,
    selectedAccountGuest,
    invoiceModalGuest,
    companiesByPerson,
    checkedOutKeys,
    feedbackBanner,
    reload,
    handleOpenInvoiceModal,
    handleCloseInvoiceModal,
    handleSelectAccountGuest,
    handleCloseAccountDrawer,
    handleSaveCompany,
    handleRemoveCompany,
    handleExecuteCheckout,
    handleDismissFeedback,
    handleResetFilters,
  } = usePersonasRegistros()

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      typeof window.matchMedia !== 'function'
    ) {
      return
    }
    const mq = window.matchMedia('(min-width: 1280px)')
    const syncViewport = () => setIsDesktopTable(mq.matches)
    syncViewport()
    mq.addEventListener('change', syncViewport)
    return () => mq.removeEventListener('change', syncViewport)
  }, [])

  const isVisibleLoading = useDelayVisibility(loading, {
    delay: 0,
    minDuration: 400,
  })
  const isVisibleServiceLoading = useDelayVisibility(loadingServiceRequests, {
    delay: 0,
    minDuration: 350,
  })

  const handleReload = useCallback(() => {
    void reload()
  }, [reload])

  const handleBackToRegistros = useCallback(() => {
    setActiveTab('registros')
  }, [])

  const handleRegistroSuccess = useCallback(() => {
    setActiveTab('registros')
    void reload()
  }, [reload])

  const handleDrawerPay = useCallback(
    (guest: Parameters<typeof handleExecuteCheckout>[0]) => {
      void handleExecuteCheckout(guest)
    },
    [handleExecuteCheckout]
  )

  return (
    <MotionConfig reducedMotion={policy.enableAnimations ? 'user' : 'always'}>
      <div className="bg-canvas text-ink min-h-screen font-sans transition-colors duration-200">
        <div className="mx-auto w-full max-w-7xl space-y-6">
          <PersonasFeedbackAlerts
            validationResult={validationResult}
            serviceRequestValidation={serviceRequestValidation}
            feedbackBanner={feedbackBanner}
            enableAnimations={policy.enableAnimations}
            onReload={handleReload}
            onDismissFeedback={handleDismissFeedback}
          />

          <PersonasRegistrosTabsBar
            activeTab={activeTab}
            onSelectTab={setActiveTab}
          />

          <AnimatePresence mode="wait">
            {activeTab === 'facturas' ? (
              <motion.div
                key="registros-facturas-tab"
                initial={
                  policy.enableAnimations ? { opacity: 0, y: 8 } : false
                }
                animate={{ opacity: 1, y: 0 }}
                exit={
                  policy.enableAnimations ? { opacity: 0, y: -8 } : undefined
                }
                transition={{ duration: policy.enableAnimations ? 0.18 : 0 }}
              >
                <Suspense
                  fallback={
                    <Loading
                      visible
                      variant="block"
                      size="md"
                      label="Cargando facturas…"
                      description="Preparando las constancias de salida de recepción."
                      delay={0}
                      minDuration={250}
                    />
                  }
                >
                  <LazyFacturasPage />
                </Suspense>
              </motion.div>
            ) : activeTab === 'nuevo' ? (
              <motion.div
                key="registros-nuevo-tab"
                initial={
                  policy.enableAnimations ? { opacity: 0, y: 8 } : false
                }
                animate={{ opacity: 1, y: 0 }}
                exit={
                  policy.enableAnimations ? { opacity: 0, y: -8 } : undefined
                }
                transition={{ duration: policy.enableAnimations ? 0.18 : 0 }}
                className="mx-auto max-w-3xl"
              >
                <Suspense
                  fallback={
                    <Loading
                      visible
                      variant="block"
                      size="md"
                      label="Cargando formulario…"
                      description="Preparando el registro de huésped."
                      delay={0}
                      minDuration={250}
                    />
                  }
                >
                  <LazyRegistroPersonaPanel
                    onBackToDirectory={handleBackToRegistros}
                    onSuccess={handleRegistroSuccess}
                  />
                </Suspense>
              </motion.div>
            ) : (
              <motion.div
                key="registros-tabla-tab"
                initial={
                  policy.enableAnimations ? { opacity: 0, y: 8 } : false
                }
                animate={{ opacity: 1, y: 0 }}
                exit={
                  policy.enableAnimations ? { opacity: 0, y: -8 } : undefined
                }
                transition={{ duration: policy.enableAnimations ? 0.18 : 0 }}
                className="space-y-4"
              >
                <PersonasKpiStrip kpis={kpis} />

                <PersonasRegistrosToolbar
                  filterMode={filterMode}
                  onFilterChange={setFilterMode}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  kpis={kpis}
                  loading={loading}
                  isVisibleServiceLoading={isVisibleServiceLoading}
                  onReload={handleReload}
                />

                <PersonasRegistrosTable
                  rows={visibleRows}
                  loading={isVisibleLoading}
                  isDesktopTable={isDesktopTable}
                  checkedOutKeys={checkedOutKeys}
                  companiesByPerson={companiesByPerson}
                  onOpenInvoiceModal={handleOpenInvoiceModal}
                  onSelectAccount={handleSelectAccountGuest}
                  onResetFilters={handleResetFilters}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {selectedAccountGuest && (
          <Suspense fallback={null}>
            <LazyCuentaHuespedDrawer
              guest={selectedAccountGuest}
              isOpen
              onClose={handleCloseAccountDrawer}
              onPay={handleDrawerPay}
            />
          </Suspense>
        )}

        {invoiceModalGuest && (
          <Suspense fallback={null}>
            <LazyFacturacionElectronicaEmpresaModal
              isOpen
              personKey={invoiceModalGuest.internalKey}
              guestName={invoiceModalGuest.name}
              guestDocument={`${invoiceModalGuest.documentTypeLabel} ${invoiceModalGuest.documentNumber}`}
              roomLabel={
                invoiceModalGuest.roomNumber || invoiceModalGuest.sourceLabel
              }
              initialData={
                companiesByPerson[invoiceModalGuest.internalKey] ?? null
              }
              onClose={handleCloseInvoiceModal}
              onSave={handleSaveCompany}
              onRemove={handleRemoveCompany}
            />
          </Suspense>
        )}
      </div>
    </MotionConfig>
  )
})

export default PersonasPage
