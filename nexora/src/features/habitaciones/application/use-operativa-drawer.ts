import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../../lib/api';
import {
  isHabitacionOcupada,
  type RoomRow,
} from '../domain/habitacion-lista';
import {
  fetchDrawerStayGuests,
  type DrawerGuestItem,
} from './fetch-drawer-stay-guests';
import type {
  MenuCatalogItem,
  RegisteredConsumptionItem,
} from '../ui/molecules/drawer-tab-consumptions';
import type { ActiveStaySummary } from '../ui/molecules/drawer-tab-summary';
import type { DrawerTabKey } from '../ui/organisms/habitacion-operativa-drawer';

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
    personId: string;
    loading: boolean;
  }>({
    roomId: '',
    summary: null,
    consumptions: [],
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
  const personId = stayState.roomId === roomId ? stayState.personId : '';
  const isOccupied = Boolean(room && isHabitacionOcupada(room.status));
  const loadingStay = Boolean(
    room && isOccupied && stayState.roomId !== room.id
  ) || (stayState.roomId === roomId && stayState.loading);

  useEffect(() => {
    if (!room || !isHabitacionOcupada(room.status)) return;

    let active = true;
    const targetRoomId = room.id;

    const loadStayAndConsumptions = async () => {
      try {
        const stayRes = await api.get<Record<string, unknown>>(
          `/stay/reception/${encodeURIComponent(targetRoomId)}`,
          { validateStatus: (s) => s >= 200 && s < 300 }
        );
        if (!active) return;
        const stayData = (stayRes.data?.data ?? stayRes.data) as Record<
          string,
          unknown
        >;
        const stayId = String(stayData?.id ?? '');
        if (!stayId) {
          setStayState({
            roomId: targetRoomId,
            summary: null,
            consumptions: [],
            personId: '',
            loading: false,
          });
          return;
        }

        const checkIn = stayData?.check_in_date
          ? new Date(String(stayData.check_in_date))
          : new Date();
        const checkOut = stayData?.check_out_date
          ? new Date(String(stayData.check_out_date))
          : new Date();
        const diffDays = Math.max(
          1,
          Math.ceil((checkOut.getTime() - checkIn.getTime()) / 86400000)
        );

        let guestName = 'Huésped Titular';
        let guests: DrawerGuestItem[] = [];
        let guestsCount = Array.isArray(stayData?.person_ids)
          ? Math.max(1, stayData.person_ids.length)
          : 1;
        let primaryPersonId = '';
        try {
          guests = await fetchDrawerStayGuests(stayId, stayData);
          if (guests.length > 0) {
            guestsCount = Math.max(guests.length, guestsCount);
            guestName = guests[0].name || guestName;
            primaryPersonId = guests[0].id;
          }
        } catch {
          // Fallback silencioso
        }

        let consumptionsTotal = 0;
        const loadedItems: RegisteredConsumptionItem[] = [];
        try {
          const srRes = await api.get<unknown>(
            `/service-request?stay_id=${encodeURIComponent(stayId)}`,
            { validateStatus: (s) => s >= 200 && s < 300 }
          );
          const orders = Array.isArray(srRes.data) ? srRes.data : [];
          for (const ord of orders as Record<string, unknown>[]) {
            consumptionsTotal += Number(ord?.total ?? 0);
            const items = Array.isArray(ord?.items) ? ord.items : [];
            for (const it of items as Record<string, unknown>[]) {
              loadedItems.push({
                id: String(it?.id ?? Math.random()),
                menuItemId: it?.item_menu_id
                  ? String(it.item_menu_id)
                  : undefined,
                name: String(it?.name_snapshot ?? 'Producto'),
                amount: Number(it?.amount ?? 1),
                priceUnit: Number(it?.price_unit ?? 0),
              });
            }
          }
        } catch {
          // Fallback silencioso
        }

        if (!active) return;
        setStayState({
          roomId: targetRoomId,
          personId: primaryPersonId,
          consumptions: loadedItems,
          loading: false,
          summary: {
            stayId,
            guestName,
            guests,
            guestsCount,
            checkInDate: stayData?.check_in_date
              ? String(stayData.check_in_date)
              : '',
            checkOutDate: stayData?.check_out_date
              ? String(stayData.check_out_date)
              : '',
            nights: diffDays,
            lodgingTotal: nightlyRate * diffDays,
            consumptionsTotal,
            securityDeposit: Number(
              stayData?.paid_amount ?? stayData?.security_deposit ?? 0
            ),
          },
        });
      } catch {
        if (!active) return;
        setStayState({
          roomId: targetRoomId,
          summary: null,
          consumptions: [],
          personId: '',
          loading: false,
        });
      }
    };

    void loadStayAndConsumptions();
    return () => {
      active = false;
    };
  }, [room, nightlyRate]);

  useEffect(() => {
    if (activeTab !== 'consumptions' || menuItems.length > 0) return;
    let active = true;

    const loadMenu = async () => {
      try {
        setLoadingMenu(true);
        const res = await api.get<unknown>('/item-menu?available=true', {
          validateStatus: (s) => s >= 200 && s < 300,
        });
        if (!active) return;
        const list = Array.isArray(res.data) ? res.data : [];
        setMenuItems(
          (list as Record<string, unknown>[]).map((it) => ({
            id: String(it.id ?? ''),
            name: String(it.name ?? 'Producto'),
            price: Number(it.price ?? 0),
            taxPercentage: Number(it.tax_percentage ?? 0),
          }))
        );
      } catch {
        if (active) setMenuItems([]);
      } finally {
        if (active) setLoadingMenu(false);
      }
    };

    void loadMenu();
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

  const handleAddConsumption = useCallback(
    async (item: MenuCatalogItem) => {
      if (!room) return;
      setAddingItemId(item.id);
      setFeedbackState({ roomId: room.id, msg: null });
      try {
        if (staySummary?.stayId && personId) {
          await api.post('/service-request', {
            order_number: `ORD-${Date.now().toString().slice(-5)}`,
            stay_id: staySummary.stayId,
            person_id: personId,
            channel: 'reception',
            currency: 'COP',
            items: [
              {
                item_menu_id: item.id,
                name_snapshot: item.name,
                price_unit: item.price,
                tax_rate: item.taxPercentage,
                amount: 1,
                note: '',
              },
            ],
          });
        }
        setStayState((prev) => {
          const existingIdx = prev.consumptions.findIndex(
            (c) =>
              c.menuItemId === item.id ||
              (!c.menuItemId &&
                c.name === item.name &&
                c.priceUnit === item.price)
          );
          const nextConsumptions =
            existingIdx >= 0
              ? prev.consumptions.map((c, idx) =>
                  idx === existingIdx
                    ? { ...c, menuItemId: item.id, amount: c.amount + 1 }
                    : c
                )
              : [
                  ...prev.consumptions,
                  {
                    id: `${item.id}-${Date.now()}`,
                    menuItemId: item.id,
                    name: item.name,
                    amount: 1,
                    priceUnit: item.price,
                  },
                ];
          const nextTotal = nextConsumptions.reduce(
            (sum, c) => sum + c.priceUnit * c.amount,
            0
          );
          return {
            ...prev,
            consumptions: nextConsumptions,
            summary: prev.summary
              ? {
                  ...prev.summary,
                  consumptionsTotal: nextTotal,
                }
              : prev.summary,
          };
        });
        setFeedbackState({
          roomId: room.id,
          msg: `+1 ${item.name} cargado a Hab. ${room.number}`,
        });
      } catch {
        setFeedbackState({
          roomId: room.id,
          msg: 'No se pudo registrar el consumo.',
        });
      } finally {
        setAddingItemId(null);
      }
    },
    [personId, room, staySummary]
  );

  const handleUpdateConsumptionQty = useCallback(
    async (consumptionId: string, delta: 1 | -1) => {
      if (!room) return;
      const target = consumptions.find((c) => c.id === consumptionId);
      if (!target) return;

      setUpdatingConsumptionId(consumptionId);
      setFeedbackState({ roomId: room.id, msg: null });
      try {
        if (delta > 0 && staySummary?.stayId && personId) {
          const matchedCatalog = menuItems.find(
            (m) =>
              m.id === target.menuItemId ||
              (m.name === target.name && m.price === target.priceUnit)
          );
          if (matchedCatalog) {
            await api.post('/service-request', {
              order_number: `ORD-${Date.now().toString().slice(-5)}`,
              stay_id: staySummary.stayId,
              person_id: personId,
              channel: 'reception',
              currency: 'COP',
              items: [
                {
                  item_menu_id: matchedCatalog.id,
                  name_snapshot: matchedCatalog.name,
                  price_unit: matchedCatalog.price,
                  tax_rate: matchedCatalog.taxPercentage,
                  amount: 1,
                  note: '',
                },
              ],
            });
          }
        }

        const nextAmount = target.amount + delta;
        setStayState((prev) => {
          const nextConsumptions = prev.consumptions
            .map((c) =>
              c.id === consumptionId ? { ...c, amount: c.amount + delta } : c
            )
            .filter((c) => c.amount > 0);
          const nextTotal = nextConsumptions.reduce(
            (sum, c) => sum + c.priceUnit * c.amount,
            0
          );
          return {
            ...prev,
            consumptions: nextConsumptions,
            summary: prev.summary
              ? {
                  ...prev.summary,
                  consumptionsTotal: nextTotal,
                }
              : prev.summary,
          };
        });

        setFeedbackState({
          roomId: room.id,
          msg:
            nextAmount <= 0
              ? `${target.name} quitado de consumos`
              : `${delta > 0 ? '+1' : '-1'} ${target.name} actualizado`,
        });
      } catch {
        setFeedbackState({
          roomId: room.id,
          msg: 'No se pudo actualizar la cantidad del consumo.',
        });
      } finally {
        setUpdatingConsumptionId(null);
      }
    },
    [consumptions, menuItems, personId, room, staySummary]
  );

  const handleClearConsumptions = useCallback(async () => {
    if (!room) return;
    setActionLoading(true);
    setFeedbackState({ roomId: room.id, msg: null });
    try {
      setStayState((prev) => ({
        ...prev,
        consumptions: [],
        summary: prev.summary
          ? {
              ...prev.summary,
              consumptionsTotal: 0,
            }
          : prev.summary,
      }));
      setFeedbackState({
        roomId: room.id,
        msg: `Consumos vaciados en Hab. ${room.number}`,
      });
    } catch {
      setFeedbackState({
        roomId: room.id,
        msg: 'No se pudo vaciar la lista de consumos.',
      });
    } finally {
      setActionLoading(false);
    }
  }, [room]);

  return {
    activeTab,
    setActiveTab,
    staySummary,
    loadingStay,
    menuItems,
    consumptions,
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
  };
}
