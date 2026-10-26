import { useCallback, useEffect, useRef, useState } from 'react';

/** Altura aproximada del calendario, para decidir si abre hacia arriba. */
const POPOVER_HEIGHT = 400;

export type Placement = 'bottom' | 'top';

/**
 * Estado y comportamiento del desplegable:
 * - abre hacia arriba si no hay espacio debajo;
 * - cierra al hacer clic fuera;
 * - Escape cierra y devuelve el foco al campo (sin cerrar un modal padre).
 */

export function usePopover() {
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<Placement>('bottom');
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const close = useCallback((returnFocus = true) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }, []);

  const toggle = useCallback(() => {
    if (open) return close();

    const rect = rootRef.current?.getBoundingClientRect();
    if (rect) {
      const below = window.innerHeight - rect.bottom;
      setPlacement(
        below < POPOVER_HEIGHT && rect.top > below ? 'top' : 'bottom'
      );
    }
    setOpen(true);
  }, [open, close]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation(); // evita cerrar también el modal que contiene el campo
      close(true);
    };

    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown, true);
    };
  }, [open, close]);

  return { open, placement, rootRef, triggerRef, toggle, close };
}

export type PopoverState = ReturnType<typeof usePopover>;
