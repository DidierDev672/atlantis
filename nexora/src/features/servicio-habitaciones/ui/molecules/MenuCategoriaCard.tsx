import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faExpand, faPlus } from '@fortawesome/free-solid-svg-icons'
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
  onAgregarProducto?: (categoria: MenuCategoria) => void
}

const FALLBACK_FOOD_IMG =
  'https://images.pexels.com/photos/1855214/pexels-photo-1855214.jpeg?auto=compress&cs=tinysrgb&w=800'

export function MenuCategoriaCard({
  categoria,
  index = 0,
  viewMode = 'grid',
  onVerDetalle,
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

  return (
    <motion.article
      layout="position"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      whileHover={{ y: -6, scale: 1.015 }}
      onClick={() => onVerDetalle?.(categoria)}
      className={`group relative ${aspectClass} w-full overflow-hidden rounded-3xl border border-line/80 bg-panel shadow-xs transition-all duration-300 hover:shadow-2xl hover:border-primary/60 cursor-pointer select-none`}
    >
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

      {/* 2. CON EL EFECTO (HOVER / TOUCH): Botones de acción ("Ver detalle" y "Agregar producto") */}
      <div
        className="absolute inset-0 flex items-center justify-center p-3 bg-black/55 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out"
      >
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 max-w-full">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onVerDetalle?.(categoria)
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-white/95 px-3.5 py-2.5 text-xs font-bold text-ink shadow-xl backdrop-blur-md transition-all duration-200 hover:scale-105 hover:bg-white active:scale-95 border border-white/60 cursor-pointer"
            title="Expandir y ver detalle de la categoría"
          >
            <FontAwesomeIcon icon={faExpand} className="size-3 text-primary" />
            <span>Ver detalle</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onAgregarProducto?.(categoria)
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2.5 text-xs font-bold text-white shadow-xl transition-all duration-200 hover:scale-105 hover:bg-primary/90 active:scale-95 border border-primary/40 cursor-pointer"
            title={`Agregar nuevo producto a ${categoria.name}`}
          >
            <FontAwesomeIcon icon={faPlus} className="size-3 text-white" />
            <span>Agregar producto</span>
          </button>
        </div>
      </div>
    </motion.article>
  )
}
