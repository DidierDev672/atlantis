import type { ReactNode } from 'react';

/** 0 = domingo, 1 = lunes ... 6 = sabadoss */
export type WeekStart = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type DateRange = { start: Date | null; end: Date | null };

export interface DateConstraints {
  /** Primer día seleccionable (inclusive). */
  minDate?: Date;
  /** Último día seleccionable (inclusive). */
  maxDate?: Date;
  /** Bloquea días concretos (ocupados, festivos, fines de semana…). */
  isDateDisabled?: (date: Date) => boolean;
}

export interface CalendarLabels {
  today: string;
  clear: string;
  prevMonth: string;
  nextMonth: string;
  selectDate: string;
  selectRange: string;
  dialog: string;
  clearValue: string;
}

/**  Posicion de la banda de rango dentro de una celda */
export type RangeBand = 'none' | 'start' | 'middle' | 'end';

export interface DayState {
  disabled: boolean;
  today: boolean;
  /** Día de otro mes que aparece para completar la semana. */
  outside: boolean;
  /** Relleno sólido (fecha única, inicio o fin confirmados). */
  selected: boolean;
  /** Fin provisional mientras el mouse recorre el calendario. */
  previewEnd: boolean;
  band: RangeBand;
  /** La banda es provisional (aún no hay fecha de fin confirmada). */
  preview: boolean;
}

/** Props de campo comunes a todos los pickers. */
export interface PickerFieldProps extends DateConstraints {
  id?: string;
  /** Si se indica, se envía un <input type="hidden"> con la fecha en ISO (yyyy-mm-dd). */
  name?: string;
  label?: ReactNode;
  hint?: ReactNode;
  /** Mensaje de error: activa el estilo de error y se anuncia con role="alert". */
  error?: ReactNode;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  /** Muestra el botón para borrar. Por defecto `true`. */
  clearable?: boolean;
  /** Código BCP-47. Por defecto `es-CO`. */
  locale?: string;
  /** Primer día de la semana. Por defecto lunes. */
  weekStartsOn?: WeekStart;
  /** Alineación del calendario respecto al campo. */
  align?: 'start' | 'end';
  labels?: Partial<CalendarLabels>;
  className?: string;
  /** Se dispara cuando el foco sale del campo (compatible con react-hook-form). */
  onBlur?: () => void;
}

export interface DatePickerProps extends PickerFieldProps {
  value?: Date | null;
  defaultValue?: Date | null;
  onChange?: (date: Date | null) => void;
}

export interface DateRangePickerProps extends PickerFieldProps {
  value?: DateRange;
  defaultValue?: DateRange;
  onChange?: (range: DateRange) => void;
  /** Permite que inicio y fin sean el mismo día. Por defecto `true`. */
  allowSameDay?: boolean;
}
