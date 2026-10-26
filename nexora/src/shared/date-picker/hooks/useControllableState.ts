import { useCallback, useState } from 'react';

type Options<T> = {
  /** Si es `undefined` el componente es no controlado. (`null` sí cuenta como controlado.) */
  value: T | undefined;
  defaultValue: T;
  onChange?: (next: T) => void;
};

/** Permite usar el mismo componente controlado (value) o no controlado (defaultValue). */
export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: Options<T>) {
  const [inner, setInner] = useState<T>(defaultValue);
  const controlled = value !== undefined;
  const current = controlled ? (value as T) : inner;

  const set = useCallback(
    (next: T) => {
      if (!controlled) setInner(next);
      onChange?.(next);
    },
    [controlled, onChange]
  );

  return [current, set] as const;
}
