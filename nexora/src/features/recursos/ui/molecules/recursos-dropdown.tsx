import {
  Suspense,
  lazy,
  memo,
  useCallback,
  useId,
  useRef,
  useState,
  type ComponentType,
} from 'react';
import { AnimatePresence, MotionConfig } from 'motion/react';
import { useDeviceResourceProfile } from '../../../../shared/lib/use-device-resource-profile';
import { useDropdownOptions } from '../../application/use-dropdown-options';
import { useDropdownPlacement } from '../../application/use-dropdown-placement';
import { useDropdownSelection } from '../../application/use-dropdown-selection';
import {
  isRolesEndpointPath,
  type DropdownOption,
  type RecursosDropdownProps,
} from '../../domain/dropdown';
import { DropdownErrorCard } from '../atoms/dropdown-error-card';
import { cn } from '../lib/cn';
import type { RecursosDropdownPopoverProps } from './recursos-dropdown-popover';
import { RecursosDropdownTrigger } from './recursos-dropdown-trigger';

export type { DropdownOption, RecursosDropdownProps };

const LazyRecursosDropdownPopover = lazy<
  ComponentType<RecursosDropdownPopoverProps>
>(async () => {
  try {
    const mod = await import('./recursos-dropdown-popover');
    return { default: mod.RecursosDropdownPopover };
  } catch (err) {
    console.error('Error al cargar popover de RecursosDropdown:', err);
    const Fallback: ComponentType<RecursosDropdownPopoverProps> = () => null;
    return { default: Fallback };
  }
});

/**
 * Molécula reutilizable de selección simple y múltiple (Atomic Design + Onion)
 * con carga perezosa del popover, `useDeviceResourceProfile` y posicionamiento auto-flip.
 */
export const RecursosDropdown = memo(function RecursosDropdown({
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
  const { policy } = useDeviceResourceProfile();
  const isComponentDisabled = isDisabled ?? disabled;
  const autoId = useId();
  const fieldId = id ?? autoId;
  const fieldLabel = label ?? 'Recurso';
  const isSearchEnabled = searchable ?? true;
  const isRolesEndpoint = isRolesEndpointPath(endpoint);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement | HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setSearchTerm('');
  }, []);

  const {
    options,
    isOptionsLoading,
    errorMessage,
    errorValidation,
    rawError,
    retryLoadOptions,
  } = useDropdownOptions({
    externalOptions,
    endpoint,
    externalIsLoading,
    onChange,
    onSelectOption,
  });

  const {
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
  } = useDropdownSelection({
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
    onClose: handleClose,
  });

  const { placement, maxHeight, updatePlacement } = useDropdownPlacement({
    isOpen,
    direction,
    optionsCount: filteredOptions.length || options.length,
    isSearchEnabled,
    dropdownRef,
    triggerRef,
    onRequestClose: handleClose,
  });

  const handleToggle = useCallback(() => {
    try {
      if (isComponentDisabled || isOptionsLoading) return;
      if (!isOpen) {
        updatePlacement();
        resetPagination();
        setIsOpen(true);
      } else {
        handleClose();
      }
    } catch (err) {
      console.error('Error al alternar RecursosDropdown:', err);
    }
  }, [
    isComponentDisabled,
    isOptionsLoading,
    isOpen,
    updatePlacement,
    resetPagination,
    handleClose,
  ]);

  if (externalOptions == null && errorMessage !== null) {
    return (
      <DropdownErrorCard
        fieldLabel={fieldLabel}
        isRolesEndpoint={isRolesEndpoint}
        errorMessage={errorMessage}
        errorValidation={errorValidation}
        rawError={rawError}
        isLoading={isOptionsLoading}
        disabled={isComponentDisabled}
        className={className}
        onRetry={() => void retryLoadOptions()}
      />
    );
  }

  const popoverNode = isOpen ? (
    <Suspense
      fallback={
        <div className="border-line bg-panel text-ink-soft absolute top-full z-50 mt-1.5 w-full rounded-xl border p-3 text-center text-xs shadow-lg">
          Preparando opciones…
        </div>
      }
    >
      <LazyRecursosDropdownPopover
        placement={placement}
        maxHeight={maxHeight}
        multiple={multiple}
        enableAnimations={policy.enableAnimations}
        isSearchEnabled={isSearchEnabled}
        searchTerm={searchTerm}
        searchPlaceholder={searchPlaceholder}
        isOptionsLoading={isOptionsLoading}
        filteredCount={filteredOptions.length}
        visibleOptions={visibleOptions}
        pageSize={pageSize}
        hasMore={hasMore}
        isLoadingMore={isLoadingMore}
        customEmptyLabel={customEmptyLabel}
        selectedValues={selectedValues}
        resolvedValue={resolvedValue}
        selectedOption={selectedOption}
        onSearchChange={setSearchTerm}
        onClose={handleClose}
        onLoadMore={handleLoadMore}
        onSelectOptionItem={handleSelectOptionItem}
      />
    </Suspense>
  ) : null;

  return (
    <MotionConfig reducedMotion={policy.enableAnimations ? 'user' : 'always'}>
      <div ref={dropdownRef} className={cn('space-y-1.5', className)}>
        <label
          id={`${fieldId}-label`}
          htmlFor={fieldId}
          className="text-ink block text-sm font-medium"
        >
          {fieldLabel}
          {required ? (
            <span aria-hidden="true" className="text-danger ml-0.5">
              *
            </span>
          ) : null}
        </label>

        <div className={cn('relative', isOpen && 'z-50')}>
          <RecursosDropdownTrigger
            fieldId={fieldId}
            triggerRef={triggerRef}
            multiple={multiple}
            isOpen={isOpen}
            isDisabled={isComponentDisabled}
            isOptionsLoading={isOptionsLoading}
            hasError={Boolean(error)}
            options={options}
            selectedValues={selectedValues}
            displayText={singleSelectDisplayText}
            hasSingleValue={Boolean(selectedOption || resolvedValue)}
            placeholder={placeholder}
            onToggle={handleToggle}
            onRemoveMultiValue={handleRemoveMultiValue}
          />

          {policy.enableAnimations ? (
            <AnimatePresence>{popoverNode}</AnimatePresence>
          ) : (
            popoverNode
          )}
        </div>

        {error ? (
          <p role="alert" className="text-danger mt-1 text-xs font-medium">
            {error}
          </p>
        ) : null}
      </div>
    </MotionConfig>
  );
});

export default RecursosDropdown;
