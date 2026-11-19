import {
  validateStatusCode,
  type AlertPlanet,
  type AlertVariant,
} from '../../../shared/lib/status-code-validator'
import type { MenuCategoria } from '../domain/menu-categoria'

export const DEFAULT_PRODUCT_IMAGE =
  'https://images.pexels.com/photos/6823326/pexels-photo-6823326.jpeg'

export interface ProductoPostFeedback {
  id: number
  isValid: boolean
  status: number
  variant: AlertVariant
  planet: AlertPlanet
  title: string
  message?: string
  rawError?: unknown
  validationErrors?: string[]
}

export function buildPostFeedback(
  status: number,
  responseData?: unknown,
  thrownError?: unknown
): ProductoPostFeedback {
  const validation = validateStatusCode(status)
  const id = Date.now()

  if (validation.isValid) {
    const serverMessage =
      typeof responseData === 'object' &&
      responseData !== null &&
      'message' in responseData &&
      typeof (responseData as Record<string, unknown>).message === 'string'
        ? ((responseData as Record<string, unknown>).message as string).trim()
        : ''

    return {
      id,
      isValid: true,
      status,
      variant: validation.variant,
      planet: validation.planet,
      title: validation.title ?? 'Producto registrado',
      message:
        validation.message ||
        serverMessage ||
        '¡Excelente! Producto registrado con éxito en la carta.',
    }
  }

  const rawError =
    thrownError ??
    ({
      response: {
        status,
        data:
          responseData !== undefined && responseData !== null && responseData !== ''
            ? responseData
            : { message: validation.message ?? undefined },
      },
      message: validation.message ?? undefined,
    } as const)

  return {
    id,
    isValid: false,
    status,
    variant: validation.variant,
    planet: validation.planet,
    title: validation.title ?? 'No se pudo registrar el producto',
    message:
      responseData !== undefined && responseData !== null && responseData !== ''
        ? undefined
        : (validation.message ??
          'No se pudo procesar la solicitud. Por favor intenta nuevamente.'),
    rawError,
  }
}

export function buildImageUploadErrorFeedback(
  errorDetail?: string | null
): ProductoPostFeedback {
  const message =
    errorDetail?.trim() ||
    'No pudimos subir la fotografía seleccionada al almacenamiento. Tus datos siguen intactos; intenta guardar de nuevo o cambia la imagen.'

  return {
    id: Date.now(),
    isValid: false,
    status: 502,
    variant: 'warning',
    planet: 'jupiter',
    title: 'Error al subir la fotografía del producto',
    message,
    rawError: new Error(message),
  }
}

export function buildValidationErrorFeedback(
  validationErrors: string[]
): ProductoPostFeedback {
  return {
    id: Date.now(),
    isValid: false,
    status: 400,
    variant: 'warning',
    planet: 'jupiter',
    title: 'Revisa los campos antes de guardar',
    message:
      'Completa o corrige la información señalada para poder registrar el producto en el catálogo.',
    validationErrors,
  }
}

export function buildUnexpectedSubmitErrorFeedback(
  err: unknown
): ProductoPostFeedback {
  const detail =
    err instanceof Error && err.message.trim()
      ? err.message
      : 'Ocurrió un error inesperado al intentar guardar el producto.'

  return {
    id: Date.now(),
    isValid: false,
    status: 500,
    variant: 'error',
    planet: 'mars',
    title: 'No se pudo completar el registro',
    message: `${detail} Tus datos siguen intactos en el formulario; puedes intentarlo de nuevo.`,
    rawError: err instanceof Error ? err : new Error(detail),
  }
}

export interface BuildItemMenuPayloadParams {
  listaCategorias: ReadonlyArray<MenuCategoria>
  categoriaSeleccionada: string
  categoriaInicial?: MenuCategoria | null
  name: string
  description: string
  price: string
  taxPercentage: string
  prepTime: string
  isVegetarian: boolean
  isVegan: boolean
  imageUrl: string
  startTime: string
  endTime: string
  available: boolean
  emailCreador?: string | null
}

export function buildItemMenuPayload({
  listaCategorias,
  categoriaSeleccionada,
  categoriaInicial,
  name,
  description,
  price,
  taxPercentage,
  prepTime,
  isVegetarian,
  isVegan,
  imageUrl,
  startTime,
  endTime,
  available,
  emailCreador,
}: BuildItemMenuPayloadParams) {
  const selectedCat = listaCategorias.find(
    (c) => c.id === categoriaSeleccionada || c.name === categoriaSeleccionada
  )
  const categoryId =
    selectedCat?.id || categoriaSeleccionada || categoriaInicial?.id || ''

  const prepMinutes = parseInt(prepTime, 10)
  const parsedPrice = parseFloat(price)
  const parsedTax = parseFloat(taxPercentage)

  return {
    category_id: categoryId,
    name: name.trim(),
    description: description.trim(),
    price: Number.isNaN(parsedPrice) ? 0 : parsedPrice,
    tax_percentage: Number.isNaN(parsedTax) ? 0 : parsedTax,
    prep_time: Number.isNaN(prepMinutes) ? 0 : prepMinutes,
    isVegetarian,
    isVegan,
    imageURL: imageUrl,
    start_time: startTime || '08:00',
    end_time: endTime || '22:00',
    available,
    created_by: emailCreador || 'ariasdev672@gmail.com',
  }
}
