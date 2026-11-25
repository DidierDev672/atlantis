import { memo } from 'react'
import { motion } from 'motion/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleCheck } from '@fortawesome/free-solid-svg-icons'
import { fadeUp } from '../../../../design-tokens/motion'
import { Button } from '../atoms/button'

export interface EdificioSuccessStateProps {
  success: { nombre: string; numPisos: string }
  onReset: () => void
  onClose: () => void
}

/**
 * Molécula: Estado de confirmación tras registrar un edificio y sus pisos.
 */
export const EdificioSuccessState = memo(function EdificioSuccessState({
  success,
  onReset,
  onClose,
}: EdificioSuccessStateProps) {
  const pisos = Number(success.numPisos)
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center gap-4 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-6 py-10 text-center"
    >
      <span className="grid size-14 place-items-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
        <FontAwesomeIcon
          icon={faCircleCheck}
          className="size-7"
          aria-hidden="true"
        />
      </span>
      <div className="space-y-1">
        <h3 className="text-ink text-xl font-bold">
          ¡«{success.nombre}» ya tiene {pisos} {pisos === 1 ? 'piso' : 'pisos'}!
        </h3>
        <p className="text-ink-muted text-sm leading-relaxed">
          Quedó ubicado dentro de tu sede, listo para que empieces a mover tus
          habitaciones hacia él y mantener todo en su lugar.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button type="button" variant="secondary" onClick={onReset}>
          Crear otro edificio
        </Button>
        <Button type="button" onClick={onClose}>
          Listo
        </Button>
      </div>
    </motion.div>
  )
})
