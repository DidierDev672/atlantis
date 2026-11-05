import { motion } from 'motion/react'
import { fadeIn } from '../../../design-tokens/motion'
import type { NavId } from '../../dashboard/ui/navigation'
import { useConfiguraciones } from '../application/use-configuraciones'
import { ConfiguracionesHeader } from './molecules/configuraciones-header'
import { ModulosHotelSection } from './organisms/modulos-hotel-section'

export interface ConfiguracionesPageProps {
  onNavigate: (id: NavId) => void
}

export function ConfiguracionesPage({ onNavigate }: ConfiguracionesPageProps) {
  const {
    categoriaActiva,
    setCategoriaActiva,
    busqueda,
    setBusqueda,
    modulosFiltrados,
    gruposFiltrados,
    totalModulos,
  } = useConfiguraciones()

  return (
    <main
      aria-label="Panel de configuraciones y módulos"
      className="space-y-8 pb-10"
    >
      {/* 1. Encabezado principal con animación slide-in */}
      <ConfiguracionesHeader
        totalModulos={totalModulos}
        direction="izq"
        duration={0.6}
      />

      {/* 2. Sección principal: Módulos del hotel organizados por categorías temáticas */}
      <motion.div
        variants={fadeIn}
        initial="hidden"
        animate="visible"
      >
        <ModulosHotelSection
          onNavigate={onNavigate}
          modulos={modulosFiltrados}
          grupos={gruposFiltrados}
          busqueda={busqueda}
          onBusquedaChange={setBusqueda}
          categoriaActiva={categoriaActiva}
          onCategoriaChange={setCategoriaActiva}
          totalModulos={totalModulos}
        />
      </motion.div>
    </main>
  )
}
