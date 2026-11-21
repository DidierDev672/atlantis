import { memo, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDoorOpen,
  faIdCard,
  faPhone,
  faUser,
} from '@fortawesome/free-solid-svg-icons';
import { Loading } from '../../../../shared/loading';
import {
  getCachedPersonaBasicaPedido,
  resolverDetalleHuespedPorId,
  type PersonaBasicaPedido,
} from '../../infrastructure/pedidos-metadatos-resolver';

export interface PedidoCardHuespedSectionProps {
  personId: string;
  habitacionEtiqueta?: string;
}

/**
 * Molécula: Sección del solicitante en la tarjeta de pedido.
 * Reutiliza la caché compartida (`/persons` batch + deduplicación `/person/{id}`)
 * evitando peticiones repetidas cuando se montan múltiples tarjetas.
 */
export const PedidoCardHuespedSection = memo(function PedidoCardHuespedSection({
  personId,
  habitacionEtiqueta,
}: PedidoCardHuespedSectionProps) {
  const cleanId = personId?.trim() || '';
  const cachedSync = getCachedPersonaBasicaPedido(cleanId);

  const [personaEstado, setPersonaEstado] = useState<{
    resolvedForId: string | null;
    persona: PersonaBasicaPedido | null;
  }>(() => ({
    resolvedForId: cachedSync ? cleanId : null,
    persona: cachedSync,
  }));

  const tienePersonId = Boolean(cleanId);
  const cargandoPersona =
    tienePersonId && !cachedSync && personaEstado.resolvedForId !== cleanId;
  const persona =
    cachedSync ??
    (tienePersonId && personaEstado.resolvedForId === cleanId
      ? personaEstado.persona
      : null);

  useEffect(() => {
    if (!cleanId || getCachedPersonaBasicaPedido(cleanId)) return;

    let activo = true;
    void resolverDetalleHuespedPorId(cleanId)
      .then((data) => {
        if (!activo) return;
        setPersonaEstado({ resolvedForId: cleanId, persona: data });
      })
      .catch(() => {
        if (!activo) return;
        setPersonaEstado({ resolvedForId: cleanId, persona: null });
      });

    return () => {
      activo = false;
    };
  }, [cleanId]);

  return (
    <section
      aria-label="Información del solicitante"
      className="border-line/70 bg-canvas/50 rounded-2xl border px-3.5 py-3 text-xs"
    >
      <AnimatePresence mode="wait" initial={false}>
        {cargandoPersona ? (
          <motion.div
            key="persona-loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="flex items-center justify-between gap-2"
          >
            <Loading
              variant="inline"
              delay={0}
              minDuration={250}
              label="Cargando datos del huésped…"
            />
            {habitacionEtiqueta && (
              <div className="text-ink-muted flex items-center gap-1.5 font-mono text-[11px] font-semibold">
                <FontAwesomeIcon
                  icon={faDoorOpen}
                  className="text-primary size-3"
                />
                <span className="max-w-36 truncate" title={habitacionEtiqueta}>
                  {habitacionEtiqueta}
                </span>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="persona-loaded"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="space-y-2"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <FontAwesomeIcon
                  icon={faUser}
                  className="text-primary size-3.5 shrink-0"
                />
                <div className="min-w-0">
                  <span className="text-ink-muted block font-mono text-[10px] tracking-wider uppercase">
                    Huésped
                  </span>
                  <span
                    className="text-ink block truncate font-mono font-bold"
                    title={persona?.name || 'Huésped Titular'}
                  >
                    {persona?.name || 'Huésped Titular'}
                  </span>
                </div>
              </div>

              {habitacionEtiqueta && (
                <div className="text-ink-muted flex items-center gap-1.5 font-mono text-[11px] font-semibold">
                  <FontAwesomeIcon
                    icon={faDoorOpen}
                    className="text-primary size-3"
                  />
                  <span className="max-w-44 truncate" title={habitacionEtiqueta}>
                    {habitacionEtiqueta}
                  </span>
                </div>
              )}
            </div>

            {(persona?.document_number || persona?.phone_number) && (
              <div className="border-line/60 text-ink-muted flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t pt-2 font-mono text-[11px]">
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
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
});
