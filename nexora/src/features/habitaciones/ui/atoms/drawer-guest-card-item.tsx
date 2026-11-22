import { memo, useCallback, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheck,
  faCopy,
  faIdCard,
  faPhone,
  faUser,
} from '@fortawesome/free-solid-svg-icons';
import type { DrawerGuestItem } from '../../application/fetch-drawer-stay-guests';

export interface DrawerGuestCardItemProps {
  guest: DrawerGuestItem;
}

/**
 * Átomo: Fila compacta de huésped dentro del acordeón con copia rápida de documento.
 */
export const DrawerGuestCardItem = memo(function DrawerGuestCardItem({
  guest,
}: DrawerGuestCardItemProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyDoc = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!guest.documentLabel) return;
      try {
        await navigator.clipboard.writeText(guest.documentLabel);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      } catch (err) {
        console.error('No se pudo copiar el documento:', err);
      }
    },
    [guest.documentLabel]
  );

  return (
    <li className="border-indigo-500/15 bg-panel/80 flex items-start justify-between gap-2 rounded-xl border px-3 py-2">
      <div className="flex min-w-0 items-start gap-2.5">
        <span
          aria-hidden="true"
          className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-300"
        >
          <FontAwesomeIcon icon={faUser} className="size-3" />
        </span>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-ink truncate text-xs font-bold sm:text-sm">
              {guest.name}
            </span>
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                guest.isPrimary
                  ? 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300'
                  : 'bg-canvas text-ink-muted border-line border'
              }`}
            >
              {guest.isPrimary ? 'Titular' : 'Acompañante'}
            </span>
          </div>

          {(guest.documentLabel || guest.phoneNumber) && (
            <div className="text-ink-muted mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px]">
              {guest.documentLabel && (
                <span className="inline-flex items-center gap-1">
                  <FontAwesomeIcon icon={faIdCard} className="size-2.5" />
                  <span>{guest.documentLabel}</span>
                  <button
                    type="button"
                    onClick={(e) => void handleCopyDoc(e)}
                    title="Copiar documento"
                    aria-label={`Copiar documento de ${guest.name}`}
                    className="hover:text-primary ml-0.5 cursor-pointer transition-colors"
                  >
                    <FontAwesomeIcon
                      icon={copied ? faCheck : faCopy}
                      className={`size-2.5 ${copied ? 'text-emerald-600' : ''}`}
                    />
                  </button>
                </span>
              )}

              {guest.phoneNumber && (
                <a
                  href={`tel:${guest.phoneNumber}`}
                  onClick={(e) => e.stopPropagation()}
                  className="hover:text-primary inline-flex items-center gap-1 transition-colors"
                  title="Llamar al huésped"
                >
                  <FontAwesomeIcon icon={faPhone} className="size-2.5" />
                  <span>{guest.phoneNumber}</span>
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </li>
  );
});
