import { memo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMinus,
  faPenToSquare,
  faPlus,
} from '@fortawesome/free-solid-svg-icons';
import { formatearMonedaCOP } from '../../domain/item-menu';

export interface ProductoCardAccionesFooterProps {
  productName: string;
  price: number;
  isDisponible: boolean;
  cantidadEnCarrito: number;
  canEdit: boolean;
  onEditar: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onAgregar: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onIncrementar: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onDecrementar: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

/**
 * Átomo: Pie de tarjeta con precio en COP y controles de edición / carrito.
 */
export const ProductoCardAccionesFooter = memo(
  function ProductoCardAccionesFooter({
    productName,
    price,
    isDisponible,
    cantidadEnCarrito,
    canEdit,
    onEditar,
    onAgregar,
    onIncrementar,
    onDecrementar,
  }: ProductoCardAccionesFooterProps) {
    return (
      <div className="px-4 pt-1.5 pb-3.5">
        <div className="border-line/70 flex items-center justify-between gap-2.5 border-t pt-2.5">
          <div>
            <span className="text-primary font-sans text-lg leading-tight font-black tracking-tight sm:text-xl">
              {formatearMonedaCOP(price)}
            </span>
          </div>

          <div
            onClick={(e) => e.stopPropagation()}
            className="flex shrink-0 items-center gap-1.5"
          >
            {canEdit && (
              <button
                type="button"
                onClick={onEditar}
                aria-label={`Modificar ${productName}`}
                title="Modificar producto"
                className="border-line bg-canvas text-ink hover:border-primary/40 hover:text-primary inline-flex size-8 cursor-pointer items-center justify-center rounded-xl border shadow-2xs transition-[transform,border-color,color] hover:scale-105 active:scale-95"
              >
                <FontAwesomeIcon
                  icon={faPenToSquare}
                  className="size-3.5"
                  aria-hidden="true"
                />
              </button>
            )}

            {cantidadEnCarrito === 0 ? (
              <button
                type="button"
                onClick={onAgregar}
                disabled={!isDisponible}
                aria-label={`Agregar ${productName} al carrito`}
                title={isDisponible ? 'Agregar al carrito' : 'No disponible'}
                className="bg-primary hover:bg-primary/90 shadow-primary/20 inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-xl px-3 text-xs font-bold text-white shadow-xs transition-[transform,background-color,opacity] hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faPlus} className="size-3" />
                <span className="hidden sm:inline">Agregar</span>
              </button>
            ) : (
              <div className="border-line bg-canvas/80 flex items-center gap-1.5 rounded-2xl border p-1 shadow-2xs">
                <button
                  type="button"
                  onClick={onDecrementar}
                  aria-label={`Descontar una unidad de ${productName}`}
                  title="Descontar cantidad"
                  className="bg-panel text-ink border-line inline-flex size-7 cursor-pointer items-center justify-center rounded-xl border transition-[transform,background-color,color] hover:bg-rose-500 hover:text-white active:scale-95"
                >
                  <FontAwesomeIcon icon={faMinus} className="size-2.5" />
                </button>

                <span
                  aria-label={`${cantidadEnCarrito} unidades en el carrito`}
                  className="text-ink min-w-6 text-center text-xs font-black"
                >
                  {cantidadEnCarrito}
                </span>

                <button
                  type="button"
                  onClick={onIncrementar}
                  disabled={!isDisponible}
                  aria-label={`Aumentar una unidad de ${productName}`}
                  title="Aumentar cantidad"
                  className="bg-primary hover:bg-primary/90 inline-flex size-7 cursor-pointer items-center justify-center rounded-xl text-white shadow-2xs transition-[transform,background-color,opacity] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FontAwesomeIcon icon={faPlus} className="size-2.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);
