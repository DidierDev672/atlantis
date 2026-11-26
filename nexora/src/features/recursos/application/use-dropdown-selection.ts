import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  filterDropdownOptions,
  resolveDropdownSelectedValue,
  type DropdownOption,
} from '../domain/dropdown';

export interface UseDropdownSelectionParams {
  options: ReadonlyArray<DropdownOption>;
  value: string;
  selectedValues: ReadonlyArray<string>;
  multiple: boolean;
  isRolesEndpoint: boolean;
  isSearchEnabled: boolean;
  isComponentDisabled: boolean;
  isOptionsLoading: boolean;
  searchTerm: string;
  pageSize: number;
  externalHasMore?: boolean;
  placeholder?: string;
  customEmptyLabel?: string;
  fieldLabel: string;
  onChange?: (value: string) => void;
  onSelectOption?: (option: DropdownOption) => void;
  onMultiChange?: (values: string[]) => void;
  onLoadMoreOptions?: () => Promise<void> | void;
  onClose: () => void;
}

/**
 * Hook de aplicación para filtrado, resolución de selección y paginación
 * sin `setState` durante el render ni esperas artificiales.
 */
export function useDropdownSelection({
  options,
  value,
  selectedValues,
  multiple,
  isRolesEndpoint,
  isSearchEnabled,
  isComponentDisabled,
  isOptionsLoading,
  searchTerm,
  pageSize,
  externalHasMore,
  placeholder,
  customEmptyLabel,
  fieldLabel,
  onChange,
  onSelectOption,
  onMultiChange,
  onLoadMoreOptions,
  onClose,
}: UseDropdownSelectionParams) {
  const isMountedRef = useRef(true);
  const isLoadingMoreRef = useRef(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [pagination, setPagination] = useState<{
    resetKey: string;
    extra: number;
  }>({ resetKey: '', extra: 0 });

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const resolvedValue = useMemo(
    () => resolveDropdownSelectedValue(value, options, isRolesEndpoint),
    [value, options, isRolesEndpoint]
  );

  const selectedOption = useMemo(() => {
    if (!resolvedValue) return null;
    return (
      options.find((o) => o.value === resolvedValue || o.id === resolvedValue) ??
      null
    );
  }, [options, resolvedValue]);

  const filteredOptions = useMemo(
    () => filterDropdownOptions(options, searchTerm, isSearchEnabled),
    [options, searchTerm, isSearchEnabled]
  );

  const resetKey = `${searchTerm}::${pageSize}::${options.length}`;
  const visibleCount =
    pagination.resetKey === resetKey ? pageSize + pagination.extra : pageSize;

  const visibleOptions = useMemo(
    () => filteredOptions.slice(0, visibleCount),
    [filteredOptions, visibleCount]
  );

  const hasMore =
    visibleCount < filteredOptions.length || Boolean(externalHasMore);

  const resetPagination = useCallback(() => {
    setPagination({ resetKey, extra: 0 });
  }, [resetKey]);

  const handleLoadMore = useCallback(async () => {
    if (!hasMore || isLoadingMoreRef.current) return;
    isLoadingMoreRef.current = true;
    setIsLoadingMore(true);
    try {
      if (onLoadMoreOptions) {
        await onLoadMoreOptions();
      }
      if (!isMountedRef.current) return;
      setPagination((prev) => ({
        resetKey,
        extra: (prev.resetKey === resetKey ? prev.extra : 0) + pageSize,
      }));
    } catch (err) {
      console.error('Error al cargar más opciones en RecursosDropdown:', err);
    } finally {
      isLoadingMoreRef.current = false;
      if (isMountedRef.current) {
        setIsLoadingMore(false);
      }
    }
  }, [hasMore, onLoadMoreOptions, pageSize, resetKey]);

  const handleSelectOptionItem = useCallback(
    (opt: DropdownOption) => {
      try {
        if (isComponentDisabled) return;
        if (multiple) {
          const exists = selectedValues.includes(opt.value);
          const next = exists
            ? selectedValues.filter((v) => v !== opt.value)
            : [...selectedValues, opt.value];
          onMultiChange?.(next);
          return;
        }
        onChange?.(opt.value);
        onSelectOption?.(opt);
        onClose();
      } catch (err) {
        console.error('Error al seleccionar opción:', err);
      }
    },
    [
      isComponentDisabled,
      multiple,
      selectedValues,
      onMultiChange,
      onChange,
      onSelectOption,
      onClose,
    ]
  );

  const handleRemoveMultiValue = useCallback(
    (optValue: string, event: React.MouseEvent) => {
      event.stopPropagation();
      if (isComponentDisabled) return;
      onMultiChange?.(selectedValues.filter((v) => v !== optValue));
    },
    [isComponentDisabled, onMultiChange, selectedValues]
  );

  const singleSelectDisplayText = useMemo(() => {
    if (isOptionsLoading) return 'Cargando opciones…';
    if (selectedOption) return selectedOption.label;
    if (resolvedValue) {
      const matchByLabel = options.find(
        (o) => o.label.toLowerCase() === resolvedValue.toLowerCase()
      );
      return matchByLabel ? matchByLabel.label : resolvedValue;
    }
    return (
      placeholder ??
      (customEmptyLabel && options.length === 0
        ? customEmptyLabel
        : `Elegir ${fieldLabel.toLowerCase()}…`)
    );
  }, [
    isOptionsLoading,
    selectedOption,
    resolvedValue,
    options,
    placeholder,
    customEmptyLabel,
    fieldLabel,
  ]);

  return {
    resolvedValue,
    selectedOption,
    filteredOptions,
    visibleOptions,
    hasMore,
    isLoadingMore,
    singleSelectDisplayText,
    resetPagination,
    handleLoadMore,
    handleSelectOptionItem,
    handleRemoveMultiValue,
  };
}
