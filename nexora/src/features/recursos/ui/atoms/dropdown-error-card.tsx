import { Suspense, lazy, memo, type ComponentType } from 'react';
import type { PlanetAlertProps } from '../../../../shared/alert/lib/types';
import type { StatusCodeValidationResult } from '../../../../shared/lib/status-code-validator';
import { useDeviceResourceProfile } from '../../../../shared/lib/use-device-resource-profile';
import { cn } from '../lib/cn';
import { Button } from './button';

const LazyPlanetAlert = lazy<ComponentType<PlanetAlertProps>>(async () => {
  try {
    const mod = await import('../../../../shared/alert/organisms/PlanetAlert');
    return { default: mod.PlanetAlert };
  } catch (err) {
    console.error('Error al cargar PlanetAlert en DropdownErrorCard:', err);
    const Fallback: ComponentType<PlanetAlertProps> = ({
      title,
      message,
      actions,
    }) => (
      <div
        role="alert"
        className="space-y-1.5 rounded-xl border border-amber-500/35 bg-amber-500/10 p-3.5 text-xs"
      >
        {title ? (
          <p className="font-bold text-amber-600 dark:text-amber-300">
            {title}
          </p>
        ) : null}
        {message ? (
          <p className="text-ink-muted text-xs leading-relaxed">{message}</p>
        ) : null}
        {actions ? <div className="pt-1">{actions}</div> : null}
      </div>
    );
    return { default: Fallback };
  }
});

export interface DropdownErrorCardProps {
  fieldLabel: string;
  isRolesEndpoint: boolean;
  errorMessage: string;
  errorValidation?: StatusCodeValidationResult | null;
  rawError?: unknown;
  isLoading: boolean;
  disabled: boolean;
  className?: string;
  onRetry: () => void;
}

/**
 * Átomo: Visualiza errores y advertencias del servidor en `RecursosDropdown`
 * usando `PlanetAlert` con carga perezosa, `StatusCodeValidationResult` y botón de reintento.
 */
export const DropdownErrorCard = memo(function DropdownErrorCard({
  fieldLabel,
  isRolesEndpoint,
  errorMessage,
  errorValidation = null,
  rawError = null,
  isLoading,
  disabled,
  className,
  onRetry,
}: DropdownErrorCardProps) {
  const { policy } = useDeviceResourceProfile();

  const resolvedTitle =
    errorValidation?.title ??
    (isRolesEndpoint
      ? '¡Pausa al sincronizar los roles!'
      : 'No pudimos traer los datos');

  return (
    <div className={cn('space-y-1.5', className)}>
      <span className="text-ink block text-sm font-medium">{fieldLabel}</span>
      <Suspense
        fallback={
          <div
            role="alert"
            className="border-line bg-panel text-ink-muted rounded-xl border p-3.5 text-xs"
          >
            {errorMessage}
          </div>
        }
      >
        <LazyPlanetAlert
          variant={errorValidation?.variant ?? 'warning'}
          planet={errorValidation?.planet ?? 'jupiter'}
          title={resolvedTitle}
          message={errorMessage}
          error={rawError}
          showPlanet={policy.tier !== 'ultra-light'}
          showBadge
          showGlowLine
          actions={
            <Button
              variant="secondary"
              onClick={onRetry}
              disabled={isLoading || disabled}
              className="cursor-pointer px-3 py-1 text-xs font-semibold"
            >
              {isLoading ? 'Consultando…' : 'Volver a intentar'}
            </Button>
          }
        />
      </Suspense>
    </div>
  );
});
