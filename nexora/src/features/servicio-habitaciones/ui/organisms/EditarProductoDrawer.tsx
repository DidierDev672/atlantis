import { Suspense, memo, useId } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCheckCircle,
  faFloppyDisk,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'
import { Drawer } from '../../../../shared/ui/Drawer'
import { StatusCodeAlert } from '../../../../shared/lib/status-code-validator'
import { lazyWithFallback } from '../../application/lazy-with-fallback'
import { useEditarProducto } from '../../application/use-editar-producto'
import {
  formatearMonedaCOP,
  type ItemMenuProducto,
} from '../../domain/item-menu'
import { IconoEscribirAnimado } from '../atoms/IconoEscribirAnimado'
import { EditarProductoFormFields } from '../molecules/EditarProductoFormFields'
import type { ServicioHabitacionRocketOverlayProps } from '../molecules/ServicioHabitacionRocketOverlay'

const LazyServicioHabitacionRocketOverlay =
  lazyWithFallback<ServicioHabitacionRocketOverlayProps>(
    () =>
      import('../molecules/ServicioHabitacionRocketOverlay').then(
        (m) => m.ServicioHabitacionRocketOverlay
      ),
    'ServicioHabitacionRocketOverlay en EditarProductoDrawer'
  )

export interface EditarProductoDrawerProps {
  producto: ItemMenuProducto | null
  onClose: () => void
  onProductoActualizado?: (producto: ItemMenuProducto) => void
}

function EditarProductoDrawerInner({
  producto,
  onClose,
  onProductoActualizado,
}: {
  producto: ItemMenuProducto
  onClose: () => void
  onProductoActualizado?: (producto: ItemMenuProducto) => void
}) {
  const form = useEditarProducto({
    producto,
    onProductoActualizado,
  })

  const formId = useId()
  const handleSafeClose = () => {
    if (!form.saving) onClose()
  }

  return (
    <Drawer
      isOpen
      onClose={handleSafeClose}
      closeOnBackdropClick={!form.saving}
      closeOnEscape={!form.saving}
      position="right"
      size="lg"
      iconElement={<IconoEscribirAnimado />}
      title="Modificar producto"
      description={`${form.name || producto.name} · ${formatearMonedaCOP(Number(form.price) || producto.price)}`}
      footer={
        <div className="flex flex-col-reverse items-center justify-end gap-2.5 sm:flex-row">
          <button
            type="button"
            onClick={handleSafeClose}
            disabled={form.saving}
            className="border-line bg-panel text-ink hover:bg-canvas inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition disabled:opacity-50 sm:w-auto"
          >
            <FontAwesomeIcon
              icon={faXmark}
              className="size-3.5"
              aria-hidden="true"
            />
            <span>Cancelar</span>
          </button>

          <button
            type="submit"
            form={formId}
            disabled={form.saving}
            className="bg-primary inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:opacity-90 disabled:opacity-50 sm:w-auto"
          >
            <FontAwesomeIcon
              icon={faFloppyDisk}
              className="size-3.5"
              aria-hidden="true"
            />
            <span>{form.saving ? 'Guardando cambios…' : 'Guardar cambios'}</span>
          </button>
        </div>
      }
    >
      <div className="relative">
        {form.saving && (
          <Suspense fallback={null}>
            <LazyServicioHabitacionRocketOverlay
              visible={form.saving}
              zIndexClass="z-70"
              title="Actualizando producto en el catálogo"
              description="Construyendo payload y enviando cambios con balanceo de carga…"
            />
          </Suspense>
        )}

        <form
          id={formId}
          onSubmit={(e) => void form.handleSubmit(e)}
          className="space-y-5"
          noValidate
        >
          <StatusCodeAlert
            validation={form.validationError}
            dismissible
            onClose={() => form.setValidationError(null)}
          />

          {form.successMessage && (
            <div
              role="status"
              className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs font-semibold text-emerald-700 dark:text-emerald-300"
            >
              <span className="flex items-center gap-2">
                <FontAwesomeIcon
                  icon={faCheckCircle}
                  className="size-4 shrink-0"
                  aria-hidden="true"
                />
                <span>{form.successMessage}</span>
              </span>
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer underline hover:opacity-80"
              >
                Cerrar
              </button>
            </div>
          )}

          <EditarProductoFormFields
            categoryId={form.categoryId}
            onCategoryChange={(val) => {
              form.setCategoryId(val)
              if (form.categoryError) form.setCategoryError(undefined)
            }}
            categoryError={form.categoryError}
            categoriaOptions={form.categoriaOptions}
            loadingCategorias={form.loadingCategorias}
            loadingCategoriaPorId={form.loadingCategoriaPorId}
            categoriaActualNombre={form.categoriaActualNombre}
            categoriaValidation={form.categoriaValidation}
            onDismissCategoriaValidation={() => form.setCategoriaValidation(null)}
            name={form.name}
            onNameChange={(val) => {
              form.setName(val)
              if (form.nameError) form.setNameError(undefined)
            }}
            nameError={form.nameError}
            price={form.price}
            onPriceChange={(val) => {
              form.setPrice(val)
              if (form.priceError) form.setPriceError(undefined)
            }}
            priceError={form.priceError}
            taxPercentage={form.taxPercentage}
            onTaxPercentageChange={form.setTaxPercentage}
            prepTime={form.prepTime}
            onPrepTimeChange={form.setPrepTime}
            startTime={form.startTime}
            onStartTimeChange={form.setStartTime}
            endTime={form.endTime}
            onEndTimeChange={form.setEndTime}
            isVegetarian={form.isVegetarian}
            onVegetarianChange={form.setIsVegetarian}
            isVegan={form.isVegan}
            onVeganChange={form.setIsVegan}
            available={form.available}
            onAvailableChange={form.setAvailable}
            description={form.description}
            onDescriptionChange={form.setDescription}
            imageFile={form.imagenArchivo}
            imagePreview={form.imagenPreview}
            onImageChange={form.handleImageChange}
          />
        </form>
      </div>
    </Drawer>
  )
}

/**
 * Organismo: Drawer lateral para modificar las características de un producto
 * sin salir del catálogo de Room Service.
 */
export const EditarProductoDrawer = memo(function EditarProductoDrawer({
  producto,
  onClose,
  onProductoActualizado,
}: EditarProductoDrawerProps) {
  if (!producto) return null

  return (
    <EditarProductoDrawerInner
      key={producto.id || producto.name}
      producto={producto}
      onClose={onClose}
      onProductoActualizado={onProductoActualizado}
    />
  )
})
