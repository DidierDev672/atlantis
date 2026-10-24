import { motion } from 'motion/react';
import { cn } from '../../../../shared/lib/cn';

export interface SniperCornerDefinition {
  index: number;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  callsign: string;
  role: string;
  containerClasses: string;
  restTransform: {
    y: number;
    x: number;
    rotate: number;
    opacity: number;
    scale: number;
  };
  cardAnchorClasses: string;
}

export const SNIPER_CORNERS: SniperCornerDefinition[] = [
  {
    index: 0,
    position: 'top-left',
    callsign: 'SNIPER TAC-01',
    role: 'TITULAR',
    containerClasses: '-top-6 -left-6',
    restTransform: { y: 12, x: 12, rotate: -4, opacity: 0.5, scale: 0.98 },
    cardAnchorClasses: 'top-6 left-6 origin-top-left',
  },
  {
    index: 1,
    position: 'top-right',
    callsign: 'SNIPER TAC-02',
    role: 'ACOMP. 1',
    containerClasses: '-top-6 -right-6',
    restTransform: { y: 12, x: -12, rotate: 4, opacity: 0.5, scale: 0.98 },
    cardAnchorClasses: 'top-6 right-6 origin-top-right',
  },
  {
    index: 2,
    position: 'bottom-left',
    callsign: 'SNIPER TAC-03',
    role: 'ACOMP. 2',
    containerClasses: '-bottom-6 -left-6',
    restTransform: { y: -12, x: 12, rotate: 4, opacity: 0.5, scale: 0.98 },
    cardAnchorClasses: 'bottom-6 left-6 origin-bottom-left',
  },
  {
    index: 3,
    position: 'bottom-right',
    callsign: 'SNIPER TAC-04',
    role: 'ACOMP. 3',
    containerClasses: '-bottom-6 -right-6',
    restTransform: { y: -12, x: -12, rotate: -4, opacity: 0.5, scale: 0.98 },
    cardAnchorClasses: 'bottom-6 right-6 origin-bottom-right',
  },
];

export function getSniperCorner(index: number): SniperCornerDefinition {
  if (index < SNIPER_CORNERS.length) {
    return SNIPER_CORNERS[index];
  }
  const isRight = index % 2 === 1;
  return {
    index,
    position: isRight ? 'top-right' : 'top-left',
    callsign: `SNIPER TAC-0${index + 1}`,
    role: `ACOMP. ${index}`,
    containerClasses: isRight ? '-top-10 right-8' : '-top-10 left-8',
    restTransform: { y: 8, x: isRight ? -8 : 8, rotate: isRight ? 6 : -6, opacity: 0.4, scale: 0.95 },
    cardAnchorClasses: isRight ? 'top-6 right-6 origin-top-right' : 'top-6 left-6 origin-top-left',
  };
}

export function CornerShadowSniperCard({
  def,
  guestName,
  isActive,
  isRegistered,
}: {
  def: SniperCornerDefinition;
  guestName?: string;
  isActive?: boolean;
  isRegistered?: boolean;
}) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute z-0 size-28 select-none sm:size-32',
        def.containerClasses
      )}
      aria-hidden="true"
    >
      <motion.div
        initial={false}
        animate={def.restTransform}
        transition={{ type: 'spring', stiffness: 340, damping: 22 }}
        className={cn(
          'pointer-events-none absolute h-40 w-28 rounded-2xl transition-all duration-300 select-none sm:h-44 sm:w-32',
          def.cardAnchorClasses,
          'border-[1.5px] backdrop-blur-xs',
          isActive
            ? 'border-amber-400 bg-amber-500/15 opacity-100 ring-2 ring-amber-400/50'
            : isRegistered
              ? 'border-emerald-400/50 bg-emerald-500/5 opacity-70 ring-1 ring-emerald-400/30'
              : 'bg-panel/10 border-amber-400/25 opacity-30 ring-1 ring-white/10 dark:bg-black/15'
        )}
      >
        {/* Filete interior sutil */}
        <div
          className={cn(
            'pointer-events-none absolute inset-1.5 rounded-xl border border-dashed transition-colors',
            isActive ? 'border-amber-400/60' : 'border-amber-400/20'
          )}
        />

        {/* Notches balísticos en esquinas */}
        <div className="absolute top-2 left-2 size-1.5 border-t-2 border-l-2 border-amber-400/70" />
        <div className="absolute top-2 right-2 size-1.5 border-t-2 border-r-2 border-amber-400/70" />
        <div className="absolute bottom-2 left-2 size-1.5 border-b-2 border-l-2 border-amber-400/70" />
        <div className="absolute bottom-2 right-2 size-1.5 border-b-2 border-r-2 border-amber-400/70" />

        {/* Contenido militar/táctico de la carta en reposo */}
        <div className="relative flex h-full flex-col justify-between p-2.5 font-mono text-[8px] text-amber-200/90">
          <div className="flex items-center justify-between border-b border-amber-400/30 pb-0.5">
            <span className="font-bold text-amber-300 tracking-wider">
              {def.callsign}
            </span>
            <span className="text-[7px] text-amber-400/80 uppercase">
              DECK 0{def.index + 1}
            </span>
          </div>

          <div className="my-auto flex flex-col items-center justify-center py-0.5">
            <span
              className={cn(
                'max-w-[95px] truncate text-[8px] font-bold tracking-wider uppercase',
                isActive ? 'text-amber-200 font-extrabold' : 'text-amber-300/70'
              )}
            >
              {guestName || `Huésped #${def.index + 1}`}
            </span>
          </div>

          <div className="flex items-center justify-between border-t border-amber-400/30 pt-0.5 text-[7px] text-amber-400/70">
            <span className={cn(isActive && 'font-bold text-amber-300')}>
              {def.role}
            </span>
            <span className="font-bold text-amber-300">
              {isRegistered ? '✓ LOCK' : 'PEND'}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
