import { motion } from 'motion/react'
import {
  LayoutViewSwitch,
  type LayoutViewMode,
} from '../atoms/LayoutViewSwitch'

export interface ProductosVisualizacionNavbarProps {
  viewMode: LayoutViewMode
  onViewModeChange: (mode: LayoutViewMode) => void
  totalProductos?: number
  className?: string
}

/**
 * Molécula: Barra de navegación flotante para alternar la visualización
 * de los productos entre Grid (Cuadrícula, por defecto) y Masonry (Cascada).
 */
export function ProductosVisualizacionNavbar({
  viewMode,
  onViewModeChange,
  className = '',
}: ProductosVisualizacionNavbarProps) {
  return (
    <motion.nav
      aria-label="Selector flotante de visualización"
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-30 inline-flex items-center select-none ${className}`}
    >
      <LayoutViewSwitch
        mode={viewMode}
        onChange={onViewModeChange}
        className="border-line/80 bg-panel/90 shadow-xl shadow-black/15 backdrop-blur-md"
      />
    </motion.nav>
  )
}
