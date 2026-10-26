import type { CalendarLabels } from '../types';

export const DEFAULT_LABELS: CalendarLabels = {
  today: 'Hoy',
  clear: 'Limpiar',
  prevMonth: 'Mes anterior',
  nextMonth: 'Mes siguiente',
  selectDate: 'Selecciona una fecha',
  selectRange: 'Selecciona un rango',
  dialog: 'Calendario',
  clearValue: 'Borrar fecha',
};

export const resolveLabels = (
  labels?: Partial<CalendarLabels>
): CalendarLabels => ({ ...DEFAULT_LABELS, ...labels });
