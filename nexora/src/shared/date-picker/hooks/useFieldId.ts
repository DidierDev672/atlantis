import { useId } from 'react';

/** Id estable y válido para `htmlFor` / `aria-*` (useId devuelve ":r1:"). */
export function useFieldId(id?: string) {
  const auto = useId();
  return id ?? `date-${auto.replace(/:/g, '')}`;
}
