import { memo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { CatalogStatusBadge } from '../../../../shared/catalog';
import { useDeviceResourceProfile } from '../../../../shared/lib/use-device-resource-profile';
import { RandomPlanet } from '../../../../shared/planets';

export interface RoomDetailModalHeaderProps {
  roomSeed?: string;
  roomNumber?: string;
  subtitle?: string;
  status?: string | null;
  onClose: () => void;
}

/**
 * Molécula: Cabecera limpia del modal de habitación con planeta, jerarquía espacial,
 * badge de estado y botón de cierre.
 */
export const RoomDetailModalHeader = memo(function RoomDetailModalHeader({
  roomSeed,
  roomNumber,
  subtitle,
  status,
  onClose,
}: RoomDetailModalHeaderProps) {
  const {
    policy: { enableAnimations },
  } = useDeviceResourceProfile();

  return (
    <header className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="border-line bg-canvas grid size-11 shrink-0 place-items-center rounded-2xl border">
          <RandomPlanet
            size={28}
            seed={roomSeed}
            animated={enableAnimations}
            interactive={enableAnimations}
          />
        </span>

        <div className="min-w-0">
          <h3
            id="modal-room-detail-title"
            className="text-ink truncate text-lg font-extrabold tracking-tight sm:text-xl"
          >
            {roomNumber ? `Habitación ${roomNumber}` : 'Consultando habitación…'}
          </h3>
          {subtitle && (
            <p className="text-ink-muted truncate text-xs font-medium">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {status && <CatalogStatusBadge status={status} />}
        <button
          type="button"
          onClick={() => {
            try {
              onClose();
            } catch (err) {
              console.error('Error al cerrar modal de habitación:', err);
            }
          }}
          aria-label="Cerrar ventana de detalle de habitación"
          title="Cerrar (Esc)"
          className="border-line bg-panel text-ink-muted hover:bg-canvas hover:text-ink focus-visible:ring-primary/40 grid size-9 cursor-pointer place-items-center rounded-full border shadow-2xs transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          <FontAwesomeIcon
            icon={faXmark}
            className="size-3.5"
            aria-hidden="true"
          />
        </button>
      </div>
    </header>
  );
});

export default RoomDetailModalHeader;
