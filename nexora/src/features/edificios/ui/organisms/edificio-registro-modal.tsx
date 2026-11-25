import { memo, useCallback } from 'react'
import { motion } from 'motion/react'
import { fadeUp } from '../../../../design-tokens/motion'
import { useEdificioRegistro } from '../../application/use-edificio-registro'
import { Button } from '../atoms/button'
import { Loader } from '../atoms/loader'
import { Modal } from '../atoms/modal'
import { EdificioForm } from '../molecules/edificio-form'

export interface EdificioRegistroModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export const EdificioRegistroModal = memo(function EdificioRegistroModal({
  open,
  onClose,
  onSuccess,
}: EdificioRegistroModalProps) {
  const {
    sedes,
    sedesLoading,
    sedesError,
    subSedes,
    subSedesLoading,
    submitting,
    submitError,
    success,
    fetchSedes,
    handleSedeChange,
    handleSubmit,
    resetForm,
  } = useEdificioRegistro({ open, onSuccess })

  const handleClose = useCallback(() => {
    try {
      if (submitting) return
      resetForm()
      onClose()
    } catch (error) {
      console.error('Error al cerrar modal de edificio:', error)
    }
  }, [onClose, resetForm, submitting])

  return (
    <>
      <Modal
        isOpen={open}
        onClose={handleClose}
        title={success ? undefined : 'Crear edificio'}
        className="max-w-xl"
      >
        {success ? (
          <SuccessState
            success={success}
            onReset={resetForm}
            onClose={handleClose}
          />
        ) : (
          <>
            {sedesError && (
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="mb-4 flex flex-col items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <p role="status" className="text-sm font-medium text-black">
                  {sedesError}
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  className="shrink-0"
                  onClick={() => void fetchSedes()}
                  disabled={sedesLoading}
                >
                  Reintentar
                </Button>
              </motion.div>
            )}
            <EdificioForm
              sedes={sedes}
              sedesLoading={sedesLoading}
              subSedes={subSedes}
              subSedesLoading={subSedesLoading}
              submitting={submitting}
              submitError={submitError}
              onSedeChange={(sedeId) => void handleSedeChange(sedeId)}
              onSubmit={(values) => void handleSubmit(values)}
            />
          </>
        )}
      </Modal>

      <Loader
        overlay
        visible={submitting}
        size={40}
        label={success?.nombre ? `Creando ${success.nombre}…` : 'Creando edificio…'}
      >
        <span className="text-ink-soft max-w-xs text-center text-xs leading-relaxed">
          Un momento: le estamos dando forma y pisos a tu nuevo edificio.
        </span>
      </Loader>
    </>
  )
})

function SuccessState({
  success,
  onReset,
  onClose,
}: {
  success: { nombre: string; numPisos: string }
  onReset: () => void
  onClose: () => void
}) {
  const pisos = Number(success.numPisos)
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center gap-4 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-6 py-10 text-center"
    >
      <span className="grid size-14 place-items-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-7"
          aria-hidden="true"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <path d="m9 11 3 3L22 4" />
        </svg>
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
}
