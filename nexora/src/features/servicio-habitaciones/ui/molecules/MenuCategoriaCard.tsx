import { memo, useCallback, useMemo } from 'react'
import type { IconProp } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEye, faPlus, faUtensils } from '@fortawesome/free-solid-svg-icons'
import type { MenuCategoria } from '../../domain/menu-categoria'
import type { LayoutViewMode } from '../atoms/LayoutViewSwitch'
import { useBalancedProductImage } from '../../application/use-balanced-product-image'
import { Skeleton } from '../../../../shared/loading'

interface MenuCategoriaCardAccion {
  readonly key: 'detalle' | 'productos' | 'agregar'
  readonly label: string
  readonly icon: IconProp
  readonly title: string
  readonly variant: 'neutral' | 'accent' | 'primary'
  readonly onClick: () => void
}

export interface MenuCategoriaCardProps {
  categoria: MenuCategoria
  index?: number
  viewMode?: LayoutViewMode
  onVerDetalle?: (categoria: MenuCategoria) => void
  onVerProductos?: (categoria: MenuCategoria) => void
  onAgregarProducto?: (categoria: MenuCategoria) => void
}

const FALLBACK_FOOD_IMG =
  'https://images.pexels.com/photos/1855214/pexels-photo-1855214.jpeg?auto=compress&cs=tinysrgb&w=800'

const BUTTON_VARIANT_CLASSES: Record<MenuCategoriaCardAccion['variant'], string> = {
  neutral:
    'border border-line bg-canvas text-ink shadow-2xs hover:border-primary/45 hover:text-primary hover:bg-panel',
  accent:
    'border border-primary/25 bg-primary/10 text-primary shadow-2xs hover:border-primary/50 hover:bg-primary/15',
  primary:
    'border border-primary bg-primary text-white shadow-xs hover:bg-primary/90',
}

const TOOLTIP_ALIGN_CLASSES: Record<MenuCategoriaCardAccion['key'], string> = {
  detalle: 'left-0',
  productos: 'left-1/2 -translate-x-1/2',
  agregar: 'right-0',
}

/**
 * Tarjeta optimizada para una categoría o servicio de habitaciones.
 * Presenta la fotografía, el nombre de la categoría y 3 acciones de solo icono
 * con jerarquía cromática, tooltip inmediato y soporte accesible para recepción.
 */
export const MenuCategoriaCard = memo(function MenuCategoriaCard({
  categoria,
  index = 0,
  viewMode = 'masonry',
  onVerDetalle,
  onVerProductos,
  onAgregarProducto,
}: MenuCategoriaCardProps) {
  const primaryUrl = categoria.asset?.trim() || FALLBACK_FOOD_IMG
  const { activeSrc, isImageReady, handleImageError } = useBalancedProductImage(
    primaryUrl,
    FALLBACK_FOOD_IMG,
    640,
  )

  const isGrid = viewMode === 'grid'
  const stableSeed = Number.isFinite(categoria.order) ? categoria.order : index
  const ratioVariant = Math.abs(stableSeed) % 3
  const aspectClass = isGrid
    ? 'aspect-4/3'
    : ratioVariant === 0
      ? 'aspect-3/4'
      : ratioVariant === 1
        ? 'aspect-4/3'
        : 'aspect-square'

  const handleCardClick = useCallback(() => {
    try {
      onVerDetalle?.(categoria)
    } catch (error) {
      console.error('Error al abrir el detalle de la categoría:', error)
    }
  }, [categoria, onVerDetalle])

  const handleCardKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      if (event.target !== event.currentTarget) return
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        handleCardClick()
      }
    },
    [handleCardClick],
  )

  const acciones = useMemo<readonly MenuCategoriaCardAccion[]>(() => {
    const base: MenuCategoriaCardAccion[] = [
      {
        key: 'detalle',
        label: 'Ver detalle',
        icon: faEye,
        title: `Ver detalle de ${categoria.name}`,
        variant: 'neutral',
        onClick: () => onVerDetalle?.(categoria),
      },
      {
        key: 'productos',
        label: 'Ver productos',
        icon: faUtensils,
        title: `Ver productos de ${categoria.name}`,
        variant: 'accent',
        onClick: () => onVerProductos?.(categoria),
      },
    ]
    if (onAgregarProducto) {
      base.push({
        key: 'agregar',
        label: 'Agregar producto',
        icon: faPlus,
        title: `Agregar producto a ${categoria.name}`,
        variant: 'primary',
        onClick: () => onAgregarProducto(categoria),
      })
    }
    return base
  }, [categoria, onAgregarProducto, onVerDetalle, onVerProductos])

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      className="group flex h-full w-full flex-col justify-between overflow-hidden rounded-3xl border border-line/80 bg-panel shadow-xs transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-primary/60 cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      {/* Contenedor multimedia con proporción Grid / Masonry */}
      <div className={`relative ${aspectClass} w-full shrink-0 overflow-hidden bg-canvas`}>
        {!isImageReady && (
          <Skeleton variant="rectangular" animation="none" className="absolute inset-0 size-full" />
        )}

        {activeSrc && (
          <img
            src={activeSrc}
            alt={categoria.name}
            onError={handleImageError}
            loading="lazy"
            decoding="async"
            className={`size-full object-cover transition-[transform,opacity] duration-300 ease-out group-hover:scale-[1.03] ${
              isImageReady ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/15 via-transparent to-transparent"
        />
      </div>

      {/* Nombre de categoría y grilla compacta de 3 botones solo icono con tooltip inmediato */}
      <div className="flex flex-1 flex-col justify-between gap-2.5 border-t border-line/60 bg-panel p-3.5">
        <h3 className="font-serif text-base font-bold leading-snug text-ink line-clamp-1">
          {categoria.name}
        </h3>

        <div className={`grid ${acciones.length === 2 ? 'grid-cols-2' : 'grid-cols-3'} gap-2`}>
          {acciones.map((accion) => (
            <button
              key={accion.key}
              type="button"
              aria-label={accion.title}
              title={accion.title}
              onClick={(event) => {
                event.stopPropagation()
                try {
                  accion.onClick()
                } catch (error) {
                  console.error(`Error al ejecutar la acción "${accion.key}":`, error)
                }
              }}
              className={`group/btn relative inline-flex h-9 items-center justify-center rounded-xl transition-colors active:scale-95 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${BUTTON_VARIANT_CLASSES[accion.variant]}`}
            >
              <FontAwesomeIcon icon={accion.icon} className="size-3.5 shrink-0" />
              <span className="sr-only">{accion.label}</span>

              {/* Tooltip instantáneo sin JS extra para facilitar la lectura al recepcionista */}
              <span
                role="tooltip"
                className={`pointer-events-none absolute bottom-full z-20 mb-1.5 whitespace-nowrap rounded-lg bg-ink px-2 py-1 text-[11px] font-semibold text-white opacity-0 shadow-md transition-opacity duration-150 group-hover/btn:opacity-100 group-focus-visible/btn:opacity-100 ${TOOLTIP_ALIGN_CLASSES[accion.key]}`}
              >
                {accion.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </article>
  )
})
