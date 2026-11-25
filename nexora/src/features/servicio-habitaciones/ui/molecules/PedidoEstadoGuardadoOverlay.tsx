import { memo } from 'react'
import { ServicioHabitacionRocketOverlay } from './ServicioHabitacionRocketOverlay'

export interface PedidoEstadoGuardadoOverlayProps {
  visible: boolean
}

/**
 * Molécula: Overlay modal adaptado a GPU/VRAM mientras se envía `PUT /service-requests/{id}`.
 */
export const PedidoEstadoGuardadoOverlay = memo(
  function PedidoEstadoGuardadoOverlay({
    visible,
  }: PedidoEstadoGuardadoOverlayProps) {
    return (
      <ServicioHabitacionRocketOverlay
        visible={visible}
        zIndexClass="z-60"
        title="Guardando Estado del Pedido"
        description="Construyendo y enviando la actualización a cocina, por favor espera un momento…"
      />
    )
  },
)

export default PedidoEstadoGuardadoOverlay
