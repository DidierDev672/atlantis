import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

function getClippingAncestors(element: HTMLElement): HTMLElement[] {
  const ancestors: HTMLElement[] = [];
  let current: HTMLElement | null = element.parentElement;

  while (
    current &&
    current !== document.body &&
    current !== document.documentElement
  ) {
    const { overflowY } = window.getComputedStyle(current);
    const isScrollContainer =
      (overflowY === 'auto' || overflowY === 'scroll') &&
      current.scrollHeight > current.clientHeight;
    if (isScrollContainer || current.getAttribute('role') === 'dialog') {
      ancestors.push(current);
    }
    current = current.parentElement;
  }
  return ancestors;
}

export interface UseDropdownPlacementParams {
  isOpen: boolean;
  direction: 'auto' | 'down' | 'up';
  optionsCount: number;
  isSearchEnabled: boolean;
  dropdownRef: RefObject<HTMLDivElement | null>;
  triggerRef: RefObject<HTMLButtonElement | HTMLDivElement | null>;
  onRequestClose: () => void;
}

/**
 * Hook de aplicación para auto-flip del popover, cierre exterior / Escape y
 * reposicionamiento throttled por `requestAnimationFrame` durante scroll.
 */
export function useDropdownPlacement({
  isOpen,
  direction,
  optionsCount,
  isSearchEnabled,
  dropdownRef,
  triggerRef,
  onRequestClose,
}: UseDropdownPlacementParams) {
  const [placement, setPlacement] = useState<'down' | 'up'>('down');
  const [maxHeight, setMaxHeight] = useState<number | undefined>(undefined);
  const scrollRafRef = useRef<number | null>(null);

  const updatePlacement = useCallback(() => {
    try {
      if (direction === 'up' || direction === 'down') {
        setPlacement(direction);
        return;
      }

      const triggerEl = triggerRef.current ?? dropdownRef.current;
      if (!triggerEl) return;

      const rect = triggerEl.getBoundingClientRect();
      const margin = 8;
      let spaceBelow = window.innerHeight - rect.bottom - margin;
      let spaceAbove = rect.top - margin;

      for (const ancestor of getClippingAncestors(triggerEl)) {
        const ancestorRect = ancestor.getBoundingClientRect();
        spaceBelow = Math.min(
          spaceBelow,
          Math.max(0, ancestorRect.bottom - rect.bottom - margin)
        );
        spaceAbove = Math.min(
          spaceAbove,
          Math.max(0, rect.top - ancestorRect.top - margin)
        );
      }

      spaceBelow = Math.max(0, spaceBelow);
      spaceAbove = Math.max(0, spaceAbove);

      const POPOVER_FULL_HEIGHT = 288;
      const estimatedCount = optionsCount || 5;
      const intrinsicHeight = Math.min(
        Math.max(estimatedCount * 40 + (isSearchEnabled ? 50 : 0) + 24, 160),
        POPOVER_FULL_HEIGHT
      );

      const fitsBelow = spaceBelow >= intrinsicHeight + margin;
      const fitsAbove = spaceAbove >= intrinsicHeight + margin;
      const nextPlacement: 'down' | 'up' =
        !fitsBelow && (fitsAbove || spaceAbove > spaceBelow) ? 'up' : 'down';

      setPlacement(nextPlacement);

      const available =
        nextPlacement === 'up' ? spaceAbove - margin : spaceBelow - margin;
      setMaxHeight(Math.min(288, Math.max(120, Math.floor(available))));
    } catch (err) {
      console.error('Error al calcular posición del dropdown:', err);
    }
  }, [direction, optionsCount, isSearchEnabled, triggerRef, dropdownRef]);

  useEffect(() => {
    if (!isOpen) return;
    const rafId = requestAnimationFrame(updatePlacement);
    return () => cancelAnimationFrame(rafId);
  }, [isOpen, updatePlacement]);

  useEffect(() => {
    if (!isOpen || direction !== 'auto') return;

    const scheduleReposition = () => {
      if (scrollRafRef.current !== null) return;
      scrollRafRef.current = requestAnimationFrame(() => {
        scrollRafRef.current = null;
        updatePlacement();
      });
    };

    window.addEventListener('resize', scheduleReposition, { passive: true });
    window.addEventListener('scroll', scheduleReposition, {
      passive: true,
      capture: true,
    });
    return () => {
      if (scrollRafRef.current !== null) {
        cancelAnimationFrame(scrollRafRef.current);
        scrollRafRef.current = null;
      }
      window.removeEventListener('resize', scheduleReposition);
      window.removeEventListener('scroll', scheduleReposition, true);
    };
  }, [isOpen, direction, updatePlacement]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!document.contains(target)) return;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        onRequestClose();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onRequestClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, dropdownRef, onRequestClose]);

  return { placement, maxHeight, updatePlacement };
}
