import { memo, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import {
  ESTADOS_PEDIDO_CONFIG,
  type EstadoPedido,
} from '../../domain/pedidos-servicio-habitacion';

export interface PedidoEstadoDropdownMenuProps {
  estadoActual: EstadoPedido;
  onChangeEstado?: (nuevoEstado: EstadoPedido) => void;
}

/**
 * Átomo: Menú desplegable perezoso (`React.lazy`) y memorizado (`React.memo`)
 * para seleccionar el nuevo estado de una comanda KDS.
 */
export const PedidoEstadoDropdownMenu = memo(function PedidoEstadoDropdownMenu({
  estadoActual,
  onChangeEstado,
}: PedidoEstadoDropdownMenuProps) {
  const handleSelect = useCallback(
    (estadoKey: EstadoPedido) => {
      try {
        onChangeEstado?.(estadoKey);
      } catch (error) {
        console.error('Error al seleccionar estado de comanda:', error);
      }
    },
    [onChangeEstado]
  );

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="border-line bg-panel text-ink absolute top-full right-0 z-40 mt-1.5 w-44 space-y-0.5 rounded-2xl border p-1.5 font-mono text-xs shadow-xl"
    >
      <div className="text-ink-muted border-line/60 border-b px-2 py-1 text-[9px] font-black tracking-wider uppercase">
        Actualizar Estado
      </div>
      {(Object.keys(ESTADOS_PEDIDO_CONFIG) as EstadoPedido[]).map(
        (estadoKey) => {
          const conf = ESTADOS_PEDIDO_CONFIG[estadoKey];
          const esSeleccionado = estadoActual === estadoKey;

          return (
            <button
              key={estadoKey}
              type="button"
              onClick={() => handleSelect(estadoKey)}
              className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl px-2.5 py-1.5 text-left text-[10px] font-bold transition-colors ${
                esSeleccionado
                  ? 'bg-primary text-white shadow-2xs'
                  : 'hover:bg-line/40 text-ink'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <FontAwesomeIcon icon={conf.icon} className="size-2.5" />
                <span>{conf.label}</span>
              </span>
              {esSeleccionado && (
                <FontAwesomeIcon icon={faCheck} className="size-2.5" />
              )}
            </button>
          );
        }
      )}
    </div>
  );
});
