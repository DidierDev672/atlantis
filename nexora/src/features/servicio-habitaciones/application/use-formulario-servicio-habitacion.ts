import { useState, useEffect, useCallback, useRef } from 'react'
import {
  validateStatusCode,
  type StatusCodeValidationResult,
} from '../../../shared/lib/status-code-validator'
import {
  guardarMenuCategoriaApi,
  obtenerEmailCreador,
} from '../infrastructure/api-formulario-servicio-repository'
import {
  subirImagenSupabase,
  DEFAULT_ROOM_SERVICE_BUCKET,
} from '../../../shared/services/supabase-storage.service'
import { revocarBlobUrlSegura } from '../domain/item-menu'
import {
  validateFormularioServicioFields,
  type FormularioServicioErrors,
  type FormularioServicioFieldKey,
} from '../domain/menu-categoria'
import { useUbicacionRecepcionista } from './use-ubicacion-recepcionista'

const DEFAULT_ASSET_URL =
  'https://images.pexels.com/photos/3136318/pexels-photo-3136318.jpeg'

function generarNumeroDosDigitos(): string {
  const dosDigitos = Math.floor(10 + Math.random() * 90)
  return dosDigitos.toString()
}

export interface UseFormularioServicioHabitacionParams {
  onCategoriaGuardada?: () => void
}

/**
 * Hook de aplicación que orquesta la lógica, balanceo de carga y validación de status codes
 * para el registro de categorías de servicio gastronómico.
 * Delega la autodetección de sede, sub-sede y edificio a `useUbicacionRecepcionista`.
 */
export function useFormularioServicioHabitacion(
  params?: UseFormularioServicioHabitacionParams,
) {
  const onCategoriaGuardada = params?.onCategoriaGuardada
  const [order, setOrder] = useState<string>(generarNumeroDosDigitos)
  const [nombreServicio, setNombreServicio] = useState('')
  const [descripcion, setDescripcion] = useState('')

  const [imagenArchivo, setImagenArchivo] = useState<File | null>(null)
  const [imagenPreview, setImagenPreview] = useState<string | null>(null)
  const [resetKey, setResetKey] = useState(0)
  const activeBlobUrlRef = useRef<string | null>(null)
  const isMountedRef = useRef(true)

  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<StatusCodeValidationResult | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FormularioServicioErrors>({})

  const handleUbicacionFeedback = useCallback(
    (validation: StatusCodeValidationResult) => {
      if (isMountedRef.current && !validation.isValid) {
        setFeedback((prev) => prev ?? validation)
      }
    },
    [],
  )

  const {
    sedeId,
    setSedeId,
    sedeOptions,
    loadingSedes,
    subSedeId,
    setSubSedeId,
    subSedeOptions,
    loadingSubSedes,
    loadUbicacionesPorSede,
    edificioId,
    setEdificioId,
    edificioOptions,
    loadingEdificios,
    locationFieldsDisabled,
    toggleManualLocation,
    restoreDetectedLocation,
  } = useUbicacionRecepcionista({
    onValidationFeedback: handleUbicacionFeedback,
  })

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      revocarBlobUrlSegura(activeBlobUrlRef.current)
      activeBlobUrlRef.current = null
    }
  }, [])

  const clearFieldError = useCallback((field: FormularioServicioFieldKey) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }, [])

  const handleSedeChange = useCallback(
    (nuevaSedeId: string) => {
      setSedeId(nuevaSedeId)
      clearFieldError('sedeId')
      clearFieldError('subSedeId')
      clearFieldError('edificioId')
      setSubSedeId('')
      setEdificioId('')
      void loadUbicacionesPorSede(nuevaSedeId)
    },
    [clearFieldError, loadUbicacionesPorSede, setEdificioId, setSedeId, setSubSedeId],
  )

  const handleToggleManualLocation = useCallback(() => {
    clearFieldError('sedeId')
    clearFieldError('subSedeId')
    clearFieldError('edificioId')
    void toggleManualLocation()
  }, [clearFieldError, toggleManualLocation])

  const handleSubSedeChange = useCallback(
    (nuevaSubSedeId: string) => {
      setSubSedeId(nuevaSubSedeId)
      clearFieldError('subSedeId')
    },
    [clearFieldError, setSubSedeId],
  )

  const handleEdificioChange = useCallback(
    (nuevoEdificioId: string) => {
      setEdificioId(nuevoEdificioId)
      clearFieldError('edificioId')
    },
    [clearFieldError, setEdificioId],
  )

  const handleOrderChange = useCallback(
    (nuevoOrder: string) => {
      setOrder(nuevoOrder)
      clearFieldError('order')
    },
    [clearFieldError],
  )

  const handleNombreServicioChange = useCallback(
    (nuevoNombre: string) => {
      setNombreServicio(nuevoNombre)
      clearFieldError('nombreServicio')
    },
    [clearFieldError],
  )

  const generarOrderAleatorio = useCallback(() => {
    setOrder(generarNumeroDosDigitos())
    clearFieldError('order')
  }, [clearFieldError])

  const limpiarFormulario = useCallback(() => {
    revocarBlobUrlSegura(activeBlobUrlRef.current)
    activeBlobUrlRef.current = null
    setOrder(generarNumeroDosDigitos())
    restoreDetectedLocation()
    setNombreServicio('')
    setDescripcion('')
    setImagenArchivo(null)
    setImagenPreview(null)
    setFeedback(null)
    setFieldErrors({})
    setResetKey((prev) => prev + 1)
  }, [restoreDetectedLocation])

  const handleImageChange = useCallback((file: File | null, previewUrl: string | null) => {
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
  }, [])

  const handleSubmit = useCallback(
    async (
      e: React.FormEvent,
    ): Promise<{
      isValid: boolean
      firstInvalidKey: FormularioServicioFieldKey | null
    }> => {
      e.preventDefault()
      if (saving) return { isValid: false, firstInvalidKey: null }

      const { errors, firstInvalidKey } = validateFormularioServicioFields({
        order,
        sedeId,
        subSedeId,
        edificioId,
        nombreServicio,
      })

      if (firstInvalidKey) {
        setFieldErrors(errors)
        setFeedback({
          ...validateStatusCode(400),
          title: 'Campos obligatorios',
          message: 'Completa los campos marcados para continuar.',
        })
        return { isValid: false, firstInvalidKey }
      }

      setFieldErrors({})
      setSaving(true)
      setFeedback(null)

      try {
        let finalAssetUrl = DEFAULT_ASSET_URL
        let imageUploadFailed = false
        if (imagenArchivo) {
          try {
            const uploadResult = await subirImagenSupabase(imagenArchivo, {
              bucketName: DEFAULT_ROOM_SERVICE_BUCKET,
            })
            if (uploadResult.success && uploadResult.publicUrl) {
              finalAssetUrl = uploadResult.publicUrl
            } else {
              imageUploadFailed = true
            }
          } catch (uploadErr) {
            imageUploadFailed = true
            console.warn('Aviso al subir imagen a Supabase Storage:', uploadErr)
          }
        }

        const orderNumber = Number(order)
        const resolvedOrder =
          Number.isFinite(orderNumber) && orderNumber > 0
            ? orderNumber
            : Number(generarNumeroDosDigitos())

        const payload = {
          headquartes_id: sedeId,
          sub_headquartes_id: subSedeId,
          building_id: edificioId,
          name: nombreServicio.trim(),
          description: descripcion.trim(),
          order: resolvedOrder,
          asset: finalAssetUrl,
          created_by: obtenerEmailCreador(),
        }

        const validation = await guardarMenuCategoriaApi(payload)
        if (isMountedRef.current) {
          if (validation.isValid && imageUploadFailed) {
            setFeedback({
              ...validation,
              variant: 'warning',
              planet: 'jupiter',
              title: 'Categoría guardada con imagen predeterminada',
              message:
                'La categoría se registró correctamente, pero no se pudo subir la fotografía seleccionada y se asignó una imagen predeterminada.',
            })
          } else {
            setFeedback(validation)
          }

          if (validation.isValid) {
            try {
              onCategoriaGuardada?.()
            } catch (callbackErr) {
              console.error('Error en callback post-registro de categoría:', callbackErr)
            }
          }
        }
        return { isValid: validation.isValid, firstInvalidKey: null }
      } catch (error) {
        console.error('Error inesperado al guardar categoría de servicio:', error)
        if (isMountedRef.current) {
          setFeedback({
            ...validateStatusCode(500),
            title: 'No pudimos registrar la categoría',
            message:
              'Ocurrió un inconveniente inesperado al enviar la categoría. Intenta nuevamente.',
          })
        }
        return { isValid: false, firstInvalidKey: null }
      } finally {
        if (isMountedRef.current) {
          setSaving(false)
        }
      }
    },
    [
      descripcion,
      edificioId,
      imagenArchivo,
      nombreServicio,
      onCategoriaGuardada,
      order,
      saving,
      sedeId,
      subSedeId,
    ],
  )

  const isLoadingEndpoints = loadingSedes || loadingSubSedes || loadingEdificios

  return {
    order,
    setOrder: handleOrderChange,
    generarOrderAleatorio,
    sedeId,
    handleSedeChange,
    sedeOptions,
    loadingSedes,
    subSedeId,
    handleSubSedeChange,
    subSedeOptions,
    loadingSubSedes,
    edificioId,
    handleEdificioChange,
    edificioOptions,
    loadingEdificios,
    locationFieldsDisabled,
    handleToggleManualLocation,
    nombreServicio,
    setNombreServicio: handleNombreServicioChange,
    descripcion,
    setDescripcion,
    imagenArchivo,
    imagenPreview,
    handleImageChange,
    saving,
    feedback,
    setFeedback,
    fieldErrors,
    handleSubmit,
    limpiarFormulario,
    resetKey,
    isLoadingEndpoints,
  }
}
