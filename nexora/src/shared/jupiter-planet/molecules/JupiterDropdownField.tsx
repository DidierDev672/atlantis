import {
  useState,
  useRef,
  useEffect,
  forwardRef,
} from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown, faCheck } from '@fortawesome/free-solid-svg-icons'
import { JupiterGlobe } from './JupiterGlobe'
import { JUPITER_PALETTE } from '../lib/colors'
import type { JupiterDropdownOption } from '../lib/types'
import { cn } from '../../lib/cn'

export interface JupiterDropdownFieldProps {
  id?: string
  options?: JupiterDropdownOption[]
  value?: string | number
  defaultValue?: string | number
  onValueChange?: (val: string) => void
  placeholder?: string
  disabled?: boolean
  hasError?: boolean
  className?: string
}

const DEFAULT_OPTIONS: JupiterDropdownOption[] = [
  { value: 'europa', label: 'Luna Europa (Océano subsuperficial)', description: 'Corteza de hielo y agua líquida' },
  { value: 'ganymede', label: 'Luna Ganímedes (La más grande)', description: 'Mayor que el planeta Mercurio' },
  { value: 'callisto', label: 'Luna Calisto (Superficie antigua)', description: 'Cráteres ancestrales' },
  { value: 'io', label: 'Luna Ío (Actividad volcánica extrema)', description: 'Cuerpos volcánicos más activos' },
]

/**
 * Molécula: Selector Desplegable (Dropdown) con temática joviana.
 * Integra el globo interactivo, selector animado con Motion y opciones estilizadas con la paleta.
 */
export const JupiterDropdownField = forwardRef<HTMLButtonElement, JupiterDropdownFieldProps>(
  function JupiterDropdownField(
    {
      id,
      options = DEFAULT_OPTIONS,
      value,
      defaultValue,
      onValueChange,
      placeholder = 'Seleccionar opción joviana…',
      disabled = false,
      hasError = false,
      className,
    },
    ref
  ) {
    const [isOpen, setIsOpen] = useState(false)
    const [selectedValue, setSelectedValue] = useState<string>(
      String(value ?? defaultValue ?? '')
    )
    const containerRef = useRef<HTMLDivElement>(null)

    // Sincronizar valor controlado
    useEffect(() => {
      if (value !== undefined) {
        setSelectedValue(String(value))
      }
    }, [value])

    // Cerrar al hacer clic fuera o con tecla Escape
    useEffect(() => {
      if (!isOpen) return
      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsOpen(false)
        }
      }
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setIsOpen(false)
      }
      window.addEventListener('mousedown', handleClickOutside)
      window.addEventListener('keydown', handleKeyDown)
      return () => {
        window.removeEventListener('mousedown', handleClickOutside)
        window.removeEventListener('keydown', handleKeyDown)
      }
    }, [isOpen])

    const selectedOption = options.find((opt) => opt.value === selectedValue)

    const handleSelect = (val: string) => {
      if (disabled) return
      setSelectedValue(val)
      onValueChange?.(val)
      setIsOpen(false)
    }

    return (
      <div ref={containerRef} className={cn('relative flex items-center gap-3', className)}>
        {/* Globo Joviano reactivo */}
        <JupiterGlobe
          size="tiny"
          animated={isOpen}
          active={isOpen}
          disabled={disabled}
        />

        {/* Botón Trigger del Dropdown */}
        <div className="relative flex-1">
          <button
            ref={ref}
            id={id}
            type="button"
            disabled={disabled}
            onClick={() => !disabled && setIsOpen((prev) => !prev)}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            className={cn(
              'flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm transition-all duration-200 outline-none cursor-pointer',
              'font-sans bg-panel text-ink text-left',
              hasError
                ? 'border-danger focus:border-danger'
                : 'border-line hover:border-ink-soft',
              disabled && 'opacity-50 cursor-not-allowed bg-canvas/50'
            )}
            style={{
              borderColor: hasError
                ? JUPITER_PALETTE.terracotta
                : isOpen
                  ? JUPITER_PALETTE.amberGold
                  : undefined,
              boxShadow:
                isOpen && !hasError
                  ? `0 0 0 3px ${JUPITER_PALETTE.amberGold}28`
                  : undefined,
            }}
          >
            <span className={cn('truncate', !selectedOption && 'text-ink-muted/60')}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <motion.span
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-ink-muted shrink-0 ml-2"
            >
              <FontAwesomeIcon icon={faChevronDown} className="size-3" />
            </motion.span>
          </button>

          {/* Menú flotante de opciones con Motion */}
          <AnimatePresence>
            {isOpen && (
              <motion.ul
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                role="listbox"
                className="absolute left-0 right-0 top-full z-40 mt-1.5 max-h-60 overflow-y-auto rounded-xl border border-line bg-panel p-1.5 shadow-xl backdrop-blur-md"
                style={{
                  boxShadow: `0 10px 25px -5px ${JUPITER_PALETTE.darkBrown}33, 0 0 0 1px ${JUPITER_PALETTE.amberGold}33`,
                }}
              >
                {options.map((opt) => {
                  const isSelected = opt.value === selectedValue
                  return (
                    <li
                      key={opt.value}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => !opt.disabled && handleSelect(opt.value)}
                      className={cn(
                        'flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs transition-colors cursor-pointer select-none',
                        isSelected
                          ? 'font-bold'
                          : 'text-ink hover:bg-surface/50',
                        opt.disabled && 'opacity-40 cursor-not-allowed'
                      )}
                      style={{
                        backgroundColor: isSelected
                          ? `${JUPITER_PALETTE.amberGold}22`
                          : undefined,
                        color: isSelected ? JUPITER_PALETTE.darkBrown : undefined,
                      }}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{opt.label}</p>
                        {opt.description && (
                          <p className="text-[10px] text-ink-muted truncate">
                            {opt.description}
                          </p>
                        )}
                      </div>
                      {isSelected && (
                        <FontAwesomeIcon
                          icon={faCheck}
                          className="size-3 shrink-0"
                          style={{ color: JUPITER_PALETTE.terracotta }}
                        />
                      )}
                    </li>
                  )
                })}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      </div>
    )
  }
)

