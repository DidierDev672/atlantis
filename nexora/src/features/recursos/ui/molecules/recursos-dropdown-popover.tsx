import { memo, useCallback, useRef } from 'react';
import { motion } from 'motion/react';
import { Loading } from '../../../../shared/loading';
import { InfiniteScroll } from '../../../../shared/ui/InfiniteScroll';
import type { DropdownOption } from '../../domain/dropdown';
import { DropdownOptionItem } from '../atoms/dropdown-option-item';
import { DropdownSearchInput } from '../atoms/dropdown-search-input';
import { cn } from '../lib/cn';

export interface RecursosDropdownPopoverProps {
  placement: 'down' | 'up';
  maxHeight?: number;
  multiple: boolean;
  enableAnimations: boolean;
  isSearchEnabled: boolean;
  searchTerm: string;
  searchPlaceholder?: string;
  isOptionsLoading: boolean;
  filteredCount: number;
  visibleOptions: ReadonlyArray<DropdownOption>;
  pageSize: number;
  hasMore: boolean;
  isLoadingMore: boolean;
  customEmptyLabel?: string;
  selectedValues: ReadonlyArray<string>;
  resolvedValue: string;
  selectedOption: DropdownOption | null;
  onSearchChange: (value: string) => void;
  onClose: () => void;
  onLoadMore: () => Promise<void> | void;
  onSelectOptionItem: (option: DropdownOption) => void;
}

/**
 * Molécula: Popover de `RecursosDropdown` sin remontar opciones por `searchTerm`,
 * sin doble disparador de scroll infinito y con navegación por teclado en `listbox`.
 */
export const RecursosDropdownPopover = memo(function RecursosDropdownPopover({
  placement,
  maxHeight,
  multiple,
  enableAnimations,
  isSearchEnabled,
  searchTerm,
  searchPlaceholder,
  isOptionsLoading,
  filteredCount,
  visibleOptions,
  pageSize,
  hasMore,
  isLoadingMore,
  customEmptyLabel,
  selectedValues,
  resolvedValue,
  selectedOption,
  onSearchChange,
  onClose,
  onLoadMore,
  onSelectOptionItem,
}: RecursosDropdownPopoverProps) {
  const listContainerRef = useRef<HTMLDivElement>(null);

  const handleListboxKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      try {
        if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
        const container = listContainerRef.current;
        if (!container) return;
        const items = Array.from(
          container.querySelectorAll<HTMLButtonElement>('[role="option"]')
        );
        if (items.length === 0) return;

        e.preventDefault();
        const activeIndex = items.findIndex(
          (el) => el === document.activeElement
        );
        const nextIndex =
          e.key === 'ArrowDown'
            ? (activeIndex + 1) % items.length
            : activeIndex <= 0
              ? items.length - 1
              : activeIndex - 1;
        items[nextIndex]?.focus();
      } catch (err) {
        console.error('Error en navegación por teclado de opciones:', err);
      }
    },
    []
  );

  const Wrapper = enableAnimations ? motion.div : 'div';
  const motionProps = enableAnimations
    ? {
        initial:
          placement === 'up'
            ? { opacity: 0, y: 6, scale: 0.98 }
            : { opacity: 0, y: -6, scale: 0.98 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit:
          placement === 'up'
            ? { opacity: 0, y: 4, scale: 0.98 }
            : { opacity: 0, y: -4, scale: 0.98 },
        transition: { duration: 0.15 },
      }
    : {};

  return (
    <Wrapper
      {...motionProps}
      style={maxHeight ? { maxHeight: `${maxHeight}px` } : undefined}
      className={cn(
        'border-line bg-panel absolute z-50 flex max-h-72 w-full flex-col overflow-hidden rounded-xl border shadow-xl',
        placement === 'up' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
      )}
      role="listbox"
      aria-multiselectable={multiple ? 'true' : undefined}
      onKeyDown={handleListboxKeyDown}
    >
      {isSearchEnabled ? (
        <DropdownSearchInput
          value={searchTerm}
          placeholder={searchPlaceholder}
          onChange={onSearchChange}
          onClose={onClose}
        />
      ) : null}

      <div
        ref={listContainerRef}
        className="max-h-56 min-h-0 flex-1 space-y-0.5 overflow-y-auto p-1.5"
      >
        {isOptionsLoading ? (
          <div className="flex items-center justify-center px-4 py-7">
            <Loading
              variant="block"
              size="sm"
              label="Cargando opciones…"
              description="Preparando opciones disponibles"
              delay={0}
              minDuration={300}
            />
          </div>
        ) : filteredCount === 0 ? (
          <div className="text-ink-soft p-4 text-center text-xs">
            {searchTerm.trim()
              ? `No se encontraron resultados para "${searchTerm}".`
              : (customEmptyLabel ?? 'No hay opciones disponibles.')}
          </div>
        ) : (
          <InfiniteScroll
            onLoadMore={onLoadMore}
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
              filteredCount > pageSize ? (
                <div className="text-ink-muted py-2 text-center text-[10px]">
                  Has visualizado todas las opciones ({filteredCount})
                </div>
              ) : undefined
            }
          >
            <div className="space-y-0.5">
              {visibleOptions.map((opt) => {
                const isSelected = multiple
                  ? selectedValues.includes(opt.value)
                  : Boolean(
                      opt.value === resolvedValue ||
                        opt.id === resolvedValue ||
                        (selectedOption && selectedOption.value === opt.value)
                    );
                return (
                  <DropdownOptionItem
                    key={opt.value}
                    option={opt}
                    multiple={multiple}
                    isSelected={isSelected}
                    enableAnimations={enableAnimations}
                    onSelect={onSelectOptionItem}
                  />
                );
              })}
            </div>
          </InfiniteScroll>
        )}
      </div>
    </Wrapper>
  );
});
