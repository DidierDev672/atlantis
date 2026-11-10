import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useId,
} from 'react';
import axios from 'axios';
import { AnimatePresence, motion, type Variants } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronDown,
  faCheck,
  faXmark,
  faMagnifyingGlass,
} from '@fortawesome/free-solid-svg-icons';
import { Button } from '../atoms/button';
import { ApiModuleRepository } from '../../infrastructure/api-module-repository';
import { cn } from '../lib/cn';
import { api } from '../../../../lib/api';
import { validateStatusCode } from '../../../../shared/lib/status-code-validator';
import { executeBalancedRequest } from '../../../reservas/infrastructure/api-load-balancer';
import { InfiniteScroll } from '../../../../shared/ui/InfiniteScroll';
import { Loading } from '../../../../shared/loading';

const apiModuleRepository = new ApiModuleRepository();

const resourceErrorMessage =
  'Tranqui, no es algo que hayas hecho vos: se nos cruzó algo del otro lado y la lista no llegó a destino. Ya lo estamos resolviendo. Probá de nuevo en un instante y vas a poder elegir tu recurso.';

const unexpectedErrorMessage =
  'Se nos complicó traer tus recursos. No es tu culpa: estamos revisándolo. Probá otra vez en un momento y seguimos.';

const rolesErrorMessage400 =
  '¡Tranqui, que no cunda el pánico! ✨ Se nos presentó una pequeña situación técnica con el servidor al consultar los roles (código 400), pero toda tu información sigue completamente a salvo. Dale una segunda oportunidad con "Volver a intentar" y los traemos de inmediato.';

const rolesUnexpectedErrorMessage =
  '¡Respira con calma! 🌿 Tuvimos un breve contratiempo de red al intentar traer los roles. Tus datos siguen intactos aquí. Presiona "Volver a intentar" en un momento.';

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
};

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
};

export interface DropdownOption {
  value: string;
  label: string;
  id?: string;
  rawName?: string;
  customContent?: React.ReactNode;
}

export interface RecursosDropdownProps {
  /** Valor seleccionado en modo selección simple */
  value?: string;
  /** Callback para cambio en modo simple */
  onChange?: (value: string) => void;
  /** Callback para notificar la opción completa seleccionada (con id y rawName) */
  onSelectOption?: (option: DropdownOption) => void;
  /** Mensaje de error a desplegar */
  error?: string;
  /** Etiqueta superior del campo */
  label?: string;
  /** Texto placeholder */
  placeholder?: string;
  /** Opciones predefinidas. Si no se pasan, carga recursos vía apiModuleRepository o endpoint */
  options?: ReadonlyArray<DropdownOption>;
  /** Endpoint personalizado para consultar opciones vía axios GET (ej: '/roles') */
  endpoint?: string;
  /** Activa la selección múltiple con chips y popover interactivo */
  multiple?: boolean;
  /** Valores seleccionados en modo múltiple */
  selectedValues?: string[];
  /** Callback para actualización en modo múltiple */
  onMultiChange?: (values: string[]) => void;
  /** Habilita la barra de búsqueda en tiempo real dentro del popover (por defecto true) */
  searchable?: boolean;
  /** Placeholder para el campo de búsqueda */
  searchPlaceholder?: string;
  /** Deshabilita la interacción */
  disabled?: boolean;
  /** Deshabilita la interacción (alias: isDisabled) */
  isDisabled?: boolean;
  /** Marca el campo como obligatorio */
  required?: boolean;
  /** Clases CSS adicionales */
  className?: string;
  /**
   * Dirección de despliegue del menú emergente ('auto' | 'down' | 'up').
   * Por defecto 'auto': detecta el espacio disponible y hace auto-flip hacia arriba si no cabe abajo.
   */
  direction?: 'auto' | 'down' | 'up';
  /** Mensaje de aviso cuando no hay opciones disponibles */
  emptyLabel?: string;
  /** Identificador opcional para el elemento de formulario */
  id?: string;
  /** Tamaño del lote para el scroll infinito y renderizado progresivo (por defecto 6) */
  pageSize?: number;
  /** Callback opcional para cargar más opciones desde un servidor */
  onLoadMoreOptions?: () => Promise<void> | void;
  /** Indica si hay más opciones en el servidor */
  hasMoreOptions?: boolean;
  /** Indica si las opciones están cargando externamente */
  isLoading?: boolean;
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
  direction = 'auto',
  emptyLabel: customEmptyLabel,
  id,
  pageSize = 6,
  onLoadMoreOptions,
  hasMoreOptions: externalHasMore,
  isLoading: externalIsLoading,
}: RecursosDropdownProps) {
  const isComponentDisabled = isDisabled ?? disabled;
  const autoId = useId();
  const fieldId = id ?? autoId;
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement | HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [computedPlacement, setComputedPlacement] = useState<'down' | 'up'>(
    'down'
  );
  const [computedMaxHeight, setComputedMaxHeight] = useState<
    number | undefined
  >(undefined);
  const onSelectOptionRef = useRef(onSelectOption);
  useEffect(() => {
    onSelectOptionRef.current = onSelectOption;
  }, [onSelectOption]);

  const [internalOptions, setInternalOptions] = useState<
    ReadonlyArray<DropdownOption>
  >([]);
  const [internalLoading, setInternalLoading] = useState(
    externalOptions == null
  );
  const isOptionsLoading = externalIsLoading ?? internalLoading;
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpeningProgressive, setIsOpeningProgressive] = useState(false);

  // Darle chance al Loading para que sea visible al desplegar el dropdown solo en carga asíncrona interna
  useEffect(() => {
    if (!isOpen || externalOptions != null) return;
    const timer = setTimeout(() => {
      setIsOpeningProgressive(false);
    }, 550);
    return () => clearTimeout(timer);
  }, [isOpen, externalOptions]);

  // Habilitado por defecto para búsqueda en tiempo real
  const isSearchEnabled = searchable ?? true;

  // Carga automática de opciones solo si NO se proveyeron opciones externas
  const loadOptions = useCallback(async () => {
    if (externalOptions != null) return;
    setErrorMessage(null);
    setInternalLoading(true);

    try {
      // 1. Endpoint específico de roles: /roles vía GET con axios, validateStatusCode y executeBalancedRequest
      if (endpoint === '/roles' || endpoint?.includes('roles')) {
        const response = await executeBalancedRequest(
          () =>
            api.get<{ id: string; name: string; description?: string }[]>(
              endpoint,
              {
                validateStatus: () => true,
              }
            ),
          { maxRetries: 2 }
        );

        const validation = validateStatusCode(response.status);

        if (validation.isValid) {
          const rawData = response.data;
          const dataList: { id: string; name: string; description?: string }[] =
            Array.isArray(rawData)
              ? rawData
              : rawData &&
                  typeof rawData === 'object' &&
                  Array.isArray((rawData as { data?: unknown[] }).data)
                ? (
                    rawData as {
                      data: {
                        id: string;
                        name: string;
                        description?: string;
                      }[];
                    }
                  ).data
                : [];

          // Para las opciones en el dropdown utilizar el item id como value y name como label
          const roleOptions = dataList.map((role) => {
            const isGuestOrHuesped =
              role.name.trim().toLowerCase() === 'guest' ||
              role.name.trim().toLowerCase() === 'huesped' ||
              role.name.trim().toLowerCase() === 'huésped';
            return {
              value: role.id,
              label: isGuestOrHuesped ? 'Huesped' : role.name,
              id: role.id,
              rawName: role.name,
            };
          });
          setInternalOptions(roleOptions);

          // De acuerdo a las opciones del endpoint por defecto es huesped
          const huespedRole =
            roleOptions.find(
              (r) =>
                r.label
                  .trim()
                  .toLowerCase()
                  .normalize('NFD')
                  .replace(/[\u0300-\u036f]/g, '') === 'huesped' ||
                r.rawName?.trim().toLowerCase() === 'guest' ||
                r.rawName?.trim().toLowerCase() === 'huesped'
            ) || roleOptions[0];

          if (huespedRole) {
            onSelectOptionRef.current?.(huespedRole);
            onChange?.(huespedRole.id || huespedRole.value);
          }
        } else if (response.status === 400) {
          // Status 400: Mensaje empático y constructivo mediante status-code-validator
          setErrorMessage(validation.message || rolesErrorMessage400);
        } else {
          setErrorMessage(validation.message || rolesUnexpectedErrorMessage);
        }
        return;
      }

      // 2. Otro endpoint genérico
      if (endpoint) {
        const response = await executeBalancedRequest(
          () =>
            api.get<unknown[]>(endpoint, {
              validateStatus: () => true,
            }),
          { maxRetries: 2 }
        );
        const validation = validateStatusCode(response.status);
        if (validation.isValid && Array.isArray(response.data)) {
          setInternalOptions(
            (
              response.data as Array<{
                id?: string;
                value?: string;
                name?: string;
                label?: string;
              }>
            ).map((item) => ({
              value: item.id ?? item.value ?? String(item),
              label: item.name ?? item.label ?? String(item),
            }))
          );
        } else if (response.status === 400) {
          setErrorMessage(validation.message || rolesErrorMessage400);
        } else {
          setErrorMessage(validation.message || unexpectedErrorMessage);
        }
        return;
      }

      // 3. Comportamiento por defecto: listResources vía apiModuleRepository
      const resources = await apiModuleRepository.listResources();
      setInternalOptions(
        resources.map((resource) => ({
          value: resource.id,
          label: resource.name,
        }))
      );
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status ?? 0;
        const validation = validateStatusCode(status);
        setErrorMessage(
          validation.message ||
            (endpoint?.includes('roles')
              ? rolesErrorMessage400
              : resourceErrorMessage)
        );
      } else {
        const validation = validateStatusCode(0);
        setErrorMessage(
          validation.message ||
            (endpoint?.includes('roles')
              ? rolesUnexpectedErrorMessage
              : unexpectedErrorMessage)
        );
      }
    } finally {
      setInternalLoading(false);
    }
  }, [externalOptions, endpoint, onChange]);

  useEffect(() => {
    if (externalOptions == null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void loadOptions();
    }
  }, [externalOptions, loadOptions]);

  // Cierre al hacer click fuera del dropdown o al presionar Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      // Si el elemento fue desmontado durante el evento (animación o re-render), no tratarlo como click fuera
      if (!document.contains(target)) return;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Conserva íntegras todas las opciones obtenidas del endpoint o externas
  const rawOptions = externalOptions ?? internalOptions;
  const isRolesEndpoint = endpoint === '/roles' || endpoint?.includes('roles');
  const defaultHuespedId = 'role-huesped';
  const options = useMemo(() => {
    if (rawOptions.length > 0) return rawOptions;
    if (isRolesEndpoint) {
      return [
        {
          value: defaultHuespedId,
          label: 'Huesped',
          id: defaultHuespedId,
          rawName: 'guest',
        },
      ];
    }
    return [];
  }, [rawOptions, isRolesEndpoint]);

  // Resolver el valor seleccionado tolerando coincidencias por id, alias o por defecto
  const resolvedValue = (() => {
    if (!value) {
      if (isRolesEndpoint) {
        const huespedOpt = options.find(
          (o) =>
            o.label.toLowerCase() === 'huesped' ||
            (o as DropdownOption).rawName?.toLowerCase() === 'guest' ||
            (o as DropdownOption).rawName?.toLowerCase() === 'huesped'
        );
        return huespedOpt
          ? huespedOpt.value
          : options[0]?.value || defaultHuespedId;
      }
      return '';
    }
    const exactMatch = options.find(
      (o) => o.value === value || (o as DropdownOption).id === value
    );
    if (exactMatch) return exactMatch.value;

    if (value.toLowerCase() === 'huesped' || value.toLowerCase() === 'guest') {
      const matchHuesped = options.find(
        (o) =>
          o.label.toLowerCase() === 'huesped' ||
          (o as DropdownOption).rawName?.toLowerCase() === 'guest' ||
          (o as DropdownOption).rawName?.toLowerCase() === 'huesped'
      );
      if (matchHuesped) return matchHuesped.value;
    }

    return value;
  })();

  // Opción seleccionada resuelta para selección simple
  const selectedOption = useMemo(() => {
    if (!resolvedValue) return null;
    return (
      options.find(
        (o) =>
          o.value === resolvedValue ||
          (o as DropdownOption).id === resolvedValue
      ) || null
    );
  }, [options, resolvedValue]);

  // Filtrado en tiempo real de opciones basado en searchTerm
  const filteredOptions = useMemo(() => {
    if (!isSearchEnabled || !searchTerm.trim()) {
      return options;
    }
    const q = searchTerm.toLowerCase().trim();
    return options.filter((opt) => {
      const labelMatch = opt.label.toLowerCase().includes(q);
      const valueMatch = opt.value.toLowerCase().includes(q);
      const rawMatch = opt.rawName?.toLowerCase().includes(q);
      return labelMatch || valueMatch || rawMatch;
    });
  }, [options, searchTerm, isSearchEnabled]);

  // Paginación reactiva con InfiniteScroll para optimización de opciones extensas
  const [visibleCount, setVisibleCount] = useState<number>(pageSize);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [prevDeps, setPrevDeps] = useState({ searchTerm, options, pageSize });

  // Reiniciar la paginación durante render al cambiar el término de búsqueda, las opciones o el pageSize
  if (
    prevDeps.searchTerm !== searchTerm ||
    prevDeps.options !== options ||
    prevDeps.pageSize !== pageSize
  ) {
    setPrevDeps({ searchTerm, options, pageSize });
    setVisibleCount(pageSize);
  }

  const hasMore =
    visibleCount < filteredOptions.length || Boolean(externalHasMore);

  const visibleOptions = useMemo(() => {
    return filteredOptions.slice(0, visibleCount);
  }, [filteredOptions, visibleCount]);

  const handleLoadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const waitTimer = new Promise((resolve) => setTimeout(resolve, 650));
      if (onLoadMoreOptions) {
        await Promise.all([onLoadMoreOptions(), waitTimer]);
      } else {
        // Pausa adecuada (chance) para que la animación del Loading sea apreciable entre lotes
        await waitTimer;
      }
      // Incrementar el lote de opciones visibles
      setVisibleCount((prev) =>
        Math.min(prev + pageSize, filteredOptions.length)
      );
    } finally {
      setIsLoadingMore(false);
    }
  }, [
    hasMore,
    isLoadingMore,
    onLoadMoreOptions,
    pageSize,
    filteredOptions.length,
  ]);

  // Helper: detecta contenedores ancestros que realmente restringen el área visible (scrollable containers o dialogs)
  const getClippingAncestors = useCallback(
    (element: HTMLElement): HTMLElement[] => {
      const ancestors: HTMLElement[] = [];
      let current: HTMLElement | null = element.parentElement;

      while (
        current &&
        current !== document.body &&
        current !== document.documentElement
      ) {
        const style = window.getComputedStyle(current);
        const overflowY = style.overflowY;
        const isActualScrollContainer =
          (overflowY === 'auto' || overflowY === 'scroll') &&
          current.scrollHeight > current.clientHeight;
        const isDialog = current.getAttribute('role') === 'dialog';

        if (isActualScrollContainer || isDialog) {
          ancestors.push(current);
        }
        current = current.parentElement;
      }
      return ancestors;
    },
    []
  );

  // Auto-flip: calcula si el popover debe desplegarse hacia abajo o hacia arriba según el espacio disponible
  const updatePlacement = useCallback(() => {
    if (direction === 'up') {
      setComputedPlacement('up');
      return;
    }
    if (direction === 'down') {
      setComputedPlacement('down');
      return;
    }

    const triggerEl = triggerRef.current ?? dropdownRef.current;
    if (!triggerEl) return;

    const rect = triggerEl.getBoundingClientRect();
    const margin = 8;
    let spaceBelow = window.innerHeight - rect.bottom - margin;
    let spaceAbove = rect.top - margin;

    // Si está dentro de un contenedor scrollable o diálogo modal, ajustar por sus límites visibles reales
    const clippingAncestors = getClippingAncestors(triggerEl);
    for (const ancestor of clippingAncestors) {
      const ancestorRect = ancestor.getBoundingClientRect();
      const ancestorSpaceBelow = ancestorRect.bottom - rect.bottom - margin;
      const ancestorSpaceAbove = rect.top - ancestorRect.top - margin;

      spaceBelow = Math.min(spaceBelow, Math.max(0, ancestorSpaceBelow));
      spaceAbove = Math.min(spaceAbove, Math.max(0, ancestorSpaceAbove));
    }

    spaceBelow = Math.max(0, spaceBelow);
    spaceAbove = Math.max(0, spaceAbove);

    // Altura ideal requerida por el popover (sin verse sesgada por un clampedMaxHeight previo)
    const POPOVER_FULL_HEIGHT = 288;
    const count = filteredOptions.length || options.length || 5;
    const intrinsicHeight = Math.min(
      Math.max(count * 40 + (isSearchEnabled ? 50 : 0) + 24, 160),
      POPOVER_FULL_HEIGHT
    );

    const fitsBelow = spaceBelow >= intrinsicHeight + margin;
    const fitsAbove = spaceAbove >= intrinsicHeight + margin;

    // Lógica inteligente y precisa de auto-flip:
    // La dirección natural preferida es hacia abajo ('down').
    // Solo se invierte hacia arriba ('up') cuando realmente NO cabe abajo (fitsBelow es false)
    // y arriba sí cabe o hay mayor espacio disponible.
    const nextPlacement: 'down' | 'up' =
      !fitsBelow && (fitsAbove || spaceAbove > spaceBelow)
        ? 'up'
        : 'down';

    setComputedPlacement(nextPlacement);

    // Ajustar altura máxima para garantizar que jamás se desborde del viewport
    const availableSpace =
      nextPlacement === 'up' ? spaceAbove - margin : spaceBelow - margin;
    const clampedMaxHeight = Math.min(
      288,
      Math.max(120, Math.floor(availableSpace))
    );
    setComputedMaxHeight(clampedMaxHeight);
  }, [
    direction,
    filteredOptions.length,
    options.length,
    isSearchEnabled,
    getClippingAncestors,
  ]);

  useEffect(() => {
    if (!isOpen) return;
    const id = requestAnimationFrame(() => {
      updatePlacement();
    });
    return () => cancelAnimationFrame(id);
  }, [isOpen, updatePlacement]);

  useEffect(() => {
    if (!isOpen || direction !== 'auto') return;
    const handleReposition = () => updatePlacement();
    window.addEventListener('resize', handleReposition, { passive: true });
    window.addEventListener('scroll', handleReposition, {
      passive: true,
      capture: true,
    });
    return () => {
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [isOpen, direction, updatePlacement]);

  const fieldLabel = label ?? 'Recurso';

  // Manejo de error de carga en modo automático
  if (externalOptions == null && errorMessage !== null) {
    const isRoles = endpoint?.includes('roles');
    return (
      <div className={cn('space-y-1.5', className)}>
        <span className="text-ink block text-sm font-medium">{fieldLabel}</span>
        <div
          role="alert"
          className="space-y-1.5 rounded-xl border border-amber-500/35 bg-amber-500/10 p-3.5 text-xs"
        >
          <div className="flex items-start gap-2">
            <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-amber-500/20 text-xs font-bold text-amber-500">
              ℹ
            </span>
            <div className="space-y-1">
              <p className="font-bold text-amber-600 dark:text-amber-300">
                {isRoles
                  ? '¡Pausa al sincronizar los roles!'
                  : 'No pudimos traer los datos'}
              </p>
              <p className="text-ink-muted text-xs leading-relaxed">
                {errorMessage}
              </p>
              <Button
                variant="secondary"
                onClick={() => {
                  setInternalLoading(true);
                  void loadOptions();
                }}
                disabled={isOptionsLoading || isComponentDisabled}
                className="mt-2 cursor-pointer px-3 py-1 text-xs font-semibold"
              >
                {isOptionsLoading ? 'Consultando roles…' : 'Volver a intentar'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Métodos para modo múltiple
  const toggleMultiOption = (optValue: string) => {
    if (isComponentDisabled) return;
    const isSelected = selectedValues.includes(optValue);
    const nextValues = isSelected
      ? selectedValues.filter((v) => v !== optValue)
      : [...selectedValues, optValue];
    onMultiChange?.(nextValues);
  };

  const removeMultiValue = (optValue: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (isComponentDisabled) return;
    onMultiChange?.(selectedValues.filter((v) => v !== optValue));
  };

  // Texto a mostrar en el trigger en modo simple
  const singleSelectDisplayText = (() => {
    if (isOptionsLoading) return 'Cargando opciones…';
    if (selectedOption) return selectedOption.label;
    if (resolvedValue) {
      const matchByLabel = options.find(
        (o) => o.label.toLowerCase() === resolvedValue.toLowerCase()
      );
      if (matchByLabel) return matchByLabel.label;
      return resolvedValue;
    }
    return (
      placeholder ??
      (customEmptyLabel && options.length === 0
        ? customEmptyLabel
        : `Elegir ${fieldLabel.toLowerCase()}…`)
    );
  })();

  const hasSingleValue = Boolean(selectedOption || resolvedValue);

  return (
    <div ref={dropdownRef} className={cn('space-y-1.5', className)}>
      <label
        id={`${fieldId}-label`}
        htmlFor={fieldId}
        className="text-ink block text-sm font-medium"
      >
        {fieldLabel}
        {required && (
          <span aria-hidden="true" className="text-danger ml-0.5">
            *
          </span>
        )}
      </label>

      {/* Contenedor relativo que ancla el trigger y el popover con auto-flip */}
      <div className={cn('relative', isOpen && 'z-50')}>
        {/* Trigger que despliega el dropdown: div en modo múltiple para evitar botones anidados ilegales (<button> dentro de <button>) y button en modo simple */}
        {multiple ? (
          <div
            ref={triggerRef as React.RefObject<HTMLDivElement>}
            id={fieldId}
            role="combobox"
            tabIndex={isComponentDisabled || isOptionsLoading ? -1 : 0}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-labelledby={`${fieldId}-label`}
            aria-disabled={isComponentDisabled || isOptionsLoading}
            onClick={() => {
              if (isComponentDisabled || isOptionsLoading) return;
              if (!isOpen) {
                updatePlacement();
                if (externalOptions == null) {
                  setIsOpeningProgressive(true);
                }
                setVisibleCount(pageSize);
                setIsOpen(true);
              } else {
                setSearchTerm('');
                setIsOpen(false);
              }
            }}
            onKeyDown={(e) => {
              if (isComponentDisabled || isOptionsLoading) return;
              if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
                if (e.target === e.currentTarget) {
                  e.preventDefault();
                  if (!isOpen) {
                    updatePlacement();
                    if (externalOptions == null) {
                      setIsOpeningProgressive(true);
                    }
                    setVisibleCount(pageSize);
                    setIsOpen(true);
                  } else {
                    setSearchTerm('');
                    setIsOpen(false);
                  }
                }
              }
            }}
            className={cn(
              'bg-panel text-ink flex min-h-[42px] w-full cursor-pointer items-center justify-between gap-2 rounded-xl border px-3.5 py-2 text-left text-sm shadow-xs transition outline-none',
              error
                ? 'border-danger/60 ring-danger/20 ring-2'
                : isOpen
                  ? 'border-primary ring-primary/20 ring-2'
                  : 'border-line hover:border-ink-soft',
              isComponentDisabled && 'cursor-not-allowed opacity-50'
            )}
          >
            {/* Modo Múltiple: Chips de valores seleccionados */}
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
              {isOptionsLoading ? (
                <Loading
                  variant="inline"
                  size="sm"
                  label="Cargando opciones…"
                  delay={0}
                />
              ) : selectedValues.length === 0 ? (
                <span className="text-ink-soft text-xs sm:text-sm">
                  {placeholder ?? 'Elige una o varias opciones…'}
                </span>
              ) : (
                selectedValues.map((val) => {
                  const matched = options.find((o) => o.value === val);
                  const textLabel = matched ? matched.label : val;
                  return (
                    <span
                      key={val}
                      className="bg-primary/10 text-primary border-primary/20 inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium"
                    >
                      <span className="max-w-[200px] truncate">
                        {textLabel}
                      </span>
                      {!isComponentDisabled && (
                        <button
                          type="button"
                          onClick={(e) => removeMultiValue(val, e)}
                          className="hover:bg-primary/20 text-primary/80 hover:text-primary cursor-pointer rounded p-0.5 transition-colors"
                          aria-label={`Remover ${textLabel}`}
                        >
                          <FontAwesomeIcon
                            icon={faXmark}
                            className="size-2.5"
                          />
                        </button>
                      )}
                    </span>
                  );
                })
              )}
            </div>

            <span className="text-ink-muted shrink-0 pl-2">
              <FontAwesomeIcon
                icon={faChevronDown}
                className={cn(
                  'size-3.5 transition-transform duration-200',
                  isOpen && 'rotate-180'
                )}
                aria-hidden="true"
              />
            </span>
          </div>
        ) : (
          <button
            ref={triggerRef as React.RefObject<HTMLButtonElement>}
            type="button"
            id={fieldId}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-labelledby={`${fieldId}-label`}
            disabled={isComponentDisabled || isOptionsLoading}
            onClick={() => {
              if (isComponentDisabled || isOptionsLoading) return;
              if (!isOpen) {
                updatePlacement();
                if (externalOptions == null) {
                  setIsOpeningProgressive(true);
                }
                setVisibleCount(pageSize);
                setIsOpen(true);
              } else {
                setSearchTerm('');
                setIsOpen(false);
              }
            }}
            className={cn(
              'bg-panel text-ink flex min-h-[42px] w-full cursor-pointer items-center justify-between gap-2 rounded-xl border px-3.5 py-2 text-left text-sm shadow-xs transition outline-none',
              error
                ? 'border-danger/60 ring-danger/20 ring-2'
                : isOpen
                  ? 'border-primary ring-primary/20 ring-2'
                  : 'border-line hover:border-ink-soft',
              isComponentDisabled && 'cursor-not-allowed opacity-50'
            )}
          >
            {/* Modo Simple: Texto de la opción seleccionada o Loading */}
            {isOptionsLoading ? (
              <Loading
                variant="inline"
                size="sm"
                label="Cargando opciones…"
                delay={0}
              />
            ) : (
              <span
                className={cn(
                  'flex-1 truncate text-xs sm:text-sm',
                  hasSingleValue ? 'text-ink font-medium' : 'text-ink-soft'
                )}
              >
                {singleSelectDisplayText}
              </span>
            )}

            <span className="text-ink-muted shrink-0 pl-2">
              <FontAwesomeIcon
                icon={faChevronDown}
                className={cn(
                  'size-3.5 transition-transform duration-200',
                  isOpen && 'rotate-180'
                )}
                aria-hidden="true"
              />
            </span>
          </button>
        )}

        {/* Popover flotante con el buscador en tiempo real y las opciones */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={popoverRef}
              initial={
                computedPlacement === 'up'
                  ? { opacity: 0, y: 6, scale: 0.98 }
                  : { opacity: 0, y: -6, scale: 0.98 }
              }
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={
                computedPlacement === 'up'
                  ? { opacity: 0, y: 4, scale: 0.98 }
                  : { opacity: 0, y: -4, scale: 0.98 }
              }
              transition={{ duration: 0.15 }}
              style={
                computedMaxHeight
                  ? { maxHeight: `${computedMaxHeight}px` }
                  : undefined
              }
              className={cn(
                'border-line bg-panel absolute z-50 flex max-h-72 w-full flex-col overflow-hidden rounded-xl border shadow-xl',
                computedPlacement === 'up'
                  ? 'bottom-full mb-1.5'
                  : 'top-full mt-1.5'
              )}
              role="listbox"
              aria-multiselectable={multiple ? 'true' : undefined}
            >
              {/* Input type search integrado por defecto para consultar opciones en tiempo real */}
              {isSearchEnabled && (
                <div className="border-line bg-panel-soft/60 border-b p-2">
                  <div className="relative flex items-center">
                    <FontAwesomeIcon
                      icon={faMagnifyingGlass}
                      className="text-ink-muted pointer-events-none absolute left-3 size-3"
                      aria-hidden="true"
                    />
                    <input
                      type="search"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder={
                        searchPlaceholder ?? 'Buscar en las opciones…'
                      }
                      className="border-line bg-panel text-ink placeholder:text-ink-soft focus:border-primary focus:ring-primary/20 w-full rounded-lg border py-1.5 pr-7 pl-8 text-xs transition outline-none focus:ring-1 [&::-webkit-search-cancel-button]:hidden"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          setIsOpen(false);
                          setSearchTerm('');
                        }
                      }}
                      autoFocus
                    />
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSearchTerm('');
                        }}
                        className="text-ink-muted hover:text-ink absolute right-2 flex size-4 cursor-pointer items-center justify-center rounded transition-colors"
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
                className="max-h-56 min-h-0 flex-1 space-y-0.5 overflow-y-auto p-1.5"
                onScroll={(e) => {
                  const el = e.currentTarget;
                  if (
                    hasMore &&
                    !isLoadingMore &&
                    el.scrollHeight - el.scrollTop - el.clientHeight < 60
                  ) {
                    void handleLoadMore();
                  }
                }}
              >
                {isOptionsLoading || isOpeningProgressive ? (
                  <div className="flex items-center justify-center px-4 py-7">
                    <Loading
                      variant="block"
                      size="sm"
                      label="Cargando opciones…"
                      description="Preparando opciones disponibles"
                      delay={0}
                      minDuration={500}
                    />
                  </div>
                ) : filteredOptions.length === 0 ? (
                  <motion.div
                    variants={dropdownStaggerItem}
                    className="text-ink-soft p-4 text-center text-xs"
                  >
                    {searchTerm.trim()
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
                      <div className="flex items-center justify-center py-2.5">
                        <Loading
                          variant="inline"
                          size="sm"
                          label="Cargando más opciones…"
                          delay={0}
                          minDuration={150}
                        />
                      </div>
                    }
                    endMessage={
                      filteredOptions.length > pageSize ? (
                        <div className="text-ink-muted py-2 text-center text-[10px]">
                          Has visualizado todas las opciones (
                          {filteredOptions.length})
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
                          const isSelected = selectedValues.includes(opt.value);
                          return (
                            <motion.button
                              key={opt.value}
                              variants={dropdownStaggerItem}
                              whileHover={{ x: 2 }}
                              whileTap={{ scale: 0.99 }}
                              type="button"
                              role="option"
                              aria-selected={isSelected}
                              onMouseDown={(e) => {
                                e.stopPropagation();
                              }}
                              onClick={() => toggleMultiOption(opt.value)}
                              className={cn(
                                'group flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors',
                                isSelected
                                  ? 'bg-primary/10 text-primary font-semibold'
                                  : 'text-ink hover:bg-black/5 dark:hover:bg-white/5'
                              )}
                            >
                              <div className="flex min-w-0 items-center gap-2.5 pr-2">
                                <div
                                  className={cn(
                                    'flex size-4 shrink-0 items-center justify-center rounded border transition-colors',
                                    isSelected
                                      ? 'border-primary bg-primary text-white'
                                      : 'border-line group-hover:border-ink-soft bg-panel'
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
                                <span className="text-primary shrink-0 text-[10px] font-medium">
                                  Seleccionado
                                </span>
                              )}
                            </motion.button>
                          );
                        }

                        // Modo Selección Simple
                        const isSelected = Boolean(
                          opt.value === resolvedValue ||
                          (opt as DropdownOption).id === resolvedValue ||
                          (selectedOption && selectedOption.value === opt.value)
                        );

                        return (
                          <motion.button
                            key={opt.value}
                            variants={dropdownStaggerItem}
                            whileHover={{ x: 2 }}
                            whileTap={{ scale: 0.99 }}
                            type="button"
                            role="option"
                            aria-selected={isSelected}
                            onMouseDown={(e) => {
                              e.stopPropagation();
                            }}
                            onClick={() => {
                              onChange?.(opt.value);
                              onSelectOption?.(opt);
                              setIsOpen(false);
                              setSearchTerm('');
                            }}
                            className={cn(
                              'group flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors',
                              isSelected
                                ? 'bg-primary/10 text-primary font-semibold'
                                : 'text-ink hover:bg-black/5 dark:hover:bg-white/5'
                            )}
                          >
                            {opt.customContent ? (
                              <div className="min-w-0 flex-1 pr-2">
                                {opt.customContent}
                              </div>
                            ) : (
                              <span className="flex-1 truncate pr-2">
                                {opt.label}
                              </span>
                            )}
                            {isSelected && (
                              <FontAwesomeIcon
                                icon={faCheck}
                                className="text-primary size-3 shrink-0"
                                aria-hidden="true"
                              />
                            )}
                          </motion.button>
                        );
                      })}
                    </motion.div>
                  </InfiniteScroll>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <p role="alert" className="text-danger mt-1 text-xs font-medium">
          {error}
        </p>
      )}
    </div>
  );
}
