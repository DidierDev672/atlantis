import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faClock,
  faDollarSign,
  faPercent,
  faStopwatch,
  faUtensils,
} from '@fortawesome/free-solid-svg-icons'
import { Input, Textarea } from '../../../../shared/ui'
import type { StatusCodeValidationResult } from '../../../../shared/lib/status-code-validator'
import type { DropdownOption } from '../../../recursos/ui/molecules/recursos-dropdown'
import { Switch } from '../atoms/Switch'
import { CategoriaProductoSelector } from './CategoriaProductoSelector'
import { SeccionCargaImagen } from './SeccionCargaImagen'

export interface EditarProductoFormFieldsProps {
  categoryId: string
  onCategoryChange: (value: string) => void
  categoryError?: string
  categoriaOptions: DropdownOption[]
  loadingCategorias: boolean
  loadingCategoriaPorId: boolean
  categoriaActualNombre?: string | null
  categoriaValidation?: StatusCodeValidationResult | null
  onDismissCategoriaValidation?: () => void
  name: string
  onNameChange: (value: string) => void
  nameError?: string
  price: string
  onPriceChange: (value: string) => void
  priceError?: string
  taxPercentage: string
  onTaxPercentageChange: (value: string) => void
  prepTime: string
  onPrepTimeChange: (value: string) => void
  startTime: string
  onStartTimeChange: (value: string) => void
  endTime: string
  onEndTimeChange: (value: string) => void
  isVegetarian: boolean
  onVegetarianChange: (value: boolean) => void
  isVegan: boolean
  onVeganChange: (value: boolean) => void
  available: boolean
  onAvailableChange: (value: boolean) => void
  description: string
  onDescriptionChange: (value: string) => void
  imageFile: File | null
  imagePreview: string | null
  onImageChange: (file: File | null, previewUrl: string | null) => void
}

/**
 * Molécula: Campos agrupados para editar las características de un producto.
 * Diseñada para lectura rápida del recepcionista.
 */
export function EditarProductoFormFields({
  categoryId,
  onCategoryChange,
  categoryError,
  categoriaOptions,
  loadingCategorias,
  loadingCategoriaPorId,
  categoriaActualNombre,
  categoriaValidation,
  onDismissCategoriaValidation,
  name,
  onNameChange,
  nameError,
  price,
  onPriceChange,
  priceError,
  taxPercentage,
  onTaxPercentageChange,
  prepTime,
  onPrepTimeChange,
  startTime,
  onStartTimeChange,
  endTime,
  onEndTimeChange,
  isVegetarian,
  onVegetarianChange,
  isVegan,
  onVeganChange,
  available,
  onAvailableChange,
  description,
  onDescriptionChange,
  imageFile,
  imagePreview,
  onImageChange,
}: EditarProductoFormFieldsProps) {
  return (
    <div className="space-y-5">
      {/* 1. Categoría */}
      <CategoriaProductoSelector
        categoryId={categoryId}
        onCategoryChange={onCategoryChange}
        categoryError={categoryError}
        categoriaOptions={categoriaOptions}
        loadingCategorias={loadingCategorias}
        loadingCategoriaPorId={loadingCategoriaPorId}
        categoriaActualNombre={categoriaActualNombre}
        categoriaValidation={categoriaValidation}
        onDismissCategoriaValidation={onDismissCategoriaValidation}
      />

      {/* 2. Nombre y Precio */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Nombre del producto"
          placeholder="Ej. Latte de Vainilla"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          error={nameError}
          required
          icon={
            <FontAwesomeIcon
              icon={faUtensils}
              className="size-3.5"
              aria-hidden="true"
            />
          }
        />

        <Input
          label="Precio (COP)"
          type="number"
          step="1"
          min="0"
          placeholder="Ej. 18000"
          value={price}
          onChange={(e) => onPriceChange(e.target.value)}
          error={priceError}
          required
          icon={
            <FontAwesomeIcon
              icon={faDollarSign}
              className="size-3.5"
              aria-hidden="true"
            />
          }
        />
      </div>

      {/* 3. Impuesto y Tiempo de preparación */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Impuesto (%)"
          type="number"
          step="0.01"
          min="0"
          placeholder="Ej. 10"
          value={taxPercentage}
          onChange={(e) => onTaxPercentageChange(e.target.value)}
          icon={
            <FontAwesomeIcon
              icon={faPercent}
              className="size-3.5"
              aria-hidden="true"
            />
          }
        />

        <Input
          label="Tiempo de preparación (min)"
          type="number"
          min="0"
          placeholder="Ej. 15"
          value={prepTime}
          onChange={(e) => onPrepTimeChange(e.target.value)}
          icon={
            <FontAwesomeIcon
              icon={faStopwatch}
              className="size-3.5"
              aria-hidden="true"
            />
          }
        />
      </div>

      {/* 4. Horario de servicio */}
      <div className="border-line bg-canvas/50 space-y-3 rounded-2xl border p-4">
        <p className="text-primary text-xs font-bold tracking-wider uppercase">
          Horario de despacho
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Hora de inicio"
            type="time"
            value={startTime}
            onChange={(e) => onStartTimeChange(e.target.value)}
            icon={
              <FontAwesomeIcon
                icon={faClock}
                className="size-3.5"
                aria-hidden="true"
              />
            }
          />

          <Input
            label="Hora final"
            type="time"
            value={endTime}
            onChange={(e) => onEndTimeChange(e.target.value)}
            icon={
              <FontAwesomeIcon
                icon={faClock}
                className="size-3.5"
                aria-hidden="true"
              />
            }
          />
        </div>
      </div>

      {/* 5. Disponibilidad y preferencias dietéticas */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Switch
          label="Disponible"
          description="Visible para pedidos"
          checked={available}
          onChange={onAvailableChange}
        />
        <Switch
          label="Vegetariano"
          description="Sin carnes"
          checked={isVegetarian}
          onChange={onVegetarianChange}
        />
        <Switch
          label="Vegano"
          description="100% vegetal"
          checked={isVegan}
          onChange={onVeganChange}
        />
      </div>

      {/* 6. Descripción */}
      <Textarea
        label="Descripción del producto"
        rows={3}
        maxLength={280}
        showCount
        resize="none"
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        placeholder="Ingredientes principales, notas de sabor o acompañamientos…"
      />

      {/* 7. Imagen del producto */}
      <SeccionCargaImagen
        imageFile={imageFile}
        imagePreview={imagePreview}
        onImageChange={onImageChange}
      />
    </div>
  )
}
