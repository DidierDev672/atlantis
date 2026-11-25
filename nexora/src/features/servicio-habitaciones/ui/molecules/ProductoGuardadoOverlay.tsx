import { memo } from 'react'
import { ServicioHabitacionRocketOverlay } from './ServicioHabitacionRocketOverlay'

export interface ProductoGuardadoOverlayProps {
  visible: boolean
}

/**
 * Molécula: Overlay perezoso adaptado a GPU/VRAM mientras se envía el producto a POST /item-menu.
 */
export const ProductoGuardadoOverlay = memo(function ProductoGuardadoOverlay({
  visible,
}: ProductoGuardadoOverlayProps) {
  return (
    <ServicioHabitacionRocketOverlay
      visible={visible}
      zIndexClass="z-50"
      title="Registrando Producto"
      description="Guardando el producto en el catálogo, por favor espera un momento…"
    />
  )
})

export default ProductoGuardadoOverlay
