import { Suspense, lazy, memo, type ComponentType } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBowlFood,
  faHashtag,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import { Skeleton } from '../../../../shared/loading/atoms/Skeleton';
import { formatearMonedaCOP } from '../../domain/item-menu';
import type { ServiceRequestItem } from '../../domain/pedidos-servicio-habitacion';
import type { PedidoProductoThumbnailProps } from '../atoms/PedidoProductoThumbnail';

export interface PedidoDetalleProductoCardProps {
  item: ServiceRequestItem;
  imageUrl?: string;
}

const FALLBACK_PRODUCT_IMG =
  'https://images.pexels.com/photos/6823326/pexels-photo-6823326.jpeg?auto=compress&cs=tinysrgb&w=400';

const LazyProductThumbnail = lazy<ComponentType<PedidoProductoThumbnailProps>>(
  async () => {
    try {
      const mod = await import('../atoms/PedidoProductoThumbnail');
      return { default: mod.PedidoProductoThumbnail };
    } catch (error) {
      console.error('Error loading PedidoProductoThumbnail:', error);
      const Fallback: ComponentType<PedidoProductoThumbnailProps> = () => (
        <FontAwesomeIcon
          icon={faBowlFood}
          className="size-5"
          aria-hidden="true"
        />
      );
      return { default: Fallback };
    }
  }
);

function parseNonNegativeNumber(rawValue: unknown): number {
  try {
    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed) || parsed < 0) return 0;
    return parsed;
  } catch {
    return 0;
  }
}

function formatCurrencySafe(amount: number): string {
  try {
    return formatearMonedaCOP(amount);
  } catch (error) {
    console.error('Error formatting item price:', error);
    return '$ 0';
  }
}

/**
 * Molécula: Card individual de cada producto solicitado en el modal de detalle.
 * Muestra imagen optimizada (<=160px), nombre, precio unitario, cantidad solicitada y total del producto.
 */
export const PedidoDetalleProductoCard = memo(
  function PedidoDetalleProductoCard({
    item,
    imageUrl = '',
  }: PedidoDetalleProductoCardProps) {
    const primaryUrl = imageUrl.trim();
    const hasImage = Boolean(primaryUrl);

    const quantity = parseNonNegativeNumber(item.amount);
    const unitPrice = parseNonNegativeNumber(item.price_unit);
    const itemTotal = quantity * unitPrice;
    const productName = item.name_snapshot?.trim() || 'Producto sin nombre';
    const productNote = item.note?.trim() || '';

    return (
      <article
        role="listitem"
        className="border-line bg-canvas/70 hover:border-primary/40 hover:bg-canvas flex flex-col gap-3 rounded-2xl border p-3.5 transition-colors sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex min-w-0 items-start gap-3.5">
          <div className="border-line bg-primary/10 text-primary relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl border">
            {hasImage ? (
              <Suspense
                fallback={
                  <Skeleton
                    variant="rectangular"
                    animation="none"
                    className="absolute inset-0 size-full"
                  />
                }
              >
                <LazyProductThumbnail
                  primaryUrl={primaryUrl}
                  alt={productName}
                  fallbackUrl={FALLBACK_PRODUCT_IMG}
                  maxDimension={160}
                />
              </Suspense>
            ) : (
              <FontAwesomeIcon
                icon={faBowlFood}
                className="size-5"
                aria-hidden="true"
              />
            )}
          </div>

          <div className="min-w-0 space-y-1.5">
            <h4
              title={productName}
              className="text-ink line-clamp-2 text-sm font-bold"
            >
              {productName}
            </h4>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="border-primary/25 bg-primary/10 text-primary inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-sans text-[11px] font-bold tabular-nums">
                <FontAwesomeIcon
                  icon={faHashtag}
                  className="size-2.5"
                  aria-hidden="true"
                />
                <span className="sr-only">Cantidad: </span>
                <span>{quantity}</span>
              </span>

              <span className="text-ink font-sans text-xs font-bold tabular-nums">
                <span className="sr-only">Precio unitario: </span>
                {formatCurrencySafe(unitPrice)}
              </span>
            </div>

            {productNote && (
              <p className="inline-flex items-start gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-800 dark:text-amber-200">
                <FontAwesomeIcon
                  icon={faTriangleExclamation}
                  className="mt-0.5 size-3 shrink-0"
                  aria-hidden="true"
                />
                <span className="sr-only">Nota: </span>
                <span>{productNote}</span>
              </p>
            )}
          </div>
        </div>

        <div className="border-line/60 flex shrink-0 items-center justify-end gap-2 border-t pt-2 sm:flex-col sm:items-end sm:justify-center sm:border-t-0 sm:pt-0">
          <span className="text-primary font-sans text-sm font-black tabular-nums">
            <span className="sr-only">Total del producto: </span>
            {formatCurrencySafe(itemTotal)}
          </span>
        </div>
      </article>
    );
  }
);
