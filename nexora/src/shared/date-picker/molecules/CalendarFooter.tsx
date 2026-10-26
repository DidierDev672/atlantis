import { CalendarAction } from '../atoms/CalendarAction';
import type { CalendarLabels } from '../types';

type CalendarFooterProps = {
  labels: CalendarLabels;
  showToday: boolean;
  onToday: () => void;
  onClear?: () => void;
};

/** Molécula: accesos rápidos del calendario. */
export function CalendarFooter({
  labels,
  showToday,
  onToday,
  onClear,
}: CalendarFooterProps) {
  return (
    <div className="border-line mt-2 flex items-center justify-between border-t pt-2">
      {showToday ? (
        <CalendarAction onClick={onToday}>{labels.today}</CalendarAction>
      ) : (
        <span />
      )}
      {onClear && (
        <CalendarAction onClick={onClear}>{labels.clear}</CalendarAction>
      )}
    </div>
  );
}
