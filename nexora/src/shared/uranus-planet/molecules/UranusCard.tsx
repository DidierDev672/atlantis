import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowTrendUp,
  faArrowTrendDown,
  faMinus,
} from '@fortawesome/free-solid-svg-icons'
import { UranusGlobe } from './UranusGlobe'
import { UranusBadge } from '../atoms/UranusBadge'
import { URANUS_PALETTE } from '../lib/colors'
import type { UranusCardMeta, UranusPlanetSize } from '../lib/types'
import { cn } from '../../lib/cn'

export interface UranusCardProps {
  /** Título principal de la tarjeta. */
  title?: string
  /** Subtítulo o descripción breve. */
  description?: string
  /** Metadatos de métrica (número, unidad, tendencia, insignia). */
  cardMeta?: UranusCardMeta
  /** Tamaño del globo de Urano renderizado en la tarjeta. @default 'small' */
  size?: UranusPlanetSize
  /** Activar rotación de neblina y anillos continuos. @default true */
  animated?: boolean
  /** Contenido secundario o componentes anidados. */
  children?: ReactNode
  /** Clase CSS adicional para el contenedor principal. */
  className?: string
  /** Callback opcional al hacer clic en la tarjeta. */
  onClick?: () => void
}

/**
 * Molécula: Tarjeta interactiva con atmósfera y globo anillado de Urano.
 *
 * Implementa la paleta de colores oficial:
 * - #355B6D (Cian petróleo profundo)
 * - #218193 (Cian brillante metánico)
 * - #79A4A9 (Aguamarina glacial)
 * - #A5BEBD (Hielo cian suave)
 * - #D1D9CE (Menta escarchada)
 * - #EAECDF (Crema glacial pálido)
 * - #D0C1AC (Arena mineral)
 * - #384555 (Azul pizarra profundo)
 */
export function UranusCard({
  title = 'Sistema Uraniano',
  description,
  cardMeta,
  size = 'small',
  animated = true,
  children,
  className,
  onClick,
}: UranusCardProps) {
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
        background: `radial-gradient(circle at 88% 18%, rgba(33,129,147,0.08) 0%, rgba(53,91,109,0.03) 45%, transparent 70%)`,
        boxShadow: `0 4px 20px -2px rgba(53,91,109,0.06)`,
      }}
    >
      {/* Resplandor cian glacial sutil en el borde superior */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[2px] opacity-80"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${URANUS_PALETTE.cyanBlue} 50%, transparent 100%)`,
        }}
      />

      {/* Cabecera de la tarjeta */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3
              className="text-base font-bold tracking-tight truncate font-sans"
              style={{ color: URANUS_PALETTE.slateNavy }}
            >
              {title}
            </h3>
            {cardMeta?.badge && (
              <UranusBadge label={cardMeta.badge} active />
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
                style={{ color: URANUS_PALETTE.cyanBlue }}
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

        {/* Globo de Urano en el lateral superior */}
        <div className="shrink-0 p-1">
          <UranusGlobe
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

