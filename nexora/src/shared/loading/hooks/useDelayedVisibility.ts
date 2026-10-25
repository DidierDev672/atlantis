import { useEffect, useRef, useState } from 'react';

type Options = {
  /** ms de espera antes de mostrar */
  delay?: number;
  /** ms minimos visible una vez mostrado. */
  minDuration?: number;
};

/**
 * Evita el "parpadeo" del loading y garantiza permanencia mínima:
 * - si delay <= 0, se muestra de inmediato sin salto de frame;
 * - si ya se mostró, permanece al menos `minDuration` ms visible para que sea apreciable.
 */
export function useDelayVisibility(
  active: boolean,
  { delay = 0, minDuration = 0 }: Options = {}
): boolean {
  const [show, setShow] = useState(() => (delay <= 0 ? active : false));
  const shownAt = useRef<number | null>(delay <= 0 && active ? Date.now() : null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    if (active) {
      if (!show) {
        if (delay <= 0) {
          shownAt.current = Date.now();
          setShow(true);
        } else {
          timer = setTimeout(() => {
            shownAt.current = Date.now();
            setShow(true);
          }, delay);
        }
      }
    } else {
      if (show) {
        const elapsed = shownAt.current ? Date.now() - shownAt.current : minDuration;
        const remaining = Math.max(0, minDuration - elapsed);
        timer = setTimeout(() => {
          setShow(false);
          shownAt.current = null;
        }, remaining);
      }
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [active, delay, minDuration, show]);

  return show;
}
