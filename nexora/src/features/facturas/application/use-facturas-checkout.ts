import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  validateStatusCode,
  type StatusCodeValidationResult,
} from '../../../shared/lib/status-code-validator'
import { useDeviceResourceProfile } from '../../../shared/lib/use-device-resource-profile'
import type {
  CheckoutInvoiceItem,
  FacturaFilterOption,
} from '../domain/factura-checkout'
import { fetchCheckoutInvoices } from '../infrastructure/facturas-checkout-api'

export interface UseFacturasCheckoutReturn {
  invoices: CheckoutInvoiceItem[]
  filteredInvoices: CheckoutInvoiceItem[]
  loading: boolean
  validationResult: StatusCodeValidationResult | null
  searchQuery: string
  setSearchQuery: (value: string) => void
  conditionFilter: FacturaFilterOption
  setConditionFilter: (value: FacturaFilterOption) => void
  counts: {
    total: number
    buenEstado: number
    novedades: number
    totalAmount: number
  }
  reload: () => Promise<void>
}

export function useFacturasCheckout(): UseFacturasCheckoutReturn {
  const { network } = useDeviceResourceProfile()
  const [invoices, setInvoices] = useState<CheckoutInvoiceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [validationResult, setValidationResult] =
    useState<StatusCodeValidationResult | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [conditionFilter, setConditionFilter] =
    useState<FacturaFilterOption>('todas')
  const seqRef = useRef(0)

  const skipEnrichment =
    network.tier === 'offline' ||
    network.saveData ||
    !network.enableBackgroundMetadata

  const loadInvoices = useCallback(
    async (seq: number, forceRefresh: boolean) => {
      try {
        const res = await fetchCheckoutInvoices({
          forceRefresh,
          maxConcurrentRequests: network.maxConcurrentRequests,
          skipRemoteEnrichment: skipEnrichment,
        })
        if (seqRef.current !== seq) return
        setInvoices(res.invoices)
        setValidationResult(res.validation)
      } catch (err) {
        console.error('[useFacturasCheckout] Error cargando facturas:', err)
        if (seqRef.current === seq) {
          setInvoices([])
          setValidationResult(validateStatusCode(500))
        }
      } finally {
        if (seqRef.current === seq) {
          setLoading(false)
        }
      }
    },
    [network.maxConcurrentRequests, skipEnrichment]
  )

  useEffect(() => {
    const seq = ++seqRef.current
    void loadInvoices(seq, false)

    return () => {
      seqRef.current += 1
    }
  }, [loadInvoices])

  const reload = useCallback(async () => {
    const seq = ++seqRef.current
    setLoading(true)
    await loadInvoices(seq, true)
  }, [loadInvoices])

  const counts = useMemo(() => {
    let buenEstado = 0
    let novedades = 0
    let totalAmount = 0

    for (const inv of invoices) {
      totalAmount += inv.amount
      if (inv.conditionTone === 'success') {
        buenEstado += 1
      } else {
        novedades += 1
      }
    }

    return {
      total: invoices.length,
      buenEstado,
      novedades,
      totalAmount,
    }
  }, [invoices])

  const filteredInvoices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()

    return invoices.filter((inv) => {
      if (conditionFilter === 'buen_estado' && inv.conditionTone !== 'success') {
        return false
      }
      if (conditionFilter === 'novedades' && inv.conditionTone === 'success') {
        return false
      }
      if (!q) return true

      return (
        inv.receiptCode.toLowerCase().includes(q) ||
        inv.guestNames.some((n) => n.toLowerCase().includes(q)) ||
        inv.roomLabel.toLowerCase().includes(q) ||
        inv.paymentLabel.toLowerCase().includes(q) ||
        inv.conditionLabel.toLowerCase().includes(q) ||
        inv.comments.toLowerCase().includes(q) ||
        inv.createdBy.toLowerCase().includes(q)
      )
    })
  }, [conditionFilter, invoices, searchQuery])

  return {
    invoices,
    filteredInvoices,
    loading,
    validationResult,
    searchQuery,
    setSearchQuery,
    conditionFilter,
    setConditionFilter,
    counts,
    reload,
  }
}
