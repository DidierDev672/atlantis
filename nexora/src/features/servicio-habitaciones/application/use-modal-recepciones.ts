import { useState, useEffect, useMemo, useCallback } from 'react'
import type { StatusCodeValidationResult } from '../../../shared/lib/status-code-validator'
import {
  formatBuilding,
  formatRoomType,
  type RecepcionSeleccionada,
} from '../domain/estadias-recepcion'
import { fetchRecepcionesEnriquecidas } from '../infrastructure/api-estadias-recepcion-repository'

/**
 * Hook de aplicación que orquesta la carga deduplicada/balanceada y filtrado de recepciones.
 */
export function useModalRecepciones(isOpen: boolean) {
  const [estado, setEstado] = useState<{
    loaded: boolean
    recepciones: RecepcionSeleccionada[]
    feedback: StatusCodeValidationResult | null
  }>({
    loaded: false,
    recepciones: [],
    feedback: null,
  })
  const [reloading, setReloading] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [feedbackOculto, setFeedbackOculto] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    let activo = true
    void fetchRecepcionesEnriquecidas().then(({ recepciones, feedback }) => {
      if (!activo) return
      setEstado({ loaded: true, recepciones, feedback })
      setFeedbackOculto(false)
    })

    return () => {
      activo = false
    }
  }, [isOpen])

  const recargar = useCallback(async () => {
    setReloading(true)
    setFeedbackOculto(false)
    const { recepciones, feedback } = await fetchRecepcionesEnriquecidas({
      forceRefresh: true,
    })
    setEstado({ loaded: true, recepciones, feedback })
    setReloading(false)
  }, [])

  const loading = reloading || (isOpen && !estado.loaded)
  const feedback = feedbackOculto ? null : estado.feedback

  const filtradas = useMemo(() => {
    const q = busqueda.toLowerCase().trim()
    if (!q) return estado.recepciones

    return estado.recepciones.filter((r) => {
      const p = r.person
      const rm = r.room
      return (
        p?.name?.toLowerCase().includes(q) ||
        p?.document_number?.toLowerCase().includes(q) ||
        p?.phone_number?.toLowerCase().includes(q) ||
        p?.email?.toLowerCase().includes(q) ||
        rm?.number?.toLowerCase().includes(q) ||
        (rm?.floor !== undefined && String(rm.floor).includes(q)) ||
        (rm?.building_id && formatBuilding(rm.building_id).toLowerCase().includes(q)) ||
        (rm?.room_types_id && formatRoomType(rm.room_types_id).toLowerCase().includes(q)) ||
        r.huespedNombre.toLowerCase().includes(q) ||
        r.habitacionNumero.toLowerCase().includes(q)
      )
    })
  }, [estado.recepciones, busqueda])

  return {
    recepciones: estado.recepciones,
    filtradas,
    loading,
    feedback,
    cerrarFeedback: () => setFeedbackOculto(true),
    busqueda,
    setBusqueda,
    recargar,
  }
}
