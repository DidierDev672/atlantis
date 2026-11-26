import { memo, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faXmark } from '@fortawesome/free-solid-svg-icons';

export interface DropdownSearchInputProps {
  value: string;
  placeholder?: string;
  onChange: (nextValue: string) => void;
  onClose: () => void;
}

/**
 * Átomo: Campo de búsqueda integrado dentro del popover de `RecursosDropdown`.
 */
export const DropdownSearchInput = memo(function DropdownSearchInput({
  value,
  placeholder,
  onChange,
  onClose,
}: DropdownSearchInputProps) {
  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange('');
    },
    [onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  return (
    <div className="border-line bg-panel-soft/60 border-b p-2">
      <div className="relative flex items-center">
        <FontAwesomeIcon
          icon={faMagnifyingGlass}
          className="text-ink-muted pointer-events-none absolute left-3 size-3"
          aria-hidden="true"
        />
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? 'Buscar en las opciones…'}
          className="border-line bg-panel text-ink placeholder:text-ink-soft focus:border-primary focus:ring-primary/20 w-full rounded-lg border py-1.5 pr-7 pl-8 text-xs transition outline-none focus:ring-1 [&::-webkit-search-cancel-button]:hidden"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={handleKeyDown}
          autoFocus
        />
        {value ? (
          <button
            type="button"
            onClick={handleClear}
            className="text-ink-muted hover:text-ink absolute right-2 flex size-4 cursor-pointer items-center justify-center rounded transition-colors"
            title="Limpiar búsqueda"
            aria-label="Limpiar búsqueda"
          >
            <FontAwesomeIcon icon={faXmark} className="size-2.5" />
          </button>
        ) : null}
      </div>
    </div>
  );
});
