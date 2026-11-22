import {
  Suspense,
  lazy,
  memo,
  useCallback,
  useDeferredValue,
  useMemo,
  useState,
} from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBagShopping,
  faRotateRight,
  faUtensils,
} from '@fortawesome/free-solid-svg-icons';
import {
  isHabitacionOcupada,
  type RoomRow,
} from '../../domain/habitacion-lista';
import { formatCurrencyCOP } from '../lib/formatters';

const LazyDrawerConsumptionsSearchBar = lazy(
  () => import('./drawer-consumptions-search-bar')
);
const LazyDrawerCatalogProductRow = lazy(
  () => import('../atoms/drawer-catalog-product-row')
);
const LazyDrawerPendingOrderCard = lazy(
  () => import('./drawer-pending-order-card')
);

export interface MenuCatalogItem {
  id: string;
  name: string;
  price: number;
  taxPercentage: number;
}

export interface RegisteredConsumptionItem {
  id: string;
  menuItemId?: string;
  name: string;
  amount: number;
  priceUnit: number;
  taxPercentage?: number;
  createdAt?: string;
}

export interface DrawerTabConsumptionsProps {
  room: RoomRow;
  menuItems: MenuCatalogItem[];
  consumptions: RegisteredConsumptionItem[];
  pendingConsumptions?: RegisteredConsumptionItem[];
  loadingMenu: boolean;
  addingItemId: string | null;
  updatingConsumptionId?: string | null;
  actionLoading?: boolean;
  onAddConsumption: (item: MenuCatalogItem) => Promise<void> | void;
  onUpdateConsumptionQty?: (
    consumptionId: string,
    delta: 1 | -1
  ) => Promise<void> | void;
  onClearConsumptions?: () => Promise<void> | void;
  onConfirmPendingConsumptions?: () => Promise<void> | void;
}

/**
 * Molécula: Pestaña 'Consumos' del Drawer Operativo con búsqueda en tiempo real
 * y bandeja agrupada por confirmar (1 único POST /service-request por pedido).
 */
export const DrawerTabConsumptions = memo(function DrawerTabConsumptions({
  room,
  menuItems,
  consumptions,
  pendingConsumptions = [],
  loadingMenu,
  addingItemId,
  updatingConsumptionId = null,
  actionLoading = false,
  onAddConsumption,
  onUpdateConsumptionQty,
  onClearConsumptions,
  onConfirmPendingConsumptions,
}: DrawerTabConsumptionsProps) {
  const isOccupied = isHabitacionOcupada(room.status);
  const [searchQuery, setSearchQuery] = useState('');
  const deferredQuery = useDeferredValue(searchQuery);

  const filteredMenuItems = useMemo(() => {
    try {
      const normalized = deferredQuery.trim().toLowerCase();
      if (!normalized) return menuItems;
      return menuItems.filter(
        (item) =>
          item.name.toLowerCase().includes(normalized) ||
          String(item.price).includes(normalized)
      );
    } catch {
      return menuItems;
    }
  }, [deferredQuery, menuItems]);

  const { pendingUnits, pendingTotal, qtyByCatalogKey } = useMemo(() => {
    const qtyMap = new Map<string, number>();
    let units = 0;
    let total = 0;
    for (const item of pendingConsumptions) {
      units += item.amount;
      total += item.priceUnit * item.amount;
      const key = item.menuItemId ?? `${item.name}::${item.priceUnit}`;
      qtyMap.set(key, (qtyMap.get(key) ?? 0) + item.amount);
    }
    return {
      pendingUnits: units,
      pendingTotal: total,
      qtyByCatalogKey: qtyMap,
    };
  }, [pendingConsumptions]);

  const confirmedTotal = useMemo(
    () => consumptions.reduce((acc, c) => acc + c.priceUnit * c.amount, 0),
    [consumptions]
  );

  const handleAddClick = useCallback(
    async (prod: MenuCatalogItem) => {
      try {
        await onAddConsumption(prod);
      } catch (err) {
        console.error('Error al agregar consumo:', err);
      }
    },
    [onAddConsumption]
  );

  const handleClearAll = useCallback(async () => {
    if (!onClearConsumptions) return;
    try {
      await onClearConsumptions();
    } catch (err) {
      console.error('Error al vaciar consumos:', err);
    }
  }, [onClearConsumptions]);

  const handleConfirmOrder = useCallback(async () => {
    if (!onConfirmPendingConsumptions) return;
    try {
      await onConfirmPendingConsumptions();
    } catch (err) {
      console.error('Error al confirmar pedido agrupado:', err);
    }
  }, [onConfirmPendingConsumptions]);

  const handleUpdateQty = useCallback(
    async (consumptionId: string, delta: 1 | -1) => {
      if (!onUpdateConsumptionQty) return;
      try {
        await onUpdateConsumptionQty(consumptionId, delta);
      } catch (err) {
        console.error('Error al cambiar cantidad:', err);
      }
    },
    [onUpdateConsumptionQty]
  );

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  return (
    <div className="space-y-4">
      <section className="space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-ink-muted flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase">
            <FontAwesomeIcon icon={faUtensils} className="size-3.5" />
            <span>Catálogo Room Service</span>
          </h4>
          {menuItems.length > 0 && (
            <span className="bg-canvas border-line text-ink-muted rounded-full border px-2 py-0.5 text-[10px] font-semibold">
              {menuItems.length} disp.
            </span>
          )}
        </div>

        {loadingMenu ? (
          <div className="text-ink-muted flex items-center justify-center gap-2 py-6 text-xs">
            <FontAwesomeIcon
              icon={faRotateRight}
              className="size-3.5 animate-spin"
            />
            <span>Cargando catálogo del menú…</span>
          </div>
        ) : menuItems.length === 0 ? (
          <p className="border-line text-ink-muted rounded-xl border border-dashed py-4 text-center text-xs">
            No hay productos disponibles en el menú activo.
          </p>
        ) : (
          <div className="space-y-2.5">
            <Suspense
              fallback={
                <div className="bg-line/40 h-9 w-full animate-pulse rounded-xl" />
              }
            >
              <LazyDrawerConsumptionsSearchBar
                value={searchQuery}
                matchedCount={filteredMenuItems.length}
                totalCount={menuItems.length}
                onChange={setSearchQuery}
                onClear={handleClearSearch}
              />
            </Suspense>

            {filteredMenuItems.length === 0 ? (
              <div className="border-line text-ink-muted rounded-xl border border-dashed px-3 py-4 text-center text-xs">
                <p>No se encontraron productos para &ldquo;{searchQuery}&rdquo;.</p>
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="text-primary mt-1.5 cursor-pointer text-[11px] font-semibold hover:underline"
                >
                  Limpiar búsqueda
                </button>
              </div>
            ) : (
              <Suspense
                fallback={
                  <div className="bg-line/30 h-20 w-full animate-pulse rounded-xl" />
                }
              >
                <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
                  {filteredMenuItems.map((prod) => {
                    const addedQty =
                      qtyByCatalogKey.get(prod.id) ??
                      qtyByCatalogKey.get(`${prod.name}::${prod.price}`) ??
                      0;
                    return (
                      <LazyDrawerCatalogProductRow
                        key={prod.id}
                        product={prod}
                        addedQty={addedQty}
                        isOccupied={isOccupied}
                        isAdding={addingItemId === prod.id}
                        isBusy={Boolean(addingItemId) || actionLoading}
                        onAdd={handleAddClick}
                      />
                    );
                  })}
                </div>
              </Suspense>
            )}
          </div>
        )}

        {!isOccupied && (
          <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
            * La habitación debe estar Ocupada (Check-In activo) para cargar
            consumos.
          </p>
        )}
      </section>

      <Suspense fallback={null}>
        <LazyDrawerPendingOrderCard
          pendingConsumptions={pendingConsumptions}
          pendingUnits={pendingUnits}
          pendingTotal={pendingTotal}
          isOccupied={isOccupied}
          actionLoading={actionLoading}
          updatingConsumptionId={updatingConsumptionId}
          onUpdateQty={handleUpdateQty}
          onClear={onClearConsumptions ? handleClearAll : undefined}
          onConfirm={onConfirmPendingConsumptions ? handleConfirmOrder : undefined}
        />
      </Suspense>

      <section className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-ink-muted flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase">
            <FontAwesomeIcon icon={faBagShopping} className="size-3.5" />
            <span>Consumos Confirmados</span>
          </h4>
          {consumptions.length > 0 && (
            <span className="text-ink text-xs font-bold">
              {formatCurrencyCOP(confirmedTotal)}
            </span>
          )}
        </div>

        {consumptions.length === 0 ? (
          <p className="border-line text-ink-muted rounded-xl border border-dashed py-4 text-center text-xs">
            No hay consumos confirmados en esta estadía.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {consumptions.map((c) => (
              <li
                key={c.id}
                className="border-line/70 bg-canvas/70 flex items-center justify-between rounded-xl border px-3 py-2 text-xs"
              >
                <div className="min-w-0 pr-2">
                  <p className="text-ink truncate font-semibold">
                    {c.amount}x {c.name}
                  </p>
                  <p className="text-ink-muted text-[10px]">
                    {formatCurrencyCOP(c.priceUnit)} c/u
                  </p>
                </div>
                <span className="text-ink shrink-0 font-bold">
                  {formatCurrencyCOP(c.priceUnit * c.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
});

export default DrawerTabConsumptions;
