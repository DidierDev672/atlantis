import { create } from 'zustand';

export interface HuespedRegistradoItem {
  id: string;
  name: string;
  document_number?: string;
  document_type?: string;
  email?: string;
  phone_number?: string;
  isTitular?: boolean;
  registeredAt?: string;
}

export interface HuespedesRegistradosStoreState {
  /** Lista de identificadores únicos de todos los huéspedes registrados independientemente */
  registeredIds: string[];
  /** Detalle estructurado de los huéspedes registrados en la sesión */
  huespedes: HuespedRegistradoItem[];
  /** Agrega el ID y metadatos de un huésped registrado */
  addHuespedId: (id: string, metadata?: Partial<HuespedRegistradoItem>) => void;
  /** Elimina un ID de la lista de registrados */
  removeHuespedId: (id: string) => void;
  /** Reemplaza la lista completa de IDs registrados */
  setRegisteredIds: (ids: string[]) => void;
  /** Sincroniza la lista de IDs seleccionados y actualiza los metadatos de los huéspedes */
  syncSelectedHuespedes: (
    ids: string[],
    catalog?: Array<{
      id: string;
      name: string;
      document_number?: string;
      document_type?: string;
      email?: string;
      phone_number?: string;
    }>
  ) => void;
  /** Limpia el estado de huéspedes registrados */
  clearHuespedes: () => void;
}

/**
 * Store de Zustand para centralizar y persistir los IDs de los huéspedes registrados
 * de manera independiente durante el flujo de creación de reservas y acompañantes.
 */
export const useHuespedesRegistradosStore = create<HuespedesRegistradosStoreState>(
  (set) => ({
    registeredIds: [],
    huespedes: [],

    addHuespedId: (id, metadata) =>
      set((state) => {
        if (!id || id.trim().length === 0) return state;
        const cleanId = id.trim();
        const alreadyExists = state.registeredIds.includes(cleanId);
        const nextIds = alreadyExists ? state.registeredIds : [...state.registeredIds, cleanId];

        const newItem: HuespedRegistradoItem = {
          id: cleanId,
          name: metadata?.name || 'Huésped registrado',
          document_number: metadata?.document_number,
          document_type: metadata?.document_type,
          email: metadata?.email,
          phone_number: metadata?.phone_number,
          isTitular: metadata?.isTitular ?? false,
          registeredAt: new Date().toISOString(),
        };

        const filtered = state.huespedes.filter((h) => h.id !== cleanId);
        return {
          registeredIds: nextIds,
          huespedes: [...filtered, newItem],
        };
      }),

    removeHuespedId: (id) =>
      set((state) => ({
        registeredIds: state.registeredIds.filter((item) => item !== id),
        huespedes: state.huespedes.filter((item) => item.id !== id),
      })),

    setRegisteredIds: (registeredIds) =>
      set({
        registeredIds: Array.from(new Set(registeredIds.filter(Boolean))),
      }),

    syncSelectedHuespedes: (ids, catalog = []) =>
      set((state) => {
        const cleanIds = Array.from(new Set(ids.filter(Boolean).map((i) => i.trim())));
        const updatedHuespedes: HuespedRegistradoItem[] = cleanIds.map((id, index) => {
          const foundInCatalog = catalog.find((c) => c.id === id);
          const existingInStore = state.huespedes.find((h) => h.id === id);

          return {
            id,
            name: foundInCatalog?.name || existingInStore?.name || 'Huésped registrado',
            document_number: foundInCatalog?.document_number || existingInStore?.document_number,
            document_type: foundInCatalog?.document_type || existingInStore?.document_type,
            email: foundInCatalog?.email || existingInStore?.email,
            phone_number: foundInCatalog?.phone_number || existingInStore?.phone_number,
            isTitular: index === 0,
            registeredAt: existingInStore?.registeredAt || new Date().toISOString(),
          };
        });

        return {
          registeredIds: cleanIds,
          huespedes: updatedHuespedes,
        };
      }),

    clearHuespedes: () => set({ registeredIds: [], huespedes: [] }),
  })
);
