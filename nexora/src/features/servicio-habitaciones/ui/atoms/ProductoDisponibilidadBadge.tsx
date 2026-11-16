import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCircleCheck,
  faCircleXmark,
  faLeaf,
  faSeedling,
} from '@fortawesome/free-solid-svg-icons'

export interface ProductoDisponibilidadBadgeProps {
  available?: boolean
  isVegetarian?: boolean
  isVegan?: boolean
}

/**
 * Átomo: Muestra el estado de disponibilidad y etiquetas dietéticas de un producto.
 */
export function ProductoDisponibilidadBadge({
  available = true,
  isVegetarian = false,
  isVegan = false,
}: ProductoDisponibilidadBadgeProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
          available
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
        }`}
      >
        <FontAwesomeIcon
          icon={available ? faCircleCheck : faCircleXmark}
          className="size-2.5"
        />
        <span>{available ? 'Disponible' : 'No disponible'}</span>
      </span>

      {isVegetarian && (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-semibold text-green-600 dark:text-green-400">
          <FontAwesomeIcon icon={faLeaf} className="size-2.5" />
          <span>Vegetariano</span>
        </span>
      )}

      {isVegan && (
        <span className="inline-flex items-center gap-1 rounded-full bg-teal-500/10 px-2 py-0.5 text-[10px] font-semibold text-teal-600 dark:text-teal-400">
          <FontAwesomeIcon icon={faSeedling} className="size-2.5" />
          <span>Vegano</span>
        </span>
      )}
    </div>
  )
}
