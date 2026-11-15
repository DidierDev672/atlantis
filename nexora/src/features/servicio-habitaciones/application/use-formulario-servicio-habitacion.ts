import { useState, useEffect, useCallback, useMemo } from 'react'
import { validateStatusCode, type StatusCodeValidationResult } from '../../../shared/lib/status-code-validator'
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
import type { DropdownOption } from '../../recursos/ui/molecules/recursos-dropdown'

const DEFAULT_ASSET_URL =
  'https://images.pexels.com/photos/3136318/pexels-photo-3136318.jpeg'

function generarNumeroDosDigitos(): string {
  const dosDigitos = Math.floor(10 + Math.random() * 90)
  return dosDigitos.toString()
}

/**
 * Hook de aplicación que orquesta la lógica, balanceo de carga y validación de status codes
 * para el registro de categorías y servicios gastronómicos de habitación.
 */
export function useFormularioServicioHabitacion() {
  // 1. Order (código de orden numérico de 2 dígitos generado automáticamente)
  const [order, setOrder] = useState<string>(generarNumeroDosDigitos)

  // 2. Sede (sin selección por defecto)
  const [sedeId, setSedeId] = useState('')
  const [sedes, setSedes] = useState<SedeOption[]>([])
  const [loadingSedes, setLoadingSedes] = useState(true)

  // 3. Sub Sede (sin selección por defecto)
  const [subSedeId, setSubSedeId] = useState('')
  const [subSedes, setSubSedes] = useState<SubSedeOption[]>([])
  const [loadingSubSedes, setLoadingSubSedes] = useState(false)

  // 4. Edificio (sin selección por defecto)
  const [edificioId, setEdificioId] = useState('')
  const [edificios, setEdificios] = useState<EdificioOption[]>([])
  const [loadingEdificios, setLoadingEdificios] = useState(true)

  // 5. Nombre y descripción (vacíos inicialmente)
  const [nombreServicio, setNombreServicio] = useState('')
  const [descripcion, setDescripcion] = useState('')

  // 6. Imagen y asset
  const [imagenArchivo, setImagenArchivo] = useState<File | null>(null)
  const [imagenPreview, setImagenPreview] = useState<string | null>(null)
  const [assetUrl, setAssetUrl] = useState<string>(DEFAULT_ASSET_URL)
  const [resetKey, setResetKey] = useState(0)

  // 7. Estados de envío y validación de status code
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<StatusCodeValidationResult | null>(null)

  // Carga balanceada de Sub-Sedes vía GET /sub-headquarters/by-headquarter/{id}
  const loadSubSedes = useCallback(async (headquarterId: string) => {
    if (!headquarterId) {
      setSubSedes([])
      setSubSedeId('')
      return
    }
    setLoadingSubSedes(true)
    try {
      const res = await fetchSubSedesApi(headquarterId)
      setSubSedes(res.subSedes)
    } finally {
      setLoadingSubSedes(false)
    }
  }, [])

  // Montaje inicial con balanceador de carga asíncrono sin seleccionar opciones por defecto
  useEffect(() => {
    let active = true

    void fetchSedesApi().then((res) => {
      if (!active) return
      setSedes(res.sedes)
      setLoadingSedes(false)
    })

    void fetchEdificiosApi().then((res) => {
      if (!active) return
      setEdificios(res.edificios)
      setLoadingEdificios(false)
    })

    return () => {
      active = false
    }
  }, [])

  // Handlers de cambio en selectores
  const handleSedeChange = (nuevaSedeId: string) => {
    setSedeId(nuevaSedeId)
    setSubSedeId('')
    if (nuevaSedeId) {
      void loadSubSedes(nuevaSedeId)
    } else {
      setSubSedes([])
    }
  }

  const handleSubSedeChange = (nuevaSubSedeId: string) => {
    setSubSedeId(nuevaSubSedeId)
  }

  const handleEdificioChange = (nuevoEdificioId: string) => {
    setEdificioId(nuevoEdificioId)
  }

  const generarOrderAleatorio = () => {
    setOrder(generarNumeroDosDigitos())
  }

  const limpiarFormulario = useCallback(() => {
    if (imagenPreview && imagenPreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagenPreview)
    }
    setOrder(generarNumeroDosDigitos())
    setSedeId('')
    setSubSedeId('')
    setSubSedes([])
    setEdificioId('')
    setNombreServicio('')
    setDescripcion('')
    setImagenArchivo(null)
    setImagenPreview(null)
    setAssetUrl(DEFAULT_ASSET_URL)
    setFeedback(null)
    setResetKey((prev) => prev + 1)
  }, [imagenPreview])

  const handleImageChange = (file: File | null, previewUrl: string | null) => {
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
      setAssetUrl(DEFAULT_ASSET_URL)
    }
  }

  // Opciones formateadas para RecursosDropdown
  const sedeOptions: DropdownOption[] = useMemo(
    () => sedes.map((s) => ({ value: s.id, label: s.name })),
    [sedes]
  )

  const subSedeOptions: DropdownOption[] = useMemo(
    () => subSedes.map((sub) => ({ value: sub.id, label: sub.name })),
    [subSedes]
  )

  const edificioOptions: DropdownOption[] = useMemo(
    () => edificios.map((ed) => ({ value: ed.id, label: ed.name })),
    [edificios]
  )

  // Envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
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

    let finalAssetUrl = assetUrl || DEFAULT_ASSET_URL
    if (imagenArchivo) {
      try {
        const uploadResult = await subirImagenSupabase(imagenArchivo, {
          bucketName: DEFAULT_ROOM_SERVICE_BUCKET,
        })
        if (uploadResult.success && uploadResult.publicUrl) {
          finalAssetUrl = uploadResult.publicUrl
          setAssetUrl(uploadResult.publicUrl)
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

    try {
      // Balanceo de carga en POST /menu-category con tiempo de animación para el despegue del cohete
      const [validation] = await Promise.all([
        guardarMenuCategoriaApi(payload),
        new Promise((resolve) => setTimeout(resolve, 2000)),
      ])
      setFeedback(validation)
    } finally {
      setSaving(false)
    }
  }

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
