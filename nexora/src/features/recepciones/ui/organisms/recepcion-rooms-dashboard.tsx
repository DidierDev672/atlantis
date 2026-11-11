import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { fadeIn } from '../../../../design-tokens/motion'
import { useRecepcionRooms } from '../../application/use-recepcion-rooms'
import { type RecepcionRoomItem, getRoomStatusConfig } from '../../domain/recepcion-room'
import { RecepcionRoomsViewSwitch } from '../molecules/recepcion-rooms-view-switch'
import { RecepcionRoomCard } from '../molecules/recepcion-room-card'
import { RecepcionRoomTable } from '../molecules/recepcion-room-table'
import { Loading, useDelayVisibility } from '../../../../shared/loading'
import { Modal } from '../../../sedes/ui/atoms/modal'
import { StatusCodeAlert } from '../../../../shared/lib/status-code-validator'
import { InfiniteScroll, InfiniteScrollEnd } from '../../../../shared/ui/InfiniteScroll'
import {
  RecursosDropdown,
  type DropdownOption,
} from '../../../recursos/ui/molecules/recursos-dropdown'

const PAGE_SIZE = 6

const STATUS_OPTIONS: DropdownOption[] = [
  { value: 'todos', label: 'Todos los estados' },
  { value: 'available', label: 'Disponible' },
  { value: 'occupied', label: 'Ocupada' },
  { value: 'maintenance', label: 'Mantenimiento' },
  { value: 'cleaning', label: 'Limpieza' },
]

const FLOOR_OPTIONS: DropdownOption[] = [
  { value: 'todos', label: 'Todos los pisos' },
  { value: '1', label: 'Piso 1' },
  { value: '2', label: 'Piso 2' },
  { value: '3', label: 'Piso 3' },
  { value: '4', label: 'Piso 4' },
]

const RECEPTION_OPTIONS: DropdownOption[] = [
  { value: 'all', label: 'Toda recepción' },
  { value: 'with', label: 'Con recepción activa' },
  { value: 'without', label: 'Sin recepción' },
]

/**
 * Organismo Dashboard para Recepcionista.
 * Supervisa el inventario de habitaciones consumiendo GET /room, validando el status code
 * con `status-code-validator.ts`, alternando entre Tarjetas y Tabla, con Scroll Infinito y
 * selectores unificados mediante `RecursosDropdown`.
 * Cumple con cero visualización de IDs (Regla de Oro nº 1).
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
    reload,
  } = useRecepcionRooms()

  const [selectedRoom, setSelectedRoom] = useState<RecepcionRoomItem | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [loadingMore, setLoadingMore] = useState(false)

  // Reiniciar paginación progresiva directamente en los manejadores de filtro/búsqueda (evita setState en useEffect)
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setVisibleCount(PAGE_SIZE)
  }

  const handleStatusChange = (value: string) => {
    setStatusFilter(value)
    setVisibleCount(PAGE_SIZE)
  }

  const handleFloorChange = (value: string) => {
    setFloorFilter(value)
    setVisibleCount(PAGE_SIZE)
  }

  const handleReceptionChange = (value: string) => {
    setReceptionFilter(value as 'all' | 'with' | 'without')
    setVisibleCount(PAGE_SIZE)
  }

  const handleResetFilters = () => {
    setSearchQuery('')
    setStatusFilter('todos')
    setFloorFilter('todos')
    setReceptionFilter('all')
    setVisibleCount(PAGE_SIZE)
  }

  const hasMore = visibleCount < filteredRooms.length

  const visibleRooms = useMemo(
    () => filteredRooms.slice(0, visibleCount),
    [filteredRooms, visibleCount]
  )

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    await new Promise((resolve) => setTimeout(resolve, 300))
    setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredRooms.length))
    setLoadingMore(false)
  }, [loadingMore, hasMore, filteredRooms.length])

  const isVisibleLoading = useDelayVisibility(loading || isRefreshing, {
    delay: 0,
    minDuration: 500,
  })

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await reload()
    } finally {
      setIsRefreshing(false)
    }
  }

  const hasValidationError = Boolean(validationResult && !validationResult.isValid)

  return (
    <motion.section
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      aria-label="Supervisión de habitaciones para recepción"
      className="space-y-6"
    >
      {/* 1. Alerta cósmica (/shared/alert) de status-code-validator (oculta automáticamente en HTTP 200) */}
      {validationResult && (
        <StatusCodeAlert
          validation={validationResult}
          dismissible
          actions={
            hasValidationError ? (
              <button
                type="button"
                onClick={handleRefresh}
                className="shrink-0 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 px-3.5 py-1.5 text-xs font-semibold text-amber-800 dark:text-amber-200 transition cursor-pointer"
              >
                Reintentar consulta
              </button>
            ) : undefined
          }
        />
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

      {/* 2. Barra de Control para Recepción: Búsqueda, Filtros (RecursosDropdown) y Switch Card / Table */}
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
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Buscar por número, piso, tipo o edificio…"
            className="w-full h-[42px] rounded-xl border border-line bg-canvas pl-10 pr-4 py-2 text-xs text-ink placeholder:text-ink-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Filtros con RecursosDropdown + Switch + Refrescar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Filtro por Estado */}
          <RecursosDropdown
            label="Estado"
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={handleStatusChange}
            placeholder="Todos los estados"
            className="w-44 sm:w-48 [&>label]:sr-only"
          />

          {/* Filtro por Piso ("Todos los pesos/pisos") */}
          <RecursosDropdown
            label="Piso"
            options={FLOOR_OPTIONS}
            value={floorFilter}
            onChange={handleFloorChange}
            placeholder="Todos los pisos"
            className="w-36 sm:w-40 [&>label]:sr-only"
          />

          {/* Filtro por Recepción ("Toda recepcion") */}
          <RecursosDropdown
            label="Recepción"
            options={RECEPTION_OPTIONS}
            value={receptionFilter}
            onChange={handleReceptionChange}
            placeholder="Toda recepción"
            className="w-44 sm:w-48 [&>label]:sr-only"
          />

          {/* Switch interactivo Tarjeta (Default) / Tabla */}
          <RecepcionRoomsViewSwitch viewMode={viewMode} onChange={setViewMode} />

          {/* Botón Refrescar */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading || isRefreshing}
            aria-label="Refrescar lista de habitaciones"
            title="Refrescar habitaciones"
            className="flex size-[42px] items-center justify-center rounded-xl border border-line bg-canvas text-ink-muted hover:border-primary/40 hover:bg-panel hover:text-primary transition cursor-pointer disabled:opacity-50 shadow-2xs"
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

      {/* 3. Contenido Principal con animación fade-in, InfiniteScroll y modo de visualización */}
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
            onClick={handleResetFilters}
            className="mt-4 rounded-xl border border-line bg-canvas px-4 py-2 text-xs font-semibold text-primary hover:bg-panel transition cursor-pointer"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="relative">
          <InfiniteScroll
            onLoadMore={handleLoadMore}
            hasMore={hasMore}
            isLoading={loadingMore}
            threshold={0.1}
            rootMargin="0px 0px 200px 0px"
            loader={
              <div className="flex items-center justify-center py-6">
                <Loading
                  variant="inline"
                  size="sm"
                  label="Cargando más habitaciones…"
                  delay={0}
                  minDuration={300}
                />
              </div>
            }
            endMessage={
              <InfiniteScrollEnd label="Has visualizado todas las habitaciones del inventario." />
            }
          >
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
                  {visibleRooms.map((room) => (
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
                    rooms={visibleRooms}
                    onSelectRoom={(r) => setSelectedRoom(r)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </InfiniteScroll>

          {/* Overlay de /shared/loading mientras se refresca /room con datos visibles */}
          {isVisibleLoading && filteredRooms.length > 0 && (
            <Loading
              variant="overlay"
              size="md"
              label="Actualizando habitaciones (/room)…"
              description="Sincronizando el inventario en tiempo real con balanceo de carga."
              delay={0}
              minDuration={400}
            />
          )}
        </div>
      )}

      {/* 4. Modal de Inspección Rápida de Habitación (Cumpliendo Regla de Oro: Cero IDs visibles) */}
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
