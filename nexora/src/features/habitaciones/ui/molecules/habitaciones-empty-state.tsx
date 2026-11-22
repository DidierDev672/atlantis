import { memo } from 'react';

export interface HabitacionesEmptyStateProps {
  hasActiveFilters: boolean;
  onNewHabitacion?: () => void;
}

export const HabitacionesEmptyState = memo(function HabitacionesEmptyState({
  hasActiveFilters,
  onNewHabitacion,
}: HabitacionesEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <span className="bg-primary/10 text-primary grid size-14 place-items-center rounded-2xl">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="size-7"
          aria-hidden="true"
        >
          <path d="M2 4v16" />
          <path d="M2 8h18a2 2 0 0 1 2 2v10" />
          <path d="M2 17h20" />
          <path d="M6 8v9" />
        </svg>
      </span>
      <h3 className="text-ink text-base font-bold">
        No hay habitaciones para mostrar
      </h3>
      <p className="text-ink-muted max-w-sm text-xs leading-relaxed">
        {hasActiveFilters
          ? 'Ninguna habitación coincide con los filtros aplicados. Prueba restableciendo los filtros para ver todo tu inventario.'
          : 'Aún no se han registrado habitaciones en este establecimiento. Registra una nueva habitación para comenzar tu catálogo.'}
      </p>
      {onNewHabitacion && (
        <button
          type="button"
          onClick={onNewHabitacion}
          className="bg-primary hover:bg-primary-hover mt-2 cursor-pointer rounded-xl px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition"
        >
          + Registrar primera habitación
        </button>
      )}
    </div>
  );
});
