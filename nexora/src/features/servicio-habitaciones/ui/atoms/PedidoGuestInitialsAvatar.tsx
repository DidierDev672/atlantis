import { memo } from 'react'
import { formatGuestInitials } from '../../../recepciones/domain/stay'

export interface PedidoGuestInitialsAvatarProps {
  huespedNombre?: string | null
}

function resolveGuestInitials(huespedNombre?: string | null): string {
  try {
    const clean = String(huespedNombre ?? '').trim()
    if (!clean || clean.toLowerCase().startsWith('cargando')) {
      return '…'
    }
    return formatGuestInitials(clean)
  } catch (error) {
    console.error('Error al resolver iniciales del huésped:', error)
    return 'H'
  }
}

/**
 * Átomo: Avatar compacto con las iniciales del huésped en tipografía Poppins (`font-sans`).
 */
export const PedidoGuestInitialsAvatar = memo(
  function PedidoGuestInitialsAvatar({
    huespedNombre,
  }: PedidoGuestInitialsAvatarProps) {
    const initials = resolveGuestInitials(huespedNombre)

    return (
      <span
        aria-hidden="true"
        className="border-primary/20 bg-primary/10 text-primary grid size-8 shrink-0 place-items-center rounded-xl border font-sans text-xs font-bold tracking-tight uppercase"
      >
        {initials}
      </span>
    )
  },
)
