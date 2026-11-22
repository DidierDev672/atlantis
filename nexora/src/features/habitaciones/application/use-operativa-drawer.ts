import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../../lib/api';
import {
  isHabitacionOcupada,
  type RoomRow,
} from '../domain/habitacion-lista';
import { fetchAvailableItemMenuCached } from '../infrastructure/sedes-and-menu-cache';
import type {
  MenuCatalogItem,
  RegisteredConsumptionItem,
} from '../ui/molecules/drawer-tab-consumptions';
import type { ActiveStaySummary } from '../ui/molecules/drawer-tab-summary';
import type { DrawerTabKey } from '../ui/organisms/habitacion-operativa-drawer';
import {
  fetchOperativaStaySnapshotCached,
  invalidateOperativaStayCache,
} from './operativa-stay-cache';

export function useOperativaDrawer(
  room: RoomRow | null,
  nightlyRate: number,
  onChangeStatus: (room: RoomRow, newStatus: string) => Promise<void> | void,
  onClose: () => void
) {
  const roomId = room?.id ?? '';
  const [tabState, setTabState] = useState<{
    roomId: string;
    tab: DrawerTabKey;
  }>({ roomId: '', tab: 'summary' });
  const [stayState, setStayState] = useState<{
    roomId: string;
    summary: ActiveStaySummary | null;
    consumptions: RegisteredConsumptionItem[];
    pendingConsumptions: RegisteredConsumptionItem[];
    personId: string;
    loading: boolean;
  }>({
    roomId: '',
    summary: null,
    consumptions: [],
    pendingConsumptions: [],
    personId: '',
    loading: false,
  });

  const [menuItems, setMenuItems] = useState<MenuCatalogItem[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [addingItemId, setAddingItemId] = useState<string | null>(null);
  const [updatingConsumptionId, setUpdatingConsumptionId] = useState<
    string | null
  >(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackState, setFeedbackState] = useState<{
    roomId: string;
    msg: string | null;
  }>({ roomId: '', msg: null });

  const activeTab: DrawerTabKey =
    tabState.roomId === roomId ? tabState.tab : 'summary';
  const setActiveTab = useCallback(
    (tab: DrawerTabKey) => {
      setTabState({ roomId, tab });
    },
    [roomId]
  );

  const feedbackMsg = feedbackState.roomId === roomId ? feedbackState.msg : null;
  const staySummary = stayState.roomId === roomId ? stayState.summary : null;
  const consumptions = useMemo(
    () => (stayState.roomId === roomId ? stayState.consumptions : []),
    [roomId, stayState.consumptions, stayState.roomId]
  );
  const pendingConsumptions = useMemo(
    () => (stayState.roomId === roomId ? stayState.pendingConsumptions : []),
    [roomId, stayState.pendingConsumptions, stayState.roomId]
  );
  const personId = stayState.roomId === roomId ? stayState.personId : '';
  const isOccupied = Boolean(room && isHabitacionOcupada(room.status));
  const loadingStay =
    Boolean(room && isOccupied && stayState.roomId !== room.id) ||
    (stayState.roomId === roomId && stayState.loading);

  useEffect(() => {
    if (!room || !isHabitacionOcupada(room.status)) return;

    let active = true;
    const targetRoomId = room.id;

    void (async () => {
      try {
        const snapshot = await fetchOperativaStaySnapshotCached(
          targetRoomId,
          nightlyRate,
          false
        );
        if (!active) return;
        setStayState((prev) => ({
          roomId: targetRoomId,
          personId: snapshot.personId,
          consumptions: snapshot.consumptions,
          pendingConsumptions:
            prev.roomId === targetRoomId ? prev.pendingConsumptions : [],
          summary: snapshot.summary,
          loading: false,
        }));
      } catch {
        if (!active) return;
        setStayState({
          roomId: targetRoomId,
          summary: null,
          consumptions: [],
          pendingConsumptions: [],
          personId: '',
          loading: false,
        });
      }
    })();

    return () => {
      active = false;
    };
  }, [room, nightlyRate]);

  useEffect(() => {
    if (activeTab !== 'consumptions' || menuItems.length > 0) return;
    let active = true;

    void (async () => {
      await Promise.resolve();
      if (!active) return;
      try {
        setLoadingMenu(true);
        const list = await fetchAvailableItemMenuCached(false);
        if (!active) return;
        setMenuItems(list);
      } catch {
        if (active) setMenuItems([]);
      } finally {
        if (active) setLoadingMenu(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [activeTab, menuItems.length]);

  const handleStatusChange = useCallback(
    async (newStatus: string) => {
      if (!room) return;
      setActionLoading(true);
      setFeedbackState({ roomId: room.id, msg: null });
      try {
        await onChangeStatus(room, newStatus);
        invalidateOperativaStayCache(room.id);
        setFeedbackState({
          roomId: room.id,
          msg: 'Estado actualizado exitosamente',
        });
      } catch {
        setFeedbackState({
          roomId: room.id,
          msg: 'No se pudo actualizar el estado de la habitación.',
        });
      } finally {
        setActionLoading(false);
      }
    },
    [onChangeStatus, room]
  );

  const handleCheckout = useCallback(async () => {
    if (!room) return;
    setActionLoading(true);
    setFeedbackState({ roomId: room.id, msg: null });
    try {
      await onChangeStatus(room, 'cleaning');
      invalidateOperativaStayCache(room.id);
      onClose();
    } catch {
      setFeedbackState({
        roomId: room.id,
        msg: 'Error al procesar el Check-Out de la habitación.',
      });
    } finally {
      setActionLoading(false);
    }
  }, [onChangeStatus, onClose, room]);

  /**
   * Agrupa localmente en bandeja por confirmar (0 llamadas HTTP por cada clic).
   */
  const handleAddConsumption = useCallback(
    async (item: MenuCatalogItem) => {
      if (!room) return;
      setAddingItemId(item.id);
      try {
        setStayState((prev) => {
          const base =
            prev.roomId === room.id
              ? prev
              : {
                  roomId: room.id,
                  summary: staySummary,
                  consumptions,
                  pendingConsumptions: [],
                  personId,
                  loading: false,
                };
          const existingIdx = base.pendingConsumptions.findIndex(
            (c) => c.menuItemId === item.id
          );
          const nextPending =
            existingIdx >= 0
              ? base.pendingConsumptions.map((c, idx) =>
                  idx === existingIdx ? { ...c, amount: c.amount + 1 } : c
                )
              : [
                  ...base.pendingConsumptions,
                  {
                    id: `pending-${item.id}`,
                    menuItemId: item.id,
                    name: item.name,
                    amount: 1,
                    priceUnit: item.price,
                    taxPercentage: item.taxPercentage,
                  },
                ];
          return { ...base, pendingConsumptions: nextPending };
        });
        setFeedbackState({
          roomId: room.id,
          msg: `+1 ${item.name} agregado al pedido por confirmar`,
        });
      } catch {
        setFeedbackState({
          roomId: room.id,
          msg: 'No se pudo añadir el producto al pedido.',
        });
      } finally {
        setAddingItemId(null);
      }
    },
    [consumptions, personId, room, staySummary]
  );

  const handleUpdateConsumptionQty = useCallback(
    async (consumptionId: string, delta: 1 | -1) => {
      if (!room) return;
      setUpdatingConsumptionId(consumptionId);
      try {
        setStayState((prev) => {
          const target = prev.pendingConsumptions.find(
            (c) => c.id === consumptionId
          );
          if (!target) return prev;
          const nextPending = prev.pendingConsumptions
            .map((c) =>
              c.id === consumptionId ? { ...c, amount: c.amount + delta } : c
            )
            .filter((c) => c.amount > 0);
          return { ...prev, pendingConsumptions: nextPending };
        });
      } catch {
        setFeedbackState({
          roomId: room.id,
          msg: 'No se pudo ajustar la cantidad del producto.',
        });
      } finally {
        setUpdatingConsumptionId(null);
      }
    },
    [room]
  );

  const handleClearConsumptions = useCallback(async () => {
    if (!room) return;
    try {
      setStayState((prev) => ({
        ...prev,
        pendingConsumptions: [],
      }));
      setFeedbackState({
        roomId: room.id,
        msg: `Pedido pendiente vaciado en Hab. ${room.number}`,
      });
    } catch {
      setFeedbackState({
        roomId: room.id,
        msg: 'No se pudo vaciar el pedido pendiente.',
      });
    }
  }, [room]);

  /**
   * Envía todo el pedido agrupado en un único POST /service-request.
   */
  const handleConfirmPendingConsumptions = useCallback(async () => {
    if (!room || pendingConsumptions.length === 0) return;
    setActionLoading(true);
    setFeedbackState({ roomId: room.id, msg: null });
    try {
      if (staySummary?.stayId && personId) {
        await api.post('/service-request', {
          order_number: `ORD-${Date.now().toString().slice(-5)}`,
          stay_id: staySummary.stayId,
          person_id: personId,
          channel: 'reception',
          currency: 'COP',
          items: pendingConsumptions.map((p) => {
            const catalogHit = menuItems.find((m) => m.id === p.menuItemId);
            return {
              item_menu_id: p.menuItemId ?? p.id,
              name_snapshot: p.name,
              price_unit: p.priceUnit,
              tax_rate: p.taxPercentage ?? catalogHit?.taxPercentage ?? 0,
              amount: p.amount,
              note: '',
            };
          }),
        });
      }

      const addedTotal = pendingConsumptions.reduce(
        (acc, p) => acc + p.priceUnit * p.amount,
        0
      );
      const totalUnits = pendingConsumptions.reduce(
        (acc, p) => acc + p.amount,
        0
      );

      setStayState((prev) => {
        const merged = [...prev.consumptions];
        for (const p of prev.pendingConsumptions) {
          const idx = merged.findIndex(
            (c) =>
              (p.menuItemId && c.menuItemId === p.menuItemId) ||
              (c.name === p.name && c.priceUnit === p.priceUnit)
          );
          if (idx >= 0) {
            merged[idx] = {
              ...merged[idx],
              amount: merged[idx].amount + p.amount,
            };
          } else {
            merged.push({
              id: `${p.menuItemId ?? p.id}-${Date.now()}`,
              menuItemId: p.menuItemId,
              name: p.name,
              amount: p.amount,
              priceUnit: p.priceUnit,
            });
          }
        }
        return {
          ...prev,
          consumptions: merged,
          pendingConsumptions: [],
          summary: prev.summary
            ? {
                ...prev.summary,
                consumptionsTotal: prev.summary.consumptionsTotal + addedTotal,
              }
            : prev.summary,
        };
      });

      invalidateOperativaStayCache(room.id);
      setFeedbackState({
        roomId: room.id,
        msg: `Pedido agrupado (${totalUnits} prod.) cargado a Hab. ${room.number}`,
      });
    } catch {
      setFeedbackState({
        roomId: room.id,
        msg: 'No se pudo cargar el pedido a la habitación.',
      });
    } finally {
      setActionLoading(false);
    }
  }, [menuItems, pendingConsumptions, personId, room, staySummary]);

  return {
    activeTab,
    setActiveTab,
    staySummary,
    loadingStay,
    menuItems,
    consumptions,
    pendingConsumptions,
    loadingMenu,
    addingItemId,
    updatingConsumptionId,
    actionLoading,
    feedbackMsg,
    handleStatusChange,
    handleCheckout,
    handleAddConsumption,
    handleUpdateConsumptionQty,
    handleClearConsumptions,
    handleConfirmPendingConsumptions,
  };
}
