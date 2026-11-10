import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUserCheck,
  faUserPlus,
  faCircleCheck,
  faClock,
} from '@fortawesome/free-solid-svg-icons';
import type { PersonApiResponse } from '../../domain/reserva';

export interface ReservaHuespedesMenuProps {
  totalGuests: number;
  titularPerson?: PersonApiResponse | null;
  companions: PersonApiResponse[];
  activeIndex: number;
  onSelectIndex: (index: number) => void;
}

/**
 * Menú indicador de los huéspedes a registrar en la reserva.
 * - Huésped 1: Huésped titular registrado en la reserva principal.
 * - Huésped 2..N: Acompañantes adicionales a registrar.
 */
export function ReservaHuespedesMenu({
  totalGuests,
  titularPerson,
  companions,
  activeIndex,
  onSelectIndex,
}: ReservaHuespedesMenuProps) {
  const safeTotal = Math.max(2, totalGuests);
  const slots = Array.from({ length: safeTotal }, (_, i) => i);
  const completedCount =
    (titularPerson ? 1 : 0) + Math.min(companions.length, safeTotal - 1);

  return (
    <nav
      aria-label="Menú de huéspedes a registrar"
      className="border-line bg-canvas/60 flex flex-col gap-2 rounded-2xl border p-3"
    >
      <div className="border-line/60 flex items-center justify-between border-b px-1 pb-2">
        <span className="text-ink-muted text-[11px] font-bold tracking-wider uppercase">
          Huéspedes ({completedCount}/{safeTotal})
        </span>
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            completedCount === safeTotal
              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
              : 'bg-primary/10 text-primary'
          }`}
        >
          {completedCount === safeTotal ? 'Completo' : 'En progreso'}
        </span>
      </div>

      <div className="flex flex-row md:flex-col gap-1.5 overflow-x-auto md:overflow-y-auto md:max-h-[360px] pb-1 md:pb-0 pr-0 md:pr-1">
        {slots.map((idx) => {
          const isTitular = idx === 0;
          const companion = !isTitular ? companions[idx - 1] : undefined;
          const isCompleted = isTitular
            ? Boolean(titularPerson)
            : Boolean(companion);
          const isActive = activeIndex === idx;

          const title = isTitular
            ? 'Huésped 1 (Titular)'
            : `Huésped ${idx + 1} (Acompañante ${idx})`;

          const subtitle = isTitular
            ? titularPerson?.name || 'Seleccionado en reserva'
            : companion?.name || 'Pendiente de registro';

          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectIndex(idx)}
              className={`group flex w-auto min-w-[190px] shrink-0 md:w-full md:shrink cursor-pointer items-center gap-2.5 sm:gap-3 rounded-xl p-2 sm:p-2.5 text-left transition-all ${
                isActive
                  ? 'bg-primary shadow-primary/20 scale-[1.01] text-white shadow-md'
                  : isCompleted
                    ? 'bg-panel text-ink border border-emerald-500/20 hover:border-emerald-500/40 hover:bg-emerald-500/5'
                    : 'bg-panel/70 border-line text-ink-muted hover:border-primary/40 hover:text-ink border'
              }`}
            >
              {/* Icono de estado */}
              <div
                className={`grid size-8 shrink-0 place-items-center rounded-lg text-xs transition ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : isCompleted
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : 'bg-neutral/15 text-ink-muted'
                }`}
              >
                <FontAwesomeIcon
                  icon={
                    isCompleted
                      ? faCircleCheck
                      : isTitular
                        ? faUserCheck
                        : faUserPlus
                  }
                  className="size-3.5"
                />
              </div>

              {/* Información del huésped */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`font-mono text-[9px] font-bold tracking-wider ${
                      isActive
                        ? 'text-amber-200'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  ></span>
                  <span
                    className={`text-[10px] ${isActive ? 'text-white/60' : 'text-ink-muted'}`}
                  >
                    ·
                  </span>
                  <p
                    className={`truncate text-xs font-semibold ${
                      isActive ? 'text-white' : 'text-ink'
                    }`}
                  >
                    {title}
                  </p>
                </div>
                <p
                  className={`truncate text-[11px] ${
                    isActive
                      ? 'text-white/80'
                      : isCompleted
                        ? 'text-ink-muted font-medium'
                        : 'text-ink-muted/70 italic'
                  }`}
                >
                  {subtitle}
                </p>
              </div>

              {/* Indicador visual de estado */}
              <div className="shrink-0 text-right">
                {isCompleted ? (
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold ${
                      isActive
                        ? 'text-white'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    <FontAwesomeIcon
                      icon={faCircleCheck}
                      className="size-2.5"
                    />
                    Listo
                  </span>
                ) : (
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] ${
                      isActive
                        ? 'text-white/80'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    <FontAwesomeIcon icon={faClock} className="size-2.5" />
                    Pendiente
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
