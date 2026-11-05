import { useState, useMemo } from 'react'
import {
  type ModuloCategoria,
  type PreferenciasHotel,
  type GrupoModulosFiltrado,
  PREFERENCIAS_HOTEL_DEFAULT,
  GRUPOS_CONFIGURACION,
} from '../domain/configuracion'
import { DASHBOARD_CARDS, type DashboardCardDefinition } from '../../dashboard/domain/dashboard-card'
import type { NavId } from '../../dashboard/ui/navigation'

export function useConfiguraciones() {
  const [categoriaActiva, setCategoriaActiva] = useState<ModuloCategoria>('todas')
  const [busqueda, setBusqueda] = useState('')
  const [preferencias, setPreferencias] = useState<PreferenciasHotel>(PREFERENCIAS_HOTEL_DEFAULT)

  // Mapa de tarjetas indexado por NavId para acceso O(1) y orden exacto por grupo
  const cardMap = useMemo(() => {
    const map = new Map<NavId, DashboardCardDefinition>()
    DASHBOARD_CARDS.forEach((card) => map.set(card.id, card))
    return map
  }, [])

  // Grupos organizados y filtrados según categoría activa y término de búsqueda
  const gruposFiltrados = useMemo((): GrupoModulosFiltrado[] => {
    const query = busqueda.toLowerCase().trim()

    return GRUPOS_CONFIGURACION.map((grupo) => {
      // Si hay una categoría específica seleccionada y no coincide con el grupo, se excluye
      if (categoriaActiva !== 'todas' && categoriaActiva !== grupo.categoria) {
        return { ...grupo, cards: [] }
      }

      // Obtener las tarjetas pertenecientes al grupo respetando su orden exacto
      const groupCards = grupo.modulosIds
        .map((id) => cardMap.get(id))
        .filter((card): card is DashboardCardDefinition => Boolean(card))

      // Aplicar filtro de búsqueda si el usuario ingresó texto
      const filteredCards = groupCards.filter((card) => {
        if (!query) return true
        const matchesTitle = card.title.toLowerCase().includes(query)
        const matchesSubtitle = card.subtitle.toLowerCase().includes(query)
        const matchesDescription = card.description.toLowerCase().includes(query)
        const matchesBadge = card.badgeText.toLowerCase().includes(query)
        return matchesTitle || matchesSubtitle || matchesDescription || matchesBadge
      })

      return {
        ...grupo,
        cards: filteredCards,
      }
    }).filter((grupo) => grupo.cards.length > 0)
  }, [categoriaActiva, busqueda, cardMap])

  // Lista plana de módulos filtrados en el orden estricto de las 4 categorías
  const modulosFiltrados = useMemo(() => {
    return gruposFiltrados.flatMap((g) => g.cards)
  }, [gruposFiltrados])

  const togglePreferencia = (clave: keyof PreferenciasHotel) => {
    setPreferencias((prev) => {
      if (typeof prev[clave] === 'boolean') {
        return { ...prev, [clave]: !prev[clave] }
      }
      return prev
    })
  }

  const setSedePredeterminada = (sedeId: string) => {
    setPreferencias((prev) => ({ ...prev, sedePredeterminadaId: sedeId }))
  }

  return {
    categoriaActiva,
    setCategoriaActiva,
    busqueda,
    setBusqueda,
    modulosFiltrados,
    gruposFiltrados,
    totalModulos: DASHBOARD_CARDS.length,
    preferencias,
    togglePreferencia,
    setSedePredeterminada,
  }
}
