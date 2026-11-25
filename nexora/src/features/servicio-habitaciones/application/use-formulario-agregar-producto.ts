import { useState, useCallback, useEffect, useRef } from 'react'
import axios from 'axios'
import { api } from '../../../lib/api'
import { executeBalancedRequest } from '../../reservas/infrastructure/api-load-balancer'
import { readAuthTokenEmail } from '../../../shared/auth-storage'
import {
  subirImagenSupabase,
  DEFAULT_ROOM_SERVICE_BUCKET,
} from '../../../shared/services/supabase-storage.service'
import { revocarBlobUrlSegura } from '../domain/item-menu'
import type { MenuCategoria } from '../domain/menu-categoria'
import {
  DEFAULT_PRODUCT_IMAGE,
  buildItemMenuPayload,
  buildPostFeedback,
  buildUnexpectedSubmitErrorFeedback,
  buildValidationErrorFeedback,
  type ProductoPostFeedback,
} from './agregar-producto.helpers'
import { useCategoriasMenuProducto } from './use-categorias-menu-producto'

export type { ProductoPostFeedback }

export interface UseFormularioAgregarProductoParams {
  categoriaInicial?: MenuCategoria | null
  categoriasDisponibles?: MenuCategoria[]
  onProductoGuardado?: () => void
}

/**
 * Hook de aplicación para el registro limpio de productos/platillos en POST /item-menu.
 * Gestiona memoria sin conversión a Base64 (`FileReader.readAsDataURL`), conservando únicamente
 * el `File` para Storage y una miniatura `blob:` liberada de forma segura.
 */
export function useFormularioAgregarProducto({
  categoriaInicial,
  categoriasDisponibles = [],
  onProductoGuardado,
}: UseFormularioAgregarProductoParams) {
  const {
    listaCategorias,
    categoriaSeleccionada,
    setCategoriaSeleccionada,
    categoriaOptions,
    loadingCategorias,
    categoriaValidation,
    setCategoriaValidation,
    recargarCategorias,
    categoriaError,
    setCategoriaError,
  } = useCategoriasMenuProducto({
    categoriaInicial,
    categoriasDisponibles,
  })

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
  const [resetKey, setResetKey] = useState(0)
  const activeBlobUrlRef = useRef<string | null>(null)

  const [saving, setSaving] = useState(false)
  const [productosRegistrados, setProductosRegistrados] = useState(0)
  const [feedback, setFeedback] = useState<ProductoPostFeedback | null>(null)

  useEffect(() => {
    return () => {
      revocarBlobUrlSegura(activeBlobUrlRef.current)
      activeBlobUrlRef.current = null
    }
  }, [])

  const handleImageChange = useCallback(
    (file: File | null, previewUrl: string | null) => {
      try {
        if (activeBlobUrlRef.current && activeBlobUrlRef.current !== previewUrl) {
          revocarBlobUrlSegura(activeBlobUrlRef.current)
        }
        activeBlobUrlRef.current =
          previewUrl && previewUrl.startsWith('blob:') ? previewUrl : null
      } catch {
        activeBlobUrlRef.current = null
      }
      setImagenArchivo(file)
      setImagenPreview(previewUrl)
    },
    []
  )

  const limpiarCampos = useCallback(() => {
    revocarBlobUrlSegura(activeBlobUrlRef.current)
    activeBlobUrlRef.current = null
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
    setResetKey((prev) => prev + 1)
  }, [])

  const validarFormulario = (): string[] => {
    const errores: string[] = []
    const categoryIdActual = categoriaSeleccionada || categoriaInicial?.id || ''
    if (!categoryIdActual.trim()) {
      const msg = 'Por favor selecciona la categoría a la que pertenece el producto.'
      setCategoriaError(msg)
      errores.push(`Categoría: ${msg}`)
    } else {
      setCategoriaError(undefined)
    }

    if (!name.trim()) {
      const msg = 'Por favor ingresa el nombre comercial del producto.'
      setNameError(msg)
      errores.push(`Nombre: ${msg}`)
    } else {
      setNameError(undefined)
    }

    const numPrecio = parseFloat(price)
    if (Number.isNaN(numPrecio) || numPrecio <= 0) {
      const msg = 'El precio debe ser un número positivo mayor a 0.'
      setPriceError(msg)
      errores.push(`Precio: ${msg}`)
    } else {
      setPriceError(undefined)
    }

    if (taxPercentage.trim() !== '') {
      const parsedTax = parseFloat(taxPercentage)
      if (Number.isNaN(parsedTax) || parsedTax < 0) {
        errores.push('Impuesto (%): debe ser un número mayor o igual a 0.')
      }
    }

    if (prepTime.trim() !== '') {
      const parsedPrep = parseInt(prepTime, 10)
      if (Number.isNaN(parsedPrep) || parsedPrep < 0) {
        errores.push('Tiempo de preparación: debe ser un número mayor o igual a 0.')
      }
    }

    return errores
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (saving) return

    try {
      const erroresValidacion = validarFormulario()
      if (erroresValidacion.length > 0) {
        setFeedback(buildValidationErrorFeedback(erroresValidacion))
        return
      }
    } catch (validationErr) {
      setFeedback(buildUnexpectedSubmitErrorFeedback(validationErr))
      return
    }

    setSaving(true)
    setFeedback(null)

    try {
      let finalImageUrl = DEFAULT_PRODUCT_IMAGE
      let avisoImagenFallback: string | null = null

      if (imagenArchivo) {
        try {
          const uploadResult = await subirImagenSupabase(imagenArchivo, {
            bucketName: DEFAULT_ROOM_SERVICE_BUCKET,
          })
          if (uploadResult.success && uploadResult.publicUrl) {
            finalImageUrl = uploadResult.publicUrl
          } else {
            console.warn(
              'Aviso al subir imagen del producto a Supabase Storage (se usará imagen por defecto):',
              uploadResult.error
            )
            avisoImagenFallback =
              'Nota: el servicio de almacenamiento de imágenes no respondió, por lo que el producto se registró con la imagen por defecto.'
          }
        } catch (uploadErr) {
          console.warn(
            'Aviso al subir imagen del producto a Supabase Storage (se usará imagen por defecto):',
            uploadErr
          )
          avisoImagenFallback =
            'Nota: el servicio de almacenamiento de imágenes no respondió, por lo que el producto se registró con la imagen por defecto.'
        }
      }

      const payload = buildItemMenuPayload({
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
        imageUrl: finalImageUrl,
        startTime,
        endTime,
        available,
        emailCreador: readAuthTokenEmail(),
      })

      const response = await executeBalancedRequest(() =>
        api.post('/item-menu', payload, {
          skipAuth: true,
          validateStatus: () => true,
        })
      )

      const postFeedback = buildPostFeedback(response.status, response.data)
      if (postFeedback.isValid && avisoImagenFallback) {
        postFeedback.message = postFeedback.message
          ? `${postFeedback.message} ${avisoImagenFallback}`
          : avisoImagenFallback
      }
      setFeedback(postFeedback)

      if (postFeedback.isValid) {
        setProductosRegistrados((prev) => prev + 1)
        try {
          limpiarCampos()
          onProductoGuardado?.()
        } catch (postHookErr) {
          console.warn(
            'El producto se guardó correctamente, pero ocurrió un error al actualizar la vista:',
            postHookErr
          )
        }
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status) {
          setFeedback(buildPostFeedback(err.response.status, err.response.data, err))
          return
        }
        const networkStatus = err.code === 'ECONNABORTED' ? 408 : 503
        setFeedback(buildPostFeedback(networkStatus, undefined, err))
        return
      }
      setFeedback(buildUnexpectedSubmitErrorFeedback(err))
    } finally {
      setSaving(false)
    }
  }

  return {
    categoriaSeleccionada,
    setCategoriaSeleccionada,
    categoriaOptions,
    loadingCategorias,
    categoriaValidation,
    setCategoriaValidation,
    recargarCategorias,
    categoriaError,
    setCategoriaError,
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
