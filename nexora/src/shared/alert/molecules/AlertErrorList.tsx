import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown, faChevronUp, faCopy, faCheck } from '@fortawesome/free-solid-svg-icons'
import { getPlanetTheme } from '../lib/colors'
import type { AlertPlanet, AlertVariant } from '../lib/types'
import { cn } from '../../lib/cn'

export interface AlertErrorListProps {
  details: string[]
  variant?: AlertVariant
  planet?: AlertPlanet
  defaultExpanded?: boolean
  collapsible?: boolean
  className?: string
}

/**
 * Molécula: Lista formateada de sub-errores o advertencias de endpoints (ej. 422 Unprocessable Entity),
 * con acordeón inteligente para listas medianas/largas y botón de copiado de diagnóstico.
 */
export function AlertErrorList({
  details,
  variant = 'danger',
  planet,
  defaultExpanded = false,
  collapsible = true,
  className,
}: AlertErrorListProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [copied, setCopied] = useState(false)
  const theme = getPlanetTheme(variant, planet)

  if (!details || details.length === 0) return null

  // Si hay más de 2 errores y es colapsable, mostrar toggle
  const shouldCollapse = collapsible && details.length > 2 && !isExpanded
  const displayedErrors = shouldCollapse ? details.slice(0, 2) : details
  const hiddenCount = details.length - 2

  const handleCopy = () => {
    const textToCopy = details.join('\n')
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div
      className={cn(
        'mt-2.5 rounded-xl border p-2.5 sm:p-3 text-xs transition-all duration-200',
        className
      )}
      style={{
        backgroundColor: 'var(--alert-details-bg)',
        borderColor: theme.detailsBorder,
      }}
    >
      <div className="flex items-center justify-between pb-1.5 border-b border-inherit/40 mb-2">
        <span
          className="font-medium tracking-wide flex items-center gap-1.5"
          style={{ color: theme.iconColor }}
        >
          <span>Detalles del endpoint ({details.length})</span>
        </span>

        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 text-[11px] font-medium opacity-80 hover:opacity-100 cursor-pointer transition-opacity"
          style={{ color: theme.iconColor }}
          title="Copiar detalles del error"
        >
          <FontAwesomeIcon icon={copied ? faCheck : faCopy} className="text-[10px]" />
          <span>{copied ? 'Copiado' : 'Copiar'}</span>
        </button>
      </div>

      <ul className="space-y-1.5 pl-1">
        {displayedErrors.map((detail, idx) => (
          <li
            key={idx}
            className="flex items-start gap-2 leading-relaxed"
            style={{ color: theme.textDark }}
          >
            <span
              className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0"
              style={{ backgroundColor: theme.iconColor }}
            />
            <span className="font-mono text-[11px] sm:text-xs break-all">
              {detail}
            </span>
          </li>
        ))}
      </ul>

      {collapsible && details.length > 2 && (
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="mt-2.5 inline-flex items-center gap-1.5 text-[11px] font-semibold cursor-pointer transition-opacity hover:opacity-100 opacity-80"
          style={{ color: theme.iconColor }}
        >
          <FontAwesomeIcon icon={isExpanded ? faChevronUp : faChevronDown} className="text-[9px]" />
          <span>
            {isExpanded ? 'Mostrar menos' : `Ver ${hiddenCount} detalle(s) más...`}
          </span>
        </button>
      )}
    </div>
  )
}
