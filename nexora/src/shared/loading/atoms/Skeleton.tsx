import type { CSSProperties } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '../../lib';
import type { SkeletonProps, SkeletonVariant } from '../type';

const VARIANT_CLASSES: Record<SkeletonVariant, string> = {
  rectangular: 'rounded-none',
  rounded: 'rounded-2xl',
  circular: 'rounded-full',
  text: 'h-3.5 w-full rounded-md',
};

function SkeletonBlock({
  variant = 'rounded',
  animation = 'shimmer',
  width,
  height,
  className,
}: Omit<SkeletonProps, 'lines'>) {
  const prefersReducedMotion = useReducedMotion();
  const effectiveAnimation = prefersReducedMotion ? 'none' : animation;

  const inlineStyle: CSSProperties = {
    ...(width !== undefined ? { width } : {}),
    ...(height !== undefined ? { height } : {}),
  };

  return (
    <span
      aria-hidden="true"
      style={inlineStyle}
      className={cn(
        'relative block overflow-hidden bg-line/55 select-none',
        VARIANT_CLASSES[variant],
        effectiveAnimation === 'shimmer' && 'skeleton-shimmer',
        effectiveAnimation === 'pulse' && 'animate-pulse',
        className
      )}
    >
      {effectiveAnimation === 'shimmer' && (
        <motion.span
          aria-hidden="true"
          initial={{ x: '-100%' }}
          animate={{ x: '200%' }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-linear-to-r from-transparent via-white/35 to-transparent dark:via-white/10"
        />
      )}
    </span>
  );
}

/**
 * Átomo: Marcador de posición animado tipo Skeleton (`/shared/loading`).
 * Simula elementos en carga (imagen rectangular, avatar circular o líneas de texto)
 * con animación shimmer suave adaptada a modo claro/oscuro y `prefers-reduced-motion`.
 */
export function Skeleton({
  variant = 'rounded',
  animation = 'shimmer',
  width,
  height,
  lines = 1,
  className,
}: SkeletonProps) {
  if (variant === 'text' && lines > 1) {
    return (
      <div aria-hidden="true" className={cn('w-full space-y-2', className)}>
        {Array.from({ length: lines }).map((_, idx) => {
          const isLastLine = idx === lines - 1;
          return (
            <SkeletonBlock
              key={idx}
              variant="text"
              animation={animation}
              width={isLastLine ? '78%' : width}
              height={height}
            />
          );
        })}
      </div>
    );
  }

  return (
    <SkeletonBlock
      variant={variant}
      animation={animation}
      width={width}
      height={height}
      className={className}
    />
  );
}
