import { useState, useEffect, useCallback, useMemo } from 'react'
import type { StatusCodeValidationResult } from '../../../shared/lib/status-code-validator'
import {
  fetchSedesApi,
  fetchSubSedesApi,
  fetchEdificiosApi,
  guardarMenuCategoriaApi,
  obtenerEmailCreador,
  FALLBACK_SEDES,
  FALLBACK_SUB_SEDES,
  FALLBACK_EDIFICIOS,
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
  // 1. Order (código de orden numérico de 2 dígitos)
  const [order, setOrder] = useState('17')

  // 2. Sede
  const [sedeId, setSedeId] = useState('857476d852c2d215')
  const [sedes, setSedes] = useState<SedeOption[]>(FALLBACK_SEDES)
  const [loadingSedes, setLoadingSedes] = useState(true)

  // 3. Sub Sede
  const [subSedeId, setSubSedeId] = useState('3964a679462f9efc')
  const [subSedes, setSubSedes] = useState<SubSedeOption[]>(FALLBACK_SUB_SEDES)
  const [loadingSubSedes, setLoadingSubSedes] = useState(false)

  // 4. Edificio
  const [edificioId, setEdificioId] = useState('161ecb4a52a33a52')
  const [edificios, setEdificios] = useState<EdificioOption[]>(FALLBACK_EDIFICIOS)
  const [loadingEdificios, setLoadingEdificios] = useState(true)

  // 5. Nombre y descripción
  const [nombreServicio, setNombreServicio] = useState('Bebidas y Cocteleria')
  const [descripcion, setDescripcion] = useState(
    'Seleccion de cocteles de autor, vinos, cervezas y bebidas refrescantes'
  )

  // 6. Imagen y asset
  const [imagenArchivo, setImagenArchivo] = useState<File | null>(null)
  const [imagenPreview, setImagenPreview] = useState<string | null>(null)
  const [assetUrl, setAssetUrl] = useState<string>(DEFAULT_ASSET_URL)

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
      if (res.subSedes.length > 0) {
        setSubSedeId(res.subSedes[0].id)
      }
    } finally {
      setLoadingSubSedes(false)
    }
  }, [])

  // Montaje inicial con balanceador de carga asíncrono sin setState síncrono en effect
  useEffect(() => {
    let active = true

    void fetchSedesApi().then((res) => {
      if (!active) return
      setSedes(res.sedes)
      if (res.sedes.length > 0) {
        setSedeId(res.sedes[0].id)
        void fetchSubSedesApi(res.sedes[0].id).then((subRes) => {
          if (!active) return
          setSubSedes(subRes.subSedes)
          if (subRes.subSedes.length > 0) {
            setSubSedeId(subRes.subSedes[0].id)
          }
        })
      }
      setLoadingSedes(false)
    })

    void fetchEdificiosApi().then((res) => {
      if (!active) return
      setEdificios(res.edificios)
      if (res.edificios.length > 0) {
        setEdificioId(res.edificios[0].id)
      }
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

    const resolvedBuildingId = edificioId || edificios[0]?.id || '161ecb4a52a33a52'
    const resolvedHeadquarterId = sedeId || sedes[0]?.id || '857476d852c2d215'
    const resolvedSubHeadquarterId = subSedeId || subSedes[0]?.id || '3964a679462f9efc'

    const orderNumber = Number(order)
    const resolvedOrder = Number.isFinite(orderNumber) ? orderNumber : 1

    const payload = {
      headquartes_id: resolvedHeadquarterId,
      sub_headquartes_id: resolvedSubHeadquarterId,
      building_id: resolvedBuildingId,
      name: nombreServicio.trim() || 'Bebidas y Cocteleria',
      description:
        descripcion.trim() ||
        'Seleccion de cocteles de autor, vinos, cervezas y bebidas refrescantes',
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
    isLoadingEndpoints,
  }
}
