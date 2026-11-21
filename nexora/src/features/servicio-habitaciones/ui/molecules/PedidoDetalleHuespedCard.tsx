import { memo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDoorOpen,
  faEnvelope,
  faIdCard,
  faPhone,
  faUser,
} from '@fortawesome/free-solid-svg-icons';
import { Skeleton } from '../../../../shared/loading/atoms/Skeleton';
import type { PersonaBasicaPedido } from '../../infrastructure/pedidos-metadatos-resolver';

export interface PedidoDetalleHuespedCardProps {
  huespedNombreFallback: string;
  persona: PersonaBasicaPedido | null;
  habitacionEtiqueta: string;
  cargando: boolean;
}

/**
 * Molécula: Tarjeta compacta con la información básica del huésped dentro del modal de detalle.
 */
export const PedidoDetalleHuespedCard = memo(function PedidoDetalleHuespedCard({
  huespedNombreFallback,
  persona,
  habitacionEtiqueta,
  cargando,
}: PedidoDetalleHuespedCardProps) {
  const nombreMostrado = persona?.name || huespedNombreFallback;

  return (
    <section
      aria-label="Información básica del huésped"
      className="border-line bg-canvas/60 rounded-2xl border p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="bg-primary/15 text-primary grid size-10 shrink-0 place-items-center rounded-xl">
            <FontAwesomeIcon
              icon={faUser}
              className="size-4"
              aria-hidden="true"
            />
          </div>

          <div className="min-w-0">
            <span className="text-ink-muted block text-[10px] font-bold tracking-wider uppercase">
              Información del huésped
            </span>
            <h4 className="text-ink truncate text-sm font-bold sm:text-base">
              {nombreMostrado}
            </h4>
          </div>
        </div>

        <span className="border-line bg-panel text-ink inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold">
          <FontAwesomeIcon
            icon={faDoorOpen}
            className="text-primary size-3 shrink-0"
          />
          <span className="max-w-52 truncate">{habitacionEtiqueta}</span>
        </span>
      </div>

      {cargando && !persona ? (
        <div className="mt-3 flex gap-2">
          <Skeleton
            variant="rectangular"
            animation="none"
            className="h-5 w-28 rounded-lg"
          />
          <Skeleton
            variant="rectangular"
            animation="none"
            className="h-5 w-32 rounded-lg"
          />
        </div>
      ) : (
        persona &&
        (persona.document_number || persona.phone_number || persona.email) && (
          <div className="text-ink-muted border-line/60 mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t pt-2.5 text-xs">
            {persona.document_number && (
              <span className="inline-flex items-center gap-1.5">
                <FontAwesomeIcon
                  icon={faIdCard}
                  className="text-primary size-3 shrink-0"
                />
                <span>{persona.document_number}</span>
              </span>
            )}

            {persona.phone_number && (
              <span className="inline-flex items-center gap-1.5">
                <FontAwesomeIcon
                  icon={faPhone}
                  className="text-primary size-3 shrink-0"
                />
                <span>{persona.phone_number}</span>
              </span>
            )}

            {persona.email && (
              <span className="inline-flex items-center gap-1.5">
                <FontAwesomeIcon
                  icon={faEnvelope}
                  className="text-primary size-3 shrink-0"
                />
                <span className="max-w-56 truncate">{persona.email}</span>
              </span>
            )}
          </div>
        )
      )}
    </section>
  );
});
