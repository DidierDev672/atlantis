import { cn } from '../../lib';

import type { LoadingSize } from '../type';

type LoadingMessageProps = {
  label: string;
  description?: string;
  size: LoadingSize;
  align: 'left' | 'center';
};

/** Molécula: título + descripción opcional del loading. */
export function LoadingMessage({
  label,
  description,
  size,
  align,
}: LoadingMessageProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-0.5',
        align === 'center'
          ? 'items-center text-center'
          : 'items-start text-left'
      )}
    >
      <p
        className={cn(
          'text-ink font-semibold',
          size === 'sm' ? 'text-xs' : 'text-sm'
        )}
      >
        {label}
      </p>
      {description && (
        <p className="text-ink-soft max-w-xs text-xs leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}
