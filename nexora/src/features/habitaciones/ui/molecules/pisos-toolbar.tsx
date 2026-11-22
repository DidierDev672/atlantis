import { memo, useCallback } from 'react';
import { faAnglesDown, faAnglesUp } from '@fortawesome/free-solid-svg-icons';
import { IconActionButton } from '../atoms/icon-action-button';

export interface PisosToolbarProps {
  floorsCount: number;
  expandedCount: number;
  totalRoomsCount: number;
  onExpandAll: () => void | Promise<void>;
  onCollapseAll: () => void | Promise<void>;
}

export const PisosToolbar = memo(function PisosToolbar({
  floorsCount,
  expandedCount,
  totalRoomsCount,
  onExpandAll,
  onCollapseAll,
}: PisosToolbarProps) {
  const allExpanded = floorsCount > 0 && expandedCount === floorsCount;
  const allCollapsed = expandedCount === 0;

  const handleExpandAll = useCallback(async () => {
    try {
      await onExpandAll();
    } catch (err) {
      console.error('Error al expandir todos los pisos:', err);
    }
  }, [onExpandAll]);

  const handleCollapseAll = useCallback(async () => {
    try {
      await onCollapseAll();
    } catch (err) {
      console.error('Error al contraer todos los pisos:', err);
    }
  }, [onCollapseAll]);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-1">
      <p className="text-ink-muted text-xs">
        <strong className="text-ink font-semibold">{floorsCount}</strong>{' '}
        {floorsCount === 1 ? 'piso' : 'pisos'} ·{' '}
        <strong className="text-ink font-semibold">{totalRoomsCount}</strong>{' '}
        {totalRoomsCount === 1 ? 'habitación' : 'habitaciones'} en catálogo
      </p>

      <div className="flex items-center gap-1.5" role="group" aria-label="Control de acordeones de pisos">
        <IconActionButton
          icon={faAnglesDown}
          label="Expandir todos los pisos"
          size="sm"
          disabled={allExpanded}
          onClick={() => void handleExpandAll()}
        />
        <IconActionButton
          icon={faAnglesUp}
          label="Contraer todos los pisos"
          size="sm"
          disabled={allCollapsed}
          onClick={() => void handleCollapseAll()}
        />
      </div>
    </div>
  );
});
