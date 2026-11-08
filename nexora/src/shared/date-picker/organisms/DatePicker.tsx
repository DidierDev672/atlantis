import { useEffect } from 'react';
import type { DayState, DatePickerProps } from '../types';
import { useCalendar } from '../hooks/useCalendar';
import { useControllableState } from '../hooks/useControllableState';
import { useFieldId } from '../hooks/useFieldId';
import { usePopover } from '../hooks/usePopover';
import {
  formatDisplay,
  getWeekdayLabels,
} from '../lib/format';
import {
  getMonthGrid,
  isDayDisabled,
  isSameDay,
  toISODate,
} from '../lib/date-utils';
import { resolveLabels } from '../lib/labels';
import { CalendarFooter } from '../molecules/CalendarFooter';
import { CalendarGrid } from '../molecules/CalendarGrid';
import { CalendarHeader } from '../molecules/CalendarHeader';
import { DateTrigger } from '../molecules/DateTrigger';
import { FieldFrame } from '../molecules/FieldFrame';
import { PickerPopover } from '../molecules/PickerPopover';

/**
 * Organismo DatePicker reutilizable.
 * Integra FieldFrame, DateTrigger, PickerPopover, CalendarHeader (con selector rápido de mes y año),
 * CalendarGrid y CalendarFooter con navegación accesible por teclado.
 */
export function DatePicker({
  id: explicitId,
  name,
  label,
  hint,
  error,
  placeholder,
  required,
  disabled,
  clearable = true,
  locale = 'es-CO',
  weekStartsOn = 1,
  align = 'start',
  labels: customLabels,
  minDate,
  maxDate,
  isDateDisabled,
  minYear,
  maxYear,
  className,
  value,
  defaultValue = null,
  onChange,
}: DatePickerProps) {
  const id = useFieldId(explicitId);
  const labels = resolveLabels(customLabels);

  const [selectedDate, setSelectedDate] = useControllableState<Date | null>({
    value,
    defaultValue: defaultValue ?? null,
    onChange,
  });

  const { open, placement, rootRef, triggerRef, toggle, close } = usePopover();

  const {
    viewMonth,
    focusedDate,
    direction,
    focusToken,
    canGoPrev,
    canGoNext,
    moveTo,
    goToMonth,
    setYear,
    setMonth,
    onGridKeyDown,
  } = useCalendar({
    initialDate: selectedDate ?? maxDate ?? new Date(),
    minDate,
    maxDate,
    weekStartsOn,
    autoFocus: open,
  });

  // Sincronizar el mes visual con la fecha seleccionada cuando se abre el popover
  useEffect(() => {
    if (open && selectedDate) {
      if (
        viewMonth.getFullYear() !== selectedDate.getFullYear() ||
        viewMonth.getMonth() !== selectedDate.getMonth()
      ) {
        moveTo(selectedDate, false);
      }
    }
  }, [open, selectedDate, moveTo, viewMonth]);

  const currentYear = new Date().getFullYear();
  const resolvedMinYear =
    minYear ?? (minDate ? minDate.getFullYear() : currentYear - 100);
  const resolvedMaxYear =
    maxYear ?? (maxDate ? maxDate.getFullYear() : currentYear + 10);

  const getDayState = (date: Date): DayState => {
    const isSelected = isSameDay(date, selectedDate);
    const dayDisabled = isDayDisabled(date, { minDate, maxDate, isDateDisabled });
    const today = isSameDay(date, new Date());
    const outside = date.getMonth() !== viewMonth.getMonth();

    return {
      disabled: dayDisabled,
      today,
      outside,
      selected: isSelected,
      previewEnd: false,
      band: 'none',
      preview: false,
    };
  };

  const handleSelectDay = (date: Date) => {
    setSelectedDate(date);
    close(true);
  };

  const handleClear = () => {
    setSelectedDate(null);
    close(true);
  };

  const handleToday = () => {
    const today = new Date();
    moveTo(today, true);
    setSelectedDate(today);
    close(true);
  };

  const isTodayDisabled = isDayDisabled(new Date(), {
    minDate,
    maxDate,
    isDateDisabled,
  });

  return (
    <FieldFrame
      id={id}
      label={label}
      required={required}
      hint={hint}
      error={error}
      className={className}
    >
      <div ref={rootRef} className="relative">
        {name && (
          <input
            type="hidden"
            name={name}
            value={selectedDate ? toISODate(selectedDate) : ''}
          />
        )}

        <DateTrigger
          id={id}
          buttonRef={triggerRef}
          popupId={`${id}-popover`}
          displayValue={selectedDate ? formatDisplay(selectedDate, locale) : ''}
          placeholder={placeholder ?? labels.selectDate}
          hasValue={Boolean(selectedDate)}
          open={open}
          disabled={disabled}
          invalid={Boolean(error)}
          clearable={clearable}
          clearLabel={labels.clearValue}
          describedBy={
            error ? `${id}-error` : hint ? `${id}-hint` : undefined
          }
          onToggle={toggle}
          onClear={handleClear}
        />

        <PickerPopover
          open={open}
          id={`${id}-popover`}
          label={labels.dialog}
          placement={placement}
          align={align}
        >
          <div className="p-3">
            <CalendarHeader
              viewMonth={viewMonth}
              locale={locale}
              direction={direction}
              canGoPrev={canGoPrev}
              canGoNext={canGoNext}
              labels={labels}
              minYear={resolvedMinYear}
              maxYear={resolvedMaxYear}
              onPrev={() => goToMonth(-1)}
              onNext={() => goToMonth(1)}
              onYearChange={setYear}
              onMonthChange={setMonth}
            />

            <CalendarGrid
              weeks={getMonthGrid(viewMonth, weekStartsOn)}
              weekdays={getWeekdayLabels(locale, weekStartsOn)}
              viewMonth={viewMonth}
              focusedDate={focusedDate}
              focusToken={focusToken}
              direction={direction}
              locale={locale}
              labels={labels}
              getDayState={getDayState}
              onDayClick={handleSelectDay}
              onDayHover={() => {}}
              onKeyDown={onGridKeyDown}
            />

            <CalendarFooter
              labels={labels}
              showToday={!isTodayDisabled}
              onToday={handleToday}
              onClear={clearable && selectedDate ? handleClear : undefined}
            />
          </div>
        </PickerPopover>
      </div>
    </FieldFrame>
  );
}
