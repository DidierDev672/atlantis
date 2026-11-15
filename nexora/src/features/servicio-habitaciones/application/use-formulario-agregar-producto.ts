import { useState, useCallback } from 'react'
import axios from 'axios'
import { api } from '../../../lib/api'
import { executeBalancedRequest } from '../../reservas/infrastructure/api-load-balancer'
import {
  validateStatusCode,
  type AlertPlanet,
  type AlertVariant,
} from '../../../shared/lib/status-code-validator'
import { readAuthTokenEmail } from '../../../shared/auth-storage'
import {
  subirImagenSupabase,
  DEFAULT_ROOM_SERVICE_BUCKET,
} from '../../../shared/services/supabase-storage.service'
import type { MenuCategoria } from '../domain/menu-categoria'

const DEFAULT_PRODUCT_IMAGE =
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
}

function buildPostFeedback(
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

export interface UseFormularioAgregarProductoParams {
  categoriaInicial?: MenuCategoria | null
  categoriasDisponibles?: MenuCategoria[]
  onProductoGuardado?: () => void
}

/**
 * Hook de aplicación para el registro limpio de productos/platillos en POST /item-menu.
 */
export function useFormularioAgregarProducto({
  categoriaInicial,
  categoriasDisponibles = [],
  onProductoGuardado,
}: UseFormularioAgregarProductoParams) {
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>(
    categoriaInicial?.name || (categoriasDisponibles[0]?.name ?? '')
  )
  const [name, setName] = useState('')
  const [nameError, setNameError] = useState<string | undefined>()
  const [price, setPrice] = useState('')
  const [priceError, setPriceError] = useState<string | undefined>()
  const [taxPercentage, setTaxPercentage] = useState('')
  const [prepTime, setPrepTime] = useState('')
  const [isVegetarian, setIsVegetarian] = useState(false)
  const [isVegan, setIsVegan] = useState(false)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [available, setAvailable] = useState(false)
  const [description, setDescription] = useState('')

  const [imagenArchivo, setImagenArchivo] = useState<File | null>(null)
  const [imagenPreview, setImagenPreview] = useState<string | null>(null)
  const [assetUrl, setAssetUrl] = useState<string>(DEFAULT_PRODUCT_IMAGE)
  const [resetKey, setResetKey] = useState(0)

  const [saving, setSaving] = useState(false)
  const [productosRegistrados, setProductosRegistrados] = useState(0)
  const [feedback, setFeedback] = useState<ProductoPostFeedback | null>(null)

  const handleImageChange = useCallback(
    (file: File | null, previewUrl: string | null) => {
      setImagenArchivo(file)
      setImagenPreview(previewUrl)
      if (file) {
        const reader = new FileReader()
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            setAssetUrl(reader.result)
          }
        }
        reader.readAsDataURL(file)
      } else {
        setAssetUrl(DEFAULT_PRODUCT_IMAGE)
      }
    },
    []
  )

  const limpiarCampos = useCallback(() => {
    if (imagenPreview && imagenPreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagenPreview)
    }
    setName('')
    setNameError(undefined)
    setPrice('')
    setPriceError(undefined)
    setTaxPercentage('')
    setPrepTime('')
    setIsVegetarian(false)
    setIsVegan(false)
    setStartTime('')
    setEndTime('')
    setAvailable(false)
    setDescription('')
    setImagenArchivo(null)
    setImagenPreview(null)
    setAssetUrl(DEFAULT_PRODUCT_IMAGE)
    setResetKey((prev) => prev + 1)
  }, [imagenPreview])

  const validarFormulario = (): boolean => {
    let valido = true
    if (!name.trim()) {
      setNameError('Por favor ingresa el nombre comercial del producto.')
      valido = false
    } else {
      setNameError(undefined)
    }

    const numPrecio = parseFloat(price)
    if (isNaN(numPrecio) || numPrecio <= 0) {
      setPriceError('El precio debe ser un número positivo mayor a 0.')
      valido = false
    } else {
      setPriceError(undefined)
    }

    return valido
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (saving) return

    if (!validarFormulario()) {
      return
    }

    setSaving(true)
    setFeedback(null)

    try {
      let finalImageUrl = assetUrl || DEFAULT_PRODUCT_IMAGE
      if (imagenArchivo) {
        try {
          const uploadResult = await subirImagenSupabase(imagenArchivo, {
            bucketName: DEFAULT_ROOM_SERVICE_BUCKET,
          })
          if (uploadResult.success && uploadResult.publicUrl) {
            finalImageUrl = uploadResult.publicUrl
            setAssetUrl(uploadResult.publicUrl)
          }
        } catch (uploadErr) {
          console.warn(
            'Aviso al subir imagen del producto a Supabase Storage:',
            uploadErr
          )
        }
      }

      const emailCreador = readAuthTokenEmail()
      const selectedCat = categoriasDisponibles.find(
        (c) => c.name === categoriaSeleccionada
      )
      const categoryId =
        categoriaInicial?.headquartes_id ||
        selectedCat?.headquartes_id ||
        '18d5458dc0eef66e'

      const prepMinutes = parseInt(prepTime, 10)
      const parsedPrice = parseFloat(price)
      const parsedTax = parseFloat(taxPercentage)

      const payload = {
        category_id: categoryId,
        name: name.trim(),
        description: description.trim(),
        price: isNaN(parsedPrice) ? 0 : parsedPrice,
        tax_percentage: isNaN(parsedTax) ? 0 : parsedTax,
        prep_time: isNaN(prepMinutes) ? 0 : prepMinutes,
        isVegetarian,
        isVegan,
        imageURL: finalImageUrl,
        start_time: startTime || '08:00',
        end_time: endTime || '22:00',
        available,
        created_by: emailCreador || 'ariasdev672@gmail.com',
      }

      const [response] = await Promise.all([
        executeBalancedRequest(() =>
          api.post('/item-menu', payload, {
            skipAuth: true,
            validateStatus: () => true,
          })
        ),
        new Promise((resolve) => setTimeout(resolve, 1800)),
      ])

      const postFeedback = buildPostFeedback(response.status, response.data)
      setFeedback(postFeedback)

      if (postFeedback.isValid) {
        setProductosRegistrados((prev) => prev + 1)
        limpiarCampos()
        onProductoGuardado?.()
      }
    } catch (err: unknown) {
      let status = 500
      let responseData: unknown
      let thrownError: unknown
      if (axios.isAxiosError(err) && err.response?.status) {
        status = err.response.status
        responseData = err.response.data
        thrownError = err
      } else if (axios.isAxiosError(err) && err.code === 'ECONNABORTED') {
        status = 408
      }
      setFeedback(buildPostFeedback(status, responseData, thrownError))
    } finally {
      setSaving(false)
    }
  }

  return {
    categoriaSeleccionada,
    setCategoriaSeleccionada,
    name,
    setName,
    nameError,
    setNameError,
    price,
    setPrice,
    priceError,
    setPriceError,
    taxPercentage,
    setTaxPercentage,
    prepTime,
    setPrepTime,
    isVegetarian,
    setIsVegetarian,
    isVegan,
    setIsVegan,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    available,
    setAvailable,
    description,
    setDescription,
    imagenArchivo,
    imagenPreview,
    handleImageChange,
    resetKey,
    saving,
    productosRegistrados,
    feedback,
    setFeedback,
    handleSubmit,
  }
}
