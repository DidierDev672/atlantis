import { memo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEnvelope,
  faIdCard,
  faPhone,
  faUser,
} from '@fortawesome/free-solid-svg-icons';
import { translateDocumentTypeToSpanish } from '../../domain/habitacion-stay';
import type { CachedPersonItem } from '../../infrastructure/persons-search-cache';
import { AnimatedCheckbox } from './animated-checkbox';

export interface BuscarHuespedCardProps {
  person: CachedPersonItem;
  isSelected: boolean;
  isDisabled: boolean;
  onToggle: (person: CachedPersonItem) => void;
}

/**
 * Átomo: Tarjeta de huésped en el buscador (sin Motion por ítem para bajo costo GPU/RAM).
 */
export const BuscarHuespedCard = memo(function BuscarHuespedCard({
  person,
  isSelected,
  isDisabled,
  onToggle,
}: BuscarHuespedCardProps) {
  return (
    <div
      onClick={() => onToggle(person)}
      className={`group relative flex cursor-pointer flex-col justify-between rounded-2xl border p-4 transition-colors ${
        isSelected
          ? 'border-primary/80 bg-primary/10 ring-primary/40 shadow-md ring-1'
          : isDisabled
            ? 'border-line/50 bg-canvas/30 hover:border-line opacity-70'
            : 'border-line/70 bg-canvas/50 hover:border-primary/40 hover:bg-panel hover:shadow-xs'
      }`}
    >
      <div className="absolute top-3.5 right-3.5 z-10">
        <AnimatedCheckbox
          id={`chk-guest-${person.id}`}
          checked={isSelected}
          disabled={isDisabled}
          onChange={() => onToggle(person)}
        />
      </div>

      <div className="space-y-2 pr-7">
        <div className="flex items-center gap-2">
          <span className="bg-primary/15 text-primary grid size-6 shrink-0 place-items-center rounded-full text-xs">
            <FontAwesomeIcon icon={faUser} className="size-2.5" />
          </span>
          <h4 className="text-ink group-hover:text-primary truncate text-sm font-bold transition-colors">
            {person.name || 'Huésped sin nombre'}
          </h4>
        </div>

        <div className="text-ink-muted flex items-center gap-1.5 text-xs">
          <FontAwesomeIcon
            icon={faIdCard}
            className="text-ink-muted/80 size-3 shrink-0"
          />
          <span className="font-medium">
            {translateDocumentTypeToSpanish(person.document_type)}:
          </span>
          <span className="text-ink font-mono font-bold">
            {person.document_number || 'S/N'}
          </span>
        </div>

        <div className="text-ink-muted flex items-center gap-1.5 truncate text-xs">
          <FontAwesomeIcon
            icon={faEnvelope}
            className="text-ink-muted/80 size-3 shrink-0"
          />
          <span className="truncate">
            {person.email || 'Sin correo registrado'}
          </span>
        </div>

        {person.phone_number && (
          <div className="text-ink-muted/80 flex items-center gap-1.5 text-[11px]">
            <FontAwesomeIcon
              icon={faPhone}
              className="text-ink-muted/70 size-2.5 shrink-0"
            />
            <span className="font-mono">{person.phone_number}</span>
          </div>
        )}
      </div>

      <div className="border-line/40 mt-3 flex items-center justify-between border-t pt-2.5 text-[11px]">
        <span
          className={`font-semibold ${
            isSelected
              ? 'text-primary'
              : isDisabled
                ? 'text-ink-muted/60'
                : 'text-ink-muted group-hover:text-ink'
          }`}
        >
          {isSelected
            ? '✓ Seleccionado'
            : isDisabled
              ? 'Límite alcanzado'
              : 'Clic para seleccionar'}
        </span>
      </div>
    </div>
  );
});

export default BuscarHuespedCard;
