/**
 * Dominio de Huéspedes Acompañantes y Atendientes (guest-attendant)
 * Estructuras y contratos para la orquestación coordinada de estancias y acompañantes.
 */

export interface StayPayload {
  /** Identificador de la habitación asignada */
  room_id: string;
  /** Arreglo de identificadores de personas registradas (titular y acompañantes) */
  person_ids: string[];
  /** Fecha de entrada en formato ISO (ej: 2026-10-24T15:00:00Z) */
  check_in_date: string;
  /** Fecha de salida en formato ISO (ej: 2026-10-26T12:00:00Z) */
  check_out_date: string;
  /** Método de pago (ej: card, cash) */
  payment_method: string;
  /** Depósito de garantía en pesos (0 por defecto si no aplica) */
  security_deposit: number;
  /** Observaciones o notas de la estadía */
  remarks: string;
  /** Estado de la estadía (ej: progress) */
  status: string;
  /** Correo del usuario que crea la estadía */
  created_by: string;
}

export interface GuestAttendantPayload {
  /** Identificador de la estadía devuelto por el endpoint /stay (item id) */
  id_stay: string;
  /** Identificadores de las personas registradas obtenidos de la store de Zustand */
  person_id: string[];
}

export interface StayApiResponseItem {
  id?: string;
  id_stay?: string;
  room_id?: string;
  person_ids?: string[];
  status?: string;
  [key: string]: unknown;
}

export interface StayGuestAttendantDispatchResult {
  /** Indica si tanto /stay como /guest-attendant se completaron exitosamente */
  success: boolean;
  /** Identificador de la estadía creada */
  stayId: string | null;
  /** Código de estado devuelto por el endpoint /stay */
  stayStatusCode: number;
  /** Código de estado devuelto por el endpoint /guest-attendant */
  guestAttendantStatusCode: number | null;
  /** Título sugerido para el feedback del recepcionista */
  title: string;
  /** Mensaje empático y claro basado en psicología del usuario */
  message: string;
  /** Flag de error de red o timeout */
  isNetworkError?: boolean;
}
