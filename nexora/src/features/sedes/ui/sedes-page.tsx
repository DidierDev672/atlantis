import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { SedesHeader } from './molecules/sedes-header'
import { SedesPanel } from './organisms/sedes-panel'
import type { SedesViewMode } from './molecules/sedes-view-switch'
import { useSedes } from './sedes-context'
import { Loading, useDelayVisibility } from '../../../shared/loading'

export function SedesPage() {
  const [viewMode, setViewMode] = useState<SedesViewMode>('cards')
  const { sedes, isLoading } = useSedes()

  const isVisibleLoading = useDelayVisibility(isLoading, {
    delay: 0,
    minDuration: 700,
  })

  return (
    <main className="min-h-screen bg-canvas px-4 py-12 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="mx-auto w-full max-w-7xl space-y-8"
      >
        <SedesHeader />

        <div className="relative min-h-[360px]">
          <AnimatePresence mode="wait">
            {isVisibleLoading && sedes.length === 0 ? (
              <motion.div
                key="sedes-loading"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center justify-center rounded-2xl border border-line bg-panel p-16 text-center shadow-xs"
              >
                <Loading
                  variant="block"
                  size="md"
                  label="Cargando sedes…"
                  description="Consultando las sedes de la red hotelera en tiempo real."
                  delay={0}
                  minDuration={700}
                />
              </motion.div>
            ) : (
              <motion.div
                key="sedes-content"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="relative"
              >
                <SedesPanel viewMode={viewMode} onViewModeChange={setViewMode} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </main>
  )
}