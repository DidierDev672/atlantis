import { memo, type RefObject } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faXmark } from '@fortawesome/free-solid-svg-icons';
import { Loading } from '../../../../shared/loading';
import type { DropdownOption } from '../../domain/dropdown';
import { cn } from '../lib/cn';

export interface RecursosDropdownTriggerProps {
  fieldId: string;
  triggerRef: RefObject<HTMLButtonElement | HTMLDivElement | null>;
  multiple: boolean;
  isOpen: boolean;
  isDisabled: boolean;
  isOptionsLoading: boolean;
  hasError: boolean;
  options: ReadonlyArray<DropdownOption>;
  selectedValues: ReadonlyArray<string>;
  displayText: string;
  hasSingleValue: boolean;
  placeholder?: string;
  onToggle: () => void;
  onRemoveMultiValue: (val: string, event: React.MouseEvent) => void;
}

/**
 * Molécula: Trigger unificado (selección simple y múltiple con chips) de `RecursosDropdown`.
 */
export const RecursosDropdownTrigger = memo(function RecursosDropdownTrigger({
  fieldId,
  triggerRef,
  multiple,
  isOpen,
  isDisabled,
  isOptionsLoading,
  hasError,
  options,
  selectedValues,
  displayText,
  hasSingleValue,
  placeholder,
  onToggle,
  onRemoveMultiValue,
}: RecursosDropdownTriggerProps) {
  const inactive = isDisabled || isOptionsLoading;

  const baseClassName = cn(
    'bg-panel text-ink flex min-h-[42px] w-full cursor-pointer items-center justify-between gap-2 rounded-xl border px-3.5 py-2 text-left text-sm shadow-xs transition outline-none',
    hasError
      ? 'border-danger/60 ring-danger/20 ring-2'
      : isOpen
        ? 'border-primary ring-primary/20 ring-2'
        : 'border-line hover:border-ink-soft',
    isDisabled && 'cursor-not-allowed opacity-50'
  );

  const chevronNode = (
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
  );

  if (multiple) {
    return (
      <div
        ref={triggerRef as RefObject<HTMLDivElement>}
        id={fieldId}
        role="combobox"
        tabIndex={inactive ? -1 : 0}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby={`${fieldId}-label`}
        aria-disabled={inactive}
        onClick={() => {
          if (!inactive) onToggle();
        }}
        onKeyDown={(e) => {
          if (inactive) return;
          if (
            (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') &&
            e.target === e.currentTarget
          ) {
            e.preventDefault();
            onToggle();
          }
        }}
        className={baseClassName}
      >
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
                  <span className="max-w-[200px] truncate">{textLabel}</span>
                  {!isDisabled ? (
                    <button
                      type="button"
                      onClick={(e) => onRemoveMultiValue(val, e)}
                      className="hover:bg-primary/20 text-primary/80 hover:text-primary cursor-pointer rounded p-0.5 transition-colors"
                      aria-label={`Remover ${textLabel}`}
                    >
                      <FontAwesomeIcon icon={faXmark} className="size-2.5" />
                    </button>
                  ) : null}
                </span>
              );
            })
          )}
        </div>
        {chevronNode}
      </div>
    );
  }

  return (
    <button
      ref={triggerRef as RefObject<HTMLButtonElement>}
      type="button"
      id={fieldId}
      aria-haspopup="listbox"
      aria-expanded={isOpen}
      aria-labelledby={`${fieldId}-label`}
      disabled={inactive}
      onClick={() => {
        if (!inactive) onToggle();
      }}
      className={baseClassName}
    >
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
          {displayText}
        </span>
      )}
      {chevronNode}
    </button>
  );
});
