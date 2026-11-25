import { Suspense, lazy, memo, useCallback, type ComponentType } from 'react';
import { motion } from 'motion/react';
import { faLayerGroup } from '@fortawesome/free-solid-svg-icons';
import { fadeUp } from '../../../../design-tokens/motion';
import { Drawer } from '../../../../shared/ui/Drawer';
import { useEdificioRegistro } from '../../application/use-edificio-registro';
import type { EdificioInput } from '../../domain/edificio';
import { Button } from '../atoms/button';
import { Loader } from '../atoms/loader';
import type { EdificioFormProps } from '../molecules/edificio-form';

const LazyEdificioForm = lazy<ComponentType<EdificioFormProps>>(async () => {
  try {
    const mod = await import('../molecules/edificio-form');
    return { default: mod.EdificioForm };
  } catch (error) {
    console.error('Error al cargar EdificioForm:', error);
    const Fallback: ComponentType<EdificioFormProps> = () => null;
    return { default: Fallback };
  }
});

export interface EdificioRegistroDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const EdificioRegistroDrawerInner = memo(function EdificioRegistroDrawerInner({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess?: () => void;
}) {
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
  } = useEdificioRegistro({ open: true, onSuccess });

  const handleSafeClose = useCallback(() => {
    try {
      if (!submitting) onClose();
    } catch (error) {
      console.error('Error al cerrar drawer de edificio y pisos:', error);
    }
  }, [onClose, submitting]);

  const handleSedeSelect = useCallback(
    (sedeId: string) => {
      void handleSedeChange(sedeId).catch((error) => {
        console.error('Error al consultar sub-sedes:', error);
      });
    },
    [handleSedeChange]
  );

  const handleFormSubmit = useCallback(
    (values: EdificioInput) => {
      void handleSubmit(values).catch((error) => {
        console.error('Error al registrar edificio y pisos:', error);
      });
    },
    [handleSubmit]
  );

  const handleRetrySedes = useCallback(() => {
    void fetchSedes().catch((error) => {
      console.error('Error al reintentar carga de sedes:', error);
    });
  }, [fetchSedes]);

  return (
    <>
      <Drawer
        isOpen
        onClose={handleSafeClose}
        closeOnBackdropClick={!submitting}
        closeOnEscape={!submitting}
        position="right"
        size="full"
        className="drawer-tablet-40 sm:w-[40vw] sm:max-w-[40vw] md:w-[40vw] md:max-w-[40vw] lg:w-[40vw] lg:max-w-[40vw]"
        icon={faLayerGroup}
        title="Registrar edificio y pisos"
        description="Define la cantidad de pisos disponibles dentro de tu sede."
      >
        {success ? (
          <PisosSuccessState
            success={success}
            onReset={resetForm}
            onClose={handleSafeClose}
          />
        ) : (
          <div className="space-y-4">
            {sedesError ? (
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="flex flex-col items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <p role="status" className="text-sm font-medium text-black">
                  {sedesError}
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  className="shrink-0"
                  onClick={handleRetrySedes}
                  disabled={sedesLoading}
                >
                  Reintentar
                </Button>
              </motion.div>
            ) : null}

            <Suspense
              fallback={
                <div className="flex min-h-48 items-center justify-center">
                  <Loader label="Preparando formulario…" />
                </div>
              }
            >
              <LazyEdificioForm
                sedes={sedes}
                sedesLoading={sedesLoading}
                subSedes={subSedes}
                subSedesLoading={subSedesLoading}
                submitting={submitting}
                submitError={submitError}
                onSedeChange={handleSedeSelect}
                onSubmit={handleFormSubmit}
              />
            </Suspense>
          </div>
        )}
      </Drawer>

      <Loader
        overlay
        visible={submitting}
        size={40}
        label={
          success?.nombre ? `Creando ${success.nombre}…` : 'Registrando pisos…'
        }
      >
        <span className="text-ink-soft max-w-xs text-center text-xs leading-relaxed">
          Un momento: le estamos dando forma y pisos a tu nuevo edificio.
        </span>
      </Loader>
    </>
  );
});

const PisosSuccessState = memo(function PisosSuccessState({
  success,
  onReset,
  onClose,
}: {
  success: { nombre: string; numPisos: string };
  onReset: () => void;
  onClose: () => void;
}) {
  const pisos = Number(success.numPisos);
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
          Quedó ubicado dentro de tu sede, listo para registrar habitaciones en
          sus pisos.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button type="button" variant="secondary" onClick={onReset}>
          Registrar otro
        </Button>
        <Button type="button" onClick={onClose}>
          Listo
        </Button>
      </div>
    </motion.div>
  );
});

/**
 * Organismo: Drawer lateral (40% de pantalla en tablet/iPad/escritorio)
 * para registrar edificios y su cantidad de pisos desde Habitaciones.
 */
export const EdificioRegistroDrawer = memo(function EdificioRegistroDrawer({
  isOpen,
  onClose,
  onSuccess,
}: EdificioRegistroDrawerProps) {
  if (!isOpen) return null;

  return (
    <EdificioRegistroDrawerInner onClose={onClose} onSuccess={onSuccess} />
  );
});

export default EdificioRegistroDrawer;
