import { useCallback, useEffect, useMemo, useRef, useState, useId } from 'react'
import axios from 'axios'
import { AnimatePresence, motion, type Variants } from 'motion/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faChevronDown,
  faCheck,
  faXmark,
  faMagnifyingGlass,
} from '@fortawesome/free-solid-svg-icons'
import { Button } from '../atoms/button'
import { ApiModuleRepository } from '../../infrastructure/api-module-repository'
import { cn } from '../lib/cn'
import { api } from '../../../../lib/api'
import { validateStatusCode } from '../../../../shared/lib/status-code-validator'
import { InfiniteScroll } from '../../../../shared/ui/InfiniteScroll'

const apiModuleRepository = new ApiModuleRepository()

const resourceErrorMessage =
  'Tranqui, no es algo que hayas hecho vos: se nos cruzó algo del otro lado y la lista no llegó a destino. Ya lo estamos resolviendo. Probá de nuevo en un instante y vas a poder elegir tu recurso.'

const unexpectedErrorMessage =
  'Se nos complicó traer tus recursos. No es tu culpa: estamos revisándolo. Probá otra vez en un momento y seguimos.'

const rolesErrorMessage400 =
  '¡Tranqui, que no cunda el pánico! ✨ Se nos presentó una pequeña situación técnica con el servidor al consultar los roles (código 400), pero toda tu información sigue completamente a salvo. Dale una segunda oportunidad con "Volver a intentar" y los traemos de inmediato.'

const rolesUnexpectedErrorMessage =
  '¡Respira con calma! 🌿 Tuvimos un breve contratiempo de red al intentar traer los roles. Tus datos siguen intactos aquí. Presiona "Volver a intentar" en un momento.'

/** Variantes de Framer Motion para efecto Stagger de los ítems del dropdown */
const dropdownStaggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.035,
      delayChildren: 0.02,
    },
  },
}

const dropdownStaggerItem: Variants = {
  hidden: {
    opacity: 0,
    y: 8,
    scale: 0.97,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 26,
      mass: 0.7,
    },
  },
}

export interface DropdownOption {
  value: string
  label: string
  id?: string
  rawName?: string
}

export interface RecursosDropdownProps {
  /** Valor seleccionado en modo selección simple */
  value?: string
  /** Callback para cambio en modo simple */
  onChange?: (value: string) => void
  /** Callback para notificar la opción completa seleccionada (con id y rawName) */
  onSelectOption?: (option: DropdownOption) => void
  /** Mensaje de error a desplegar */
  error?: string
  /** Etiqueta superior del campo */
  label?: string
  /** Texto placeholder */
  placeholder?: string
  /** Opciones predefinidas. Si no se pasan, carga recursos vía apiModuleRepository o endpoint */
  options?: ReadonlyArray<DropdownOption>
  /** Endpoint personalizado para consultar opciones vía axios GET (ej: '/roles') */
  endpoint?: string
  /** Activa la selección múltiple con chips y popover interactivo */
  multiple?: boolean
  /** Valores seleccionados en modo múltiple */
  selectedValues?: string[]
  /** Callback para actualización en modo múltiple */
  onMultiChange?: (values: string[]) => void
  /** Habilita la barra de búsqueda en tiempo real dentro del popover (por defecto true) */
  searchable?: boolean
  /** Placeholder para el campo de búsqueda */
  searchPlaceholder?: string
  /** Deshabilita la interacción */
  disabled?: boolean
  /** Deshabilita la interacción (alias: isDisabled) */
  isDisabled?: boolean
  /** Marca el campo como obligatorio */
  required?: boolean
  /** Clases CSS adicionales */
  className?: string
  /** Mensaje de aviso cuando no hay opciones disponibles */
  emptyLabel?: string
  /** Identificador opcional para el elemento de formulario */
  id?: string
  /** Tamaño del lote para el scroll infinito y renderizado progresivo (por defecto 20) */
  pageSize?: number
  /** Callback opcional para cargar más opciones desde un servidor */
  onLoadMoreOptions?: () => Promise<void> | void
  /** Indica si hay más opciones en el servidor */
  hasMoreOptions?: boolean
}

export function RecursosDropdown({
  value = '',
  onChange,
  onSelectOption,
  error,
  label,
  placeholder,
  options: externalOptions,
  endpoint,
  multiple = false,
  selectedValues = [],
  onMultiChange,
  searchable = true,
  searchPlaceholder,
  disabled = false,
  isDisabled,
  required = false,
  className,
  emptyLabel: customEmptyLabel,
  id,
  pageSize = 20,
  onLoadMoreOptions,
  hasMoreOptions: externalHasMore,
}: RecursosDropdownProps) {
  const isComponentDisabled = isDisabled ?? disabled
  const autoId = useId()
  const fieldId = id ?? autoId
  const dropdownRef = useRef<HTMLDivElement>(null)
  const onSelectOptionRef = useRef(onSelectOption)
  useEffect(() => {
    onSelectOptionRef.current = onSelectOption
  }, [onSelectOption])

  const [internalOptions, setInternalOptions] = useState<ReadonlyArray<DropdownOption>>([])
  const [loading, setLoading] = useState(externalOptions == null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Habilitado por defecto para búsqueda en tiempo real
  const isSearchEnabled = searchable ?? true

  // Carga automática de opciones solo si NO se proveyeron opciones externas
  const loadOptions = useCallback(async () => {
    if (externalOptions != null) return
    setErrorMessage(null)
    setLoading(true)

    try {
      // 1. Endpoint específico de roles: /roles vía GET con axios y validateStatusCode
      if (endpoint === '/roles' || endpoint?.includes('roles')) {
        const response = await api.get<{ id: string; name: string; description?: string }[]>(endpoint, {
          validateStatus: () => true,
        })

        const validation = validateStatusCode(response.status)

        if (validation.isValid) {
          const rawData = response.data
          const dataList: { id: string; name: string; description?: string }[] = Array.isArray(rawData)
            ? rawData
            : rawData && typeof rawData === 'object' && Array.isArray((rawData as { data?: unknown[] }).data)
              ? (rawData as { data: { id: string; name: string; description?: string }[] }).data
              : []

          // Para las opciones en el dropdown utilizar el item id como value y name como label
          const roleOptions = dataList.map((role) => {
            const isGuestOrHuesped =
              role.name.trim().toLowerCase() === 'guest' ||
              role.name.trim().toLowerCase() === 'huesped' ||
              role.name.trim().toLowerCase() === 'huésped'
            return {
              value: role.id,
              label: isGuestOrHuesped ? 'Huesped' : role.name,
              id: role.id,
              rawName: role.name,
            }
          })
          setInternalOptions(roleOptions)

          // De acuerdo a las opciones del endpoint por defecto es huesped
          const huespedRole =
            roleOptions.find(
              (r) =>
                r.label.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === 'huesped' ||
                r.rawName?.trim().toLowerCase() === 'guest' ||
                r.rawName?.trim().toLowerCase() === 'huesped'
            ) || roleOptions[0]

          if (huespedRole) {
            onSelectOptionRef.current?.(huespedRole)
            onChange?.(huespedRole.id || huespedRole.value)
          }
        } else if (response.status === 400) {
          // Status 400: Mensaje empático y constructivo mediante status-code-validator
          setErrorMessage(validation.message || rolesErrorMessage400)
        } else {
          setErrorMessage(validation.message || rolesUnexpectedErrorMessage)
        }
        return
      }

      // 2. Otro endpoint genérico
      if (endpoint) {
        const response = await api.get<unknown[]>(endpoint, {
          validateStatus: () => true,
        })
        const validation = validateStatusCode(response.status)
        if (validation.isValid && Array.isArray(response.data)) {
          setInternalOptions(
            (response.data as Array<{ id?: string; value?: string; name?: string; label?: string }>).map((item) => ({
              value: item.id ?? item.value ?? String(item),
              label: item.name ?? item.label ?? String(item),
            }))
          )
        } else if (response.status === 400) {
          setErrorMessage(validation.message || rolesErrorMessage400)
        } else {
          setErrorMessage(validation.message || unexpectedErrorMessage)
        }
        return
      }

      // 3. Comportamiento por defecto: listResources vía apiModuleRepository
      const resources = await apiModuleRepository.listResources()
      setInternalOptions(resources.map((resource) => ({ value: resource.id, label: resource.name })))
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status ?? 0
        const validation = validateStatusCode(status)
        setErrorMessage(
          validation.message || (endpoint?.includes('roles') ? rolesErrorMessage400 : resourceErrorMessage)
        )
      } else {
        const validation = validateStatusCode(0)
        setErrorMessage(
          validation.message || (endpoint?.includes('roles') ? rolesUnexpectedErrorMessage : unexpectedErrorMessage)
        )
      }
    } finally {
      setLoading(false)
    }
  }, [externalOptions, endpoint, onChange])

  useEffect(() => {
    if (externalOptions == null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void loadOptions()
    }
  }, [externalOptions, loadOptions])

  // Cierre al hacer click fuera del dropdown o al presionar Escape
  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
        setSearchTerm('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  // Conserva íntegras todas las opciones obtenidas del endpoint o externas
  const rawOptions = externalOptions ?? internalOptions
  const isRolesEndpoint = endpoint === '/roles' || endpoint?.includes('roles')
  const defaultHuespedId = 'role-huesped'
  const options =
    rawOptions.length > 0
      ? rawOptions
      : isRolesEndpoint
        ? [{ value: defaultHuespedId, label: 'Huesped', id: defaultHuespedId, rawName: 'guest' }]
        : []

  // Resolver el valor seleccionado tolerando coincidencias por id, alias o por defecto
  const resolvedValue = (() => {
    if (!value) {
      if (isRolesEndpoint) {
        const huespedOpt = options.find(
          (o) =>
            o.label.toLowerCase() === 'huesped' ||
            (o as DropdownOption).rawName?.toLowerCase() === 'guest' ||
            (o as DropdownOption).rawName?.toLowerCase() === 'huesped'
        )
        return huespedOpt ? huespedOpt.value : options[0]?.value || defaultHuespedId
      }
      return ''
    }
    const exactMatch = options.find((o) => o.value === value || (o as DropdownOption).id === value)
    if (exactMatch) return exactMatch.value

    if (value.toLowerCase() === 'huesped' || value.toLowerCase() === 'guest') {
      const matchHuesped = options.find(
        (o) =>
          o.label.toLowerCase() === 'huesped' ||
          (o as DropdownOption).rawName?.toLowerCase() === 'guest' ||
          (o as DropdownOption).rawName?.toLowerCase() === 'huesped'
      )
      if (matchHuesped) return matchHuesped.value
    }

    return value
  })()

  // Opción seleccionada resuelta para selección simple
  const selectedOption = useMemo(() => {
    if (!resolvedValue) return null
    return (
      options.find(
        (o) =>
          o.value === resolvedValue ||
          (o as DropdownOption).id === resolvedValue
      ) || null
    )
  }, [options, resolvedValue])

  // Filtrado en tiempo real de opciones basado en searchTerm
  const filteredOptions = useMemo(() => {
    if (!isSearchEnabled || !searchTerm.trim()) {
      return options
    }
    const q = searchTerm.toLowerCase().trim()
    return options.filter((opt) => {
      const labelMatch = opt.label.toLowerCase().includes(q)
      const valueMatch = opt.value.toLowerCase().includes(q)
      const rawMatch = opt.rawName?.toLowerCase().includes(q)
      return labelMatch || valueMatch || rawMatch
    })
  }, [options, searchTerm, isSearchEnabled])

  // Paginación reactiva con InfiniteScroll para optimización de opciones extensas
  const [visibleCount, setVisibleCount] = useState<number>(pageSize)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // Reiniciar la paginación al cambiar el término de búsqueda, las opciones o el pageSize
  useEffect(() => {
    setVisibleCount(pageSize)
  }, [searchTerm, options, pageSize])

  const hasMore = visibleCount < filteredOptions.length || Boolean(externalHasMore)

  const visibleOptions = useMemo(() => {
    return filteredOptions.slice(0, visibleCount)
  }, [filteredOptions, visibleCount])

  const handleLoadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore) return
    setIsLoadingMore(true)
    try {
      if (onLoadMoreOptions) {
        await onLoadMoreOptions()
      }
      // Incrementar el lote de opciones visibles
      setVisibleCount((prev) => Math.min(prev + pageSize, filteredOptions.length))
    } finally {
      setIsLoadingMore(false)
    }
  }, [hasMore, isLoadingMore, onLoadMoreOptions, pageSize, filteredOptions.length])

  const fieldLabel = label ?? 'Recurso'

  // Manejo de error de carga en modo automático
  if (externalOptions == null && errorMessage !== null) {
    const isRoles = endpoint?.includes('roles')
    return (
      <div className={cn('space-y-1.5', className)}>
        <span className="block text-sm font-medium text-ink">{fieldLabel}</span>
        <div role="alert" className="rounded-xl border border-amber-500/35 bg-amber-500/10 p-3.5 space-y-1.5 text-xs">
          <div className="flex items-start gap-2">
            <span className="grid size-5 shrink-0 place-items-center rounded-full bg-amber-500/20 text-amber-500 font-bold text-xs mt-0.5">
              ℹ
            </span>
            <div className="space-y-1">
              <p className="font-bold text-amber-600 dark:text-amber-300">
                {isRoles ? '¡Pausa al sincronizar los roles!' : 'No pudimos traer los datos'}
              </p>
              <p className="text-xs leading-relaxed text-ink-muted">{errorMessage}</p>
              <Button
                variant="secondary"
                onClick={() => {
                  setLoading(true)
                  void loadOptions()
                }}
                disabled={loading || isComponentDisabled}
                className="mt-2 px-3 py-1 text-xs font-semibold cursor-pointer"
              >
                {loading ? 'Consultando roles…' : 'Volver a intentar'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Métodos para modo múltiple
  const toggleMultiOption = (optValue: string) => {
    if (isComponentDisabled) return
    const isSelected = selectedValues.includes(optValue)
    const nextValues = isSelected
      ? selectedValues.filter((v) => v !== optValue)
      : [...selectedValues, optValue]
    onMultiChange?.(nextValues)
  }

  const removeMultiValue = (optValue: string, event: React.MouseEvent) => {
    event.stopPropagation()
    if (isComponentDisabled) return
    onMultiChange?.(selectedValues.filter((v) => v !== optValue))
  }

  // Texto a mostrar en el trigger en modo simple
  const singleSelectDisplayText = (() => {
    if (loading) return 'Cargando opciones…'
    if (selectedOption) return selectedOption.label
    if (resolvedValue) {
      const matchByLabel = options.find(
        (o) => o.label.toLowerCase() === resolvedValue.toLowerCase()
      )
      if (matchByLabel) return matchByLabel.label
      return resolvedValue
    }
    return (
      placeholder ??
      (customEmptyLabel && options.length === 0
        ? customEmptyLabel
        : `Elegir ${fieldLabel.toLowerCase()}…`)
    )
  })()

  const hasSingleValue = Boolean(selectedOption || resolvedValue)

  return (
    <div ref={dropdownRef} className={cn('relative space-y-1.5', className)}>
      <label id={`${fieldId}-label`} htmlFor={fieldId} className="block text-sm font-medium text-ink">
        {fieldLabel}
        {required && (
          <span aria-hidden="true" className="ml-0.5 text-danger">
            *
          </span>
        )}
      </label>

      {/* Trigger / Botón que despliega el dropdown */}
      <button
        type="button"
        id={fieldId}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby={`${fieldId}-label`}
        disabled={isComponentDisabled || loading}
        onClick={() => {
          if (isComponentDisabled || loading) return
          setIsOpen((prev) => {
            if (prev) {
              setSearchTerm('')
            } else {
              setVisibleCount(pageSize)
            }
            return !prev
          })
        }}
        className={cn(
          'flex min-h-[42px] w-full items-center justify-between gap-2 rounded-xl border bg-panel px-3.5 py-2 text-left text-sm text-ink shadow-xs outline-none transition cursor-pointer',
          error
            ? 'border-danger/60 ring-2 ring-danger/20'
            : isOpen
              ? 'border-primary ring-2 ring-primary/20'
              : 'border-line hover:border-ink-soft',
          isComponentDisabled && 'cursor-not-allowed opacity-50',
        )}
      >
        {multiple ? (
          // Modo Múltiple: Chips de valores seleccionados
          <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
            {selectedValues.length === 0 ? (
              <span className="text-ink-soft text-xs sm:text-sm">
                {loading ? 'Cargando opciones…' : (placeholder ?? 'Elige una o varias opciones…')}
              </span>
            ) : (
              selectedValues.map((val) => {
                const matched = options.find((o) => o.value === val)
                const textLabel = matched ? matched.label : val
                return (
                  <span
                    key={val}
                    className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary border border-primary/20"
                  >
                    <span className="max-w-[200px] truncate">{textLabel}</span>
                    {!isComponentDisabled && (
                      <button
                        type="button"
                        onClick={(e) => removeMultiValue(val, e)}
                        className="rounded hover:bg-primary/20 p-0.5 transition-colors cursor-pointer text-primary/80 hover:text-primary"
                        aria-label={`Remover ${textLabel}`}
                      >
                        <FontAwesomeIcon icon={faXmark} className="size-2.5" />
                      </button>
                    )}
                  </span>
                )
              })
            )}
          </div>
        ) : (
          // Modo Simple: Texto de la opción seleccionada
          <span
            className={cn(
              'truncate text-xs sm:text-sm flex-1',
              hasSingleValue ? 'text-ink font-medium' : 'text-ink-soft',
            )}
          >
            {singleSelectDisplayText}
          </span>
        )}

        <span className="shrink-0 text-ink-muted pl-2">
          <FontAwesomeIcon
            icon={faChevronDown}
            className={cn('size-3.5 transition-transform duration-200', isOpen && 'rotate-180')}
            aria-hidden="true"
          />
        </span>
      </button>

      {/* Popover flotante con el buscador en tiempo real y las opciones */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-1 flex max-h-72 w-full flex-col overflow-hidden rounded-xl border border-line bg-panel shadow-xl"
            role="listbox"
            aria-multiselectable={multiple ? 'true' : undefined}
          >
            {/* Input type search integrado por defecto para consultar opciones en tiempo real */}
            {isSearchEnabled && (
              <div className="border-b border-line bg-panel-soft/60 p-2">
                <div className="relative flex items-center">
                  <FontAwesomeIcon
                    icon={faMagnifyingGlass}
                    className="pointer-events-none absolute left-3 size-3 text-ink-muted"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={searchPlaceholder ?? 'Buscar en las opciones…'}
                    className="w-full rounded-lg border border-line bg-panel py-1.5 pl-8 pr-7 text-xs text-ink placeholder:text-ink-soft outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20 [&::-webkit-search-cancel-button]:hidden"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setIsOpen(false)
                        setSearchTerm('')
                      }
                    }}
                    autoFocus
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSearchTerm('')
                      }}
                      className="absolute right-2 flex size-4 items-center justify-center rounded text-ink-muted hover:text-ink transition-colors cursor-pointer"
                      title="Limpiar búsqueda"
                      aria-label="Limpiar búsqueda"
                    >
                      <FontAwesomeIcon icon={faXmark} className="size-2.5" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Contenedor scrollable optimizado con InfiniteScroll para listas de opciones extensas */}
            <div
              className="max-h-56 overflow-y-auto p-1.5 space-y-0.5"
              onScroll={(e) => {
                const el = e.currentTarget
                if (hasMore && !isLoadingMore && el.scrollHeight - el.scrollTop - el.clientHeight < 60) {
                  void handleLoadMore()
                }
              }}
            >
              {filteredOptions.length === 0 ? (
                <motion.div
                  variants={dropdownStaggerItem}
                  className="p-4 text-center text-xs text-ink-soft"
                >
                  {loading
                    ? 'Cargando opciones…'
                    : searchTerm.trim()
                      ? `No se encontraron resultados para "${searchTerm}".`
                      : (customEmptyLabel ?? 'No hay opciones disponibles.')}
                </motion.div>
              ) : (
                <InfiniteScroll
                  onLoadMore={handleLoadMore}
                  hasMore={hasMore}
                  isLoading={isLoadingMore}
                  rootMargin="0px 0px 80px 0px"
                  loader={
                    <div className="flex items-center justify-center py-2 text-xs text-ink-muted">
                      <span className="inline-block size-3 animate-spin rounded-full border-2 border-primary/20 border-t-primary mr-1.5" />
                      <span className="text-[11px]">Cargando más opciones…</span>
                    </div>
                  }
                  endMessage={
                    filteredOptions.length > pageSize ? (
                      <div className="py-2 text-center text-[10px] text-ink-muted">
                        Has visualizado todas las opciones ({filteredOptions.length})
                      </div>
                    ) : undefined
                  }
                >
                  <motion.div
                    key={searchTerm || 'options-list'}
                    variants={dropdownStaggerContainer}
                    initial="hidden"
                    animate="visible"
                    className="space-y-0.5"
                  >
                    {visibleOptions.map((opt) => {
                      if (multiple) {
                        // Modo Selección Múltiple
                        const isSelected = selectedValues.includes(opt.value)
                        return (
                          <motion.button
                            key={opt.value}
                            variants={dropdownStaggerItem}
                            whileHover={{ x: 2 }}
                            whileTap={{ scale: 0.99 }}
                            type="button"
                            role="option"
                            aria-selected={isSelected}
                            onClick={() => toggleMultiOption(opt.value)}
                            className={cn(
                              'flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs transition-colors text-left cursor-pointer group',
                              isSelected
                                ? 'bg-primary/10 font-semibold text-primary'
                                : 'text-ink hover:bg-black/5 dark:hover:bg-white/5',
                            )}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                              <div
                                className={cn(
                                  'flex size-4 shrink-0 items-center justify-center rounded border transition-colors',
                                  isSelected
                                    ? 'border-primary bg-primary text-white'
                                    : 'border-line group-hover:border-ink-soft bg-panel',
                                )}
                              >
                                {isSelected && (
                                  <FontAwesomeIcon
                                    icon={faCheck}
                                    className="size-2.5 text-white"
                                    aria-hidden="true"
                                  />
                                )}
                              </div>
                              <span className="truncate">{opt.label}</span>
                            </div>

                            {isSelected && (
                              <span className="shrink-0 text-[10px] font-medium text-primary">
                                Seleccionado
                              </span>
                            )}
                          </motion.button>
                        )
                      }

                      // Modo Selección Simple
                      const isSelected = Boolean(
                        opt.value === resolvedValue ||
                        (opt as DropdownOption).id === resolvedValue ||
                        (selectedOption && selectedOption.value === opt.value)
                      )

                      return (
                        <motion.button
                          key={opt.value}
                          variants={dropdownStaggerItem}
                          whileHover={{ x: 2 }}
                          whileTap={{ scale: 0.99 }}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => {
                            onChange?.(opt.value)
                            onSelectOption?.(opt)
                            setIsOpen(false)
                            setSearchTerm('')
                          }}
                          className={cn(
                            'flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs transition-colors text-left cursor-pointer group',
                            isSelected
                              ? 'bg-primary/10 font-semibold text-primary'
                              : 'text-ink hover:bg-black/5 dark:hover:bg-white/5',
                          )}
                        >
                          <span className="truncate flex-1 pr-2">{opt.label}</span>
                          {isSelected && (
                            <FontAwesomeIcon
                              icon={faCheck}
                              className="size-3 text-primary shrink-0"
                              aria-hidden="true"
                            />
                          )}
                        </motion.button>
                      )
                    })}
                  </motion.div>
                </InfiniteScroll>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <p role="alert" className="mt-1 text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
