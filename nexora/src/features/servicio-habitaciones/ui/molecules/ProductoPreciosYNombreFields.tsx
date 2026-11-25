import { memo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDollarSign,
  faPercent,
  faStopwatch,
  faUtensils,
} from '@fortawesome/free-solid-svg-icons';
import { Input } from '../../../../shared/ui/Input';

export interface ProductoPreciosYNombreFieldsProps {
  name: string;
  onNameChange: (value: string) => void;
  nameError?: string;
  price: string;
  onPriceChange: (value: string) => void;
  priceError?: string;
  taxPercentage: string;
  onTaxPercentageChange: (value: string) => void;
  prepTime: string;
  onPrepTimeChange: (value: string) => void;
}

/**
 * Molécula: Campos de identificación comercial, precio, impuesto y tiempo de preparación.
 */
export const ProductoPreciosYNombreFields = memo(
  function ProductoPreciosYNombreFields({
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
  }: ProductoPreciosYNombreFieldsProps) {
    return (
      <>
        {/* Fila 1: Nombre y Precio */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Nombre del producto"
            placeholder="Ej. Bowl de Quinoa y Aguacate"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            error={nameError}
            required
            icon={<FontAwesomeIcon icon={faUtensils} className="size-4" />}
          />

          <Input
            label="Precio de venta (COP)"
            type="number"
            step="0.01"
            min="0"
            placeholder="Ej. 14.50"
            value={price}
            onChange={(e) => onPriceChange(e.target.value)}
            error={priceError}
            required
            icon={<FontAwesomeIcon icon={faDollarSign} className="size-4" />}
          />
        </div>

        {/* Fila 2: Porcentaje de Impuesto y Tiempo de Preparación */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Porcentaje de impuesto (%)"
            type="number"
            step="0.01"
            min="0"
            placeholder="Ej. 10.0"
            value={taxPercentage}
            onChange={(e) => onTaxPercentageChange(e.target.value)}
            icon={<FontAwesomeIcon icon={faPercent} className="size-4" />}
          />

          <Input
            label="Tiempo de preparación"
            type="number"
            min="1"
            placeholder="Ej. 15"
            value={prepTime}
            onChange={(e) => onPrepTimeChange(e.target.value)}
            icon={<FontAwesomeIcon icon={faStopwatch} className="size-4" />}
          />
        </div>
      </>
    );
  }
);
