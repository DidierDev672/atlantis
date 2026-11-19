import { memo, useCallback } from 'react';
import {
  type CategoriaVinculadaInfo,
  type ItemMenuProducto,
} from '../../domain/item-menu';
import {
  obtenerProductoKey,
  useCarritoStore,
} from '../../application/carrito-store';
import { useCategoriaServicio } from '../../application/use-categoria-servicio';
import { CategoriaVinculadaBadge } from '../atoms/CategoriaVinculadaBadge';
import { ProductoCardAccionesFooter } from '../atoms/ProductoCardAccionesFooter';
import { ProductoImagenHeader } from '../atoms/ProductoImagenHeader';
import type { LayoutViewMode } from '../atoms/LayoutViewSwitch';
import { ItemMenuProductoMasonryCard } from './ItemMenuProductoMasonryCard';

export interface ItemMenuProductoCardProps {
  producto: ItemMenuProducto;
  index?: number;
  viewMode?: LayoutViewMode;
  categoriaInfo?: CategoriaVinculadaInfo | null;
  onVerDetalle?: (producto: ItemMenuProducto) => void;
  onEditar?: (producto: ItemMenuProducto) => void;
}

const ItemMenuProductoGridCard = memo(function ItemMenuProductoGridCard({
  producto,
  categoriaInfo,
  onVerDetalle,
  onEditar,
}: Omit<ItemMenuProductoCardProps, 'index' | 'viewMode'>) {
  const { categoriaServicio } = useCategoriaServicio(
    categoriaInfo ? undefined : producto.category_id
  );
  const categoriaVinculada = categoriaInfo ?? categoriaServicio;
  const isDisponible = producto.available !== false;

  const productoKey = obtenerProductoKey(producto);
  const cantidadEnCarrito = useCarritoStore(
    (s) => s.cantidadPorKey[productoKey] ?? 0
  );
  const agregarProducto = useCarritoStore((s) => s.agregarProducto);
  const incrementarCantidad = useCarritoStore((s) => s.incrementarCantidad);
  const decrementarCantidad = useCarritoStore((s) => s.decrementarCantidad);

  const handleVerDetalle = useCallback(() => {
    try {
      onVerDetalle?.(producto);
    } catch (error) {
      console.error('Error al abrir el detalle del producto:', error);
    }
  }, [onVerDetalle, producto]);

  const handleEditar = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      try {
        onEditar?.(producto);
      } catch (error) {
        console.error('Error al abrir la edición del producto:', error);
      }
    },
    [onEditar, producto]
  );

  const handleAgregar = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      try {
        agregarProducto(producto, 1);
      } catch (error) {
        console.error('Error al agregar producto al carrito:', error);
      }
    },
    [agregarProducto, producto]
  );

  const handleIncrementar = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      try {
        incrementarCantidad(productoKey);
      } catch (error) {
        console.error('Error al incrementar cantidad en el carrito:', error);
      }
    },
    [incrementarCantidad, productoKey]
  );

  const handleDecrementar = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      try {
        decrementarCantidad(productoKey);
      } catch (error) {
        console.error('Error al descontar cantidad en el carrito:', error);
      }
    },
    [decrementarCantidad, productoKey]
  );

  return (
    <article
      data-id={producto.id}
      data-category-id={producto.category_id}
      role="button"
      tabIndex={0}
      onClick={handleVerDetalle}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleVerDetalle();
        }
      }}
      className="group border-line bg-panel hover:border-primary/40 relative flex h-full cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border shadow-xs transition-[transform,border-color,box-shadow] duration-300 select-none hover:-translate-y-0.5 hover:shadow-lg"
    >
      {/* 1. Encabezado visual con imagen + Nombre del Producto y Categoría cercana */}
      <div>
        <ProductoImagenHeader producto={producto} />

        <div className="space-y-0.5 px-4 pt-3 pb-1.5">
          <h3 className="text-ink group-hover:text-primary line-clamp-2 text-base leading-tight font-bold transition-colors">
            {producto.name}
          </h3>

          {categoriaVinculada && (
            <CategoriaVinculadaBadge
              categoria={categoriaVinculada}
              variant="card"
            />
          )}
        </div>
      </div>

      {/* 2. Pie con precio y controles de edición / carrito */}
      <ProductoCardAccionesFooter
        productName={producto.name}
        price={producto.price}
        isDisponible={isDisponible}
        cantidadEnCarrito={cantidadEnCarrito}
        canEdit={Boolean(onEditar)}
        onEditar={handleEditar}
        onAgregar={handleAgregar}
        onIncrementar={handleIncrementar}
        onDecrementar={handleDecrementar}
      />
    </article>
  );
});

/**
 * Molécula: Tarjeta interactiva de producto gastronómico optimizada para el recepcionista.
 * Enruta entre vista Masonry y Grid sin duplicar suscripciones de hooks.
 */
export const ItemMenuProductoCard = memo(function ItemMenuProductoCard({
  producto,
  index = 0,
  viewMode = 'grid',
  categoriaInfo,
  onVerDetalle,
  onEditar,
}: ItemMenuProductoCardProps) {
  if (viewMode === 'masonry') {
    return (
      <ItemMenuProductoMasonryCard
        producto={producto}
        index={index}
        categoriaInfo={categoriaInfo}
        onVerDetalle={onVerDetalle}
        onEditar={onEditar}
      />
    );
  }

  return (
    <ItemMenuProductoGridCard
      producto={producto}
      categoriaInfo={categoriaInfo}
      onVerDetalle={onVerDetalle}
      onEditar={onEditar}
    />
  );
});

export default ItemMenuProductoCard;
