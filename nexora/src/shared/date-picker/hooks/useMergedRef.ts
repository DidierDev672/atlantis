import { useCallback, type MutableRefObject, type Ref } from 'react';

/** Combina varias refs (la interna del componente y la que pasa el formulario). */
export function useMergedRef<T>(...refs: Array<Ref<T> | undefined>) {
  return useCallback((node: T | null) => {
    for (const ref of refs) {
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as MutableRefObject<T | null>).current = node;
    }
  });
}
