import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBowlFood, faExpand, faPlus } from '@fortawesome/free-solid-svg-icons'
import type { MenuCategoria } from '../../domain/menu-categoria'
import type { LayoutViewMode } from '../atoms/LayoutViewSwitch'
import {
  isImageCached,
  loadBalancedImage,
} from '../../infrastructure/image-load-balancer'
import { Loading } from '../../../../shared/loading'

interface MenuCategoriaCardProps {
  categoria: MenuCategoria
  index?: number
  viewMode?: LayoutViewMode
  onVerDetalle?: (categoria: MenuCategoria) => void
  onVerProductos?: (categoria: MenuCategoria) => void
  onAgregarProducto?: (categoria: MenuCategoria) => void
}

const FALLBACK_FOOD_IMG =
  'https://images.pexels.com/photos/1855214/pexels-photo-1855214.jpeg?auto=compress&cs=tinysrgb&w=800'

export function MenuCategoriaCard({
  categoria,
  index = 0,
  viewMode = 'grid',
  onVerDetalle,
  onVerProductos,
  onAgregarProducto,
}: MenuCategoriaCardProps) {
  const primaryUrl = categoria.asset || FALLBACK_FOOD_IMG
  const [loadedState, setLoadedState] = useState<{
    sourceKey: string
    resolvedUrl: string
  } | null>(() =>
    isImageCached(primaryUrl)
      ? { sourceKey: primaryUrl, resolvedUrl: primaryUrl }
      : null
  )

  useEffect(() => {
    if (isImageCached(primaryUrl)) return

    let active = true
    void loadBalancedImage(primaryUrl, {
      fallbackUrl: FALLBACK_FOOD_IMG,
    }).then((result) => {
      if (!active) return
      setLoadedState({
        sourceKey: primaryUrl,
        resolvedUrl: result.resolvedUrl,
      })
    })

    return () => {
      active = false
    }
  }, [primaryUrl])

  const cachedReady = isImageCached(primaryUrl)
  const isImageReady = cachedReady || loadedState?.sourceKey === primaryUrl
  const activeSrc = cachedReady
    ? primaryUrl
    : loadedState?.sourceKey === primaryUrl
      ? loadedState.resolvedUrl
      : null

  // En modo Grid la relación de aspecto es uniforme (4/3) para alineación perfecta de cuadrícula;
  // en modo Masonry es variable determinista (estilo Cascada / Pinterest).
  const isGrid = viewMode === 'grid'
  const ratioVariant = (categoria.order + index) % 3
  const aspectClass = isGrid
    ? 'aspect-4/3'
    : ratioVariant === 0
      ? 'aspect-3/4' // Formato vertical estilizado
      : ratioVariant === 1
        ? 'aspect-4/3' // Formato clásico
        : 'aspect-square' // Formato cuadrado 1:1

  const acciones = [
    {
      key: 'detalle',
      label: 'Ver detalle',
      icon: faExpand,
      title: 'Expandir y ver detalle de la categoría',
      isPrimary: false,
      onClick: () => onVerDetalle?.(categoria),
    },
    {
      key: 'productos',
      label: 'Ver productos',
      icon: faBowlFood,
      title: `Ver productos vinculados a ${categoria.name}`,
      isPrimary: false,
      onClick: () => onVerProductos?.(categoria),
    },
    {
      key: 'agregar',
      label: 'Agregar producto',
      icon: faPlus,
      title: `Agregar nuevo producto a ${categoria.name}`,
      isPrimary: true,
      onClick: () => onAgregarProducto?.(categoria),
    },
  ] as const

  return (
    <motion.article
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      whileHover={{ y: -6, scale: 1.015 }}
      onClick={() => onVerDetalle?.(categoria)}
      className="group flex w-full flex-col overflow-hidden rounded-3xl border border-line/80 bg-panel shadow-xs transition-[border-color,box-shadow] duration-300 hover:shadow-2xl hover:border-primary/60 cursor-pointer select-none"
    >
      {/* Contenedor multimedia con proporción Grid / Masonry */}
      <div className={`relative ${aspectClass} w-full overflow-hidden`}>
        {/* Loader del balanceador de cargas de imagen (/shared/loading) */}
        <Loading
          visible={!isImageReady}
          variant="overlay"
          size="sm"
          label="Cargando imagen…"
          delay={0}
          minDuration={250}
        />

        {/* 1. VISTA EN REPOSO: SOLO LA FOTOGRAFÍA (Pura y en alta definición) */}
        {activeSrc && (
          <img
            src={activeSrc}
            alt={categoria.name}
            onError={() => {
              if (activeSrc !== FALLBACK_FOOD_IMG) {
                setLoadedState({
                  sourceKey: primaryUrl,
                  resolvedUrl: FALLBACK_FOOD_IMG,
                })
              }
            }}
            loading="lazy"
            className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
          />
        )}

        {/* Sombra sutil en los bordes para profundidad visual */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-linear-to-t from-black/20 via-transparent to-black/10 pointer-events-none transition-opacity duration-300 group-hover:opacity-0"
        />

        {/* 2. DESKTOP (HOVER): Overlay ligero sin backdrop-blur para evitar sobrecarga de GPU */}
        <div
          className="hidden lg:flex [@media(hover:none)]:hidden absolute inset-0 items-center justify-center p-3 bg-black/65 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out"
        >
          <div className="flex w-44 max-w-full flex-col items-stretch justify-center gap-2">
            {acciones.map((accion) => (
              <button
                key={accion.key}
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  accion.onClick()
                }}
                className={
                  accion.isPrimary
                    ? 'inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-white shadow-xl transition-transform duration-200 hover:scale-105 hover:bg-primary/90 active:scale-95 border border-primary/40 cursor-pointer'
                    : 'inline-flex items-center justify-center gap-2 rounded-xl bg-white/95 px-3.5 py-2 text-xs font-bold text-ink shadow-xl transition-transform duration-200 hover:scale-105 hover:bg-white active:scale-95 border border-white/60 cursor-pointer'
                }
                title={accion.title}
              >
                <FontAwesomeIcon
                  icon={accion.icon}
                  className={`size-3 ${accion.isPrimary ? 'text-white' : 'text-primary'}`}
                />
                <span>{accion.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. MÓVIL Y TABLET (SIN HOVER): Título, descripción y grid de acciones siempre visible */}
      <div className="flex flex-col gap-3 border-t border-line/60 bg-panel p-4 lg:hidden [@media(hover:none)]:flex">
        <div className="space-y-1">
          <h3 className="font-serif text-base font-bold leading-snug text-ink line-clamp-1">
            {categoria.name}
          </h3>
          <p className="text-xs leading-relaxed text-ink-muted line-clamp-2">
            {categoria.description || 'Sin descripción registrada para esta categoría.'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {acciones.map((accion) => (
            <button
              key={accion.key}
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                accion.onClick()
              }}
              className={
                accion.isPrimary
                  ? 'col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-white shadow-xs transition-all active:scale-95 hover:bg-primary/90 cursor-pointer'
                  : 'inline-flex items-center justify-center gap-1.5 rounded-xl border border-line bg-canvas px-2.5 py-2 text-xs font-bold text-ink shadow-2xs transition-all active:scale-95 hover:border-primary/40 hover:bg-panel cursor-pointer'
              }
              title={accion.title}
            >
              <FontAwesomeIcon
                icon={accion.icon}
                className={`size-3 shrink-0 ${accion.isPrimary ? 'text-white' : 'text-primary'}`}
              />
              <span className="truncate">{accion.label}</span>
            </button>
          ))}
        </div>
      </div>
    </motion.article>
  )
}
