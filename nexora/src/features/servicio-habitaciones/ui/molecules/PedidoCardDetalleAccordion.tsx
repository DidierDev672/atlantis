import { memo, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTag,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import { Loading } from '../../../../shared/loading';
import { Accordion, type AccordionItem } from '../../../../shared/ui';
import { useBalancedProductImage } from '../../application/use-balanced-product-image';
import { formatearMonedaCOP } from '../../domain/item-menu';
import type { ServiceRequestItem } from '../../domain/pedidos-servicio-habitacion';
import {
  resolverCategoriaPorItemMenuId,
  type CategoriaMenuPedidoInfo,
} from '../../infrastructure/pedidos-metadatos-resolver';
import { CubiertosRozandoAnimados } from '../atoms/CubiertosRozandoAnimados';

const DEFAULT_CATEGORY_THUMB =
  'https://images.pexels.com/photos/1855214/pexels-photo-1855214.jpeg?auto=compress&cs=tinysrgb&w=160';

const CategoriaMiniaturaBalanceada = memo(function CategoriaMiniaturaBalanceada({
  assetUrl,
  alt,
}: {
  assetUrl: string;
  alt: string;
}) {
  const { activeSrc, handleImageError } = useBalancedProductImage(
    assetUrl,
    DEFAULT_CATEGORY_THUMB,
    160
  );

  if (!activeSrc) {
    return <FontAwesomeIcon icon={faTag} className="size-3 shrink-0" />;
  }

  return (
    <img
      src={activeSrc}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={handleImageError}
      className="size-4 shrink-0 rounded-full object-cover"
    />
  );
});

const ProductoCategoriaBadge = memo(function ProductoCategoriaBadge({
  itemMenuId,
}: {
  itemMenuId: string;
}) {
  const [estado, setEstado] = useState<{
    resolvedForId: string | null;
    categoria: CategoriaMenuPedidoInfo | null;
  }>({ resolvedForId: null, categoria: null });

  const tieneId = Boolean(
    itemMenuId && itemMenuId.trim() && itemMenuId !== 'N/A'
  );
  const cargando = tieneId && estado.resolvedForId !== itemMenuId;
  const categoria =
    tieneId && estado.resolvedForId === itemMenuId ? estado.categoria : null;

  useEffect(() => {
    if (!tieneId) return;

    let activo = true;
    void resolverCategoriaPorItemMenuId(itemMenuId)
      .then((data) => {
        if (!activo) return;
        setEstado({ resolvedForId: itemMenuId, categoria: data });
      })
      .catch(() => {
        if (!activo) return;
        setEstado({ resolvedForId: itemMenuId, categoria: null });
      });

    return () => {
      activo = false;
    };
  }, [itemMenuId, tieneId]);

  if (!tieneId) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <span className="text-ink-muted">Categoría / Servicio:</span>

      <AnimatePresence mode="wait" initial={false}>
        {cargando ? (
          <motion.div
            key="categoria-loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
          >
            <Loading
              variant="inline"
              delay={0}
              minDuration={200}
              label="Cargando categoría…"
              className="py-0"
            />
          </motion.div>
        ) : categoria ? (
          <motion.div
            key={`categoria-${categoria.name}`}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="bg-primary/10 text-primary border-primary/20 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-bold"
          >
            {categoria.asset ? (
              <CategoriaMiniaturaBalanceada
                assetUrl={categoria.asset}
                alt={categoria.name}
              />
            ) : (
              <FontAwesomeIcon icon={faTag} className="size-3 shrink-0" />
            )}
            <span className="max-w-44 truncate">{categoria.name}</span>
          </motion.div>
        ) : (
          <motion.span
            key="categoria-fallback"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-ink font-semibold"
          >
            Servicio de Habitación
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
});

export interface PedidoCardDetalleAccordionProps {
  detalleItems: ReadonlyArray<ServiceRequestItem>;
  singleOpenDetalle?: boolean;
}

/**
 * Molécula: Acordeón de ítems del pedido con miniaturas balanceadas (`<=160px`)
 * y resolución compartida de categoría sin consultas redundantes por tarjeta.
 */
export const PedidoCardDetalleAccordion = memo(
  function PedidoCardDetalleAccordion({
    detalleItems,
    singleOpenDetalle = false,
  }: PedidoCardDetalleAccordionProps) {
    const accordionItems = useMemo<AccordionItem[]>(
      () =>
        detalleItems.map((item, idx): AccordionItem => {
          const cantidad = Number(item.amount) || 0;
          const precioUnitario = Number(item.price_unit) || 0;
          const subtotalItem = cantidad * precioUnitario;

          return {
            id: `${item.item_menu_id}-${idx}`,
            title: (
              <div className="flex items-center justify-between gap-2.5">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="bg-primary/15 text-primary inline-flex h-6 min-w-7 shrink-0 items-center justify-center rounded-lg px-1.5 font-mono text-[11px] font-black">
                    {cantidad}x
                  </span>
                  <span className="text-ink truncate text-xs font-bold sm:text-sm">
                    {item.name_snapshot}
                  </span>
                  {item.note && item.note.trim() && (
                    <FontAwesomeIcon
                      icon={faTriangleExclamation}
                      className="size-3 shrink-0 text-red-500"
                      title="Incluye nota de preparación"
                    />
                  )}
                </div>

                <span className="text-ink shrink-0 font-mono text-xs font-extrabold">
                  {formatearMonedaCOP(subtotalItem)}
                </span>
              </div>
            ),
            content: (
              <div className="space-y-2 font-mono text-[11px]">
                <ProductoCategoriaBadge itemMenuId={item.item_menu_id} />

                <div className="text-ink-muted flex flex-wrap items-center justify-between gap-2">
                  <span>Cantidad: {cantidad}</span>
                  <span>
                    Unitario:{' '}
                    <strong className="text-ink">
                      {formatearMonedaCOP(precioUnitario)}
                    </strong>
                  </span>
                </div>

                <div className="text-ink-muted flex items-center justify-between">
                  <span>Producto: {item.name_snapshot}</span>
                  <span>
                    Subtotal:{' '}
                    <strong className="text-ink">
                      {formatearMonedaCOP(subtotalItem)}
                    </strong>
                  </span>
                </div>

                {item.note && item.note.trim() && (
                  <p className="flex items-start gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-red-700 dark:text-red-300">
                    <FontAwesomeIcon
                      icon={faTriangleExclamation}
                      className="mt-0.5 size-3 shrink-0"
                    />
                    <span>{item.note}</span>
                  </p>
                )}
              </div>
            ),
          };
        }),
      [detalleItems]
    );

    return (
      <section aria-label="Detalle del pedido" className="space-y-2.5">
        <div className="text-ink-muted flex items-center justify-between font-mono text-[11px] font-bold tracking-wider uppercase">
          <motion.span
            initial="rest"
            animate="rest"
            whileHover="hover"
            className="inline-flex cursor-pointer items-center gap-1.5"
          >
            <CubiertosRozandoAnimados className="text-primary" />
            <span>Detalle del Producto</span>
          </motion.span>
        </div>

        <Accordion singleOpen={singleOpenDetalle} items={accordionItems} />
      </section>
    );
  }
);
