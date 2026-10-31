import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRotateRight } from '@fortawesome/free-solid-svg-icons'
import { fadeUp, staggerContainer, staggerItem } from '../../../../design-tokens/motion'
import { useStaysList, type UseStaysListReturn } from '../../application/use-stays-list'
import { RecepcionesViewSwitch } from '../molecules/recepciones-view-switch'
import { RecepcionStayCard } from '../molecules/recepcion-stay-card'
import { RecepcionStayTable } from '../molecules/recepcion-stay-table'
import { RecepcionStayDetailModal } from '../molecules/recepcion-stay-detail-modal'
import { InfiniteScroll, InfiniteScrollEnd } from '../../../../shared/ui/InfiniteScroll'
import { Loading } from '../../../../shared/loading'
import type { StayItem } from '../../domain/stay'

export interface RecepcionesListContainerProps {
  onNewCheckIn?: () => void
  staysListReturn?: UseStaysListReturn
}


/**
 * Organismo contenedor para la supervisión y visualización de recepciones.
 * Integra consumo de GET /stays con Axios, validación de status code,
 * tarjetas detalladas, tabla responsiva y switch con animación fluida.
 */
export function RecepcionesListContainer({
  onNewCheckIn,
  staysListReturn: externalStaysList,
}: RecepcionesListContainerProps) {
  const internalStaysList = useStaysList()
  const staysList = externalStaysList ?? internalStaysList
  const {
    filteredStays,
    loading,
    validationResult,
    isDemoFallback,
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    paymentFilter,
    setPaymentFilter,
    reload,
  } = staysList

  const [selectedStay, setSelectedStay] = useState<StayItem | null>(null)

  // Determinar si hay error retornado por validateStatusCode
  const hasValidationError = validationResult && !validationResult.isValid

  return (
    <div className="space-y-6">
      {/* 2. Banner de validación empática (si el servidor responde con 4xx/5xx o conexión) */}
      {hasValidationError && (
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          role="alert"
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-amber-900 dark:text-amber-200 shadow-xs"
        >
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 mt-0.5 sm:mt-0">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-5"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </span>
            <div>
              <h4 className="text-sm font-bold">
                {validationResult.title || 'Aviso del servicio de recepciones'} (Código HTTP {validationResult.status})
              </h4>
              <p className="text-xs mt-0.5 leading-relaxed opacity-90">
                {validationResult.message || 'La consulta se completó con un código no estándar.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void reload()}
            className="shrink-0 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 px-3.5 py-1.5 text-xs font-semibold text-amber-800 dark:text-amber-200 transition cursor-pointer"
          >
            Reintentar consulta
          </button>
        </motion.div>
      )}

      {/* Banner de datos de muestra activos */}
      {isDemoFallback && !hasValidationError && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-canvas px-4 py-2.5 text-xs text-ink-muted">
          <span className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-primary/60" />
            Mostrando datos estructurados
          </span>
          <button
            type="button"
            onClick={() => void reload()}
            className="text-primary hover:underline font-semibold cursor-pointer"
          >
            Actualizar ahora
          </button>
        </div>
      )}

      {/* 3. Barra de Control: Búsqueda, Filtros y Switch Card / Table */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between rounded-2xl border border-line bg-panel p-4 shadow-xs">
        {/* Campo de búsqueda */}
        <div className="relative flex-1 min-w-[240px]">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-ink-muted"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por habitación, persona, ID de estancia..."
            className="w-full rounded-xl border border-line bg-canvas pl-10 pr-4 py-2 text-xs text-ink placeholder:text-ink-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Filtros + Switch */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Filtro de Estado */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filtrar por estado"
            className="rounded-xl border border-line bg-canvas px-3 py-2 text-xs text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
          >
            <option value="todos">Todos los estados</option>
            <option value="progress">En progreso</option>
            <option value="completed">Finalizada</option>
            <option value="canceled">Cancelada</option>
          </select>

          {/* Filtro de Método de pago */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            aria-label="Filtrar por método de pago"
            className="rounded-xl border border-line bg-canvas px-3 py-2 text-xs text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
          >
            <option value="todos">Todos los pagos</option>
            <option value="cash">Efectivo</option>
            <option value="card">Tarjeta</option>
            <option value="transfer">Transferencia</option>
          </select>

          {/* Switch interactivo Card / Table (Requisito explícito del usuario) */}
          <RecepcionesViewSwitch viewMode={viewMode} onChange={setViewMode} />

          {/* Botón para refrescar la información de tablas y tarjetas */}
          <button
            type="button"
            onClick={() => void reload()}
            disabled={loading}
            aria-label="Refrescar información de recepciones y estancias"
            title="Refrescar información"
            className="flex size-9 items-center justify-center rounded-xl border border-line bg-canvas text-ink-muted hover:border-primary/40 hover:bg-panel hover:text-primary transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
          >
            <FontAwesomeIcon
              icon={faRotateRight}
              className={`size-3.5 transition-transform ${loading ? 'animate-spin text-primary' : ''}`}
            />
          </button>

          {/* Botón de nuevo check-in */}
          {onNewCheckIn && (
            <button
              type="button"
              onClick={onNewCheckIn}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:opacity-90 transition cursor-pointer"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-4"
                aria-hidden="true"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Nuevo recepcion</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. Contenido Principal: Cards vs. Table según el switch */}
      {loading && filteredStays.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-line bg-panel p-16 text-center shadow-xs">
          <Loading
            variant="block"
            size="md"
            label="Cargando recepciones y estancias…"
            description="Consultando el estado de ocupación hotelera en tiempo real."
            delay={0}
            minDuration={500}
          />
        </div>
      ) : filteredStays.length === 0 ? (
        /* Empty State */
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-panel/60 p-12 text-center"
        >
          <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary mb-3">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-7"
              aria-hidden="true"
            >
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </span>
          <h3 className="text-base font-bold text-ink">Sin recepciones que coincidan</h3>
          <p className="mt-1 text-xs text-ink-muted max-w-sm">
            {searchQuery
              ? `No encontramos estancias con el término "${searchQuery}". Prueba ajustando tus filtros.`
              : 'Aún no se registran estancias en este momento.'}
          </p>
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                setStatusFilter('todos')
                setPaymentFilter('todos')
              }}
              className="mt-4 rounded-xl border border-line bg-canvas px-4 py-2 text-xs font-semibold text-primary hover:bg-line/40 transition cursor-pointer"
            >
              Limpiar filtros
            </button>
          )}
        </motion.div>
      ) : (
        /* Renderizado condicional Card vs. Table */
        <InfiniteScroll
          onLoadMore={() => {}}
          hasMore={false}
          isLoading={false}
          loader={
            <div className="flex items-center justify-center py-6">
              <Loading
                variant="inline"
                size="sm"
                label="Cargando más recepciones…"
                delay={0}
                minDuration={400}
              />
            </div>
          }
          endMessage={<InfiniteScrollEnd label="Has visualizado todas las recepciones registradas." />}
        >
          <AnimatePresence mode="wait">
            {viewMode === 'card' ? (
              /* Vista en Cards con Stagger Reveal */
              <motion.div
                key="recepciones-cards-view"
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.05 }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
              >
                {filteredStays.map((stay) => (
                  <RecepcionStayCard
                    key={stay.id}
                    stay={stay}
                    variants={staggerItem}
                    onClick={(item) => setSelectedStay(item)}
                  />
                ))}
              </motion.div>
            ) : (
              /* Vista en Tabla con Stagger Reveal */
              <motion.div
                key="recepciones-table-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
              >
                <RecepcionStayTable
                  stays={filteredStays}
                  onSelectStay={(item) => setSelectedStay(item)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </InfiniteScroll>
      )}

      {/* Modal de Detalle al interactuar */}
      <RecepcionStayDetailModal
        stay={selectedStay}
        onClose={() => setSelectedStay(null)}
      />
    </div>
  )
}
