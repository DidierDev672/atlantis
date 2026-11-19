import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import type { DropdownOption } from '../../recursos/ui/molecules/recursos-dropdown'
import type { StatusCodeValidationResult } from '../../../shared/lib/status-code-validator'
import {
  DEFAULT_ROOM_SERVICE_BUCKET,
  subirImagenSupabase,
} from '../../../shared/services/supabase-storage.service'
import {
  resolverImagenProducto,
  revocarBlobUrlSegura,
  type ItemMenuProducto,
} from '../domain/item-menu'
import type { MenuCategoria } from '../domain/menu-categoria'
import { updateProductoMenu } from '../infrastructure/api-item-menu-repository'
import {
  FALLBACK_MENU_CATEGORIAS,
  obtenerMenuCategoriaPorIdApi,
  obtenerMenuCategoriasApi,
} from '../infrastructure/api-menu-categoria-repository'

export interface UseEditarProductoParams {
  producto: ItemMenuProducto
  onProductoActualizado?: (producto: ItemMenuProducto) => void
}

export function useEditarProducto({
  producto,
  onProductoActualizado,
}: UseEditarProductoParams) {
  const initialCategoryId = (producto.category_id ?? '').trim()

  const [categorias, setCategorias] = useState<MenuCategoria[]>([])
  const [loadingCategorias, setLoadingCategorias] = useState(true)
  const [categoriaActual, setCategoriaActual] = useState<MenuCategoria | null>(null)
  const [loadingCategoriaPorId, setLoadingCategoriaPorId] = useState(
    () => Boolean(initialCategoryId)
  )
  const [categoriaValidation, setCategoriaValidation] =
    useState<StatusCodeValidationResult | null>(null)

  const [categoryId, setCategoryId] = useState(() => producto.category_id ?? '')
  const [categoryError, setCategoryError] = useState<string | undefined>()
  const [name, setName] = useState(() => producto.name ?? '')
  const [nameError, setNameError] = useState<string | undefined>()
  const [price, setPrice] = useState(() =>
    producto.price !== undefined ? String(producto.price) : ''
  )
  const [priceError, setPriceError] = useState<string | undefined>()
  const [taxPercentage, setTaxPercentage] = useState(() =>
    producto.tax_percentage !== undefined ? String(producto.tax_percentage) : '0'
  )
  const [prepTime, setPrepTime] = useState(() =>
    producto.prep_time !== undefined ? String(producto.prep_time) : '15'
  )
  const [startTime, setStartTime] = useState(() => producto.start_time || '08:00')
  const [endTime, setEndTime] = useState(() => producto.end_time || '22:00')
  const [isVegetarian, setIsVegetarian] = useState(() =>
    Boolean(producto.isVegetarian ?? producto.is_vegetarian)
  )
  const [isVegan, setIsVegan] = useState(() =>
    Boolean(producto.isVegan ?? producto.is_vegan)
  )
  const [available, setAvailable] = useState(() => producto.available !== false)
  const [description, setDescription] = useState(() => producto.description ?? '')

  const initialImageUrl = resolverImagenProducto(producto)
  const activeBlobUrlRef = useRef<string | null>(null)
  const [imagenArchivo, setImagenArchivo] = useState<File | null>(null)
  const [imagenPreview, setImagenPreview] = useState<string | null>(
    () => producto.imageURL || producto.image_url || null
  )

  useEffect(() => {
    return () => {
      revocarBlobUrlSegura(activeBlobUrlRef.current)
      activeBlobUrlRef.current = null
    }
  }, [])

  const [saving, setSaving] = useState(false)
  const [validationError, setValidationError] =
    useState<StatusCodeValidationResult | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const cargarCatalogo = obtenerMenuCategoriasApi()
      .then((res) => {
        if (!active) return
        const lista =
          res.categorias.length > 0 ? res.categorias : FALLBACK_MENU_CATEGORIAS
        setCategorias(lista)
      })
      .finally(() => {
        if (active) setLoadingCategorias(false)
      })

    const cargarCategoriaActual = initialCategoryId
      ? obtenerMenuCategoriaPorIdApi(initialCategoryId)
          .then((res) => {
            if (!active) return
            if (!res.validation.isValid) {
              setCategoriaValidation(res.validation)
            } else {
              setCategoriaValidation(null)
            }
            if (res.categoria) {
              setCategoriaActual(res.categoria)
              const resolvedId = res.categoria.id || initialCategoryId
              setCategoryId((prev) =>
                prev.trim() === initialCategoryId ? resolvedId : prev
              )
            }
          })
          .finally(() => {
            if (active) setLoadingCategoriaPorId(false)
          })
      : Promise.resolve()

    void Promise.all([cargarCatalogo, cargarCategoriaActual])

    return () => {
      active = false
    }
  }, [initialCategoryId])

  const categoriaOptions: DropdownOption[] = useMemo(() => {
    const listaBase =
      categorias.length > 0 ? categorias : FALLBACK_MENU_CATEGORIAS

    const listaCombinada: MenuCategoria[] = (() => {
      if (!categoriaActual) return listaBase

      const actualId = categoriaActual.id || initialCategoryId
      const existeEnCatalogo = listaBase.some(
        (c) =>
          (c.id && actualId && c.id === actualId) ||
          (c.id && initialCategoryId && c.id === initialCategoryId) ||
          c.name.toLowerCase() === categoriaActual.name.toLowerCase()
      )

      if (existeEnCatalogo) {
        return listaBase.map((c) => {
          const coincide =
            (c.id && actualId && c.id === actualId) ||
            (c.id && initialCategoryId && c.id === initialCategoryId) ||
            c.name.toLowerCase() === categoriaActual.name.toLowerCase()
          return coincide ? { ...c, name: categoriaActual.name, id: c.id || actualId } : c
        })
      }

      return [
        { ...categoriaActual, id: actualId || undefined },
        ...listaBase,
      ]
    })()

    return listaCombinada.map((c) => ({
      value: c.id || c.name,
      label: c.name,
      id: c.id,
      rawName: c.name,
    }))
  }, [categorias, categoriaActual, initialCategoryId])

  const handleImageChange = useCallback(
    (file: File | null, previewUrl: string | null) => {
      try {
        if (
          activeBlobUrlRef.current &&
          activeBlobUrlRef.current !== previewUrl
        ) {
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

  const validar = (): boolean => {
    let ok = true
    if (!categoryId.trim()) {
      setCategoryError('Selecciona una categoría para el producto.')
      ok = false
    } else {
      setCategoryError(undefined)
    }

    if (!name.trim()) {
      setNameError('Escribe el nombre del producto.')
      ok = false
    } else {
      setNameError(undefined)
    }

    const parsedPrice = Number(price)
    if (price.trim() === '' || Number.isNaN(parsedPrice) || parsedPrice < 0) {
      setPriceError('Ingresa un precio válido mayor o igual a 0.')
      ok = false
    } else {
      setPriceError(undefined)
    }

    return ok
  }

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault()
    if (saving || !validar()) return

    setSaving(true)
    setValidationError(null)
    setSuccessMessage(null)

    try {
      let finalImageUrl = imagenPreview || initialImageUrl

      if (imagenArchivo) {
        try {
          const uploadRes = await subirImagenSupabase(imagenArchivo, {
            bucketName: DEFAULT_ROOM_SERVICE_BUCKET,
          })
          if (uploadRes.success && uploadRes.publicUrl) {
            finalImageUrl = uploadRes.publicUrl
            revocarBlobUrlSegura(activeBlobUrlRef.current)
            activeBlobUrlRef.current = null
            setImagenPreview(uploadRes.publicUrl)
            setImagenArchivo(null)
          }
        } catch {
          // Mantiene la imagen actual si falla la subida auxiliar
        }
      }

      const listaBase =
        categorias.length > 0 ? categorias : FALLBACK_MENU_CATEGORIAS
      const lista = categoriaActual ? [categoriaActual, ...listaBase] : listaBase
      const selectedCat = lista.find(
        (c) => c.id === categoryId || c.name === categoryId
      )

      const payload = {
        category_id: selectedCat?.id || categoryId,
        name: name.trim(),
        description: description.trim(),
        price: Number(price) || 0,
        tax_percentage: Number(taxPercentage) || 0,
        prep_time: Math.max(0, parseInt(prepTime, 10) || 0),
        isVegetarian,
        isVegan,
        imageURL: finalImageUrl,
        start_time: startTime || '08:00',
        end_time: endTime || '22:00',
        available,
        created_by: producto.created_by,
      }

      const targetId = producto.id || producto.name
      const [res] = await Promise.all([
        updateProductoMenu(targetId, payload),
        new Promise((resolve) => setTimeout(resolve, 1800)),
      ])

      setValidationError(res.validation)

      if (!res.ok) {
        return
      }

      const updatedProduct: ItemMenuProducto = {
        ...producto,
        ...payload,
        ...(res.producto ?? {}),
        id: res.producto?.id ?? producto.id,
      }

      setSuccessMessage('Cambios guardados correctamente en el catálogo.')
      onProductoActualizado?.(updatedProduct)
    } finally {
      setSaving(false)
    }
  }

  return {
    categoryId,
    setCategoryId,
    categoryError,
    setCategoryError,
    categoriaOptions,
    loadingCategorias,
    loadingCategoriaPorId,
    categoriaActualNombre: categoriaActual?.name ?? null,
    categoriaValidation,
    setCategoriaValidation,
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
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    isVegetarian,
    setIsVegetarian,
    isVegan,
    setIsVegan,
    available,
    setAvailable,
    description,
    setDescription,
    imagenArchivo,
    imagenPreview,
    handleImageChange,
    saving,
    validationError,
    setValidationError,
    successMessage,
    handleSubmit,
  }
}
