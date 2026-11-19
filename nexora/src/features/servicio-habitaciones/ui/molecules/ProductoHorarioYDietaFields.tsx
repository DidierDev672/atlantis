import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faClock } from '@fortawesome/free-solid-svg-icons'
import { Input } from '../../../../shared/ui/Input'
import { Textarea } from '../../../../shared/ui/Textarea'
import { Switch } from '../atoms/Switch'

export interface ProductoHorarioYDietaFieldsProps {
  startTime: string
  onStartTimeChange: (value: string) => void
  endTime: string
  onEndTimeChange: (value: string) => void
  isVegetarian: boolean
  onIsVegetarianChange: (value: boolean) => void
  isVegan: boolean
  onIsVeganChange: (value: boolean) => void
  available: boolean
  onAvailableChange: (value: boolean) => void
  description: string
  onDescriptionChange: (value: string) => void
}

/**
 * Molécula: Sección de ventana horaria, preferencias dietéticas, disponibilidad
 * y descripción comercial del producto.
 */
export function ProductoHorarioYDietaFields({
  startTime,
  onStartTimeChange,
  endTime,
  onEndTimeChange,
  isVegetarian,
  onIsVegetarianChange,
  isVegan,
  onIsVeganChange,
  available,
  onAvailableChange,
  description,
  onDescriptionChange,
}: ProductoHorarioYDietaFieldsProps) {
  return (
    <>
      {/* Horarios de Servicio ("Solo hora") */}
      <div className="border-line bg-canvas/40 rounded-2xl border p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <span className="text-primary text-xs font-bold tracking-wider uppercase">
              Ventana de Horario
            </span>
            <p className="text-ink-muted text-xs">
              Horas del día en que cocina y bar despachan este producto.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Fecha de inicio (Solo hora)"
            type="time"
            value={startTime}
            onChange={(e) => onStartTimeChange(e.target.value)}
            icon={<FontAwesomeIcon icon={faClock} className="size-4" />}
          />

          <Input
            label="Fecha final (Solo hora)"
            type="time"
            value={endTime}
            onChange={(e) => onEndTimeChange(e.target.value)}
            icon={<FontAwesomeIcon icon={faClock} className="size-4" />}
          />
        </div>
      </div>

      {/* Switches */}
      <div className="space-y-3">
        <span className="text-ink block text-sm font-semibold">
          Preferencias dietéticas y estado en catálogo
        </span>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Switch
            label="¿Es vegetariano?"
            description="Apto para dietas sin carnes"
            checked={isVegetarian}
            onChange={onIsVegetarianChange}
          />

          <Switch
            label="¿Es vegano?"
            description="Libre de derivados animales"
            checked={isVegan}
            onChange={onIsVeganChange}
          />

          <Switch
            label="Disponible"
            description="Habilitado para pedidos hoy"
            checked={available}
            onChange={onAvailableChange}
          />
        </div>
      </div>

      {/* Descripción comercial y notas de sabor */}
      <Textarea
        label="Descripción comercial y notas de sabor"
        rows={3}
        maxLength={280}
        showCount
        resize="none"
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        placeholder="Describe los ingredientes principales, alérgenos o maridajes recomendados..."
      />
    </>
  )
}
