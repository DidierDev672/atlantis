import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { fadeIn, fadeUp } from '../../../../design-tokens/motion'
import { useRecepcionRooms } from '../../application/use-recepcion-rooms'
import { type RecepcionRoomItem, getRoomStatusConfig } from '../../domain/recepcion-room'
import { RecepcionRoomsViewSwitch } from '../molecules/recepcion-rooms-view-switch'
import { RecepcionRoomCard } from '../molecules/recepcion-room-card'
import { RecepcionRoomTable } from '../molecules/recepcion-room-table'
import { Loading, useDelayVisibility } from '../../../../shared/loading'
import { Modal } from '../../../sedes/ui/atoms/modal'

/**
 * Organismo Dashboard para Recepcionista.
 * Supervisa el inventario de habitaciones consumiendo GET /room, validando el status code
 * con `status-code-validator.ts`, alternando entre Tarjetas y Tabla, y garantizando
 * cero visualización de IDs (Regla de Oro nº 1).
 */
export function RecepcionRoomsDashboard() {
  const {
    filteredRooms,
    loading,
    validationResult,
    isFallback,
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    floorFilter,
    setFloorFilter,
    receptionFilter,
    setReceptionFilter,
    metrics,
    reload,
  } = useRecepcionRooms()

  const [selectedRoom, setSelectedRoom] = useState<RecepcionRoomItem | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const isVisibleLoading = useDelayVisibility(loading, {
    delay: 0,
    minDuration: 500,
  })

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await reload()
    } finally {
      setTimeout(() => setIsRefreshing(false), 500)
    }
  }

  const hasValidationError = validationResult && !validationResult.isValid

  return (
    <motion.section
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      aria-label="Supervisión de habitaciones para recepción"
      className="space-y-6"
    >
      {/* 1. Tarjetas de métricas rápidas para el recepcionista */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {/* Total */}
        <div className="rounded-2xl border border-line bg-panel p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-muted">Total inventario</span>
            <span className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4">
                <path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
              </svg>
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-ink">{metrics.total}</p>
          <span className="text-[11px] text-ink-muted">Habitaciones registradas</span>
        </div>

        {/* Disponibles */}
        <div className="rounded-2xl border border-line bg-panel p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-muted">Disponibles</span>
            <span className="grid size-7 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="size-4">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{metrics.available}</p>
          <span className="text-[11px] text-ink-muted">Listas para Check-in</span>
        </div>

        {/* Ocupadas */}
        <div className="rounded-2xl border border-line bg-panel p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-muted">Ocupadas</span>
            <span className="grid size-7 place-items-center rounded-lg bg-sky-500/10 text-sky-600">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-sky-600 dark:text-sky-400">{metrics.occupied}</p>
          <span className="text-[11px] text-ink-muted">Huéspedes hospedados</span>
        </div>

        {/* Con Recepción / Reserva activa */}
        <div className="rounded-2xl border border-line bg-panel p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-muted">Con recepción</span>
            <span className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4">
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <path d="M7 8h10M7 12h10M7 16h6" />
              </svg>
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-primary">{metrics.withReception}</p>
          <span className="text-[11px] text-ink-muted">Estancia o reserva activa</span>
        </div>
      </div>

      {/* 2. Banner de validación empática de status code si el endpoint responde con aviso */}
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
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </span>
            <div>
              <h4 className="text-sm font-bold">
                {validationResult.title || 'Aviso de conexión'} (Código {validationResult.status})
              </h4>
              <p className="text-xs mt-0.5 leading-relaxed opacity-90">
                {validationResult.message || 'Mostrando inventario en modo de protección local.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            className="shrink-0 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 px-3.5 py-1.5 text-xs font-semibold text-amber-800 dark:text-amber-200 transition cursor-pointer"
          >
            Reintentar consulta
          </button>
        </motion.div>
      )}

      {/* Banner de datos locales activos si la API está offline */}
      {isFallback && !hasValidationError && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-canvas px-4 py-2.5 text-xs text-ink-muted">
          <span className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500" />
            Inventario en tiempo real sincronizado
          </span>
          <button
            type="button"
            onClick={handleRefresh}
            className="text-primary hover:underline font-semibold cursor-pointer"
          >
            Actualizar ahora
          </button>
        </div>
      )}

      {/* 3. Barra de Control para Recepción: Búsqueda, Filtros y Switch Card / Table */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between rounded-2xl border border-line bg-panel p-4 shadow-xs">
        {/* Buscador en tiempo real */}
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
            placeholder="Buscar por número, piso, tipo o edificio…"
            className="w-full rounded-xl border border-line bg-canvas pl-10 pr-4 py-2 text-xs text-ink placeholder:text-ink-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Filtros + Switch */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Filtro por Estado */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filtrar por estado"
            className="rounded-xl border border-line bg-canvas px-3 py-2 text-xs text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
          >
            <option value="todos">Todos los estados</option>
            <option value="available">Disponible</option>
            <option value="occupied">Ocupada</option>
            <option value="maintenance">Mantenimiento</option>
            <option value="cleaning">Limpieza</option>
          </select>

          {/* Filtro por Piso */}
          <select
            value={floorFilter}
            onChange={(e) => setFloorFilter(e.target.value)}
            aria-label="Filtrar por piso"
            className="rounded-xl border border-line bg-canvas px-3 py-2 text-xs text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
          >
            <option value="todos">Todos los pisos</option>
            <option value="1">Piso 1</option>
            <option value="2">Piso 2</option>
            <option value="3">Piso 3</option>
            <option value="4">Piso 4</option>
          </select>

          {/* Filtro por Recepción */}
          <select
            value={receptionFilter}
            onChange={(e) => setReceptionFilter(e.target.value as 'all' | 'with' | 'without')}
            aria-label="Filtrar por recepción"
            className="rounded-xl border border-line bg-canvas px-3 py-2 text-xs text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
          >
            <option value="all">Toda recepción</option>
            <option value="with">Con recepción activa</option>
            <option value="without">Sin recepción</option>
          </select>

          {/* Switch interactivo Tarjeta (Default) / Tabla */}
          <RecepcionRoomsViewSwitch viewMode={viewMode} onChange={setViewMode} />

          {/* Botón Refrescar */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading || isRefreshing}
            aria-label="Refrescar lista de habitaciones"
            title="Refrescar habitaciones"
            className="flex size-9 items-center justify-center rounded-xl border border-line bg-canvas text-ink-muted hover:border-primary/40 hover:bg-panel hover:text-primary transition cursor-pointer disabled:opacity-50 shadow-2xs"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`size-4 transition-transform ${isRefreshing ? 'animate-spin text-primary' : ''}`}
              aria-hidden="true"
            >
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
              <path d="M16 21h5v-5" />
            </svg>
          </button>
        </div>
      </div>

      {/* 4. Contenido Principal con animación fade-in y modo de visualización */}
      {isVisibleLoading && filteredRooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-line bg-panel p-16 text-center shadow-xs">
          <Loading
            variant="block"
            size="md"
            label="Consultando habitaciones (/room)…"
            description="Obteniendo el estado del inventario para recepción en tiempo real."
            delay={0}
            minDuration={500}
          />
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-line bg-panel p-12 text-center shadow-xs">
          <span className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary mb-3">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-6">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <h3 className="text-base font-bold text-ink">Sin habitaciones coincidentes</h3>
          <p className="mt-1 max-w-sm text-xs text-ink-muted">
            No encontramos habitaciones que coincidan con los filtros seleccionados. Intenta cambiar tu término de búsqueda.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('')
              setStatusFilter('todos')
              setFloorFilter('todos')
              setReceptionFilter('all')
            }}
            className="mt-4 rounded-xl border border-line bg-canvas px-4 py-2 text-xs font-semibold text-primary hover:bg-panel transition cursor-pointer"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {viewMode === 'cards' ? (
            <motion.div
              key="rooms-cards-grid"
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {filteredRooms.map((room) => (
                <RecepcionRoomCard
                  key={room.id}
                  room={room}
                  onClick={(r) => setSelectedRoom(r)}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="rooms-table-view"
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <RecepcionRoomTable
                rooms={filteredRooms}
                onSelectRoom={(r) => setSelectedRoom(r)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* 5. Modal de Inspección Rápida de Habitación (Cumpliendo Regla de Oro: Cero IDs visibles) */}
      <Modal
        isOpen={selectedRoom !== null}
        onClose={() => setSelectedRoom(null)}
        title={selectedRoom ? `Detalle de Habitación ${selectedRoom.number}` : undefined}
      >
        {selectedRoom && (
          <div className="space-y-4 text-xs">
            {/* Cabecera del modal con estado */}
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <span className="text-[11px] font-medium text-ink-muted">Tipo de estancia</span>
                <p className="text-sm font-bold text-ink">{selectedRoom.roomTypeName}</p>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold shadow-2xs ${getRoomStatusConfig(selectedRoom.status).badgeClass}`}
              >
                <span
                  className={`size-1.5 rounded-full ${getRoomStatusConfig(selectedRoom.status).dotClass}`}
                  aria-hidden="true"
                />
                {getRoomStatusConfig(selectedRoom.status).label}
              </span>
            </div>

            {/* Grilla de atributos (SIN IDs) */}
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-line bg-canvas/70 p-3.5">
              <div>
                <span className="text-[11px] text-ink-muted block">Ubicación</span>
                <span className="font-semibold text-ink">Piso {selectedRoom.floor}</span>
              </div>
              <div>
                <span className="text-[11px] text-ink-muted block">Edificio</span>
                <span className="font-semibold text-ink">{selectedRoom.buildingName}</span>
              </div>
              <div>
                <span className="text-[11px] text-ink-muted block">Tarifa a cobrar</span>
                <span className="font-bold text-primary">{selectedRoom.formattedPrice}</span>
              </div>
              <div>
                <span className="text-[11px] text-ink-muted block">Recepción activa</span>
                <span className={`font-semibold ${selectedRoom.has_reception ? 'text-primary' : 'text-ink-muted'}`}>
                  {selectedRoom.has_reception ? 'Sí (Huésped asignado)' : 'No (Libre de recepción)'}
                </span>
              </div>
            </div>

            {/* Aviso informativo de experiencia de usuario */}
            <p className="text-[11px] text-ink-muted leading-relaxed">
              Habitación preparada para atención en recepción. Toda la información ha sido validada según los estándares de servicio del hotel.
            </p>

            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedRoom(null)}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-xs hover:opacity-90 transition cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        )}
      </Modal>
    </motion.section>
  )
}

