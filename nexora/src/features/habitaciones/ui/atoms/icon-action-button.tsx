import { memo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

export interface IconActionButtonProps {
  icon: IconDefinition;
  label: string;
  disabled?: boolean;
  spin?: boolean;
  size?: 'sm' | 'md';
  tone?: 'neutral' | 'danger';
  onClick: () => void;
}

const SIZE_CLASSES: Record<'sm' | 'md', string> = {
  sm: 'size-8 rounded-lg',
  md: 'h-[42px] w-[42px] rounded-xl',
};

const TONE_CLASSES: Record<'neutral' | 'danger', string> = {
  neutral:
    'border-line bg-panel text-ink-muted hover:border-primary/40 hover:text-primary',
  danger:
    'border-danger/30 bg-danger/10 text-danger hover:bg-danger/15 hover:border-danger/50',
};

export const IconActionButton = memo(function IconActionButton({
  icon,
  label,
  disabled = false,
  spin = false,
  size = 'md',
  tone = 'neutral',
  onClick,
}: IconActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`focus-visible:ring-primary/40 inline-grid shrink-0 cursor-pointer place-items-center border shadow-2xs transition focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-45 ${SIZE_CLASSES[size]} ${TONE_CLASSES[tone]}`}
    >
      <FontAwesomeIcon
        icon={icon}
        spin={spin}
        className="size-3.5"
        aria-hidden="true"
      />
    </button>
  );
});
