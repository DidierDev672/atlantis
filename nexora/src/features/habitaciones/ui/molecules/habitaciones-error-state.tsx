import { memo } from 'react';

export interface HabitacionesErrorStateProps {
  message: string;
  actionLabel?: string;
  onRetry: () => void;
  compact?: boolean;
}

export const HabitacionesErrorState = memo(function HabitacionesErrorState({
  message,
  actionLabel = 'Reintentar',
  onRetry,
  compact = false,
}: HabitacionesErrorStateProps) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center gap-3 text-center ${
        compact ? 'py-6' : 'py-12'
      }`}
    >
      <span className="bg-danger/10 text-danger grid size-11 place-items-center rounded-full">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="size-5"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </span>
      <p className="text-danger max-w-md text-xs font-medium sm:text-sm">
        {message}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="border-line bg-panel text-ink hover:border-primary/40 hover:text-primary cursor-pointer rounded-xl border px-4 py-2 text-xs font-semibold shadow-2xs transition"
      >
        {actionLabel}
      </button>
    </div>
  );
});
