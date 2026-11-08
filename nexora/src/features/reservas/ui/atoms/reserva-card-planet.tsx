import { useMemo } from 'react'
import { motion } from 'motion/react'
import { EarthGlobe } from '../../../../shared/earth-planet'
import { MarsGlobe } from '../../../../shared/mars-planet'
import { JupiterGlobe } from '../../../../shared/jupiter-planet'
import { SaturnGlobe } from '../../../../shared/saturn-planet'
import { UranusGlobe } from '../../../../shared/uranus-planet'
import { NeptuneGlobe } from '../../../../shared/neptune-planet'
import { PlutoGlobe } from '../../../../shared/pluto-planet'
import { VenusGlobe } from '../../../../shared/venus-planet'
import { cn } from '../../../../shared/lib/cn'

interface PlanetConfig {
  name: string
  render: (px: number) => React.ReactNode
}

/**
 * Catálogo de planetas disponibles en /shared:
 * - Tierra
 * - Marte
 * - Júpiter
 * - Saturno
 * - Urano
 * - Neptuno
 * - Plutón
 * - Venus
 */
const PLANET_CATALOG: PlanetConfig[] = [
  {
    name: 'Tierra',
    render: (px) => <EarthGlobe customPx={px} animated={true} />,
  },
  {
    name: 'Marte',
    render: (px) => <MarsGlobe customPx={px} animated={true} />,
  },
  {
    name: 'Júpiter',
    render: (px) => <JupiterGlobe customPx={px} animated={true} />,
  },
  {
    name: 'Saturno',
    render: (px) => <SaturnGlobe customPx={px} animated={true} />,
  },
  {
    name: 'Urano',
    render: (px) => <UranusGlobe customPx={px} animated={true} />,
  },
  {
    name: 'Neptuno',
    render: (px) => <NeptuneGlobe customPx={px} animated={true} />,
  },
  {
    name: 'Plutón',
    render: (px) => <PlutoGlobe customPx={px} animated={true} />,
  },
  {
    name: 'Venus',
    render: () => <VenusGlobe size="tiny" animated={true} />,
  },
]

/**
 * Función pura determinista para asignar un planeta de forma aleatoria y estable
 * a cada tarjeta a partir de su identificador.
 */
function getPlanetForId(id: string): PlanetConfig {
  let hash = 0
  const str = id || 'reserva-default-planet'
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  const index = Math.abs(hash) % PLANET_CATALOG.length
  return PLANET_CATALOG[index]
}

export interface ReservaCardPlanetProps {
  /** Identificador de la reserva para derivación pseudo-aleatoria estable */
  id?: string
  /** Tamaño del planeta en píxeles. @default 30 */
  size?: number
  /** Clases CSS adicionales */
  className?: string
}

/**
 * Átomo: Planeta aleatorio para tarjetas de reservas.
 * Ubicado en la esquina superior izquierda de cada tarjeta.
 *
 * Utiliza un algoritmo de dispersión determinista basado en el ID de la reserva,
 * garantizando que cada tarjeta tenga un planeta aleatorio y consistente sin
 * parpadeos ni cambios indeseados en re-renderizados de filtros o búsqueda.
 */
export function ReservaCardPlanet({ id = '', size = 30, className }: ReservaCardPlanetProps) {
  const planet = useMemo(() => getPlanetForId(id), [id])

  return (
    <motion.div
      whileHover={{ scale: 1.15, rotate: 6 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 350, damping: 18 }}
      className={cn(
        'relative shrink-0 flex items-center justify-center cursor-pointer select-none',
        className
      )}
      style={{ width: size, height: size }}
      title={`Planeta asignado: ${planet.name}`}
      aria-label={`Planeta asignado a la reserva: ${planet.name}`}
    >
      {planet.render(size)}
    </motion.div>
  )
}
