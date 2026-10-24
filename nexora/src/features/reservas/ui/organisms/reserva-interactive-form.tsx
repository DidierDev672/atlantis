import { useState, useEffect, useMemo, type FormEvent } from 'react';
import { AnimatePresence, motion, type Variants } from 'motion/react';
import { fadeIn, fadeUp } from '../../../../design-tokens/motion';
import { api } from '../../../../lib/api';
import {
  readAuthTokenEmail,
  readTokenEmail,
} from '../../../../shared/auth-storage';
import { validateStatusCode } from '../../../../shared/lib/status-code-validator';
import {
  formatPrecioCOP,
  calculateNights,
  type PersonApiResponse,
} from '../../domain/reserva';
import type { StayPayload } from '../../domain/guest-attendant';
import { NuevoHuespedModal } from '../molecules/nuevo-huesped-modal';
import { ReservaAcompanantesModal } from '../molecules/reserva-acompanantes-modal';
import { useHuespedesRegistradosStore } from '../../application/use-huespedes-registrados-store';
import { coordinateBalancedStaySubmission } from '../../infrastructure/api-guest-attendant-service';
import {
  RecursosDropdown,
  type DropdownOption,
} from '../../../recursos/ui/molecules/recursos-dropdown';
import { Input } from '../../../../shared/ui/Input';
import { Loader } from '../../../tema/ui/atoms/loader';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircleCheck,
  faPlus,
  faCheck,
  faUsers,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';

/** Variantes de Framer Motion para el cruce vertical (hoja arrancada del calendario) */
const tearSheetVariants: Variants = {
  initial: (direction: number) => ({
    y: direction > 0 ? 18 : -18,
    opacity: 0,
    rotate: direction > 0 ? 8 : -8,
    scale: 0.9,
  }),
  animate: {
    y: 0,
    opacity: 1,
    rotate: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 420,
      damping: 24,
      mass: 0.55,
    },
  },
  exit: (direction: number) => ({
    y: direction > 0 ? -18 : 18,
    opacity: 0,
    rotate: direction > 0 ? -12 : 12,
    scale: 0.85,
    transition: {
      duration: 0.2,
      ease: [0.32, 0, 0.67, 0],
    },
  }),
};

/** Variantes de Framer Motion para el número que se desliza según la dirección (efecto estrella) */
const slidingGuestNumberVariants: Variants = {
  initial: (direction: number) => ({
    y: direction > 0 ? 20 : -20,
    opacity: 0,
    scale: 0.85,
  }),
  animate: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 450,
      damping: 25,
      mass: 0.5,
    },
  },
  exit: (direction: number) => ({
    y: direction > 0 ? -20 : 20,
    opacity: 0,
    scale: 0.85,
    transition: {
      duration: 0.18,
      ease: [0.32, 0, 0.67, 0],
    },
  }),
};

export interface RoomApiResponseItem {
  id: string;
  number: string;
  floor: number | string;
  room_types_id?: string;
  building_id?: string;
  price_override?: number | null;
  status?: string;
  has_reception?: boolean;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface RoomOption {
  id: string;
  number: string;
  floor: number | string;
  price_override?: number | null;
  price: number;
  capacity: number;
  status: string;
}

export interface PersonApiResponseItem {
  id: string;
  document_type?: string;
  document_number?: string;
  name: string;
  phone_number?: string;
  email?: string;
  date_of_birth?: string;
  gender?: string;
  nationality?: string;
  roles?: string[];
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

const ESTADOS_RESERVA = [
  {
    value: 'pendiente',
    backendValue: 'pending',
    label: 'Pendiente',
    dotColor: 'bg-amber-500',
    badgeClass:
      'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
  },
  {
    value: 'confirmada',
    backendValue: 'confirmed',
    label: 'Confirmada',
    dotColor: 'bg-emerald-500',
    badgeClass:
      'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
  },
  {
    value: 'en curso',
    backendValue: 'in progress',
    label: 'En curso',
    dotColor: 'bg-blue-500',
    badgeClass:
      'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
  },
  {
    value: 'finalizada',
    backendValue: 'completed',
    label: 'Finalizada',
    dotColor: 'bg-neutral',
    badgeClass: 'bg-neutral/15 text-ink-muted border-line',
  },
  {
    value: 'cancelada',
    backendValue: 'canceled',
    label: 'Cancelada',
    dotColor: 'bg-rose-500',
    badgeClass:
      'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
  },
  {
    value: 'no muestrar',
    backendValue: 'no show',
    label: 'No asistió (No show)',
    dotColor: 'bg-purple-500',
    badgeClass:
      'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20',
  },
] as const;

function getTodayString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTomorrowString(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const day = String(tomorrow.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Obtiene el correo del recepcionista desde el objeto 'auth_user' de localStorage (propiedad email)
 */
function getCreatedByEmail(): string {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem('auth_user');
      if (raw) {
        const parsed = JSON.parse(raw) as {
          email?: string;
          user?: { email?: string };
        };
        const email = parsed?.email || parsed?.user?.email;
        if (typeof email === 'string' && email.trim().length > 0) {
          return email.trim();
        }
      }
    }
  } catch {
    // Si localStorage no está disponible o el JSON es inválido
  }
  return readTokenEmail() || readAuthTokenEmail() || 'ariasdev672@gmail.com';
}

export function ReservaInteractiveForm() {
  // 1. Datos del catálogo
  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [roomError, setRoomError] = useState<string | null>(null);

  const [persons, setPersons] = useState<PersonApiResponse[]>([]);
  const [loadingPersons, setLoadingPersons] = useState(true);
  const [personError, setPersonError] = useState<string | null>(null);

  // 2. Estado de los campos del formulario
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [selectedPersonId, setSelectedPersonId] = useState('');
  const [selectedPersonIds, setSelectedPersonIds] = useState<string[]>([]);
  const [checkInDate, setCheckInDate] = useState(getTodayString());
  const [checkOutDate, setCheckOutDate] = useState(getTomorrowString());

  // Estado para la animación interactiva de cruce vertical (hoja arrancada) en el icono calendario
  const [isCalendarHovered, setIsCalendarHovered] = useState(false);
  const calendarTodayDate = useMemo(() => new Date(), []);
  const calendarTodayDay = calendarTodayDate.getDate();
  const calendarNextDay = calendarTodayDay < 31 ? calendarTodayDay + 1 : 1;
  const calendarMonthAbbr = useMemo(
    () =>
      calendarTodayDate
        .toLocaleDateString('es-ES', { month: 'short' })
        .replace('.', '')
        .toUpperCase(),
    [calendarTodayDate]
  );
  const [numberOfGuests, setNumberOfGuests] = useState<number>(1);
  const [guestDirection, setGuestDirection] = useState<number>(1);
  const [stateValue, setStateValue] = useState<string>('pendiente');
  const [customTotalPrice, setCustomTotalPrice] = useState<number | null>(null);

  // Store Zustand para centralizar y sincronizar huéspedes registrados
  const syncSelectedHuespedes = useHuespedesRegistradosStore((s) => s.syncSelectedHuespedes);
  const addHuespedId = useHuespedesRegistradosStore((s) => s.addHuespedId);
  const clearHuespedes = useHuespedesRegistradosStore((s) => s.clearHuespedes);

  // 3. UI states y modal
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
  const [isAcompanantesModalOpen, setIsAcompanantesModalOpen] = useState(false);
  const [companions, setCompanions] = useState<PersonApiResponse[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitStatusCode, setSubmitStatusCode] = useState<number | null>(null);
  const [submitFeedback, setSubmitFeedback] = useState<{
    type: 'success' | 'error' | 'warning';
    title: string;
    message: string;
    statusCode?: number;
  } | null>(null);
  const [successReservation, setSuccessReservation] = useState<{
    roomNumber: string;
    roomFloor: number | string;
    personName: string;
    checkInDate: string;
    checkOutDate: string;
    nights: number;
    numberOfGuests: number;
    stateLabel: string;
    totalPrice: number;
  } | null>(null);

  // Carga inicial de habitaciones consumiendo GET /room y validando con validateStatusCode
  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      // 1. Cargar habitaciones con Axios GET /room y validación de status code
      try {
        const response = await api.get<RoomApiResponseItem[]>('/room', {
          validateStatus: () => true, // Permite evaluar manualmente el status code
        });

        const validation = validateStatusCode(response.status);

        if (isMounted) {
          if (validation.isValid) {
            const data = response.data;
            const rawList: RoomApiResponseItem[] = Array.isArray(data)
              ? data
              : data &&
                  typeof data === 'object' &&
                  Array.isArray((data as { data?: RoomApiResponseItem[] }).data)
                ? (data as { data: RoomApiResponseItem[] }).data
                : [];

            const mappedRooms: RoomOption[] = rawList.map((r) => ({
              id: String(r.id),
              number: String(r.number ?? ''),
              floor: r.floor ?? 1,
              price_override:
                r.price_override != null ? Number(r.price_override) : null,
              price:
                r.price_override != null && Number(r.price_override) > 0
                  ? Number(r.price_override)
                  : 160000,
              capacity: 2,
              status: String(r.status || 'available'),
            }));

            // Ordenamiento natural por número de habitación
            mappedRooms.sort((a, b) =>
              a.number.localeCompare(b.number, undefined, { numeric: true })
            );

            setRooms(mappedRooms);
          } else {
            setRoomError(
              validation.message ||
                'No pudimos consultar las habitaciones en este momento. Por favor verifica tu conexión o reintenta.'
            );
          }
        }
      } catch {
        if (isMounted) {
          const netValidation = validateStatusCode(0);
          setRoomError(
            netValidation.message ||
              'Ocurrió una pausa inesperada en la red al conectar con el inventario de habitaciones.'
          );
        }
      } finally {
        if (isMounted) {
          setLoadingRooms(false);
        }
      }

      // 2. Cargar personas registradas con Axios GET /persons y validación de status code
      try {
        let response = await api.get<PersonApiResponseItem[]>('/persons', {
          validateStatus: () => true,
        });

        // Fallback preventivo si el backend expone /person en singular
        if (response.status === 404) {
          try {
            const fallbackRes = await api.get<PersonApiResponseItem[]>(
              '/person',
              {
                validateStatus: () => true,
              }
            );
            if (validateStatusCode(fallbackRes.status).isValid) {
              response = fallbackRes;
            }
          } catch {
            // Mantener respuesta de /persons
          }
        }

        const validation = validateStatusCode(response.status);

        if (isMounted) {
          if (validation.isValid) {
            const data = response.data;
            const rawList: PersonApiResponseItem[] = Array.isArray(data)
              ? data
              : data &&
                  typeof data === 'object' &&
                  Array.isArray(
                    (data as { data?: PersonApiResponseItem[] }).data
                  )
                ? (data as { data: PersonApiResponseItem[] }).data
                : [];

            const mappedPersons: PersonApiResponse[] = rawList.map((p) => ({
              id: String(p.id),
              document_type: String(p.document_type || 'id_card'),
              document_number: String(p.document_number || ''),
              name: String(p.name || 'Huésped'),
              phone_number: String(p.phone_number || ''),
              email: String(p.email || ''),
            }));

            // Ordenamiento por nombre
            mappedPersons.sort((a, b) => a.name.localeCompare(b.name));

            setPersons(mappedPersons);
          } else {
            setPersonError(
              validation.message ||
                'No pudimos consultar la lista de huéspedes en este momento. Por favor verifica tu conexión o reintenta.'
            );
          }
        }
      } catch {
        if (isMounted) {
          const netValidation = validateStatusCode(0);
          setPersonError(
            netValidation.message ||
              'Ocurrió una pausa inesperada en la red al conectar con el registro de huéspedes.'
          );
        }
      } finally {
        if (isMounted) {
          setLoadingPersons(false);
        }
      }
    };

    void loadInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Reintento manual de carga de habitaciones
  const handleRetryRooms = async () => {
    setLoadingRooms(true);
    setRoomError(null);

    try {
      const response = await api.get<RoomApiResponseItem[]>('/room', {
        validateStatus: () => true,
      });

      const validation = validateStatusCode(response.status);

      if (validation.isValid) {
        const data = response.data;
        const rawList: RoomApiResponseItem[] = Array.isArray(data)
          ? data
          : data &&
              typeof data === 'object' &&
              Array.isArray((data as { data?: RoomApiResponseItem[] }).data)
            ? (data as { data: RoomApiResponseItem[] }).data
            : [];

        const mappedRooms: RoomOption[] = rawList.map((r) => ({
          id: String(r.id),
          number: String(r.number ?? ''),
          floor: r.floor ?? 1,
          price_override:
            r.price_override != null ? Number(r.price_override) : null,
          price:
            r.price_override != null && Number(r.price_override) > 0
              ? Number(r.price_override)
              : 160000,
          capacity: 2,
          status: String(r.status || 'available'),
        }));

        mappedRooms.sort((a, b) =>
          a.number.localeCompare(b.number, undefined, { numeric: true })
        );
        setRooms(mappedRooms);
      } else {
        setRoomError(
          validation.message || 'No se pudo obtener la lista de habitaciones.'
        );
      }
    } catch {
      const netValidation = validateStatusCode(0);
      setRoomError(
        netValidation.message || 'Error de conexión al cargar habitaciones.'
      );
    } finally {
      setLoadingRooms(false);
    }
  };

  // Reintento manual de carga de personas (/persons) con validateStatusCode
  const handleRetryPersons = async () => {
    setLoadingPersons(true);
    setPersonError(null);

    try {
      let response = await api.get<PersonApiResponseItem[]>('/persons', {
        validateStatus: () => true,
      });

      if (response.status === 404) {
        try {
          const fallbackRes = await api.get<PersonApiResponseItem[]>(
            '/person',
            {
              validateStatus: () => true,
            }
          );
          if (validateStatusCode(fallbackRes.status).isValid) {
            response = fallbackRes;
          }
        } catch {
          // Mantener respuesta original
        }
      }

      const validation = validateStatusCode(response.status);

      if (validation.isValid) {
        const data = response.data;
        const rawList: PersonApiResponseItem[] = Array.isArray(data)
          ? data
          : data &&
              typeof data === 'object' &&
              Array.isArray((data as { data?: PersonApiResponseItem[] }).data)
            ? (data as { data: PersonApiResponseItem[] }).data
            : [];

        const mappedPersons: PersonApiResponse[] = rawList.map((p) => ({
          id: String(p.id),
          document_type: String(p.document_type || 'id_card'),
          document_number: String(p.document_number || ''),
          name: String(p.name || 'Huésped'),
          phone_number: String(p.phone_number || ''),
          email: String(p.email || ''),
        }));

        mappedPersons.sort((a, b) => a.name.localeCompare(b.name));
        setPersons(mappedPersons);
      } else {
        setPersonError(
          validation.message || 'No se pudo obtener la lista de huéspedes.'
        );
      }
    } catch {
      const netValidation = validateStatusCode(0);
      setPersonError(
        netValidation.message || 'Error de conexión al cargar huéspedes.'
      );
    } finally {
      setLoadingPersons(false);
    }
  };

  // Habitación y Persona actualmente seleccionadas
  const selectedRoom = useMemo(
    () => rooms.find((r) => r.id === selectedRoomId),
    [rooms, selectedRoomId]
  );

  const selectedPerson = useMemo(
    () => persons.find((p) => p.id === selectedPersonId),
    [persons, selectedPersonId]
  );

  // Acompañantes seleccionados derivados de selectedPersonIds (a partir del segundo huésped)
  const selectedCompanions = useMemo<PersonApiResponse[]>(() => {
    if (selectedPersonIds.length <= 1) return [];
    const companionIds = selectedPersonIds.slice(1);
    return companionIds
      .map((id) => {
        const fromPersons = persons.find((p) => p.id === id);
        if (fromPersons) return fromPersons;
        const fromCompanions = companions.find((c) => c.id === id);
        if (fromCompanions) return fromCompanions;
        const fromStore = useHuespedesRegistradosStore
          .getState()
          .huespedes.find((h) => h.id === id);
        if (fromStore) {
          return {
            id: fromStore.id,
            name: fromStore.name,
            document_number: fromStore.document_number || '',
            document_type: fromStore.document_type || 'national_id',
            email: fromStore.email,
            phone_number: fromStore.phone_number,
          };
        }
        return {
          id,
          name: 'Acompañante registrado',
          document_number: '',
          document_type: 'national_id',
        };
      })
      .filter((c): c is PersonApiResponse => Boolean(c));
  }, [selectedPersonIds, persons, companions]);

  const personDropdownOptions = useMemo<DropdownOption[]>(() => {
    return persons.map((person) => {
      const docType = person.document_type?.trim();
      const isNationalId = !docType || docType.toLowerCase() === 'national_id';

      // Elimina la palabra 'national_id' de la experiencia de usuario
      const docLabel = isNationalId
        ? ''
        : docType.toLowerCase() === 'id_card'
          ? 'Tarjeta de identidad'
          : docType.toLowerCase() === 'foreign_id'
            ? 'Tarjeta de extranjería'
            : docType.toLowerCase() === 'passport'
              ? 'Pasaporte'
              : docType.replace(/_/g, ' ');

      const parts = [
        person.name?.trim(),
        docLabel,
        person.document_number?.trim(),
      ].filter(Boolean);

      return {
        value: person.id,
        label: parts.length > 0 ? parts.join(' - ') : person.name,
        id: person.id,
        rawName: person.name,
      };
    });
  }, [persons]);

  const roomDropdownOptions = useMemo<DropdownOption[]>(() => {
    return rooms.map((room) => ({
      value: room.id,
      label: `${room.number} - ${room.floor}`,
      id: room.id,
      rawName: room.number,
    }));
  }, [rooms]);

  const estadoDropdownOptions = useMemo<DropdownOption[]>(() => {
    return ESTADOS_RESERVA.map((est) => ({
      value: est.value,
      label: est.label,
    }));
  }, []);

  // Cálculo dinámico de noches
  const nights = useMemo(
    () => calculateNights(checkInDate, checkOutDate),
    [checkInDate, checkOutDate]
  );

  // Precio sugerido derivado y precio final mostrado
  const suggestedPrice = useMemo(() => {
    const roomPrice = selectedRoom ? selectedRoom.price : 160000;
    return Math.max(nights, 1) * roomPrice;
  }, [nights, selectedRoom]);

  const effectiveTotalPrice =
    customTotalPrice !== null ? customTotalPrice : suggestedPrice;

  // Manejador al seleccionar habitación
  const handleRoomChange = (roomId: string) => {
    setSelectedRoomId(roomId);
    if (errors.roomId) setErrors((p) => ({ ...p, roomId: '' }));

    const found = rooms.find((r) => r.id === roomId);
    if (found && numberOfGuests > found.capacity) {
      setNumberOfGuests(found.capacity);
      if (selectedPersonIds.length > found.capacity) {
        const trimmed = selectedPersonIds.slice(0, found.capacity);
        setSelectedPersonIds(trimmed);
        setSelectedPersonId(trimmed[0] || '');
        syncSelectedHuespedes(trimmed, persons);
      }
      if (companions.length > found.capacity - 1) {
        setCompanions((prev) => prev.slice(0, Math.max(0, found.capacity - 1)));
      }
    }
  };

  // Manejador del número de huéspedes con sincronización hacia los huéspedes seleccionados
  const handleNumberOfGuestsChange = (newVal: number) => {
    const max = selectedRoom ? selectedRoom.capacity : 10;
    const sanitized = Math.max(1, Math.min(max, newVal));
    if (sanitized !== numberOfGuests) {
      setGuestDirection(sanitized > numberOfGuests ? 1 : -1);
    }
    setNumberOfGuests(sanitized);
    if (errors.numberOfGuests) setErrors((p) => ({ ...p, numberOfGuests: '' }));

    // Si se reduce el número de huéspedes por debajo de los seleccionados, recortamos la selección
    if (selectedPersonIds.length > sanitized) {
      const trimmedIds = selectedPersonIds.slice(0, sanitized);
      setSelectedPersonIds(trimmedIds);
      setSelectedPersonId(trimmedIds[0] || '');
      syncSelectedHuespedes(trimmedIds, persons);
    }

    // Sincronizar companions si la lista excede el nuevo cupo de acompañantes
    if (companions.length > sanitized - 1) {
      setCompanions((prev) => prev.slice(0, Math.max(0, sanitized - 1)));
    }

    // Si superamos 1 y faltan acompañantes por registrar, abrimos automáticamente el modal
    if (sanitized > 1 && companions.length < sanitized - 1) {
      setIsAcompanantesModalOpen(true);
    }
  };

  // Manejador de selección múltiple de huéspedes en el dropdown y sincronización con "Número de huéspedes" y Zustand
  const handleHuespedesMultiChange = (newIds: string[]) => {
    const maxCapacity = selectedRoom ? selectedRoom.capacity : 10;

    // Validación y ajuste si supera la capacidad de la habitación
    if (selectedRoom && newIds.length > selectedRoom.capacity) {
      setErrors((p) => ({
        ...p,
        numberOfGuests: `La habitación ${selectedRoom.number} admite un máximo de ${selectedRoom.capacity} personas.`,
      }));
      newIds = newIds.slice(0, selectedRoom.capacity);
    } else if (errors.numberOfGuests) {
      setErrors((p) => ({ ...p, numberOfGuests: '' }));
    }

    setSelectedPersonIds(newIds);

    // El primer huésped de la selección actúa como titular principal para el payload /reserve (person_id)
    const primaryId = newIds[0] || '';
    setSelectedPersonId(primaryId);
    if (errors.personId) setErrors((p) => ({ ...p, personId: '' }));

    // Sincronización automática con "Número de huéspedes":
    // Si se seleccionan varios huéspedes, el contador de huéspedes se ajusta inmediatamente a la cantidad de personas
    const nextGuestCount = Math.max(1, Math.min(maxCapacity, newIds.length || 1));
    if (nextGuestCount !== numberOfGuests) {
      setGuestDirection(nextGuestCount > numberOfGuests ? 1 : -1);
    }
    setNumberOfGuests(nextGuestCount);

    // Sincronizar acompañantes: mapeamos los huéspedes seleccionados a partir del segundo (índice >= 1)
    const companionIds = newIds.slice(1);
    const mappedCompanions: PersonApiResponse[] = companionIds
      .map((id) => {
        const found = persons.find((p) => p.id === id);
        if (found) return found;
        const inStore = useHuespedesRegistradosStore.getState().huespedes.find((h) => h.id === id);
        if (inStore) {
          return {
            id: inStore.id,
            name: inStore.name,
            document_number: inStore.document_number || '',
            document_type: inStore.document_type || 'national_id',
            email: inStore.email || '',
            phone_number: inStore.phone_number || '',
          };
        }
        return null;
      })
      .filter((c): c is PersonApiResponse => c !== null);

    setCompanions(mappedCompanions);

    // Sincronizar en la store de Zustand
    syncSelectedHuespedes(newIds, persons);
  };

  // Guardado de acompañante desde el modal
  const handleSaveCompanion = (
    newCompanion: PersonApiResponse,
    slotIndex: number
  ) => {
    setCompanions((prev) => {
      const copy = [...prev];
      copy[slotIndex] = newCompanion;
      return copy;
    });
    // Integrar al catálogo general de huéspedes de la vista
    setPersons((prev) => [
      newCompanion,
      ...prev.filter((p) => p.id !== newCompanion.id),
    ]);
    // Registrar acompañante en el store de Zustand
    addHuespedId(newCompanion.id, {
      name: newCompanion.name,
      document_number: newCompanion.document_number,
      document_type: newCompanion.document_type,
      email: newCompanion.email,
      phone_number: newCompanion.phone_number,
      isTitular: false,
    });
    // Sincronizar acompañante con el dropdown de huéspedes seleccionados
    setSelectedPersonIds((prev) => {
      if (prev.includes(newCompanion.id)) return prev;
      return [...prev, newCompanion.id];
    });
  };

  // Manejador de fechas
  const handleCheckInChange = (newCheckIn: string) => {
    setCheckInDate(newCheckIn);
    if (errors.checkInDate) setErrors((p) => ({ ...p, checkInDate: '' }));

    // Si checkOut es menor o igual, avanzamos un día
    if (checkOutDate && newCheckIn >= checkOutDate) {
      const nextDay = new Date(newCheckIn);
      nextDay.setDate(nextDay.getDate() + 1);
      const y = nextDay.getFullYear();
      const m = String(nextDay.getMonth() + 1).padStart(2, '0');
      const d = String(nextDay.getDate()).padStart(2, '0');
      setCheckOutDate(`${y}-${m}-${d}`);
    }
  };

  const handleCheckOutChange = (newCheckOut: string) => {
    setCheckOutDate(newCheckOut);
    if (errors.checkOutDate) setErrors((p) => ({ ...p, checkOutDate: '' }));
  };

  // Recepción de nuevo huésped creado desde el modal
  const handleGuestCreated = (newPerson: PersonApiResponse) => {
    setPersons((prev) => [
      newPerson,
      ...prev.filter((p) => p.id !== newPerson.id),
    ]);
    setSelectedPersonId(newPerson.id);
    setSelectedPersonIds((prev) => Array.from(new Set([newPerson.id, ...prev])));
    addHuespedId(newPerson.id, {
      name: newPerson.name,
      document_number: newPerson.document_number,
      document_type: newPerson.document_type,
      email: newPerson.email,
      phone_number: newPerson.phone_number,
      isTitular: true,
    });
    if (errors.personId) setErrors((p) => ({ ...p, personId: '' }));
  };

  // Validación de formulario
  const validateForm = () => {
    const errs: Record<string, string> = {};

    if (!selectedRoomId) {
      errs.roomId = 'Por favor selecciona una habitación para la reserva.';
    }

    if (!selectedPersonId) {
      errs.personId =
        'Por favor selecciona el huésped titular o registra uno nuevo.';
    }

    if (!checkInDate) {
      errs.checkInDate = 'La fecha de entrada es obligatoria.';
    }

    if (!checkOutDate) {
      errs.checkOutDate = 'La fecha de salida es obligatoria.';
    } else if (checkInDate && checkOutDate <= checkInDate) {
      errs.checkOutDate =
        'La fecha de salida debe ser posterior a la fecha de entrada.';
    }

    if (!numberOfGuests || numberOfGuests < 1) {
      errs.numberOfGuests = 'El número de huéspedes debe ser al menos 1.';
    } else if (selectedRoom && numberOfGuests > selectedRoom.capacity) {
      errs.numberOfGuests = `Esta habitación admite un máximo de ${selectedRoom.capacity} huéspedes.`;
    }

    if (effectiveTotalPrice < 0 || isNaN(effectiveTotalPrice)) {
      errs.totalPrice = 'Ingresa un precio total válido (mayor o igual a 0).';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Envío del formulario validando status codes con validateStatusCode y retroalimentación psicológica al recepcionista
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Visualizar inmediatamente el componente reutilizable Loader al hacer clic en el botón
    setSubmitting(true);
    setSubmitStatusCode(null);
    setSubmitFeedback(null);

    // Formatear fechas en formato ISO para la API (check-in 15:00Z y check-out 12:00Z)
    const checkInIso = checkInDate.includes('T')
      ? checkInDate
      : `${checkInDate}T15:00:00Z`;

    const checkOutIso = checkOutDate.includes('T')
      ? checkOutDate
      : `${checkOutDate}T12:00:00Z`;

    // Estado de la reserva para el resumen de confirmación
    const estadoObj = ESTADOS_RESERVA.find((item) => item.value === stateValue);

    // created_by obtenido del localStorage 'auth_user' y del item email
    const createdByEmail = getCreatedByEmail();

    // Determinar person_ids para el payload de /stay (titular y acompañantes registrados)
    const activePersonIds = [
      selectedPersonId,
      ...selectedPersonIds.filter((id) => id !== selectedPersonId),
      ...companions.map((c) => c.id).filter((id) => id !== selectedPersonId),
    ].filter((id): id is string => Boolean(id && id.trim()));

    const finalPersonIds =
      activePersonIds.length > 0 ? activePersonIds : [selectedPersonId];

    // Payload de estadía corregido exactamente para /stay con el método POST
    const stayPayload: StayPayload = {
      room_id: selectedRoomId,
      person_ids: finalPersonIds,
      check_in_date: checkInIso,
      check_out_date: checkOutIso,
      payment_method: 'card',
      security_deposit: 0,
      remarks: 'Check-in regular',
      status: 'progress',
      created_by: createdByEmail || 'ariasdev672@gmail.com',
    };

    try {
      // Envío casi simultáneo de los endpoints /stay y /guest-attendant balanceando cargas (Reglas de Oro 1, 2, 3 y 4)
      const result = await coordinateBalancedStaySubmission(
        stayPayload,
        finalPersonIds
      );

      setSubmitStatusCode(result.stayStatusCode);

      if (result.success) {
        // Respuesta POSITIVA: mensaje empático y tranquilizador usando psicología para el recepcionista
        setSubmitFeedback({
          type: 'success',
          title: result.title || '¡Reserva confirmada con éxito!',
          message:
            result.message ||
            '¡Excelente trabajo! La reserva se registró y aseguró con éxito en el sistema.',
          statusCode: result.stayStatusCode,
        });

        setSuccessReservation({
          roomNumber: selectedRoom?.number || '',
          roomFloor: selectedRoom?.floor ?? '',
          personName: selectedPerson?.name || 'Huésped registrado',
          checkInDate,
          checkOutDate,
          nights: Math.max(nights, 1),
          numberOfGuests,
          stateLabel: estadoObj?.label || stateValue,
          totalPrice: effectiveTotalPrice,
        });
      } else {
        // Respuesta NEGATIVA: psicología empática orientada al recepcionista para preservar la calma
        let friendlyTitle = result.title || 'No pudimos registrar la reserva';
        let friendlyMessage = result.message;

        if (result.stayStatusCode === 409) {
          friendlyTitle = 'Habitación no disponible en esas fechas';
          friendlyMessage =
            '¡Tranquilo(a)! Tus datos siguen intactos en el formulario. La habitación seleccionada ya tiene una reserva activa para esas fechas. Puedes ajustar el periodo o elegir otra habitación con un solo clic.';
        } else if (result.stayStatusCode === 400) {
          friendlyTitle = 'Revisemos algunos datos de la reserva';
          friendlyMessage =
            friendlyMessage ||
            'Tus datos están completamente a salvo. Por favor verifica que las fechas y el huésped titular estén correctamente seleccionados e inténtalo nuevamente.';
        } else if (result.stayStatusCode >= 500) {
          friendlyTitle = 'El servidor tuvo una pausa momentánea';
          friendlyMessage =
            '¡Respira con calma! No es tu culpa: tus datos siguen aquí intactos en pantalla. Espera un momento y vuelve a presionar "Confirmar y asegurar reserva".';
        }

        setSubmitFeedback({
          type: result.stayStatusCode === 409 ? 'warning' : 'error',
          title: friendlyTitle,
          message:
            friendlyMessage ||
            'Tus datos están intactos en pantalla. Intenta nuevamente en un momento.',
          statusCode: result.stayStatusCode,
        });
      }
    } catch {
      // Manejo de errores de red o interrupción de conexión con psicología preventiva
      const netVal = validateStatusCode(0);
      setSubmitStatusCode(0);

      setSubmitFeedback({
        type: 'error',
        title: netVal.title || 'Pequeña pausa de conexión',
        message:
          netVal.message ||
          'Tuvimos una pequeña dificultad de conexión con el servidor. No te preocupes: tus datos no se perdieron y siguen aquí en el formulario. Prueba de nuevo en un instante.',
        statusCode: 0,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Reiniciar formulario para una nueva reserva
  const handleResetForm = () => {
    setSelectedRoomId('');
    setSelectedPersonId('');
    setSelectedPersonIds([]);
    clearHuespedes();
    setCheckInDate(getTodayString());
    setCheckOutDate(getTomorrowString());
    setNumberOfGuests(1);
    setGuestDirection(1);
    setCompanions([]);
    setIsAcompanantesModalOpen(false);
    setStateValue('pendiente');
    setCustomTotalPrice(null);
    setErrors({});
    setPersonError(null);
    setSubmitStatusCode(null);
    setSubmitFeedback(null);
    setSuccessReservation(null);
  };

  const selectedStateObj = ESTADOS_RESERVA.find(
    (item) => item.value === stateValue
  );

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {successReservation ? (
          /* PANTALLA DE ÉXITO */
          <motion.div
            key="reserva-success-card"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-panel mx-auto max-w-2xl rounded-3xl border border-emerald-500/30 p-8 text-center shadow-xl sm:p-12"
          >
            <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 shadow-sm dark:text-emerald-400">
              <FontAwesomeIcon icon={faCircleCheck} className="size-8" />
            </div>

            <div className="mt-5 space-y-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                ¡Reserva Garantizada {submitStatusCode ? `· Código ${submitStatusCode}` : ''}!
              </span>
              <h2 className="text-ink text-2xl font-bold sm:text-3xl">
                ¡Estadía reservada con éxito!
              </h2>
              <p className="text-ink-muted mx-auto max-w-md text-xs leading-relaxed">
                {submitFeedback?.message ||
                  '¡Excelente trabajo! La reserva ha quedado vinculada y registrada de forma segura en el sistema de Nexora.'}
              </p>
            </div>

            {/* Ficha Resumen */}
            <div className="divide-line/60 border-line bg-canvas/60 mt-6 divide-y rounded-2xl border p-5 text-left text-xs">
              <div className="flex items-center justify-between py-2.5">
                <span className="text-ink-muted">Habitación asignada:</span>
                <span className="text-ink font-bold">
                  {successReservation.roomNumber} -{' '}
                  {successReservation.roomFloor}
                </span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-ink-muted">Huésped titular:</span>
                <span className="text-ink font-semibold">
                  {successReservation.personName}
                </span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-ink-muted">Periodo:</span>
                <span className="text-ink font-semibold">
                  {successReservation.checkInDate} al{' '}
                  {successReservation.checkOutDate} ({successReservation.nights}{' '}
                  {successReservation.nights === 1 ? 'noche' : 'noches'})
                </span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-ink-muted">Número de huéspedes:</span>
                <span className="text-ink font-semibold">
                  {successReservation.numberOfGuests} personas
                </span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-ink-muted">Estado inicial:</span>
                <span className="text-ink font-semibold">
                  {successReservation.stateLabel}
                </span>
              </div>
              <div className="flex items-center justify-between pt-3">
                <span className="text-ink text-sm font-bold">
                  Total pagado:
                </span>
                <span className="text-primary text-lg font-black">
                  {formatPrecioCOP(successReservation.totalPrice)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleResetForm}
              className="bg-primary hover:bg-primary/90 mt-6 inline-flex cursor-pointer items-center gap-2 rounded-xl px-6 py-2.5 text-xs font-bold text-white shadow-sm transition-all active:scale-95"
            >
              <span>Registrar otra reserva</span>
            </button>
          </motion.div>
        ) : (
          /* FORMULARIO REDISEÑADO */
          <motion.div
            key="reserva-main-form"
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12"
          >
            {/* Columna Izquierda (8 columnas): Campos del formulario */}
            <div className="border-line bg-panel space-y-6 rounded-3xl border p-6 shadow-sm sm:p-8 lg:col-span-8">
              <div className="border-line/60 border-b pb-4">
                <h2 className="text-ink flex items-center gap-3 text-xl font-bold">
                  {/* Icono interactivo estilo calendario con animación de hoja que se arranca al hacer hover */}
                  <motion.div
                    onHoverStart={() => setIsCalendarHovered(true)}
                    onHoverEnd={() => setIsCalendarHovered(false)}
                    whileHover={{ scale: 1.06, y: -1 }}
                    whileTap={{ scale: 0.96 }}
                    className="relative flex size-10 shrink-0 cursor-pointer flex-col overflow-hidden rounded-xl border border-primary/25 bg-panel shadow-xs transition-shadow hover:shadow-md select-none group"
                    title={`Fecha actual: ${calendarTodayDay} de ${calendarMonthAbbr}. Pasa el cursor para arrancar la hoja del día.`}
                    aria-label={`Calendario: día ${isCalendarHovered ? calendarNextDay : calendarTodayDay} de ${calendarMonthAbbr}`}
                  >
                    {/* Anillos superiores del calendario */}
                    <span
                      aria-hidden="true"
                      className="absolute -top-0.5 left-2 h-1.5 w-1 rounded-full bg-primary/40 border border-panel z-10"
                    />
                    <span
                      aria-hidden="true"
                      className="absolute -top-0.5 right-2 h-1.5 w-1 rounded-full bg-primary/40 border border-panel z-10"
                    />

                    {/* Cabecera del mes */}
                    <div className="bg-primary flex h-3.5 w-full items-center justify-center px-1 text-[8px] font-black uppercase tracking-wider text-white">
                      <span>{calendarMonthAbbr}</span>
                    </div>

                    {/* Línea de corte / picado de papel */}
                    <div className="w-full border-t border-dashed border-primary/20" />

                    {/* Hoja del día con efecto de cruce vertical (hoja arrancada) */}
                    <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-panel">
                      <AnimatePresence mode="popLayout" initial={false} custom={isCalendarHovered ? 1 : -1}>
                        <motion.span
                          key={isCalendarHovered ? 'calendar-next' : 'calendar-today'}
                          custom={isCalendarHovered ? 1 : -1}
                          variants={tearSheetVariants}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                          className="font-black text-xs text-primary leading-none"
                        >
                          {isCalendarHovered ? calendarNextDay : calendarTodayDay}
                        </motion.span>
                      </AnimatePresence>

                      {/* Pliegue de esquina de papel inferior derecha */}
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute bottom-0 right-0 size-1.5 rounded-tl-[2px] bg-primary/10 border-l border-t border-primary/20 transition-transform group-hover:scale-125"
                      />
                    </div>
                  </motion.div>

                  Datos de la Reserva
                </h2>
                <p className="text-ink-muted mt-1 text-xs">
                  Ingresa o selecciona la información esencial para reservar y
                  asegurar el alojamiento.
                </p>
              </div>

              {/* Error al cargar catálogo de habitaciones con validateStatusCode */}
              {roomError && (
                <div
                  role="alert"
                  className="border-danger/30 bg-danger/10 text-danger flex items-center justify-between rounded-2xl border p-4 text-xs"
                >
                  <span>{roomError}</span>
                  <button
                    type="button"
                    onClick={handleRetryRooms}
                    className="hover:text-danger/80 ml-2 shrink-0 cursor-pointer font-bold underline"
                  >
                    Reintentar habitaciones
                  </button>
                </div>
              )}

              {/* Mensaje de retroalimentación psicológica al recepcionista si la reserva no se registró */}
              {submitFeedback && submitFeedback.type !== 'success' && (
                <div
                  role="alert"
                  className={`flex items-start gap-3 rounded-2xl border p-4.5 text-xs leading-relaxed shadow-xs ${
                    submitFeedback.type === 'warning' || submitStatusCode === 409
                      ? 'border-amber-500/35 bg-amber-500/10 text-amber-950 dark:text-amber-200'
                      : 'border-danger/35 bg-danger/10 text-danger'
                  }`}
                >
                  <span className="text-xl shrink-0 mt-0.5">
                    {submitStatusCode === 409 ? '📅' : '🌿'}
                  </span>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <strong className="block font-bold text-sm">
                        {submitFeedback.title}
                      </strong>
                      {submitStatusCode !== null && submitStatusCode > 0 && (
                        <span className="rounded-md border border-current/20 px-2 py-0.5 text-[10px] font-mono font-semibold">
                          Código {submitStatusCode}
                        </span>
                      )}
                    </div>
                    <p className="leading-relaxed">{submitFeedback.message}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSubmitFeedback(null)}
                    aria-label="Cerrar notificación"
                    className="text-current/60 hover:text-current ml-1 shrink-0 cursor-pointer p-1 transition-colors"
                  >
                    <FontAwesomeIcon icon={faXmark} className="size-3.5" />
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-6">
                {/* 1. DROPDOWN: HABITACIONES (RecursosDropdown reutilizable) */}
                <div>
                  <RecursosDropdown
                    id="select-habitacion"
                    label="Habitación (Numero - Piso)"
                    placeholder={
                      loadingRooms
                        ? 'Consultando habitaciones (/room)…'
                        : '-- Selecciona una habitación --'
                    }
                    options={roomDropdownOptions}
                    value={selectedRoomId}
                    onChange={(val) => handleRoomChange(val)}
                    disabled={loadingRooms || submitting}
                    required
                    error={errors.roomId || roomError || undefined}
                  />

                  {/* Ficha descriptiva de la habitación seleccionada */}
                  {selectedRoom && (
                    <div className="border-primary/20 bg-primary/5 text-ink mt-2.5 flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2 text-[11px]">
                      <span className="text-primary font-bold">
                        Habitación {selectedRoom.number} - {selectedRoom.floor}
                      </span>
                      {selectedRoom.status && (
                        <>
                          <span className="text-ink-muted">·</span>
                          <span className="text-ink-muted capitalize">
                            Estado: {selectedRoom.status}
                          </span>
                        </>
                      )}
                      {selectedRoom.price_override != null && (
                        <>
                          <span className="text-ink-muted">·</span>
                          <span>
                            Tarifa:{' '}
                            <strong>
                              {formatPrecioCOP(selectedRoom.price_override)}
                              /noche
                            </strong>
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* 2. DROPDOWN: PERSONAS REGISTRADAS (RecursosDropdown reutilizable) */}
                <div>
                  <div className="flex items-start gap-2.5">
                    <div className="min-w-0 flex-1">
                      <RecursosDropdown
                        id="select-persona"
                        label="Huésped titular registrado"
                        placeholder={
                          loadingPersons
                            ? 'Consultando huéspedes (/persons)…'
                            : '-- Selecciona uno o varios huéspedes registrados --'
                        }
                        options={personDropdownOptions}
                        multiple={true}
                        searchable={true}
                        searchPlaceholder="Buscar huésped por nombre o documento..."
                        selectedValues={selectedPersonIds}
                        onMultiChange={handleHuespedesMultiChange}
                        disabled={loadingPersons || submitting}
                        required
                        error={errors.personId}
                      />
                    </div>

                    {/* Botón que abre el modal de ingreso de información personal del huésped */}
                    <div className="pt-[26px]">
                      <button
                        type="button"
                        onClick={() => setIsGuestModalOpen(true)}
                        className="border-primary/30 bg-primary/10 text-primary hover:bg-primary inline-flex h-[42px] shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border px-3.5 text-xs font-semibold shadow-xs transition-all hover:text-white active:scale-95"
                        title="Registrar un nuevo huésped"
                      >
                        <FontAwesomeIcon icon={faPlus} className="size-3.5" aria-hidden="true" />
                        <span className="hidden sm:inline">Nuevo huésped</span>
                        <span className="sm:hidden">Nuevo</span>
                      </button>
                    </div>
                  </div>

                  {/* Feedback de error de carga de huéspedes si ocurre */}
                  {personError && (
                    <div
                      role="alert"
                      className="border-danger/30 bg-danger/10 text-danger mt-1.5 flex items-center justify-between rounded-xl border p-2.5 text-[11px]"
                    >
                      <span>{personError}</span>
                      <button
                        type="button"
                        onClick={handleRetryPersons}
                        className="hover:text-danger/80 ml-2 shrink-0 cursor-pointer font-bold underline"
                      >
                        Reintentar
                      </button>
                    </div>
                  )}

                  {/* Ficha del huésped titular y lista detallada de acompañantes debajo */}
                  {selectedPerson && (
                    <div className="mt-2.5 space-y-2">
                      {/* Ficha del Huésped Titular */}
                      <div className="border-line bg-canvas/70 text-ink flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2 text-[11px] shadow-xs">
                        <span className="inline-flex items-center rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary border border-primary/20">
                          Titular
                        </span>
                        <span className="text-ink font-semibold">
                          {selectedPerson.name}
                        </span>
                        {selectedPerson.document_number && (
                          <>
                            <span className="text-ink-muted">·</span>
                            <span className="text-ink-muted">
                              Doc: {selectedPerson.document_number}
                            </span>
                          </>
                        )}
                        {selectedPerson.phone_number && (
                          <>
                            <span className="text-ink-muted">·</span>
                            <span className="text-ink-muted">
                              Tel: {selectedPerson.phone_number}
                            </span>
                          </>
                        )}
                        {selectedPerson.email && (
                          <>
                            <span className="text-ink-muted">·</span>
                            <span className="text-ink-muted truncate max-w-[200px]">
                              {selectedPerson.email}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Lista de acompañantes seleccionados debajo de la sección Titular */}
                      {selectedCompanions.length > 0 && (
                        <div className="space-y-1.5 pt-0.5">
                          <div className="flex items-center justify-between px-1">
                            <span className="text-[11px] font-semibold text-ink-muted flex items-center gap-1.5">
                              <FontAwesomeIcon icon={faUsers} className="size-3 text-primary" />
                              Acompañante{selectedCompanions.length > 1 ? 's' : ''} ({selectedCompanions.length})
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            {selectedCompanions.map((comp, idx) => (
                              <div
                                key={comp.id || idx}
                                className="border-line/70 bg-panel-soft/60 text-ink flex flex-wrap items-center gap-2 rounded-xl border px-3 py-1.5 text-[11px] transition hover:border-primary/30"
                              >
                                <span className="inline-flex items-center rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                  Acompañante #{idx + 1}
                                </span>
                                <span className="text-ink font-medium">
                                  {comp.name}
                                </span>
                                {comp.document_number && (
                                  <>
                                    <span className="text-ink-muted">·</span>
                                    <span className="text-ink-muted">
                                      Doc: {comp.document_number}
                                    </span>
                                  </>
                                )}
                                {comp.phone_number && (
                                  <>
                                    <span className="text-ink-muted">·</span>
                                    <span className="text-ink-muted">
                                      Tel: {comp.phone_number}
                                    </span>
                                  </>
                                )}
                                {comp.email && (
                                  <>
                                    <span className="text-ink-muted">·</span>
                                    <span className="text-ink-muted truncate max-w-[200px]">
                                      {comp.email}
                                    </span>
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 3. DATE PICKER: FECHA DE ENTRADA Y FECHA DE SALIDA */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-ink block text-xs font-semibold">
                      Periodo de la estadía{' '}
                      <span className="text-danger">*</span>
                    </span>
                    <span className="bg-primary/10 text-primary inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold">
                      {nights} {nights === 1 ? 'noche' : 'noches'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {/* Fecha de Entrada */}
                    <div>
                      <label
                        htmlFor="check-in-date"
                        className="text-ink-muted mb-1 block text-[11px] font-medium"
                      >
                        Fecha de entrada
                      </label>
                      <input
                        type="date"
                        id="check-in-date"
                        value={checkInDate}
                        min={getTodayString()}
                        onChange={(e) => handleCheckInChange(e.target.value)}
                        disabled={submitting}
                        className={`bg-canvas text-ink focus:border-primary focus:ring-primary/20 w-full cursor-pointer rounded-xl border px-3.5 py-2 text-xs transition outline-none focus:ring-2 ${
                          errors.checkInDate
                            ? 'border-danger/60 focus:border-danger'
                            : 'border-line'
                        }`}
                      />
                      {errors.checkInDate && (
                        <p
                          role="alert"
                          className="text-danger mt-1 text-xs font-medium"
                        >
                          {errors.checkInDate}
                        </p>
                      )}
                    </div>

                    {/* Fecha de Salida */}
                    <div>
                      <label
                        htmlFor="check-out-date"
                        className="text-ink-muted mb-1 block text-[11px] font-medium"
                      >
                        Fecha de salida
                      </label>
                      <input
                        type="date"
                        id="check-out-date"
                        value={checkOutDate}
                        min={checkInDate || getTodayString()}
                        onChange={(e) => handleCheckOutChange(e.target.value)}
                        disabled={submitting}
                        className={`bg-canvas text-ink focus:border-primary focus:ring-primary/20 w-full cursor-pointer rounded-xl border px-3.5 py-2 text-xs transition outline-none focus:ring-2 ${
                          errors.checkOutDate
                            ? 'border-danger/60 focus:border-danger'
                            : 'border-line'
                        }`}
                      />
                      {errors.checkOutDate && (
                        <p
                          role="alert"
                          className="text-danger mt-1 text-xs font-medium"
                        >
                          {errors.checkOutDate}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 4. INPUT: NÚMERO DE HUÉSPEDES (Input reutilizable con número deslizante direccional) */}
                <div className="grid grid-cols-1 items-start gap-6 sm:grid-cols-2">
                  <div>
                    <div className="flex items-end gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={() => {
                          setGuestDirection(-1);
                          const val = Math.max(1, numberOfGuests - 1);
                          handleNumberOfGuestsChange(val);
                        }}
                        disabled={numberOfGuests <= 1 || submitting}
                        aria-label="Disminuir huéspedes"
                        className="border-line bg-canvas text-ink hover:bg-panel grid size-[42px] shrink-0 cursor-pointer place-items-center rounded-xl border transition disabled:opacity-40 mb-[1px]"
                      >
                        <span className="text-base font-bold">−</span>
                      </motion.button>

                      <div className="relative flex-1">
                        <Input
                          id="number-of-guests"
                          label="Número de huéspedes"
                          type="number"
                          min={1}
                          max={selectedRoom ? selectedRoom.capacity : 10}
                          value={numberOfGuests}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            if (!isNaN(val)) {
                              setGuestDirection(val >= numberOfGuests ? 1 : -1);
                              handleNumberOfGuestsChange(val);
                            }
                          }}
                          disabled={submitting}
                          required
                          error={errors.numberOfGuests}
                          className="[&_input]:text-center [&_input]:font-bold [&_input]:text-xs [&_input]:text-transparent select-none"
                        />

                        {/* Número animado con Framer Motion que se desliza según la dirección (efecto estrella) */}
                        <div className="pointer-events-none absolute inset-x-0 top-[26px] flex h-[42px] items-center justify-center overflow-hidden">
                          <AnimatePresence mode="popLayout" initial={false} custom={guestDirection}>
                            <motion.span
                              key={numberOfGuests}
                              custom={guestDirection}
                              variants={slidingGuestNumberVariants}
                              initial="initial"
                              animate="animate"
                              exit="exit"
                              className="font-bold text-xs text-ink select-none"
                            >
                              {numberOfGuests}
                            </motion.span>
                          </AnimatePresence>
                        </div>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={() => {
                          setGuestDirection(1);
                          handleNumberOfGuestsChange(numberOfGuests + 1);
                        }}
                        disabled={
                          (selectedRoom &&
                            numberOfGuests >= selectedRoom.capacity) ||
                          submitting
                        }
                        aria-label="Aumentar huéspedes"
                        className="border-line bg-canvas text-ink hover:bg-panel grid size-[42px] shrink-0 cursor-pointer place-items-center rounded-xl border transition disabled:opacity-40 mb-[1px]"
                      >
                        <span className="text-base font-bold">+</span>
                      </motion.button>
                    </div>

                    {/* Botón interactivo para abrir/gestionar el modal de acompañantes si superamos 1 huésped */}
                    {numberOfGuests > 1 && (
                      <button
                        type="button"
                        onClick={() => setIsAcompanantesModalOpen(true)}
                        className="mt-2.5 flex w-full items-center justify-between gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary transition hover:bg-primary/20 active:scale-[0.99] cursor-pointer"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FontAwesomeIcon icon={faUsers} className="size-3.5 shrink-0" />
                          <span className="truncate">
                            Acompañantes: {companions.length} de {numberOfGuests - 1} registrados
                          </span>
                        </div>
                        <span className="shrink-0 rounded-lg bg-primary px-2 py-0.5 text-[10px] font-bold text-white">
                          {companions.length >= numberOfGuests - 1 ? 'Gestionar' : 'Registrar'}
                        </span>
                      </button>
                    )}

                    {selectedRoom && (
                      <p className="text-ink-muted mt-1 text-[11px]">
                        Habitación {selectedRoom.number} (Piso{' '}
                        {selectedRoom.floor}): Capacidad sugerida hasta{' '}
                        {selectedRoom.capacity} personas.
                      </p>
                    )}
                  </div>

                  {/* 5. DROPDOWN: ESTADO DE LA RESERVA (RecursosDropdown reutilizable) */}
                  <div>
                    <RecursosDropdown
                      id="select-estado"
                      label="Estado de la reserva"
                      options={estadoDropdownOptions}
                      value={stateValue}
                      onChange={(val) => setStateValue(val)}
                      disabled={submitting}
                      required
                    />

                    {selectedStateObj && (
                      <div className="mt-2 flex items-center gap-1.5">
                        <span
                          className={`size-2 rounded-full ${selectedStateObj.dotColor}`}
                          aria-hidden="true"
                        />
                        <span className="text-ink-muted text-[11px] font-medium">
                          Estado seleccionado:{' '}
                          <strong>{selectedStateObj.label}</strong>
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 6. INPUT: PRECIO TOTAL (Input reutilizable) */}
                <div>
                  <div className="mb-1 flex items-center justify-end">
                    {customTotalPrice !== null && (
                      <button
                        type="button"
                        onClick={() => setCustomTotalPrice(null)}
                        className="text-primary cursor-pointer text-[11px] font-medium hover:underline"
                        title="Restaurar precio calculado por noches"
                      >
                        Restaurar precio sugerido ({formatPrecioCOP(suggestedPrice)})
                      </button>
                    )}
                  </div>

                  <Input
                    id="total-price"
                    label="Precio total (COP)"
                    type="number"
                    min={0}
                    value={effectiveTotalPrice}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (!isNaN(val)) setCustomTotalPrice(val);
                      if (errors.totalPrice)
                        setErrors((p) => ({ ...p, totalPrice: '' }));
                    }}
                    disabled={submitting}
                    required
                    error={errors.totalPrice}
                    icon={
                      <span className="text-ink-muted text-xs font-bold">
                        $ COP
                      </span>
                    }
                    className="[&_input]:pl-16 [&_input]:font-bold [&_input]:text-xs"
                  />

                  <div className="text-ink-muted mt-1.5 flex items-center justify-between text-[11px]">
                    <span>
                      Representación:{' '}
                      <strong className="text-ink">
                        {formatPrecioCOP(effectiveTotalPrice)}
                      </strong>
                    </span>
                    {selectedRoom && (
                      <span>
                        Base sugerida: {formatPrecioCOP(selectedRoom.price)} ×{' '}
                        {nights} {nights === 1 ? 'noche' : 'noches'}
                      </span>
                    )}
                  </div>
                </div>
              </form>
            </div>

            {/* Columna Derecha (4 columnas): Resumen Dinámico y Confirmación */}
            <div className="sticky top-6 space-y-4 lg:col-span-4">
              <div className="border-line bg-panel space-y-5 rounded-3xl border p-6 shadow-sm">
                <div className="border-line/60 flex items-center justify-between border-b pb-3">
                  <h3 className="text-ink text-sm font-bold tracking-wider uppercase">
                    Resumen de Estadía
                  </h3>
                  {selectedStateObj && (
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${selectedStateObj.badgeClass}`}
                    >
                      <span
                        className={`size-1.5 rounded-full ${selectedStateObj.dotColor}`}
                      />
                      {selectedStateObj.label}
                    </span>
                  )}
                </div>

                <div className="space-y-3 text-xs">
                  {/* Habitación con formato number - floor */}
                  <div className="flex items-start justify-between">
                    <span className="text-ink-muted">Habitación:</span>
                    <strong className="text-ink max-w-[180px] truncate text-right">
                      {selectedRoom
                        ? `${selectedRoom.number} - ${selectedRoom.floor}`
                        : 'Sin seleccionar'}
                    </strong>
                  </div>

                  {/* Huésped */}
                  <div className="flex items-start justify-between">
                    <span className="text-ink-muted">Huésped:</span>
                    <strong className="text-ink max-w-[180px] truncate text-right">
                      {selectedPerson ? selectedPerson.name : 'Sin seleccionar'}
                    </strong>
                  </div>

                  {/* Periodo */}
                  <div className="flex items-start justify-between">
                    <span className="text-ink-muted">Entrada / Salida:</span>
                    <span className="text-ink text-right font-semibold">
                      {checkInDate} <br />
                      <span className="text-ink-muted text-[11px]">
                        hasta {checkOutDate}
                      </span>
                    </span>
                  </div>

                  {/* Noches */}
                  <div className="flex items-center justify-between">
                    <span className="text-ink-muted">Noches:</span>
                    <strong className="text-ink">
                      {nights} {nights === 1 ? 'noche' : 'noches'}
                    </strong>
                  </div>

                  {/* Huéspedes */}
                  <div className="flex items-center justify-between">
                    <span className="text-ink-muted">Aforo:</span>
                    <strong className="text-ink">
                      {numberOfGuests} personas
                    </strong>
                  </div>

                  {/* Tarifa base */}
                  {selectedRoom && (
                    <div className="border-line/50 flex items-center justify-between border-t pt-2 text-[11px]">
                      <span className="text-ink-muted">Tarifa por noche:</span>
                      <span className="text-ink">
                        {formatPrecioCOP(selectedRoom.price)}
                      </span>
                    </div>
                  )}

                  {/* Total */}
                  <div className="border-line/70 flex items-baseline justify-between border-t pt-3">
                    <span className="text-ink text-sm font-bold">
                      Total a pagar:
                    </span>
                    <span className="text-primary text-xl font-black">
                      {formatPrecioCOP(effectiveTotalPrice)}
                    </span>
                  </div>
                </div>

                {/* Botón de Confirmación Principal */}
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting || loadingRooms}
                  className="bg-primary hover:bg-primary/90 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-xs font-bold text-white shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader size={16} visible={true} className="text-white" />
                      <span>Confirmando y asegurando reserva…</span>
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faCheck} className="size-4" />
                      <span>Confirmar y asegurar reserva</span>
                    </>
                  )}
                </button>

                <p className="text-ink-muted text-center text-[11px] leading-tight">
                  Tus datos están protegidos. La reserva se confirmará
                  inmediatamente en el sistema.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL PARA INGRESAR INFORMACIÓN PERSONAL DEL HUÉSPED TITULAR */}
      <NuevoHuespedModal
        isOpen={isGuestModalOpen}
        onClose={() => setIsGuestModalOpen(false)}
        onSuccess={handleGuestCreated}
      />

      {/* MODAL PARA REGISTRAR LOS ACOMPAÑANTES DE LA RESERVA (SI HUÉSPEDES > 1) */}
      <ReservaAcompanantesModal
        isOpen={isAcompanantesModalOpen}
        onClose={() => setIsAcompanantesModalOpen(false)}
        totalGuests={numberOfGuests}
        titularPerson={selectedPerson}
        companions={companions}
        onSaveCompanion={handleSaveCompanion}
      />

      {/* Componente reutilizable Loader con overlay mientras se procesa la reserva en segundo plano */}
      <Loader
        overlay
        visible={submitting}
        label="Confirmando y asegurando reserva en el sistema…"
        size={36}
      />
    </div>
  );
}
