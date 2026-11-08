import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowTrendUp,
  faArrowTrendDown,
  faMinus,
} from '@fortawesome/free-solid-svg-icons'
import { JupiterGlobe } from './JupiterGlobe'
import { JupiterBadge } from '../atoms/JupiterBadge'
import { JUPITER_PALETTE } from '../lib/colors'
import type { JupiterCardMeta, JupiterPlanetSize } from '../lib/types'
import { cn } from '../../lib/cn'

export interface JupiterCardProps {
  /** Título principal de la tarjeta. */
  title?: string
  /** Subtítulo o descripción breve. */
  description?: string
  /** Metadatos de métrica (número, unidad, tendencia, insignia). */
  cardMeta?: JupiterCardMeta
  /** Tamaño del globo de Júpiter renderizado en la tarjeta. @default 'small' */
  size?: JupiterPlanetSize
  /** Activar rotación y tormentas continuas de Júpiter. @default true */
  animated?: boolean
  /** Contenido secundario o componentes anidados (inputs, listas, acciones). */
  children?: ReactNode
  /** Clase CSS adicional para el contenedor principal. */
  className?: string
  /** Callback opcional al hacer clic en la tarjeta. */
  onClick?: () => void
}

/**
 * Molécula: Tarjeta interactiva con atmósfera y globo de Júpiter.
 *
 * Implementa la paleta de colores oficial:
 * - #82614D (Marrón joviano oscuro)
 * - #D3C7AF (Crema amoniacal)
 * - #8B7A62 (Gris pardo templado)
 * - #FEAC4D (Ámbar dorado radiante)
 * - #D26F37 (Terracota de la Gran Mancha Roja)
 */
export function JupiterCard({
  title = 'Sistema Joviano',
  description,
  cardMeta,
  size = 'small',
  animated = true,
  children,
  className,
  onClick,
}: JupiterCardProps) {
  const isClickable = Boolean(onClick)

  return (
    <motion.div
      whileHover={isClickable ? { scale: 1.015, y: -2 } : { y: -1 }}
      whileTap={isClickable ? { scale: 0.985 } : undefined}
      onClick={onClick}
      className={cn(
        'group relative overflow-hidden rounded-2xl border bg-panel p-5.5 shadow-sm transition-all duration-300',
        'border-line hover:border-ink-soft/40',
        isClickable && 'cursor-pointer hover:shadow-md',
        className
      )}
      style={{
        background: `radial-gradient(circle at 88% 18%, rgba(254,172,77,0.08) 0%, rgba(130,97,77,0.03) 45%, transparent 70%)`,
        boxShadow: `0 4px 20px -2px rgba(130,97,77,0.06)`,
      }}
    >
      {/* Resplandor áureo sutil en el borde superior */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[2px] opacity-75"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${JUPITER_PALETTE.amberGold} 50%, transparent 100%)`,
        }}
      />

      {/* Cabecera de la tarjeta */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3
              className="text-base font-bold tracking-tight truncate font-sans"
              style={{ color: JUPITER_PALETTE.darkBrown }}
            >
              {title}
            </h3>
            {cardMeta?.badge && (
              <JupiterBadge label={cardMeta.badge} active />
            )}
          </div>

          {description && (
            <p className="mt-1 text-xs text-ink-muted leading-relaxed line-clamp-2">
              {description}
            </p>
          )}

          {/* Sección de Métrica / KPI */}
          {cardMeta?.metric !== undefined && (
            <div className="mt-3 flex items-baseline gap-2">
              <span
                className="text-2xl sm:text-3xl font-extrabold tracking-tight font-sans"
                style={{ color: JUPITER_PALETTE.terracotta }}
              >
                {cardMeta.metric}
              </span>
              {cardMeta.unit && (
                <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
                  {cardMeta.unit}
                </span>
              )}

              {/* Indicador de Tendencia */}
              {cardMeta.trend && (
                <div
                  className={cn(
                    'ml-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
                    cardMeta.trend.direction === 'up'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : cardMeta.trend.direction === 'down'
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        : 'bg-ink-muted/10 text-ink-muted'
                  )}
                >
                  <FontAwesomeIcon
                    icon={
                      cardMeta.trend.direction === 'up'
                        ? faArrowTrendUp
                        : cardMeta.trend.direction === 'down'
                          ? faArrowTrendDown
                          : faMinus
                    }
                    className="size-2.5"
                  />
                  <span>{cardMeta.trend.label}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Globo Joviano en el lateral superior */}
        <div className="shrink-0 p-1">
          <JupiterGlobe
            size={size}
            animated={animated}
            className="transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      </div>

      {/* Contenido / Slot de hijos */}
      {children && (
        <div className="mt-4 pt-4 border-t border-line/60">
          {children}
        </div>
      )}
    </motion.div>
  )
}

