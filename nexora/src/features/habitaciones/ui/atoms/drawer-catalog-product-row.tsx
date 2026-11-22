import { memo, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faRotateRight } from '@fortawesome/free-solid-svg-icons';
import { formatCurrencyCOP } from '../lib/formatters';
import type { MenuCatalogItem } from '../molecules/drawer-tab-consumptions';

export interface DrawerCatalogProductRowProps {
  product: MenuCatalogItem;
  addedQty: number;
  isOccupied: boolean;
  isAdding: boolean;
  isBusy: boolean;
  onAdd: (product: MenuCatalogItem) => Promise<void> | void;
}

/**
 * Átomo: Tarjeta individual de producto del catálogo para carga rápida en consumos.
 */
export const DrawerCatalogProductRow = memo(function DrawerCatalogProductRow({
  product,
  addedQty,
  isOccupied,
  isAdding,
  isBusy,
  onAdd,
}: DrawerCatalogProductRowProps) {
  const handleClick = useCallback(async () => {
    try {
      await onAdd(product);
    } catch (err) {
      console.error('Error al agregar producto del catálogo:', err);
    }
  }, [onAdd, product]);

  return (
    <div className="border-line bg-panel hover:border-primary/35 flex items-center justify-between gap-2 rounded-xl border p-2.5 transition-colors">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-ink truncate text-xs font-semibold">
            {product.name}
          </span>
          {addedQty > 0 && (
            <span className="bg-primary/10 text-primary shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold">
              {addedQty}x
            </span>
          )}
        </div>
        <div className="text-ink-muted text-[11px]">
          {formatCurrencyCOP(product.price)}
          {product.taxPercentage > 0
            ? ` (+${product.taxPercentage}% imp.)`
            : ''}
        </div>
      </div>

      <button
        type="button"
        disabled={!isOccupied || isBusy}
        onClick={() => void handleClick()}
        className={`inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
          isOccupied
            ? 'bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer'
            : 'bg-canvas text-ink-muted cursor-not-allowed opacity-60'
        }`}
      >
        <FontAwesomeIcon
          icon={isAdding ? faRotateRight : faPlus}
          className={`size-3 ${isAdding ? 'animate-spin' : ''}`}
          aria-hidden="true"
        />
        <span>{isAdding ? 'Cargando…' : 'Agregar'}</span>
      </button>
    </div>
  );
});

export default DrawerCatalogProductRow;
