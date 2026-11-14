import { motion, AnimatePresence } from 'motion/react'
import { fadeIn } from '../../../../design-tokens/motion'
import { Input } from '../../../../shared/ui/Input'
import { Textarea } from '../../../../shared/ui/Textarea'
import { RecursosDropdown } from '../../../recursos/ui/molecules/recursos-dropdown'
import { StatusCodeAlert } from '../../../../shared/lib/status-code-validator'
import { Loading } from '../../../../shared/loading'
import { Rocket } from '../../../../shared/rocket/organisms/Rocket'
import { CampanaHotelAnimada } from '../atoms/CampanaHotelAnimada'
import { SeccionCargaImagen } from '../molecules/SeccionCargaImagen'
import { useFormularioServicioHabitacion } from '../../application/use-formulario-servicio-habitacion'

/**
 * Organismo de formulario para el registro y alta de servicios gastronómicos / categorías.
 * Integra RecursosDropdown, balanceador de carga en endpoints (/headquarters, /sub-headquarters, /building),
 * validación estricta de status code, animación de cohete Rocket durante POST /menu-category
 * y retroalimentación visual con /shared/loading.
 */
export function FormularioServicioHabitacionCard() {
  const {
    order,
    setOrder,
    generarOrderAleatorio,
    sedeId,
    handleSedeChange,
    sedeOptions,
    loadingSedes,
    subSedeId,
    handleSubSedeChange,
    subSedeOptions,
    loadingSubSedes,
    edificioId,
    handleEdificioChange,
    edificioOptions,
    loadingEdificios,
    nombreServicio,
    setNombreServicio,
    descripcion,
    setDescripcion,
    imagenArchivo,
    imagenPreview,
    handleImageChange,
    saving,
    feedback,
    setFeedback,
    handleSubmit,
    isLoadingEndpoints,
  } = useFormularioServicioHabitacion()

  return (
    <>
      {/* Animación del cohete Rocket mientras se consume el endpoint POST /menu-category con balanceo de carga */}
      <AnimatePresence>
        {saving && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/75 p-4 backdrop-blur-md select-none text-center"
          >
            <motion.div
              initial={{ scale: 0.9, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 16 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="flex flex-col items-center"
            >
              <div className="relative rounded-3xl border border-white/20 bg-panel/90 p-3 shadow-2xl backdrop-blur-xl">
                <Rocket
                  launch={true}
                  autoLaunch={true}
                  interactive={false}
                  size="md"
                  showStars={true}
                  showPad={true}
                />
              </div>

              <div className="mt-5 space-y-1.5 max-w-sm">
                <h3 className="font-serif text-lg font-bold text-white tracking-wide">
                  Despachando Orden de Servicio
                </h3>
                <p className="text-xs text-white/80 leading-relaxed">
                  Transmitiendo petición balanceada con validación de código de estado al endpoint{' '}
                  <span className="font-mono font-bold text-primary-light">/menu-category</span>…
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        className="w-full rounded-3xl border border-line bg-panel p-6 sm:p-8 shadow-xs"
      >
        {/* Cabecera con microinteracción visual */}
        <div className="flex flex-col gap-3 border-b border-line pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <CampanaHotelAnimada />
            <div>
              <h2 className="font-serif text-xl font-bold tracking-tight text-ink sm:text-2xl">
                Registro de Servicios a la Habitación
              </h2>
              <p className="text-xs text-ink-muted leading-relaxed">
                Asigna la ubicación de sede y edificio, ingresa la orden con precisión y añade la fotografía del servicio.
              </p>
            </div>
          </div>
        </div>

        {/* Notificación de validación de status code (/shared/lib/status-code-validator) */}
        <div className="mt-5">
          <StatusCodeAlert
            validation={feedback}
            dismissible
            onClose={() => setFeedback(null)}
          />
        </div>

        {/* Estado de carga de endpoints de ubicación balanceados (/shared/loading) */}
        {isLoadingEndpoints && (
          <div className="mt-4 flex items-center justify-center rounded-2xl border border-line bg-canvas/70 p-3 shadow-2xs backdrop-blur-xs">
            <Loading
              visible={true}
              variant="inline"
              size="sm"
              label="Consultando y balanceando catálogos de sedes, subsedes y edificios (/headquarters, /sub-headquarters, /building)…"
              delay={0}
              minDuration={300}
            />
          </div>
        )}

        {/* Formulario de Registro */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* 1. Código de orden numérico de 2 dígitos */}
            <div>
              <Input
                label="Order (Código de orden)"
                value={order}
                onChange={(e) => setOrder(e.target.value)}
                placeholder="Ej: 17"
                required
                hint="Identificador numérico de orden o secuencia (dos dígitos)."
                action={
                  <button
                    type="button"
                    onClick={generarOrderAleatorio}
                    className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 active:scale-95 transition-all cursor-pointer"
                    title="Generar número aleatorio de dos dígitos"
                  >
                    <span>Aleatorio</span>
                  </button>
                }
              />
            </div>

            {/* 2. Sede: RecursosDropdown conectado a /headquarters balanceado */}
            <div>
              <RecursosDropdown
                label="Sede"
                placeholder={loadingSedes ? 'Consultando sedes…' : 'Selecciona una sede…'}
                value={sedeId}
                onChange={handleSedeChange}
                options={sedeOptions}
                required
                isLoading={loadingSedes}
                disabled={loadingSedes}
                emptyLabel="No hay sedes disponibles."
              />
            </div>

            {/* 3. Sub Sede: RecursosDropdown dependiente conectado a /sub-headquarters balanceado */}
            <div>
              <RecursosDropdown
                label="Sub sede"
                placeholder={
                  !sedeId
                    ? 'Primero selecciona una sede…'
                    : loadingSubSedes
                      ? 'Consultando sub sedes…'
                      : 'Selecciona una sub sede…'
                }
                value={subSedeId}
                onChange={handleSubSedeChange}
                options={subSedeOptions}
                required
                isLoading={loadingSubSedes}
                disabled={!sedeId || loadingSubSedes}
                emptyLabel={
                  !sedeId
                    ? 'Debes elegir una sede para consultar sus sub sedes'
                    : 'No hay sub sedes disponibles para esta sede.'
                }
              />
            </div>

            {/* 4. Edificio: RecursosDropdown conectado a /building balanceado */}
            <div>
              <RecursosDropdown
                label="Edificio"
                placeholder={loadingEdificios ? 'Consultando edificios…' : 'Selecciona un edificio…'}
                value={edificioId}
                onChange={handleEdificioChange}
                options={edificioOptions}
                required
                isLoading={loadingEdificios}
                disabled={loadingEdificios}
                emptyLabel="No hay edificios disponibles."
              />
            </div>
          </div>

          {/* 5. Nombre del servicio gastronómico */}
          <div>
            <Input
              label="Nombre del servicio"
              value={nombreServicio}
              onChange={(e) => setNombreServicio(e.target.value)}
              placeholder="Ej: Bebidas y Cocteleria"
              required
              hint="Nombre de la categoría o servicio gastronómico."
            />
          </div>

          {/* 6. Descripción del servicio gastronómico */}
          <div>
            <Textarea
              label="Descripción"
              rows={3}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Describe los ingredientes, horarios de servicio o cocteles de autor..."
              hint="Detalla los ingredientes, horarios de servicio o notas destacadas de la categoría."
              autoResize
            />
          </div>

          {/* 7. Sección para cargar imagen desde cualquier dispositivo */}
          <div className="pt-2">
            <SeccionCargaImagen
              imageFile={imagenArchivo}
              imagePreview={imagenPreview}
              onImageChange={handleImageChange}
            />
          </div>

          {/* Botón de acción principal */}
          <div className="flex flex-wrap items-center justify-end gap-3 pt-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-7 py-3 text-xs font-bold text-white shadow-xs transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {saving ? (
                <>
                  <span className="inline-block size-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <span>Guardando...</span>
                </>
              ) : (
                'Guardar y emitir orden de servicio'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </>
  )
}
