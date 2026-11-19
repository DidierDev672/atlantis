import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  validateStatusCode,
  type StatusCodeValidationResult,
} from '../../../shared/lib/status-code-validator'
import {
  fetchSedesApi,
  fetchSubSedesApi,
  fetchEdificiosApi,
  guardarMenuCategoriaApi,
  obtenerEmailCreador,
  type SedeOption,
  type SubSedeOption,
  type EdificioOption,
} from '../infrastructure/api-formulario-servicio-repository'
import {
  subirImagenSupabase,
  DEFAULT_ROOM_SERVICE_BUCKET,
} from '../../../shared/services/supabase-storage.service'
import { revocarBlobUrlSegura } from '../domain/item-menu'
import type { DropdownOption } from '../../recursos/ui/molecules/recursos-dropdown'

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
 * para el registro de categorías y servicios gastronómicos de habitación.
 * Evita convertir imágenes a Base64 en RAM conservando solo el `File` y miniatura `blob:`.
 */
export function useFormularioServicioHabitacion(
  params?: UseFormularioServicioHabitacionParams,
) {
  const onCategoriaGuardada = params?.onCategoriaGuardada
  const [order, setOrder] = useState<string>(generarNumeroDosDigitos)
  const [sedeId, setSedeId] = useState('')
  const [sedes, setSedes] = useState<SedeOption[]>([])
  const [loadingSedes, setLoadingSedes] = useState(true)

  const [subSedeId, setSubSedeId] = useState('')
  const [subSedes, setSubSedes] = useState<SubSedeOption[]>([])
  const [loadingSubSedes, setLoadingSubSedes] = useState(false)

  const [edificioId, setEdificioId] = useState('')
  const [edificios, setEdificios] = useState<EdificioOption[]>([])
  const [loadingEdificios, setLoadingEdificios] = useState(true)

  const [nombreServicio, setNombreServicio] = useState('')
  const [descripcion, setDescripcion] = useState('')

  const [imagenArchivo, setImagenArchivo] = useState<File | null>(null)
  const [imagenPreview, setImagenPreview] = useState<string | null>(null)
  const [resetKey, setResetKey] = useState(0)
  const activeBlobUrlRef = useRef<string | null>(null)
  const isMountedRef = useRef(true)

  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<StatusCodeValidationResult | null>(null)

  const loadSubSedes = useCallback(async (headquarterId: string) => {
    if (!headquarterId) {
      setSubSedes([])
      setSubSedeId('')
      return
    }
    setLoadingSubSedes(true)
    try {
      const res = await fetchSubSedesApi(headquarterId)
      if (isMountedRef.current) {
        setSubSedes(res.subSedes)
      }
    } catch (error) {
      console.error('Error al cargar sub sedes:', error)
      if (isMountedRef.current) {
        setSubSedes([])
      }
    } finally {
      if (isMountedRef.current) {
        setLoadingSubSedes(false)
      }
    }
  }, [])

  useEffect(() => {
    isMountedRef.current = true

    const cargarCatalogosIniciales = async () => {
      try {
        const [sedesRes, edificiosRes] = await Promise.allSettled([
          fetchSedesApi(),
          fetchEdificiosApi(),
        ])
        if (!isMountedRef.current) return

        if (sedesRes.status === 'fulfilled') {
          setSedes(sedesRes.value.sedes)
        } else {
          console.error('Error al cargar sedes:', sedesRes.reason)
          setSedes([])
        }

        if (edificiosRes.status === 'fulfilled') {
          setEdificios(edificiosRes.value.edificios)
        } else {
          console.error('Error al cargar edificios:', edificiosRes.reason)
          setEdificios([])
        }
      } catch (error) {
        console.error('Error cargando catálogos de ubicación:', error)
      } finally {
        if (isMountedRef.current) {
          setLoadingSedes(false)
          setLoadingEdificios(false)
        }
      }
    }

    void Promise.resolve().then(() => cargarCatalogosIniciales())

    return () => {
      isMountedRef.current = false
      revocarBlobUrlSegura(activeBlobUrlRef.current)
      activeBlobUrlRef.current = null
    }
  }, [])

  const handleSedeChange = useCallback(
    (nuevaSedeId: string) => {
      setSedeId(nuevaSedeId)
      setSubSedeId('')
      if (nuevaSedeId) {
        void loadSubSedes(nuevaSedeId)
      } else {
        setSubSedes([])
      }
    },
    [loadSubSedes],
  )

  const handleSubSedeChange = useCallback((nuevaSubSedeId: string) => {
    setSubSedeId(nuevaSubSedeId)
  }, [])

  const handleEdificioChange = useCallback((nuevoEdificioId: string) => {
    setEdificioId(nuevoEdificioId)
  }, [])

  const generarOrderAleatorio = useCallback(() => {
    setOrder(generarNumeroDosDigitos())
  }, [])

  const limpiarFormulario = useCallback(() => {
    revocarBlobUrlSegura(activeBlobUrlRef.current)
    activeBlobUrlRef.current = null
    setOrder(generarNumeroDosDigitos())
    setSedeId('')
    setSubSedeId('')
    setSubSedes([])
    setEdificioId('')
    setNombreServicio('')
    setDescripcion('')
    setImagenArchivo(null)
    setImagenPreview(null)
    setFeedback(null)
    setResetKey((prev) => prev + 1)
  }, [])

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

  const sedeOptions: DropdownOption[] = useMemo(
    () => sedes.map((s) => ({ value: s.id, label: s.name })),
    [sedes],
  )

  const subSedeOptions: DropdownOption[] = useMemo(
    () => subSedes.map((sub) => ({ value: sub.id, label: sub.name })),
    [subSedes],
  )

  const edificioOptions: DropdownOption[] = useMemo(
    () => edificios.map((ed) => ({ value: ed.id, label: ed.name })),
    [edificios],
  )

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (saving) return

      if (!sedeId || !subSedeId || !edificioId || !nombreServicio.trim()) {
        setFeedback({
          ...validateStatusCode(400),
          title: 'Campos obligatorios pendientes',
          message:
            'Selecciona una sede, sub sede y edificio, e ingresa el nombre del servicio antes de guardar.',
        })
        return
      }

      setSaving(true)
      setFeedback(null)

      try {
        let finalAssetUrl = DEFAULT_ASSET_URL
        if (imagenArchivo) {
          try {
            const uploadResult = await subirImagenSupabase(imagenArchivo, {
              bucketName: DEFAULT_ROOM_SERVICE_BUCKET,
            })
            if (uploadResult.success && uploadResult.publicUrl) {
              finalAssetUrl = uploadResult.publicUrl
            }
          } catch (uploadErr) {
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
          setFeedback(validation)
          if (validation.isValid) {
            try {
              onCategoriaGuardada?.()
            } catch (callbackErr) {
              console.error('Error en callback post-registro de categoría:', callbackErr)
            }
          }
        }
      } catch (error) {
        console.error('Error inesperado al guardar categoría de servicio:', error)
        if (isMountedRef.current) {
          setFeedback({
            ...validateStatusCode(500),
            title: 'No pudimos registrar la categoría',
            message:
              'Ocurrió un inconveniente inesperado al enviar el servicio. Intenta nuevamente.',
          })
        }
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
    setOrder,
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
    nombreServicio,
    setNombreServicio,
    descripcion,
    setDescripcion,
    imagenArchivo,
    imagenPreview,
    handleImageChange,
    saving,
    feedback,
    setFeedback,
    handleSubmit,
    limpiarFormulario,
    resetKey,
    isLoadingEndpoints,
  }
}
