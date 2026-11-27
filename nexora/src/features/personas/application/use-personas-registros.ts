import { useCallback, useMemo, useState } from 'react'
import { useSalidasRecepciones } from '../../recepciones/application/use-salidas-recepciones'
import { performGuestCheckout } from '../../recepciones/infrastructure/salidas-api'
import type { CuentaCheckoutDetails } from '../../recepciones/application/use-cuenta-huesped-checkout'
import {
  loadAllDatosEmpresaFacturacion,
  removeDatosEmpresaFacturacion,
  saveDatosEmpresaFacturacion,
  type DatosEmpresaFacturacion,
} from '../domain/facturacion-empresa-storage'
import {
  isRegistroCheckedOut,
  type RegistroHuespedItem,
} from '../domain/registro-huesped'

export type RegistrosFilterMode = 'todos' | 'hoy' | 'salen_hoy' | 'con_deuda'

export interface PersonasKpisSummary {
  totalGuests: number
  activeTodayCount: number
  departingTodayCount: number
  withDebtCount: number
  totalLodgingDebt: number
  totalStoreDebt: number
  grandTotalDebt: number
}

/**
 * Hook de aplicación para la gestión de registros en `PersonasPage`.
 * Centraliza comunicación con `recepciones`, KPIs, filtros, estado de check-out
 * y datos locales de facturación electrónica.
 */
export function usePersonasRegistros() {
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

  const [filterMode, setFilterMode] = useState<RegistrosFilterMode>('todos')
  const [selectedAccountGuestKey, setSelectedAccountGuestKey] = useState<
    string | null
  >(null)
  const [invoiceModalGuest, setInvoiceModalGuest] =
    useState<RegistroHuespedItem | null>(null)
  const [companiesByPerson, setCompaniesByPerson] = useState<
    Record<string, DatosEmpresaFacturacion>
  >(() => loadAllDatosEmpresaFacturacion())
  const [checkedOutKeys, setCheckedOutKeys] = useState<Set<string>>(
    () => new Set()
  )
  const [feedbackBanner, setFeedbackBanner] = useState<{
    tone: 'success' | 'error'
    text: string
  } | null>(null)

  const selectedAccountGuest = useMemo(
    () => guests.find((g) => g.internalKey === selectedAccountGuestKey) ?? null,
    [guests, selectedAccountGuestKey]
  )

  const kpis: PersonasKpisSummary = useMemo(() => {
    let activeTodayCount = 0
    let departingTodayCount = 0
    let totalLodgingDebt = 0
    let totalStoreDebt = 0
    let withDebtCount = 0

    for (const g of guests) {
      const checkedOut = isRegistroCheckedOut(g, checkedOutKeys)
      const lodging = checkedOut ? 0 : g.receptionsTotal + g.reservesTotal
      const store = checkedOut ? 0 : g.serviceRequestsTotal

      if (g.isTodayActivity || g.roomNumber || g.sourceKind !== 'registrado') {
        activeTodayCount += 1
      }
      if (g.departureWindow === 'hoy' && !checkedOut) {
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
  }, [checkedOutKeys, guests])

  const visibleRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()

    return guests.filter((g) => {
      const checkedOut = isRegistroCheckedOut(g, checkedOutKeys)
      const lodging = checkedOut ? 0 : g.receptionsTotal + g.reservesTotal
      const store = checkedOut ? 0 : g.serviceRequestsTotal
      const totalDebt = lodging + store
      const company = companiesByPerson[g.internalKey]

      if (filterMode === 'hoy') {
        const hasActiveOrToday =
          Boolean(g.isTodayActivity) ||
          Boolean(g.roomNumber) ||
          g.sourceKind !== 'registrado'
        if (!hasActiveOrToday) return false
      } else if (filterMode === 'salen_hoy') {
        if (g.departureWindow !== 'hoy' || checkedOut) return false
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
  }, [checkedOutKeys, companiesByPerson, filterMode, guests, searchQuery])

  const handleOpenInvoiceModal = useCallback((guest: RegistroHuespedItem) => {
    setInvoiceModalGuest(guest)
  }, [])

  const handleCloseInvoiceModal = useCallback(() => {
    setInvoiceModalGuest(null)
  }, [])

  const handleSelectAccountGuest = useCallback((internalKey: string) => {
    setSelectedAccountGuestKey(internalKey)
  }, [])

  const handleCloseAccountDrawer = useCallback(() => {
    setSelectedAccountGuestKey(null)
  }, [])

  const handleSaveCompany = useCallback(
    (personKey: string, data: DatosEmpresaFacturacion) => {
      const updated = saveDatosEmpresaFacturacion(personKey, data)
      setCompaniesByPerson(updated)
      setFeedbackBanner({
        tone: 'success',
        text: `Datos de facturación electrónica guardados para ${data.razonSocial} (NIT ${data.nit}).`,
      })
    },
    []
  )

  const handleRemoveCompany = useCallback((personKey: string) => {
    const updated = removeDatosEmpresaFacturacion(personKey)
    setCompaniesByPerson(updated)
    setFeedbackBanner({
      tone: 'success',
      text: 'Se desvincularon los datos de empresa para facturación electrónica.',
    })
  }, [])

  const handleExecuteCheckout = useCallback(
    async (guest: RegistroHuespedItem, _details?: CuentaCheckoutDetails) => {
      try {
        void _details
        const res = await performGuestCheckout(guest)
        if (!res.ok) {
          setFeedbackBanner({
            tone: 'error',
            text: res.message,
          })
          return
        }

        setCheckedOutKeys((prev) => {
          const next = new Set(prev)
          next.add(guest.internalKey)
          return next
        })
        setSelectedAccountGuestKey(null)
        setFeedbackBanner({
          tone: 'success',
          text: res.message,
        })
        await reload()
      } catch (error) {
        console.error('[usePersonasRegistros] Error en check-out:', error)
        setFeedbackBanner({
          tone: 'error',
          text: 'No pudimos sincronizar la actualización de la habitación tras el pago. Los datos siguen seguros; intenta recargar la vista.',
        })
      }
    },
    [reload]
  )

  const handleDismissFeedback = useCallback(() => {
    setFeedbackBanner(null)
  }, [])

  const handleResetFilters = useCallback(() => {
    setFilterMode('todos')
    setSearchQuery('')
  }, [setSearchQuery])

  return {
    guests,
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
  }
}
