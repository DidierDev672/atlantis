import {
  useState,
  useRef,
  useEffect,
  forwardRef,
} from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown, faCheck } from '@fortawesome/free-solid-svg-icons'
import { NeptuneGlobe } from './NeptuneGlobe'
import { NEPTUNE_PALETTE } from '../lib/colors'
import type { NeptuneDropdownOption } from '../lib/types'
import { cn } from '../../lib/cn'

export interface NeptuneDropdownFieldProps {
  id?: string
  options?: NeptuneDropdownOption[]
  value?: string | number
  defaultValue?: string | number
  onValueChange?: (val: string) => void
  placeholder?: string
  disabled?: boolean
  hasError?: boolean
  className?: string
}

const DEFAULT_NEPTUNE_OPTIONS: NeptuneDropdownOption[] = [
  { value: 'triton', label: 'Luna Tritón (Géiseres de nitrógeno)', description: 'Órbita retrógrada y mundo helado activo' },
  { value: 'proteus', label: 'Luna Proteo (Cuerpo irregular mayor)', description: 'Superficie oscura y forma poliédrica' },
  { value: 'nereid', label: 'Luna Nereida (Órbita hiper-excéntrica)', description: 'Tarda 360 días terrestres en orbitar' },
  { value: 'larissa', label: 'Luna Larisa (Conexión con anillos)', description: 'Mundo craterizado y pastora de arcos' },
  { value: 'thalassa', label: 'Luna Talasa (Danza orbital)', description: 'Órbita zigzagueante en resonancia' },
]

/**
 * Molécula: Selector Desplegable (Dropdown) con temática neptuniana.
 * Integra el globo interactivo, menú animado con Motion y FontAwesome.
 */
export const NeptuneDropdownField = forwardRef<HTMLButtonElement, NeptuneDropdownFieldProps>(
  function NeptuneDropdownField(
    {
      id,
      options = DEFAULT_NEPTUNE_OPTIONS,
      value,
      defaultValue,
      onValueChange,
      placeholder = 'Seleccionar opción neptuniana…',
      disabled = false,
      hasError = false,
      className,
    },
    ref
  ) {
    const [isOpen, setIsOpen] = useState(false)
    const [prevValue, setPrevValue] = useState(value)
    const [selectedValue, setSelectedValue] = useState<string>(
      String(value ?? defaultValue ?? '')
    )
    const containerRef = useRef<HTMLDivElement>(null)

    // Sincronización en fase de render sin causar bucles de efectos
    if (value !== undefined && value !== prevValue) {
      setPrevValue(value)
      setSelectedValue(String(value))
    }

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
      <div ref={containerRef} className={cn('relative flex items-center gap-3.5', className)}>
        {/* Globo de Neptuno reactivo al despliegue */}
        <NeptuneGlobe
          size="tiny"
          animated={isOpen}
          active={isOpen}
          disabled={disabled}
        />

        <div className="relative flex-1">
          {/* Botón trigger del dropdown */}
          <button
            ref={ref}
            id={id}
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            className={cn(
              'w-full flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm transition-all duration-200 outline-none text-left',
              'font-sans bg-panel text-ink',
              hasError
                ? 'border-danger'
                : 'border-line hover:border-ink-soft',
              disabled && 'opacity-50 cursor-not-allowed bg-canvas/50',
              isOpen && 'border-transparent ring-2'
            )}
            style={{
              borderColor: hasError
                ? NEPTUNE_PALETTE.azureVivid
                : isOpen
                  ? NEPTUNE_PALETTE.azureVivid
                  : undefined,
              boxShadow:
                isOpen && !hasError
                  ? `0 0 0 3px ${NEPTUNE_PALETTE.azureVivid}28`
                  : undefined,
            }}
          >
            <span className={cn('truncate', !selectedOption && 'text-ink-muted')}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>

            <FontAwesomeIcon
              icon={faChevronDown}
              className={cn(
                'size-3 shrink-0 text-ink-muted transition-transform duration-200',
                isOpen && 'rotate-180',
                isOpen && 'text-ink'
              )}
            />
          </button>

          {/* Menú desplegable flotante con Motion */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
                className="absolute z-50 mt-1.5 w-full overflow-hidden rounded-xl border border-line bg-panel p-1 shadow-lg backdrop-blur-md"
                style={{
                  boxShadow: `0 8px 24px -4px rgba(33,35,84,0.22)`,
                }}
              >
                <div className="max-h-56 overflow-y-auto space-y-0.5">
                  {options.map((option) => {
                    const isSelected = option.value === selectedValue
                    return (
                      <button
                        key={option.value}
                        type="button"
                        disabled={option.disabled}
                        onClick={() => handleSelect(option.value)}
                        className={cn(
                          'w-full flex items-start justify-between gap-2 rounded-lg px-3 py-2 text-left text-xs transition-colors',
                          isSelected
                            ? 'font-semibold'
                            : 'hover:bg-canvas/80 text-ink',
                          option.disabled && 'opacity-40 cursor-not-allowed'
                        )}
                        style={{
                          backgroundColor: isSelected
                            ? `${NEPTUNE_PALETTE.azureVivid}20`
                            : undefined,
                          color: isSelected
                            ? NEPTUNE_PALETTE.azureVivid
                            : undefined,
                        }}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="truncate">{option.label}</p>
                          {option.description && (
                            <p className="mt-0.5 text-[11px] text-ink-muted leading-tight truncate">
                              {option.description}
                            </p>
                          )}
                        </div>

                        {isSelected && (
                          <FontAwesomeIcon
                            icon={faCheck}
                            className="size-3 shrink-0 mt-0.5"
                            style={{ color: NEPTUNE_PALETTE.azureVivid }}
                          />
                        )}
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    )
  }
)

NeptuneDropdownField.displayName = 'NeptuneDropdownField'

