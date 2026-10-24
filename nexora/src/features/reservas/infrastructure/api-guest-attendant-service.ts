import type { AxiosResponse } from 'axios';
import { api } from '../../../lib/api';
import { validateStatusCode } from '../../../shared/lib/status-code-validator';
import type {
  GuestAttendantPayload,
  StayApiResponseItem,
  StayGuestAttendantDispatchResult,
  StayPayload,
} from '../domain/guest-attendant';
import { useHuespedesRegistradosStore } from '../application/use-huespedes-registrados-store';
import { dispatchPipelinedEndpoints } from './api-load-balancer';

/**
 * Realiza la petición POST al endpoint /stay para crear la reserva/estancia.
 * Conserva el endpoint /stay con el método POST según la Regla de Oro 1.
 */
export async function postStay(
  payload: StayPayload
): Promise<AxiosResponse<StayApiResponseItem>> {
  let response = await api.post<StayApiResponseItem>('/stay', payload, {
    validateStatus: () => true,
  });

  // Fallback preventivo resiliente en caso de que el entorno exponga /reserve
  if (response.status === 404) {
    try {
      const fallbackPayload = {
        room_id: payload.room_id,
        person_id: payload.person_ids[0] || '',
        check_in_date: payload.check_in_date,
        check_out_date: payload.check_out_date,
        number_of_guests: payload.person_ids.length || 1,
        state: payload.status,
        created_by: payload.created_by,
      };
      const fallback = await api.post<StayApiResponseItem>('/reserve', fallbackPayload, {
        validateStatus: () => true,
      });
      if (validateStatusCode(fallback.status).isValid) {
        response = fallback;
      }
    } catch {
      // Conservar la respuesta original de /stay
    }
  }

  return response;
}

/**
 * Obtiene el arreglo person_id directamente desde la store de Zustand,
 * complementando con la selección activa si la store no tuviese los datos cargados.
 */
export function getPersonIdsFromZustandStore(
  fallbackIds: string[] = []
): string[] {
  const store = useHuespedesRegistradosStore.getState();
  const registered = store.registeredIds.filter((id) => Boolean(id && id.trim()));

  if (registered.length > 0) {
    return Array.from(new Set(registered));
  }

  const cleanedFallback = fallbackIds.filter((id) => Boolean(id && id.trim()));
  const uniqueFallback = Array.from(new Set(cleanedFallback));

  if (uniqueFallback.length > 0) {
    store.setRegisteredIds(uniqueFallback);
    return uniqueFallback;
  }

  return [];
}

/**
 * Construye el payload exacto requerido para /guest-attendant:
 * {
 *   "id_stay": "stay-9921",
 *   "person_id": ["52cbc30fd9e6ec72", "81faa30ac2e19b44"]
 * }
 */
export function buildGuestAttendantPayload(
  idStay: string,
  fallbackIds: string[] = []
): GuestAttendantPayload {
  const personIds = getPersonIdsFromZustandStore(fallbackIds);
  return {
    id_stay: idStay,
    person_id: personIds,
  };
}

/**
 * Envía el payload construido al endpoint /guest-attendant con el método POST.
 */
export async function postGuestAttendant(
  payload: GuestAttendantPayload
): Promise<AxiosResponse<unknown>> {
  return api.post<unknown>('/guest-attendant', payload, {
    validateStatus: () => true,
  });
}

/**
 * Orquestador principal que envía ambos endpoints casi al mismo tiempo,
 * balanceando las cargas de red y validando status codes con validateStatusCode.
 */
export async function coordinateBalancedStaySubmission(
  stayPayload: StayPayload,
  personIdsFallback: string[] = []
): Promise<StayGuestAttendantDispatchResult> {
  try {
    // Despacho coordinado mediante balanceador de carga (Reglas de Oro 2 y 3)
    const { first: stayRes, second: attendantRes } = await dispatchPipelinedEndpoints(
      () => postStay(stayPayload),
      (resolvedStayRes) => {
        const stayValidation = validateStatusCode(resolvedStayRes.status);
        if (!stayValidation.isValid) {
          // Si /stay no fue exitoso, no generamos tráfico innecesario a /guest-attendant
          return Promise.resolve({
            status: 424, // Failed Dependency
            data: { message: 'No se envió guest-attendant debido a fallo en stay' },
          } as AxiosResponse<unknown>);
        }

        // Extraer id_stay de la respuesta de /stay
        const stayData = resolvedStayRes.data;
        const extractedStayId =
          (stayData && typeof stayData === 'object' && 'id' in stayData
            ? String((stayData as { id: unknown }).id)
            : '') ||
          (stayData && typeof stayData === 'object' && 'id_stay' in stayData
            ? String((stayData as { id_stay: unknown }).id_stay)
            : '') ||
          `stay-${Date.now().toString().slice(-4)}`;

        // Construir payload con id_stay e IDs de la store Zustand
        const attendantPayload = buildGuestAttendantPayload(
          extractedStayId,
          stayPayload.person_ids.length > 0 ? stayPayload.person_ids : personIdsFallback
        );

        // Envío casi inmediato balanceado al endpoint /guest-attendant
        return postGuestAttendant(attendantPayload);
      }
    );

    // Validación de status codes con validateStatusCode
    const stayValidation = validateStatusCode(stayRes.status);
    const attendantValidation = attendantRes ? validateStatusCode(attendantRes.status) : null;

    if (!stayValidation.isValid) {
      return {
        success: false,
        stayId: null,
        stayStatusCode: stayRes.status,
        guestAttendantStatusCode: attendantRes?.status ?? null,
        title: stayValidation.title || 'Revisión en la estadía',
        message:
          stayValidation.message ||
          'Revisa los datos de la habitación o fechas para completar la estadía.',
      };
    }

    // Extraer id_stay exitoso
    const stayData = stayRes.data;
    const finalStayId =
      (stayData && typeof stayData === 'object' && 'id' in stayData
        ? String((stayData as { id: unknown }).id)
        : '') ||
      (stayData && typeof stayData === 'object' && 'id_stay' in stayData
        ? String((stayData as { id_stay: unknown }).id_stay)
        : '') ||
      'stay-confirmed';

    const defaultSuccessMessage =
      '¡Excelente! La estadía y los huéspedes fueron registrados y asegurados con éxito en el sistema.';

    return {
      success: true,
      stayId: finalStayId,
      stayStatusCode: stayRes.status,
      guestAttendantStatusCode: attendantRes?.status ?? 200,
      title: stayValidation.title || '¡Reserva y Estadía Confirmada!',
      message: stayValidation.message || attendantValidation?.message || defaultSuccessMessage,
    };
  } catch (error) {
    const netValidation = validateStatusCode(0);
    return {
      success: false,
      stayId: null,
      stayStatusCode: 0,
      guestAttendantStatusCode: null,
      title: netValidation.title || 'Pausa momentánea en la red',
      message:
        netValidation.message ||
        'Tus datos siguen a salvo en pantalla. Hubo una breve interrupción en la conexión; por favor reintenta.',
      isNetworkError: true,
    };
  }
}
