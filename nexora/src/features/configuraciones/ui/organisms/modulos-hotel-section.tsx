import type React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { staggerContainer } from '../../../../design-tokens/motion';
import type { NavId } from '../../../dashboard/ui/navigation';
import type { DashboardCardDefinition } from '../../../dashboard/domain/dashboard-card';
import { DashboardNavCard } from '../../../dashboard/ui/molecules/dashboard-nav-card';
import { ModuloFilterBar } from '../molecules/modulo-filter-bar';
import type {
  ModuloCategoria,
  GrupoModulosFiltrado,
} from '../../domain/configuracion';
import {
  ConciergeBellIcon,
  BuildingIcon,
  ShieldIcon,
  SparklesIcon,
  InfoIcon,
} from '../../../dashboard/ui/icons';

const GROUP_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  ConciergeBellIcon,
  BuildingIcon,
  ShieldIcon,
  SparklesIcon,
};

export interface ModulosHotelSectionProps {
  onNavigate: (id: NavId) => void;
  modulos: readonly DashboardCardDefinition[];
  grupos?: readonly GrupoModulosFiltrado[];
  busqueda: string;
  onBusquedaChange: (val: string) => void;
  categoriaActiva: ModuloCategoria;
  onCategoriaChange: (cat: ModuloCategoria) => void;
  totalModulos: number;
  className?: string;
}

export function ModulosHotelSection({
  onNavigate,
  modulos,
  grupos,
  busqueda,
  onBusquedaChange,
  categoriaActiva,
  onCategoriaChange,
  totalModulos,
  className = '',
}: ModulosHotelSectionProps) {
  const hayModulos = (grupos && grupos.length > 0) || modulos.length > 0;

  return (
    <section
      aria-label="Panel de configuración de módulos del hotel"
      className={`border-line bg-panel rounded-3xl border p-6 shadow-xs sm:p-8 ${className}`}
    >
      {/* Cabecera de la sección Módulos del Hotel */}
      <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-ink text-xl font-bold tracking-tight sm:text-2xl">
              Módulos del hotel
            </h2>
            <span className="border-line bg-canvas text-ink-muted inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-xs font-semibold shadow-2xs">
              <span className="size-2 animate-pulse rounded-full bg-emerald-500" />
              {modulos.length === totalModulos
                ? `${totalModulos} módulos disponibles`
                : `${modulos.length} de ${totalModulos} módulos`}
            </span>
          </div>
          <p className="text-ink-muted mt-1 text-xs sm:text-sm">
            Explora y gestiona cada área de tu red hotelera con un solo clic.
          </p>
        </div>
      </div>

      {/* Barra de filtros por categoría y buscador dinámico */}
      <div className="mb-8">
        <ModuloFilterBar
          busqueda={busqueda}
          onBusquedaChange={onBusquedaChange}
          categoriaActiva={categoriaActiva}
          onCategoriaChange={onCategoriaChange}
        />
      </div>

      {/* Contenedor interactivo de grupos de módulos */}
      <AnimatePresence mode="wait">
        {hayModulos ? (
          <motion.div
            key={`grid-${categoriaActiva}-${busqueda}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="space-y-10"
          >
            {grupos && grupos.length > 0 ? (
              grupos.map((grupo) => {
                const IconComp = GROUP_ICONS[grupo.iconName] ?? SparklesIcon;
                return (
                  <div key={grupo.categoria} className="space-y-4">
                    {/* Encabezado descriptivo del grupo temático */}
                    <div className="border-line/60 flex flex-col gap-2 border-b pb-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 text-primary grid size-9 place-items-center rounded-xl">
                          <IconComp className="size-4.5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-ink text-base font-bold sm:text-lg">
                              {grupo.titulo}
                            </h3>
                            <span className="bg-canvas border-line text-ink-muted rounded-full border px-2.5 py-0.5 text-[11px] font-semibold">
                              {grupo.cards.length}{' '}
                              {grupo.cards.length === 1 ? 'módulo' : 'módulos'}
                            </span>
                          </div>
                          <p className="text-ink-muted mt-0.5 text-xs">
                            {grupo.descripcion}
                          </p>
                        </div>
                      </div>

                      <span className="border-line bg-canvas/70 text-ink-muted self-start rounded-lg border px-2.5 py-1 text-[11px] font-medium sm:self-auto">
                        {grupo.badge}
                      </span>
                    </div>

                    {/* Grid de tarjetas del grupo */}
                    <motion.div
                      variants={staggerContainer}
                      initial="hidden"
                      animate="visible"
                      className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4"
                    >
                      {grupo.cards.map((card) => (
                        <DashboardNavCard
                          key={card.id}
                          card={card}
                          onNavigate={onNavigate}
                        />
                      ))}
                    </motion.div>
                  </div>
                );
              })
            ) : (
              /* Fallback en caso de renderizado plano directo */
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6 xl:grid-cols-4 2xl:grid-cols-5"
              >
                {modulos.map((card) => (
                  <DashboardNavCard
                    key={card.id}
                    card={card}
                    onNavigate={onNavigate}
                  />
                ))}
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="border-line bg-canvas/40 flex flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-12 text-center"
          >
            <div className="bg-line/50 text-ink-muted grid size-12 place-items-center rounded-2xl">
              <InfoIcon className="size-6" />
            </div>
            <h3 className="text-ink mt-3 text-sm font-semibold">
              No se encontraron módulos
            </h3>
            <p className="text-ink-muted mt-1 max-w-sm text-xs">
              No hay módulos que coincidan con &ldquo;{busqueda}&rdquo; en la
              categoría seleccionada.
            </p>
            <button
              type="button"
              onClick={() => {
                onBusquedaChange('');
                onCategoriaChange('todas');
              }}
              className="bg-primary text-cream hover:bg-primary/90 mt-4 cursor-pointer rounded-xl px-4 py-2 text-xs font-semibold transition-colors"
            >
              Restablecer filtros
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
