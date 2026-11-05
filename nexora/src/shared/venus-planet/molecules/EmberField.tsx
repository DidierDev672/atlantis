import { Ember } from '../atoms/Ember';
import { EMBERS } from '../lib/scenery';

type EmberFieldProps = {
  count: number;
  animated: boolean;
};

/** Molécula: brasas que suben del suelo volcánico. No renderiza nada si `count` es 0. */
export function EmberField({ count, animated }: EmberFieldProps) {
  if (count <= 0 || !animated) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {EMBERS.slice(0, count).map((ember) => (
        <Ember
          key={`${ember.left}-${ember.bottom}`}
          {...ember}
          animated={animated}
        />
      ))}
    </div>
  );
}
