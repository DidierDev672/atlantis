import {
  Suspense,
  lazy,
  memo,
  useCallback,
  useId,
  useMemo,
  type ComponentType,
  type FormEvent,
} from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFloppyDisk, faXmark } from '@fortawesome/free-solid-svg-icons'
import { Drawer } from '../../../../shared/ui/Drawer'
import { PlanetAlert } from '../../../../shared/alert/organisms/PlanetAlert'
import { PlatoAlimentosAnimado } from '../atoms/PlatoAlimentosAnimado'
import { ProductoCategoriaField } from '../molecules/ProductoCategoriaField'
import { ProductoHorarioYDietaFields } from '../molecules/ProductoHorarioYDietaFields'
import { ProductoPreciosYNombreFields } from '../molecules/ProductoPreciosYNombreFields'
import { SeccionCargaImagen } from '../molecules/SeccionCargaImagen'
import { buildUnexpectedSubmitErrorFeedback } from '../../application/agregar-producto.helpers'
import { useFormularioAgregarProducto } from '../../application/use-formulario-agregar-producto'
import type { MenuCategoria } from '../../domain/menu-categoria'
import type { ProductoGuardadoOverlayProps } from '../molecules/ProductoGuardadoOverlay'

const LazyProductoGuardadoOverlay = lazy<ComponentType<ProductoGuardadoOverlayProps>>(
  async () => {
    try {
      const mod = await import('../molecules/ProductoGuardadoOverlay')
      return { default: mod.ProductoGuardadoOverlay }
    } catch (error) {
      console.error('Error al cargar ProductoGuardadoOverlay:', error)
      const Fallback: ComponentType<ProductoGuardadoOverlayProps> = () => null
      return { default: Fallback }
    }
  },
)

export interface AgregarProductoDrawerProps {
  /** Categoría desde la que se disparó el alta; cuando es null (y isOpen no es true), no se monta */
  categoria: MenuCategoria | null
  isOpen?: boolean
  categoriasDisponibles?: MenuCategoria[]
  onClose: () => void
  onProductoGuardado?: () => void
}

interface AgregarProductoDrawerInnerProps {
  categoria: MenuCategoria | null
  categoriasDisponibles: MenuCategoria[]
  onClose: () => void
  onProductoGuardado?: () => void
}

const AgregarProductoDrawerInner = memo(function AgregarProductoDrawerInner({
  categoria,
  categoriasDisponibles,
  onClose,
  onProductoGuardado,
}: AgregarProductoDrawerInnerProps) {
  const {
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
  } = useFormularioAgregarProducto({
    categoriaInicial: categoria,
    categoriasDisponibles,
    onProductoGuardado,
  })

  const formId = useId()

  const handleSafeClose = useCallback(() => {
    try {
      if (!saving) onClose()
    } catch (error) {
      console.error('Error al cerrar el drawer de alta de producto:', error)
    }
  }, [onClose, saving])

  const handleGuardarSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      try {
        await handleSubmit(e)
      } catch (error) {
        setFeedback(buildUnexpectedSubmitErrorFeedback(error))
      }
    },
    [handleSubmit, setFeedback],
  )

  const handleDismissValidation = useCallback(() => {
    setCategoriaValidation(null)
  }, [setCategoriaValidation])

  const handleRetryCategorias = useCallback(() => {
    void recargarCategorias().catch((error) => {
      console.error('Error al reintentar carga de categorías:', error)
    })
  }, [recargarCategorias])

  const handleCategoriaChange = useCallback(
    (val: string) => {
      setCategoriaSeleccionada(val)
      if (categoriaError) setCategoriaError(undefined)
    },
    [categoriaError, setCategoriaError, setCategoriaSeleccionada],
  )

  const handleNameChange = useCallback(
    (val: string) => {
      setName(val)
      if (nameError) setNameError(undefined)
    },
    [nameError, setName, setNameError],
  )

  const handlePriceChange = useCallback(
    (val: string) => {
      setPrice(val)
      if (priceError) setPriceError(undefined)
    },
    [priceError, setPrice, setPriceError],
  )

  const handleDismissFeedback = useCallback(() => {
    setFeedback(null)
  }, [setFeedback])

  const categoriaNombreActual = useMemo(() => {
    const match = categoriaOptions.find((opt) => opt.value === categoriaSeleccionada)
    return match?.label || categoria?.name || ''
  }, [categoria?.name, categoriaOptions, categoriaSeleccionada])

  const headerDescription = useMemo(() => {
    const baseLabel = categoriaNombreActual
      ? `Categoría: ${categoriaNombreActual}`
      : 'Selecciona una categoría y completa la ficha del platillo'

    if (productosRegistrados <= 0) {
      return baseLabel
    }
    const unidad = productosRegistrados === 1 ? 'producto registrado' : 'productos registrados'
    return `${baseLabel} · ${productosRegistrados} ${unidad}`
  }, [categoriaNombreActual, productosRegistrados])

  return (
    <Drawer
      isOpen
      onClose={handleSafeClose}
      closeOnBackdropClick={!saving}
      closeOnEscape={!saving}
      position="right"
      size="lg"
      iconElement={<PlatoAlimentosAnimado />}
      title="Agregar Producto o Platillo"
      description={headerDescription}
      footer={
        <div className="flex flex-col-reverse items-center justify-end gap-2.5 sm:flex-row">
          <button
            type="button"
            onClick={handleSafeClose}
            disabled={saving}
            className="border-line bg-panel text-ink hover:bg-canvas inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition disabled:opacity-50 sm:w-auto"
          >
            <FontAwesomeIcon icon={faXmark} className="size-3.5" aria-hidden="true" />
            <span>Cancelar</span>
          </button>

          <button
            type="submit"
            form={formId}
            disabled={saving}
            aria-busy={saving}
            className="bg-primary inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:opacity-90 disabled:opacity-50 sm:w-auto"
          >
            <FontAwesomeIcon icon={faFloppyDisk} className="size-3.5" aria-hidden="true" />
            <span>{saving ? 'Guardando y registrando…' : 'Guardar y Registrar producto'}</span>
          </button>
        </div>
      }
    >
      <div className="relative">
        {saving && (
          <Suspense fallback={null}>
            <LazyProductoGuardadoOverlay visible />
          </Suspense>
        )}

        <form
          id={formId}
          onSubmit={(e) => void handleGuardarSubmit(e)}
          className="space-y-5"
          noValidate
        >
          <ProductoCategoriaField
            loadingCategorias={loadingCategorias}
            categoriaValidation={categoriaValidation}
            onDismissValidation={handleDismissValidation}
            onRetryCategorias={handleRetryCategorias}
            canRetry={categoriasDisponibles.length === 0}
            categoriaSeleccionada={categoriaSeleccionada}
            onCategoriaChange={handleCategoriaChange}
            categoriaOptions={categoriaOptions}
            categoriaError={categoriaError}
          />

          <ProductoPreciosYNombreFields
            name={name}
            onNameChange={handleNameChange}
            nameError={nameError}
            price={price}
            onPriceChange={handlePriceChange}
            priceError={priceError}
            taxPercentage={taxPercentage}
            onTaxPercentageChange={setTaxPercentage}
            prepTime={prepTime}
            onPrepTimeChange={setPrepTime}
          />

          <ProductoHorarioYDietaFields
            startTime={startTime}
            onStartTimeChange={setStartTime}
            endTime={endTime}
            onEndTimeChange={setEndTime}
            isVegetarian={isVegetarian}
            onIsVegetarianChange={setIsVegetarian}
            isVegan={isVegan}
            onIsVeganChange={setIsVegan}
            available={available}
            onAvailableChange={setAvailable}
            description={description}
            onDescriptionChange={setDescription}
          />

          <SeccionCargaImagen
            key={resetKey}
            imageFile={imagenArchivo}
            imagePreview={imagenPreview}
            onImageChange={handleImageChange}
          />

          {feedback && (
            <PlanetAlert
              key={feedback.id}
              variant={feedback.variant}
              planet={feedback.planet}
              title={feedback.title}
              message={feedback.message}
              error={feedback.rawError}
              errors={feedback.validationErrors}
              dismissible
              onClose={handleDismissFeedback}
              role={feedback.isValid ? 'status' : 'alert'}
              actions={
                <div className="flex w-full flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-[11px] font-bold opacity-80">
                    HTTP {feedback.status}
                  </span>

                  {feedback.isValid && (
                    <button
                      type="button"
                      onClick={handleSafeClose}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-emerald-400/50 bg-white/85 px-3 py-1.5 text-xs font-bold text-emerald-900 transition-colors hover:bg-white dark:border-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-100"
                    >
                      <span>Terminar y cerrar</span>
                    </button>
                  )}
                </div>
              }
            >
              {feedback.isValid && (
                <p className="text-xs opacity-85">
                  El formulario está limpio y listo para agregar otro producto en esta
                  categoría.
                </p>
              )}
            </PlanetAlert>
          )}
        </form>
      </div>
    </Drawer>
  )
})

/**
 * Organismo: Drawer lateral para registrar un producto directamente desde una categoría
 * sin abandonar el catálogo ni perder la posición del scroll.
 */
export const AgregarProductoDrawer = memo(function AgregarProductoDrawer({
  categoria,
  isOpen,
  categoriasDisponibles = [],
  onClose,
  onProductoGuardado,
}: AgregarProductoDrawerProps) {
  const shouldRender = isOpen ?? Boolean(categoria)
  if (!shouldRender) return null

  return (
    <AgregarProductoDrawerInner
      key={categoria?.id || categoria?.name || 'sin-categoria'}
      categoria={categoria}
      categoriasDisponibles={categoriasDisponibles}
      onClose={onClose}
      onProductoGuardado={onProductoGuardado}
    />
  )
})
