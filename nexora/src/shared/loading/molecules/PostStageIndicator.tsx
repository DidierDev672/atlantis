import { AnimatePresence, motion } from 'motion/react';
import { fadeUp } from '../../../design-tokens/motion';
import type { PostStage, PostStageDetails } from '../type';

interface PostStageIndicatorProps {
  stage: PostStage;
  customTitle?: string;
  customDescription?: string;
}

const STAGES_CONFIG: Record<PostStage, PostStageDetails> = {
  preparing: {
    key: 'preparing',
    stepNumber: 1,
    label: 'Construyendo payload',
    title: 'Construyendo y empaquetando payload',
    description: 'Estructurando los datos del formulario y asegurando el formato antes del despegue.',
  },
  transmitting: {
    key: 'transmitting',
    stepNumber: 2,
    label: 'Despegue y transmisión',
    title: 'Enviando payload al endpoint...',
    description: 'Transmitiendo los datos de forma segura a través de la red.',
  },
  confirming: {
    key: 'confirming',
    stepNumber: 3,
    label: 'Respuesta confirmada',
    title: '¡Operación sincronizada con éxito!',
    description: 'El servidor ha recibido y registrado los datos correctamente.',
  },
};

const STAGES_LIST: PostStage[] = ['preparing', 'transmitting', 'confirming'];

/**
 * Molécula: Indicador de etapas para operaciones POST con psicología del usuario.
 * Proporciona certidumbre y control cognitivo mediante progresión visible.
 */
export function PostStageIndicator({
  stage,
  customTitle,
  customDescription,
}: PostStageIndicatorProps) {
  const currentDetails = STAGES_CONFIG[stage];
  const activeIndex = STAGES_LIST.indexOf(stage);

  return (
    <div className="flex flex-col items-center text-center gap-3 w-full max-w-sm px-2">
      {/* Barra de progreso por etapas */}
      <div className="flex items-center gap-2 w-full justify-center">
        {STAGES_LIST.map((stageKey, idx) => {
          const isDone = idx < activeIndex;
          const isCurrent = idx === activeIndex;

          return (
            <div key={stageKey} className="flex items-center gap-2 flex-1 max-w-[90px]">
              <div className="relative flex-1 h-1.5 rounded-full bg-line/60 overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${
                    isDone
                      ? 'bg-emerald-600 dark:bg-emerald-400'
                      : isCurrent
                      ? 'bg-primary dark:bg-amber-400'
                      : 'bg-transparent'
                  }`}
                  initial={{ width: 0 }}
                  animate={{
                    width: isDone ? '100%' : isCurrent ? '100%' : '0%',
                  }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Número de paso amigable */}
      <span className="text-[11px] font-medium tracking-wide uppercase text-ink-muted">
        Paso {currentDetails.stepNumber} de 3 • {currentDetails.label}
      </span>

      {/* Contenido animado con transición de texto fadeUp */}
      <div className="min-h-[58px] flex flex-col items-center justify-start">
        <AnimatePresence mode="wait">
          <motion.div
            key={stage}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex flex-col items-center gap-1"
          >
            <h4 className="text-base font-bold text-ink leading-snug">
              {customTitle || currentDetails.title}
            </h4>
            <p className="text-xs text-ink-soft leading-relaxed max-w-xs">
              {customDescription || currentDetails.description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
