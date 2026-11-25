import { Suspense, lazy, memo } from 'react';
import { Loading } from '../../../../shared/loading';

const LazyMenuServiciosHabitacionPage = lazy(() =>
  import('./MenuServiciosHabitacionPage').then((m) => ({
    default: m.MenuServiciosHabitacionPage,
  }))
);

/**
 * Vista principal de Servicio a la Habitación para el Dashboard.
 * Carga de forma perezosa `MenuServiciosHabitacionPage`.
 */
export const ServicioHabitacionesPage = memo(
  function ServicioHabitacionesPage() {
    return (
      <Suspense
        fallback={
          <div className="border-line bg-panel flex min-h-[240px] items-center justify-center rounded-3xl border">
            <Loading
              visible
              variant="inline"
              size="sm"
              label="Cargando servicios a la habitación…"
              delay={0}
              minDuration={0}
            />
          </div>
        }
      >
        <LazyMenuServiciosHabitacionPage />
      </Suspense>
    );
  }
);

export default ServicioHabitacionesPage;
