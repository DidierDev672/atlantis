import { Suspense, memo, useCallback, type ChangeEvent } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBellConcierge,
  faMagnifyingGlass,
  faMobileScreen,
  faRotateRight,
  faTabletScreenButton,
} from '@fortawesome/free-solid-svg-icons'
import type { DatePickerProps } from '../../../../shared/date-picker'
import {
  RecursosDropdown,
  type DropdownOption,
} from '../../../recursos/ui/molecules/recursos-dropdown'
import { lazyWithFallback } from '../../application/lazy-with-fallback'
import type { NivelPrioridad } from '../../domain/pedidos-servicio-habitacion'

const LazyDatePicker = lazyWithFallback<DatePickerProps>(
  () => import('../../../../shared/date-picker').then((m) => m.DatePicker),
  'DatePicker en PedidosControlToolbar',
)

const OPCIONES_PRIORIDAD: ReadonlyArray<DropdownOption> = [
  { value: 'todos', label: 'Todos' },
  {
    value: 'urgente',
    label: 'Urgentes',
    customContent: (
      <span className="flex items-center gap-2">
        <span className="size-2 shrink-0 rounded-full bg-red-500" />
        <span>Urgentes</span>
      </span>
    ),
  },
  {
    value: 'atencion',
    label: 'En cola',
    customContent: (
      <span className="flex items-center gap-2">
        <span className="size-2 shrink-0 rounded-full bg-amber-500" />
        <span>En cola</span>
      </span>
    ),
  },
  {
    value: 'normal',
    label: 'A tiempo',
    customContent: (
      <span className="flex items-center gap-2">
        <span className="size-2 shrink-0 rounded-full bg-emerald-500" />
        <span>A tiempo</span>
      </span>
    ),
  },
]

const OPCIONES_CANAL_FILTRO: ReadonlyArray<DropdownOption> = [
  { value: 'todos', label: 'Todos' },
  {
    value: 'front_desk',
    label: 'Recepción',
    customContent: (
      <span className="flex items-center gap-2">
        <FontAwesomeIcon icon={faBellConcierge} className="text-primary size-3.5" />
        <span>Recepción</span>
      </span>
    ),
  },
  {
    value: 'room_tablet',
    label: 'Tablet',
    customContent: (
      <span className="flex items-center gap-2">
        <FontAwesomeIcon icon={faTabletScreenButton} className="text-primary size-3.5" />
        <span>Tablet</span>
      </span>
    ),
  },
  {
    value: 'mobile_app',
    label: 'Móvil',
    customContent: (
      <span className="flex items-center gap-2">
        <FontAwesomeIcon icon={faMobileScreen} className="text-primary size-3.5" />
        <span>Móvil</span>
      </span>
    ),
  },
]

export interface PedidosControlToolbarProps {
  busqueda: string
  filtroPrioridad: 'todos' | NivelPrioridad
  filtroCanales: string[]
  filtroFechaVenta: Date | null
  loading: boolean
  onBusquedaChange: (valor: string) => void
  onPrioridadChange: (valor: 'todos' | NivelPrioridad) => void
  onCanalesChange: (valores: string[]) => void
  onFechaVentaChange: (fecha: Date | null) => void
  onRefrescar: () => void
}

/**
 * Molécula: Barra de búsqueda, filtros de prioridad/canal/fecha de venta y refresco manual de comandas.
 * Envuelta en `React.memo` para evitar re-renders cuando solo cambian estados internos de tarjetas.
 */
export const PedidosControlToolbar = memo(function PedidosControlToolbar({
  busqueda,
  filtroPrioridad,
  filtroCanales,
  filtroFechaVenta,
  loading,
  onBusquedaChange,
  onPrioridadChange,
  onCanalesChange,
  onFechaVentaChange,
  onRefrescar,
}: PedidosControlToolbarProps) {
  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onBusquedaChange(e.target.value)
    },
    [onBusquedaChange],
  )

  const handleLimpiarBusqueda = useCallback(() => {
    onBusquedaChange('')
  }, [onBusquedaChange])

  const handlePrioridadSelect = useCallback(
    (val: string) => {
      onPrioridadChange((val || 'todos') as 'todos' | NivelPrioridad)
    },
    [onPrioridadChange],
  )

  const handleFechaVentaSelect = useCallback(
    (fecha: Date | null) => {
      try {
        onFechaVentaChange(fecha)
      } catch (error) {
        console.error('Error al seleccionar fecha de venta:', error)
      }
    },
    [onFechaVentaChange],
  )

  return (
    <div className="border-line bg-panel flex flex-col gap-4 rounded-3xl border p-4 shadow-xs lg:flex-row lg:items-end lg:justify-between">
      <div className="relative w-full lg:flex-1">
        <input
          type="text"
          value={busqueda}
          onChange={handleInputChange}
          placeholder="Buscar comanda #, plato o nota especial..."
          className="border-line bg-canvas text-ink placeholder:text-ink-muted focus:border-primary focus:ring-primary w-full rounded-2xl border py-2.5 pr-8 pl-10 font-sans text-xs font-medium transition-colors focus:ring-1 focus:outline-none"
        />
        <FontAwesomeIcon
          icon={faMagnifyingGlass}
          className="text-ink-muted pointer-events-none absolute top-1/2 left-3.5 size-3.5 -translate-y-1/2"
        />
        {busqueda && (
          <button
            type="button"
            onClick={handleLimpiarBusqueda}
            aria-label="Limpiar búsqueda"
            className="text-ink-muted hover:text-ink absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-xs font-bold"
          >
            ×
          </button>
        )}
      </div>

      <div className="flex shrink-0 flex-wrap items-end gap-2.5">
        <div className="w-40 sm:w-44">
          <RecursosDropdown
            label="Prioridad"
            value={filtroPrioridad}
            onChange={handlePrioridadSelect}
            options={OPCIONES_PRIORIDAD}
            placeholder="Prioridad…"
            searchable={false}
            className="text-xs"
          />
        </div>

        <div className="w-full sm:w-56">
          <RecursosDropdown
            label="Canal"
            multiple
            selectedValues={filtroCanales}
            onMultiChange={onCanalesChange}
            options={OPCIONES_CANAL_FILTRO}
            placeholder="Todos"
            searchable={false}
            className="text-xs"
          />
        </div>

        <div className="w-full sm:w-52">
          <Suspense
            fallback={
              <div className="border-line bg-canvas h-10 w-full rounded-2xl border" />
            }
          >
            <LazyDatePicker
              label="Fecha de venta"
              value={filtroFechaVenta}
              onChange={handleFechaVentaSelect}
              placeholder="Filtrar por fecha…"
              clearable
              locale="es-CO"
              align="end"
              className="text-xs"
            />
          </Suspense>
        </div>

        <button
          type="button"
          onClick={onRefrescar}
          disabled={loading}
          aria-label="Actualizar tiquetera de cocina"
          title="Actualizar tiquetera de cocina"
          className="border-line bg-canvas text-ink hover:border-primary/40 hover:bg-line/40 inline-flex size-9 cursor-pointer items-center justify-center rounded-2xl border shadow-2xs transition-colors disabled:opacity-50"
        >
          <FontAwesomeIcon
            icon={faRotateRight}
            className={`size-3.5 ${loading ? 'animate-spin' : ''}`}
          />
        </button>
      </div>
    </div>
  )
})
