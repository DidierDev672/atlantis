import { memo } from 'react'
import { motion } from 'motion/react'
import { fadeUp } from '../../../../design-tokens/motion'
import { useDeviceResourceProfile } from '../../../../shared/lib/use-device-resource-profile'
import { DEFAULT_HOTEL_LOGO, useTemaStore } from '../../../tema/application/tema-store'
import { DEFAULT_HOTEL_NAME } from '../../domain/login'

export interface LoginSuccessStateProps {
  email: string
  onClose: () => void
  onContinue?: () => void
}

/**
 * Molécula: Estado de bienvenida tras autenticación correcta.
 * Cargada de forma perezosa y envuelta en `React.memo`.
 */
export const LoginSuccessState = memo(function LoginSuccessState({
  email,
  onClose,
  onContinue,
}: LoginSuccessStateProps) {
  const hotelLogo = useTemaStore((state) => state.hotelLogo)
  const hotelName = useTemaStore((state) => state.hotelName)
  const {
    policy: { enableAnimations, tier },
  } = useDeviceResourceProfile()

  const displayName =
    hotelName !== DEFAULT_HOTEL_NAME ? hotelName : 'tu hotel'
  const allowMotion = enableAnimations && tier !== 'ultra-light'

  const content = (
    <>
      <span className="text-primary grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-transparent">
        <img
          src={hotelLogo || DEFAULT_HOTEL_LOGO}
          alt={displayName}
          decoding="async"
          className={
            hotelLogo ? 'size-full object-cover' : 'size-full object-contain'
          }
        />
      </span>
      <div className="space-y-1">
        <h3 className="text-ink text-xl font-bold">
          ¡Bienvenido a {displayName}!
        </h3>
        <p className="text-ink-muted text-sm leading-relaxed">
          Aloja acaba de encender las luces de {displayName} solo para ti. Tus
          huéspedes te esperan y hoy también va a ser un gran día para tu
          equipo.
        </p>
        <p className="text-ink-soft text-xs font-medium">{email}</p>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={onContinue}
          className="bg-primary hover:bg-primary/90 focus-visible:ring-primary/40 cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all outline-none focus-visible:ring-2 active:scale-[0.97]"
        >
          Continuar a mi hotel
        </button>
        <button
          type="button"
          onClick={onClose}
          className="border-line text-ink-muted hover:bg-primary/5 hover:text-ink focus-visible:ring-primary/30 cursor-pointer rounded-lg border px-4 py-2 text-sm font-medium transition-all outline-none focus-visible:ring-2 active:scale-[0.97]"
        >
          Salir
        </button>
      </div>
    </>
  )

  const containerClass =
    'flex flex-col items-center gap-4 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-6 py-12 text-center'

  if (!allowMotion) {
    return <div className={containerClass}>{content}</div>
  }

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className={containerClass}
    >
      {content}
    </motion.div>
  )
})
