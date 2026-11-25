import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowsRotate,
  faBed,
  faBuilding,
  faCalendarCheck,
  faCircleCheck,
  faClock,
  faDoorOpen,
  faFileInvoiceDollar,
  faMagnifyingGlass,
  faPhone,
  faReceipt,
  faStore,
  faUserPlus,
  faUsers,
} from '@fortawesome/free-solid-svg-icons'
import { Loading, useDelayVisibility } from '../../../shared/loading'
import { StatusCodeAlert } from '../../../shared/lib/status-code-validator'
import { useSalidasRecepciones } from '../../recepciones/application/use-salidas-recepciones'
import {
  formatCurrencyAmount,
  getGuestInitials,
  type SalidaHuespedItem,
} from '../../recepciones/domain/salida-huesped'
import { performGuestCheckout } from '../../recepciones/infrastructure/salidas-api'
import { CuentaHuespedDrawer } from '../../recepciones/ui/organisms/cuenta-huesped-drawer'
import { RegistroPersonaPanel } from './organisms/registro-persona-panel'
import { PersonaRegistroMobileCard } from './molecules/persona-registro-mobile-card'
import {
  FacturacionElectronicaEmpresaModal,
  loadAllDatosEmpresaFacturacion,
  removeDatosEmpresaFacturacion,
  saveDatosEmpresaFacturacion,
  type DatosEmpresaFacturacion,
} from './molecules/facturacion-electronica-empresa-modal'

export type PersonasPageTab = 'registros' | 'nuevo'
export type RegistrosFilterMode = 'todos' | 'hoy' | 'salen_hoy' | 'con_deuda'

/**
 * Módulo unificado de Registros (Control diario e histórico de huéspedes, saldos, Check-out y Facturación Electrónica).
 */
export function PersonasPage() {
  const [activeTab, setActiveTab] = useState<PersonasPageTab>('registros')
  const [filterMode, setFilterMode] = useState<RegistrosFilterMode>('todos')

  const {
    guests,
    loading,
    loadingServiceRequests,
    validationResult,
    serviceRequestValidation,
    searchQuery,
    setSearchQuery,
    reload,
  } = useSalidasRecepciones()

  const [selectedAccountGuestKey, setSelectedAccountGuestKey] = useState<string | null>(null)
  const [invoiceModalGuest, setInvoiceModalGuest] = useState<SalidaHuespedItem | null>(null)
  const [companiesByPerson, setCompaniesByPerson] = useState<
    Record<string, DatosEmpresaFacturacion>
  >(() => loadAllDatosEmpresaFacturacion())
  const [checkedOutKeys, setCheckedOutKeys] = useState<Set<string>>(() => new Set())
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null)
  const [isDesktopTable, setIsDesktopTable] = useState<boolean>(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return true
    }
    return window.matchMedia('(min-width: 1280px)').matches
  })

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }
    const mq = window.matchMedia('(min-width: 1280px)')
    const syncViewport = () => setIsDesktopTable(mq.matches)
    syncViewport()
    mq.addEventListener('change', syncViewport)
    return () => mq.removeEventListener('change', syncViewport)
  }, [])

  const handleOpenInvoiceModal = useCallback((guest: SalidaHuespedItem) => {
    setInvoiceModalGuest(guest)
  }, [])

  const handleSelectAccountGuest = useCallback((internalKey: string) => {
    setSelectedAccountGuestKey(internalKey)
  }, [])

  const selectedAccountGuest =
    guests.find((g) => g.internalKey === selectedAccountGuestKey) ?? null

  const isVisibleLoading = useDelayVisibility(loading, {
    delay: 0,
    minDuration: 400,
  })

  const isVisibleServiceLoading = useDelayVisibility(loadingServiceRequests, {
    delay: 0,
    minDuration: 350,
  })

  // Métricas operativas en tiempo real
  const kpis = useMemo(() => {
    let activeTodayCount = 0
    let departingTodayCount = 0
    let totalLodgingDebt = 0
    let totalStoreDebt = 0
    let withDebtCount = 0

    for (const g of guests) {
      const isCheckedOut = checkedOutKeys.has(g.internalKey)
      const lodging = isCheckedOut ? 0 : g.receptionsTotal + g.reservesTotal
      const store = isCheckedOut ? 0 : g.serviceRequestsTotal

      if (g.isTodayActivity || g.roomNumber || g.sourceKind !== 'registrado') {
        activeTodayCount += 1
      }
      if (g.departureWindow === 'hoy' && !isCheckedOut) {
        departingTodayCount += 1
      }
      if (lodging + store > 0) {
        withDebtCount += 1
      }
      totalLodgingDebt += lodging
      totalStoreDebt += store
    }

    return {
      totalGuests: guests.length,
      activeTodayCount,
      departingTodayCount,
      withDebtCount,
      totalLodgingDebt,
      totalStoreDebt,
      grandTotalDebt: totalLodgingDebt + totalStoreDebt,
    }
  }, [guests, checkedOutKeys])

  // Filtrado por pestaña operativa y buscador
  const visibleRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()

    return guests.filter((g) => {
      const isCheckedOut = checkedOutKeys.has(g.internalKey)
      const lodging = isCheckedOut ? 0 : g.receptionsTotal + g.reservesTotal
      const store = isCheckedOut ? 0 : g.serviceRequestsTotal
      const totalDebt = lodging + store
      const company = companiesByPerson[g.internalKey]

      if (filterMode === 'hoy') {
        const hasActiveOrToday =
          Boolean(g.isTodayActivity) ||
          Boolean(g.roomNumber) ||
          g.sourceKind !== 'registrado'
        if (!hasActiveOrToday) return false
      } else if (filterMode === 'salen_hoy') {
        if (g.departureWindow !== 'hoy' || isCheckedOut) return false
      } else if (filterMode === 'con_deuda') {
        if (totalDebt <= 0) return false
      }

      if (!q) return true

      return (
        g.name.toLowerCase().includes(q) ||
        g.documentNumber.toLowerCase().includes(q) ||
        g.phoneNumber.toLowerCase().includes(q) ||
        (g.roomNumber?.toLowerCase().includes(q) ?? false) ||
        (company?.razonSocial.toLowerCase().includes(q) ?? false) ||
        (company?.nit.toLowerCase().includes(q) ?? false)
      )
    })
  }, [guests, filterMode, searchQuery, checkedOutKeys, companiesByPerson])

  const handleSaveCompany = (personKey: string, data: DatosEmpresaFacturacion) => {
    const updated = saveDatosEmpresaFacturacion(personKey, data)
    setCompaniesByPerson(updated)
    setFeedbackBanner(
      `Datos de facturación electrónica guardados para ${data.razonSocial} (NIT ${data.nit}).`,
    )
  }

  const handleRemoveCompany = (personKey: string) => {
    const updated = removeDatosEmpresaFacturacion(personKey)
    setCompaniesByPerson(updated)
    setFeedbackBanner('Se desvincularon los datos de empresa para facturación electrónica.')
  }

  const handleExecuteCheckout = async (guest: SalidaHuespedItem) => {
    const res = await performGuestCheckout(guest)
    setCheckedOutKeys((prev) => {
      const next = new Set(prev)
      next.add(guest.internalKey)
      return next
    })
    setSelectedAccountGuestKey(null)
    setFeedbackBanner(res.message)
    void reload()
  }

  return (
    <div className="bg-canvas text-ink min-h-screen font-sans transition-colors duration-200">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        {/* Alertas de validación HTTP */}
        {validationResult && !validationResult.isValid && (
          <StatusCodeAlert
            validation={validationResult}
            dismissible
            actions={
              <button
                type="button"
                onClick={() => void reload()}
                className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold underline hover:opacity-80"
              >
                <FontAwesomeIcon icon={faArrowsRotate} className="size-3" />
                <span>Reintentar</span>
              </button>
            }
          />
        )}

        {serviceRequestValidation && !serviceRequestValidation.isValid && (
          <StatusCodeAlert
            validation={serviceRequestValidation}
            dismissible
            actions={
              <button
                type="button"
                onClick={() => void reload()}
                className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold underline hover:opacity-80"
              >
                <FontAwesomeIcon icon={faArrowsRotate} className="size-3" />
                <span>Reintentar</span>
              </button>
            }
          />
        )}

        {/* Banner de confirmación de acción operativa */}
        <AnimatePresence>
          {feedbackBanner && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-xs font-medium shadow-2xs"
            >
              <span className="flex items-center gap-2">
                <FontAwesomeIcon icon={faCircleCheck} className="size-4 text-emerald-500" />
                <span>{feedbackBanner}</span>
              </span>
              <button
                type="button"
                onClick={() => setFeedbackBanner(null)}
                className="cursor-pointer text-xs font-bold underline opacity-80 hover:opacity-100"
              >
                Cerrar
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tarjetas KPI Operativas del Día */}
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="border-line bg-panel flex items-center gap-3.5 rounded-2xl border p-4 shadow-2xs">
            <span className="bg-primary/10 text-primary grid size-11 shrink-0 place-items-center rounded-xl">
              <FontAwesomeIcon icon={faUsers} className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-ink-muted text-[11px] font-medium">
                Personas / Activos hoy
              </p>
              <p className="text-ink text-lg font-bold">
                {kpis.activeTodayCount}{' '}
                <span className="text-ink-muted text-xs font-normal">
                  de {kpis.totalGuests} registrados
                </span>
              </p>
            </div>
          </div>

          <div className="border-line bg-panel flex items-center gap-3.5 rounded-2xl border p-4 shadow-2xs">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <FontAwesomeIcon icon={faDoorOpen} className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-ink-muted text-[11px] font-medium">
                Salidas programadas hoy
              </p>
              <p className="text-ink text-lg font-bold">
                {kpis.departingTodayCount}{' '}
                <span className="text-ink-muted text-xs font-normal">
                  por hacer Check-out
                </span>
              </p>
            </div>
          </div>

          <div className="border-line bg-panel flex items-center gap-3.5 rounded-2xl border p-4 shadow-2xs">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <FontAwesomeIcon icon={faBed} className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-ink-muted text-[11px] font-medium">
                Deuda por Alojamiento
              </p>
              <p className="text-ink truncate text-lg font-bold">
                {formatCurrencyAmount(kpis.totalLodgingDebt)}
              </p>
            </div>
          </div>

          <div className="border-line bg-panel flex items-center gap-3.5 rounded-2xl border p-4 shadow-2xs">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <FontAwesomeIcon icon={faStore} className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-ink-muted text-[11px] font-medium">
                Deuda por Tienda / Servicios
              </p>
              <p className="text-ink truncate text-lg font-bold">
                {formatCurrencyAmount(kpis.totalStoreDebt)}
              </p>
            </div>
          </div>
        </div>

        {/* Barra superior de navegación entre Tabla de Registros y Nuevo Registro */}
        <div className="border-line flex flex-wrap items-center justify-between gap-3 border-b pb-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('registros')}
              className={`relative flex cursor-pointer items-center gap-2 px-4 py-2 text-xs font-bold transition ${
                activeTab === 'registros'
                  ? 'text-primary'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <FontAwesomeIcon icon={faCalendarCheck} className="size-3.5" />
              <span>Tabla de registros e historial</span>
              {activeTab === 'registros' && (
                <motion.div
                  layoutId="activeRegistrosTabIndicator"
                  className="bg-primary absolute inset-x-0 -bottom-2 h-0.5"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('nuevo')}
              className={`relative flex cursor-pointer items-center gap-2 px-4 py-2 text-xs font-bold transition ${
                activeTab === 'nuevo'
                  ? 'text-primary'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <FontAwesomeIcon icon={faUserPlus} className="size-3.5" />
              <span>Registrar nueva persona</span>
              {activeTab === 'nuevo' && (
                <motion.div
                  layoutId="activeRegistrosTabIndicator"
                  className="bg-primary absolute inset-x-0 -bottom-2 h-0.5"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
            </button>
          </div>

          {activeTab === 'nuevo' && (
            <button
              type="button"
              onClick={() => setActiveTab('registros')}
              className="text-primary flex cursor-pointer items-center gap-1 text-xs font-semibold hover:underline"
            >
              ← Volver a la tabla de registros
            </button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'nuevo' ? (
            <motion.div
              key="registros-nuevo-tab"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="mx-auto max-w-3xl"
            >
              <RegistroPersonaPanel
                onBackToDirectory={() => setActiveTab('registros')}
                onSuccess={() => {
                  setActiveTab('registros')
                  void reload()
                }}
              />
            </motion.div>
          ) : (
            <motion.div
              key="registros-tabla-tab"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="space-y-4"
            >
              {/* Barra de filtros operativos y buscador */}
              <div className="border-line bg-panel flex flex-col gap-3 rounded-2xl border p-4 shadow-2xs lg:flex-row lg:items-center lg:justify-between">
                {/* Filtros rápidos */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {(
                    [
                      {
                        id: 'todos',
                        label: 'Todos los registros',
                        count: kpis.totalGuests,
                      },
                      {
                        id: 'hoy',
                        label: 'Ingresos hoy / En habitación',
                        count: kpis.activeTodayCount,
                      },
                      {
                        id: 'salen_hoy',
                        label: 'Salen hoy',
                        count: kpis.departingTodayCount,
                      },
                      {
                        id: 'con_deuda',
                        label: 'Con deuda pendiente',
                        count: kpis.withDebtCount,
                      },
                    ] as const
                  ).map((pill) => {
                    const active = filterMode === pill.id
                    return (
                      <button
                        key={pill.id}
                        type="button"
                        onClick={() => setFilterMode(pill.id)}
                        className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                          active
                            ? 'bg-primary text-white shadow-2xs'
                            : 'bg-canvas text-ink-muted hover:text-ink border-line border'
                        }`}
                      >
                        <span>{pill.label}</span>
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                            active
                              ? 'bg-white/20 text-white'
                              : 'bg-panel text-ink-muted'
                          }`}
                        >
                          {pill.count}
                        </span>
                      </button>
                    )
                  })}
                </div>

                {/* Buscador y botón actualizar */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1 sm:w-72">
                    <FontAwesomeIcon
                      icon={faMagnifyingGlass}
                      className="text-ink-muted absolute top-1/2 left-3.5 size-3.5 -translate-y-1/2"
                    />
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar por nombre, documento, habitación, NIT…"
                      className="border-line bg-canvas text-ink placeholder:text-ink-muted/60 focus:border-primary focus:ring-primary/20 h-10 w-full rounded-xl border pr-3.5 pl-9 text-xs outline-none focus:ring-2"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => void reload()}
                    disabled={isVisibleLoading || isVisibleServiceLoading}
                    title="Actualizar registros y saldos"
                    className="border-line bg-canvas text-ink-muted hover:border-primary/40 hover:text-primary inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition disabled:opacity-50"
                  >
                    <FontAwesomeIcon
                      icon={faArrowsRotate}
                      className={`size-3.5 ${
                        isVisibleLoading || isVisibleServiceLoading ? 'animate-spin text-primary' : ''
                      }`}
                    />
                    <span className="hidden sm:inline">Actualizar</span>
                  </button>
                </div>
              </div>

              {isVisibleServiceLoading && guests.length > 0 && (
                <div className="border-line bg-panel flex items-center justify-between rounded-xl border px-4 py-2 text-xs shadow-2xs">
                  <Loading
                    variant="inline"
                    size="sm"
                    label="Sincronizando consumos de tienda y room service por huésped…"
                    delay={0}
                    minDuration={350}
                  />
                </div>
              )}

              {/* Tabla Maestra Operativa */}
              {isVisibleLoading && guests.length === 0 ? (
                <div className="border-line bg-panel flex flex-col items-center justify-center rounded-2xl border p-14 text-center shadow-xs">
                  <Loading
                    variant="block"
                    size="md"
                    label="Cargando registros de huéspedes y estancias…"
                    description="Consultando habitaciones asignadas, horarios de ingreso/salida y saldos."
                    delay={0}
                    minDuration={400}
                  />
                </div>
              ) : visibleRows.length === 0 ? (
                <div className="border-line bg-panel flex flex-col items-center justify-center rounded-2xl border p-12 text-center shadow-2xs">
                  <span className="bg-primary/10 text-primary mb-3 grid size-12 place-items-center rounded-full">
                    <FontAwesomeIcon icon={faUsers} className="size-5" />
                  </span>
                  <h3 className="text-ink text-sm font-bold">
                    No se encontraron registros para este filtro
                  </h3>
                  <p className="text-ink-muted mt-1 max-w-md text-xs">
                    Prueba cambiando el filtro superior a «Todos los registros» o limpia el término de búsqueda.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setFilterMode('todos')
                      setSearchQuery('')
                    }}
                    className="border-line bg-canvas text-primary hover:bg-panel mt-4 cursor-pointer rounded-xl border px-4 py-2 text-xs font-semibold transition"
                  >
                    Ver todos los registros
                  </button>
                </div>
              ) : !isDesktopTable ? (
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  {visibleRows.map((guest) => {
                    const isCheckedOut = checkedOutKeys.has(guest.internalKey)
                    const lodgingDebt = isCheckedOut
                      ? 0
                      : guest.receptionsTotal + guest.reservesTotal
                    const storeDebt = isCheckedOut ? 0 : guest.serviceRequestsTotal
                    const grandTotal = lodgingDebt + storeDebt
                    const companyData = companiesByPerson[guest.internalKey]

                    return (
                      <PersonaRegistroMobileCard
                        key={guest.internalKey}
                        guest={guest}
                        isCheckedOut={isCheckedOut}
                        lodgingDebt={lodgingDebt}
                        storeDebt={storeDebt}
                        grandTotal={grandTotal}
                        companyData={companyData}
                        onOpenInvoiceModal={handleOpenInvoiceModal}
                        onSelectAccount={handleSelectAccountGuest}
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
                          <th className="px-3.5 py-3.5 text-right">Deuda Alojamiento</th>
                          <th className="px-3.5 py-3.5 text-right">Deuda Tienda</th>
                          <th className="px-3.5 py-3.5 text-right">Total Deuda</th>
                          <th className="px-4 py-3.5 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-line divide-y">
                        {visibleRows.map((guest) => {
                          const isCheckedOut = checkedOutKeys.has(guest.internalKey)
                          const lodgingDebt = isCheckedOut
                            ? 0
                            : guest.receptionsTotal + guest.reservesTotal
                          const storeDebt = isCheckedOut ? 0 : guest.serviceRequestsTotal
                          const grandTotal = lodgingDebt + storeDebt
                          const companyData = companiesByPerson[guest.internalKey]

                          return (
                            <tr
                              key={guest.internalKey}
                              className="hover:bg-primary/[0.03] transition-colors"
                            >
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
                                          />
                                          <span>
                                            FE: {companyData.razonSocial} (NIT{' '}
                                            {companyData.nit}
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
                                      <FontAwesomeIcon icon={faBed} className="size-3" />
                                      <span>
                                        {guest.roomNumber.replace(/^Hab\.?\s*/i, '')}
                                      </span>
                                    </span>
                                    {guest.roomFloor && (
                                      <span className="text-ink-muted block text-[11px]">
                                        {guest.roomFloor}
                                      </span>
                                    )}
                                  </div>
                                ) : isCheckedOut ? (
                                  <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                                    <FontAwesomeIcon icon={faCircleCheck} className="size-3" />
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
                                    <FontAwesomeIcon icon={faClock} className="size-2.5" />
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
                                      <FontAwesomeIcon icon={faClock} className="size-2.5" />
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

                              {/* 8. Acciones: solo iconos accesibles para operación ágil en recepción */}
                              <td className="px-4 py-3.5 text-right align-middle">
                                <div className="flex items-center justify-end gap-2">
                                  {/* Botón: Datos de Empresa para Facturación Electrónica */}
                                  <button
                                    type="button"
                                    onClick={() => setInvoiceModalGuest(guest)}
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
                                        className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-emerald-500 ring-2 ring-panel"
                                      />
                                    )}
                                  </button>

                                  {/* Botón: Ver Cuenta y hacer Check-out */}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setSelectedAccountGuestKey(guest.internalKey)
                                    }
                                    disabled={isCheckedOut}
                                    aria-label={
                                      isCheckedOut
                                        ? 'Check-out liquidado'
                                        : 'Check-out / Cuenta'
                                    }
                                    title={
                                      isCheckedOut
                                        ? 'Cuenta liquidada (Check-out entregado)'
                                        : 'Check-out / Cuenta — Revisar estado de cuenta y cobrar'
                                    }
                                    className={`inline-flex size-9 shrink-0 items-center justify-center rounded-xl shadow-2xs transition focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none ${
                                      isCheckedOut
                                        ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 opacity-70 cursor-not-allowed dark:text-emerald-300'
                                        : 'bg-primary text-white cursor-pointer hover:opacity-90 active:scale-95'
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
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Drawer de Estado de Cuenta y Liquidación / Check-out */}
      <CuentaHuespedDrawer
        guest={selectedAccountGuest}
        isOpen={Boolean(selectedAccountGuest)}
        onClose={() => setSelectedAccountGuestKey(null)}
        onPay={(guest) => void handleExecuteCheckout(guest)}
      />

      {/* Modal para capturar datos de Empresa para Facturación Electrónica */}
      {invoiceModalGuest && (
        <FacturacionElectronicaEmpresaModal
          isOpen={Boolean(invoiceModalGuest)}
          personKey={invoiceModalGuest.internalKey}
          guestName={invoiceModalGuest.name}
          guestDocument={`${invoiceModalGuest.documentTypeLabel} ${invoiceModalGuest.documentNumber}`}
          roomLabel={invoiceModalGuest.roomNumber || invoiceModalGuest.sourceLabel}
          initialData={companiesByPerson[invoiceModalGuest.internalKey] ?? null}
          onClose={() => setInvoiceModalGuest(null)}
          onSave={handleSaveCompany}
          onRemove={handleRemoveCompany}
        />
      )}
    </div>
  )
}

export default PersonasPage
