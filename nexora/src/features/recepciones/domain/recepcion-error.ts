/**
 * Excepción base para fallos originados en la API REST de recepciones
 */
export class RecepcionApiError extends Error {
  readonly statusCode: number
  readonly serverMessage?: string

  constructor(statusCode: number, message?: string) {
    super(message || `Error en la API de recepciones con código ${statusCode}`)
    this.name = 'RecepcionApiError'
    this.statusCode = statusCode
    this.serverMessage = message
  }
}

/** Error 404: Habitación, Huésped, Sede o recurso no localizado */
export class RecepcionNotFoundError extends RecepcionApiError {
  constructor(recurso: string, id: string) {
    super(404, `No encontramos el registro de ${recurso} con identificador "${id}".`)
    this.name = 'RecepcionNotFoundError'
  }
}

/** Error 409: Conflicto de ocupación de cama o habitación */
export class RecepcionConflictError extends RecepcionApiError {
  constructor(mensaje?: string) {
    super(409, mensaje || 'La habitación o cama seleccionada ya se encuentra ocupada por otra estadía activa.')
    this.name = 'RecepcionConflictError'
  }
}

/** Error 0 o Network: Falla de conexión, DNS o timeout */
export class RecepcionNetworkError extends RecepcionApiError {
  constructor(mensaje?: string) {
    super(0, mensaje || 'No pudimos conectar con los servidores de Aloja. Por favor verifica tu conexión a internet.')
    this.name = 'RecepcionNetworkError'
  }
}

/**
 * Excepción lanzada cuando no se puede obtener la información del edificio (/building/{id}).
 */
export class EdificioNotFoundException extends RecepcionApiError {
  constructor(edificioId?: string, mensaje?: string) {
    super(
      404,
      mensaje ||
        (edificioId
          ? `No se encontró el edificio con identificador "${edificioId}".`
          : 'No se encontraron edificios registrados en el sistema.')
    )
    this.name = 'EdificioNotFoundException'
  }
}

/**
 * Excepción lanzada cuando no se puede obtener la información de la sede (/headquarters/{id}).
 */
export class SedeNotFoundException extends RecepcionApiError {
  constructor(sedeId?: string, mensaje?: string) {
    super(
      404,
      mensaje ||
        (sedeId
          ? `No se encontró la sede con identificador "${sedeId}".`
          : 'No se encontraron sedes registradas en el sistema.')
    )
    this.name = 'SedeNotFoundException'
  }
}

/**
 * Excepción lanzada cuando no se pueden obtener subsedes (/sub-headquarters/by-headquarter/{id_headquarters}).
 */
export class SubSedeNotFoundException extends RecepcionApiError {
  constructor(headquarterId?: string, mensaje?: string) {
    super(
      404,
      mensaje ||
        (headquarterId
          ? `No se encontraron subsedes asociadas a la sede "${headquarterId}".`
          : 'No se encontraron subsedes registradas en el sistema.')
    )
    this.name = 'SubSedeNotFoundException'
  }
}

/**
 * Excepción compuesta cuando la jerarquía completa de ubicación física (Edificio, Sede, Subsede) no está disponible.
 */
export class UbicacionHierarchyNotFoundException extends RecepcionApiError {
  constructor(mensaje?: string) {
    super(
      404,
      mensaje || 'No fue posible resolver la jerarquía completa de ubicación (Edificio, Sede y Subsede).'
    )
    this.name = 'UbicacionHierarchyNotFoundException'
  }
}
