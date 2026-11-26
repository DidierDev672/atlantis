import { memo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import type { DropdownOption } from '../../domain/dropdown';
import { cn } from '../lib/cn';

export interface DropdownOptionItemProps {
  option: DropdownOption;
  multiple: boolean;
  isSelected: boolean;
  enableAnimations: boolean;
  onSelect: (option: DropdownOption) => void;
}

/**
 * Átomo: Ítem unificado para selección simple y múltiple en `RecursosDropdown`,
 * sin animaciones destructivas ni re-render innecesario al escribir en búsqueda.
 */
export const DropdownOptionItem = memo(function DropdownOptionItem({
  option,
  multiple,
  isSelected,
  enableAnimations,
  onSelect,
}: DropdownOptionItemProps) {
  const buttonClassName = cn(
    'group flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors',
    enableAnimations && 'hover:translate-x-0.5 transition-transform duration-150',
    isSelected
      ? 'bg-primary/10 text-primary font-semibold'
      : 'text-ink hover:bg-black/5 dark:hover:bg-white/5'
  );

  if (multiple) {
    return (
      <button
        type="button"
        role="option"
        aria-selected={isSelected}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={() => onSelect(option)}
        className={buttonClassName}
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
            {isSelected ? (
              <FontAwesomeIcon
                icon={faCheck}
                className="size-2.5 text-white"
                aria-hidden="true"
              />
            ) : null}
          </div>
          <span className="truncate">{option.label}</span>
        </div>

        {isSelected ? (
          <span className="text-primary shrink-0 text-[10px] font-medium">
            Seleccionado
          </span>
        ) : null}
      </button>
    );
  }

  return (
    <button
      type="button"
      role="option"
      aria-selected={isSelected}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={() => onSelect(option)}
      className={buttonClassName}
    >
      {option.renderContent || option.customContent ? (
        <div className="min-w-0 flex-1 pr-2">
          {option.renderContent ? option.renderContent() : option.customContent}
        </div>
      ) : (
        <span className="flex-1 truncate pr-2">{option.label}</span>
      )}
      {isSelected ? (
        <FontAwesomeIcon
          icon={faCheck}
          className="text-primary size-3 shrink-0"
          aria-hidden="true"
        />
      ) : null}
    </button>
  );
});
