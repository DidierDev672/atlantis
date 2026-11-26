import type { ReactNode } from 'react';

export interface DropdownOption {
  value: string;
  label: string;
  id?: string;
  rawName?: string;
  customContent?: ReactNode;
  renderContent?: () => ReactNode;
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

export const DEFAULT_HUESPED_ROLE_ID = 'role-huesped';

export function isRolesEndpointPath(endpoint?: string): boolean {
  return endpoint === '/roles' || Boolean(endpoint?.includes('roles'));
}

export function isHuespedOption(opt: DropdownOption): boolean {
  const normalizedLabel = opt.label
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const normalizedRaw = opt.rawName?.trim().toLowerCase();
  return (
    normalizedLabel === 'huesped' ||
    normalizedRaw === 'guest' ||
    normalizedRaw === 'huesped'
  );
}

export function getFallbackOptionsForEndpoint(
  endpoint?: string
): DropdownOption[] {
  if (!isRolesEndpointPath(endpoint)) return [];
  return [
    {
      value: DEFAULT_HUESPED_ROLE_ID,
      label: 'Huesped',
      id: DEFAULT_HUESPED_ROLE_ID,
      rawName: 'guest',
    },
  ];
}

export function resolveDropdownSelectedValue(
  value: string,
  options: ReadonlyArray<DropdownOption>,
  isRolesEndpoint: boolean
): string {
  if (!value) {
    if (!isRolesEndpoint) return '';
    const huespedOpt = options.find(isHuespedOption);
    return huespedOpt ? huespedOpt.value : options[0]?.value || DEFAULT_HUESPED_ROLE_ID;
  }

  const exactMatch = options.find((o) => o.value === value || o.id === value);
  if (exactMatch) return exactMatch.value;

  const lower = value.toLowerCase();
  if (lower === 'huesped' || lower === 'guest') {
    const matchHuesped = options.find(isHuespedOption);
    if (matchHuesped) return matchHuesped.value;
  }

  return value;
}

export function filterDropdownOptions(
  options: ReadonlyArray<DropdownOption>,
  searchTerm: string,
  searchable: boolean
): ReadonlyArray<DropdownOption> {
  if (!searchable || !searchTerm.trim()) return options;
  const q = searchTerm.toLowerCase().trim();
  return options.filter((opt) => {
    return (
      opt.label.toLowerCase().includes(q) ||
      opt.value.toLowerCase().includes(q) ||
      Boolean(opt.rawName?.toLowerCase().includes(q))
    );
  });
}
