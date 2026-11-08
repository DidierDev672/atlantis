import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers,
  faXmark,
  faUserCheck,
  faCircleCheck,
  faArrowRight,
  faIdCard,
  faEnvelope,
  faPhone,
  faGlobe,
  faCrosshairs,
  faChevronLeft,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import { fadeUp } from '../../../../design-tokens/motion';
import { ReservaHuespedesMenu } from './reserva-huespedes-menu';
import { ReservaAcompananteForm } from './reserva-acompanante-form';
import {
  CornerShadowSniperCard,
  getSniperCorner,
} from '../atoms/corner-shadow-sniper-card';
import { useHuespedesRegistradosStore } from '../../application/use-huespedes-registrados-store';
import type { PersonApiResponse } from '../../domain/reserva';

export interface ReservaAcompanantesModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalGuests: number;
  titularPerson?: PersonApiResponse | null;
  companions: PersonApiResponse[];
  onSaveCompanion: (companion: PersonApiResponse, index: number) => void;
}

/**
 * Variantes de animación para la transición cinemática de intercambio de cartas de sniper.
 * Emula la salida deslizante con leve giro angular (tilt) y entrada elástica con física spring.
 */
const sniperCardTransitionVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 56 : -56,
    opacity: 0,
    scale: 0.94,
    rotate: dir > 0 ? 2.8 : -2.8,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 340,
      damping: 24,
      mass: 0.75,
    },
  },
  exit: (dir: number) => ({
    x: dir > 0 ? -56 : 56,
    opacity: 0,
    scale: 0.94,
    rotate: dir > 0 ? -2.8 : 2.8,
    transition: {
      duration: 0.18,
      ease: 'easeInOut' as const,
    },
  }),
};

export function ReservaAcompanantesModal({
  isOpen,
  onClose,
  totalGuests,
  titularPerson,
  companions,
  onSaveCompanion,
}: ReservaAcompanantesModalProps) {
  // Store Zustand para centralizar los IDs de huéspedes registrados
  const addHuespedId = useHuespedesRegistradosStore((s) => s.addHuespedId);

  // Huésped/carta activo en el mazo (0: titular, 1..N-1: acompañantes)
  const [activeIndex, setActiveIndex] = useState<number>(1);

  // Dirección cinemática del intercambio de carta (+1: avance hacia la derecha, -1: retroceso hacia la izquierda)
  const [direction, setDirection] = useState<number>(1);

  // Registrar el ID del titular en el store de Zustand si está seleccionado
  useEffect(() => {
    if (titularPerson?.id) {
      addHuespedId(titularPerson.id, {
        name: titularPerson.name,
        document_number: titularPerson.document_number,
        document_type: titularPerson.document_type,
        email: titularPerson.email,
        phone_number: titularPerson.phone_number,
        isTitular: true,
      });
    }
  }, [titularPerson, addHuespedId]);

  // Navegación con cálculo automático de dirección cinemática
  const handleNavigate = (nextIndex: number) => {
    if (nextIndex === activeIndex) return;
    setDirection(nextIndex > activeIndex ? 1 : -1);
    setActiveIndex(nextIndex);
  };

  // Sincronizar al abrir el modal situando en el primer acompañante pendiente de registro sin efectos en cascada
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      const firstPendingIndex = Array.from(
        { length: Math.max(1, totalGuests - 1) },
        (_, i) => i + 1
      ).find((slotIdx) => !companions[slotIdx - 1]);

      const target = firstPendingIndex ?? 1;
      setDirection(1);
      setActiveIndex(target);
    }
  }

  // Cerrar con Escape y bloquear scroll del body
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const totalCompanionsNeeded = Math.max(1, totalGuests - 1);
  const allCompanionsRegistered = companions.length >= totalCompanionsNeeded;

  const handleCompanionSaved = (newPerson: PersonApiResponse) => {
    const companionSlotIndex = activeIndex - 1;
    onSaveCompanion(newPerson, companionSlotIndex);

    // Si aún faltan acompañantes por registrar, avanzar automáticamente al siguiente slot con efecto de carta sniper
    const nextSlot = activeIndex + 1;
    if (nextSlot <= totalCompanionsNeeded) {
      setDirection(1);
      setActiveIndex(nextSlot);
    }
  };

  // Cartas tácticas semitransparentes del mazo ubicadas en las esquinas detrás del modal
  const activeCorners = Array.from(
    { length: Math.max(2, totalGuests) },
    (_, idx) => getSniperCorner(idx)
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-acompanantes-title"
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-3 sm:p-5"
        >
          {/* Backdrop con desenfoque */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 cursor-pointer bg-stone-950/80 backdrop-blur-md"
          />

          {/* CONTENEDOR RELATIVO (Alberga las cartas de sniper en el mazo DETRÁS y el modal AL FRENTE) */}
          <div className="relative isolate my-auto w-full max-w-4xl">
            {/* ========================================================= */}
            {/* 1. CARTAS DE SNIPER SEMITRANSPARENTES EN EL MAZO DETRÁS  */}
            {/* ========================================================= */}
            {activeCorners.map((def) => {
              const isTitular = def.index === 0;
              const companion = !isTitular
                ? companions[def.index - 1]
                : undefined;
              const guestName = isTitular
                ? titularPerson?.name
                : companion?.name;
              const isRegistered = isTitular
                ? Boolean(titularPerson)
                : Boolean(companion);
              const isActive = activeIndex === def.index;
              return (
                <CornerShadowSniperCard
                  key={def.index}
                  def={def}
                  guestName={guestName}
                  isActive={isActive}
                  isRegistered={isRegistered}
                />
              );
            })}

            {/* ========================================================= */}
            {/* 2. CUERPO PRINCIPAL DEL MODAL (z-10, AL FRENTE DEL MAZO) */}
            {/* ========================================================= */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="border-line/80 bg-panel relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-3xl border shadow-2xl ring-1 ring-white/10"
            >
              {/* Header */}
              <div className="border-line bg-canvas/50 flex items-center justify-between border-b px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                    <FontAwesomeIcon icon={faUsers} className="size-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3
                        id="modal-acompanantes-title"
                        className="text-ink text-base font-bold"
                      >
                        Registro de Huéspedes y Acompañantes
                      </h3>
                      <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-700 dark:text-amber-300">
                        DECK {totalGuests} CARTAS
                      </span>
                    </div>
                    <p className="text-ink-muted text-xs">
                      Configuración para {totalGuests} personas ({1} titular +{' '}
                      {totalCompanionsNeeded} acompañante
                      {totalCompanionsNeeded > 1 ? 's' : ''})
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Cerrar modal"
                  className="border-line bg-canvas text-ink-muted hover:bg-panel hover:text-ink grid size-9 cursor-pointer place-items-center rounded-xl border transition"
                >
                  <FontAwesomeIcon icon={faXmark} className="size-4" />
                </button>
              </div>

              {/* Banner de felicitación si todos los acompañantes están completos */}
              {allCompanionsRegistered && (
                <div className="flex items-center justify-between gap-3 border-b border-emerald-500/20 bg-emerald-500/10 px-6 py-2.5 text-xs text-emerald-800 dark:text-emerald-200">
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon
                      icon={faCircleCheck}
                      className="size-4 text-emerald-600"
                    />
                    <span className="font-semibold">
                      ¡Todos los {totalGuests} huéspedes están registrados y
                      listos para la reserva!
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="cursor-pointer rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-700"
                  >
                    Finalizar
                  </button>
                </div>
              )}

              {/* Layout de 2 columnas: Menú a la izquierda + Formulario táctico a la derecha */}
              <div className="grid max-h-[calc(92vh-140px)] grid-cols-1 gap-5 overflow-y-auto p-6 md:grid-cols-12">
                {/* Columna Izquierda: Menú con selector de cartas tácticas */}
                <div className="space-y-3 md:col-span-4">
                  <ReservaHuespedesMenu
                    totalGuests={totalGuests}
                    titularPerson={titularPerson}
                    companions={companions}
                    activeIndex={activeIndex}
                    onSelectIndex={handleNavigate}
                  />
                </div>

                {/* Columna Derecha: Contenedor con Efecto de Intercambio de Carta de Sniper */}
                <div className="bg-canvas/30 border-line relative overflow-hidden rounded-2xl border p-5 shadow-inner md:col-span-8">
                  {/* Filete balístico interior con notches decorativos */}
                  <div className="pointer-events-none absolute inset-2 rounded-xl border border-dashed border-amber-500/20 dark:border-amber-400/20" />
                  <div className="pointer-events-none absolute top-3 left-3 size-2 border-t-2 border-l-2 border-amber-500/70" />
                  <div className="pointer-events-none absolute top-3 right-3 size-2 border-t-2 border-r-2 border-amber-500/70" />
                  <div className="pointer-events-none absolute bottom-3 left-3 size-2 border-b-2 border-l-2 border-amber-500/70" />
                  <div className="pointer-events-none absolute right-3 bottom-3 size-2 border-r-2 border-b-2 border-amber-500/70" />

                  {/* Cabecera Táctica de la Carta de Sniper */}
                  <div className="border-line/80 relative z-10 mb-4 flex items-center justify-between border-b pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="grid size-8 place-items-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                        <FontAwesomeIcon
                          icon={faCrosshairs}
                          className="size-4"
                        />
                      </div>
                      <div>
                        <h4 className="text-ink text-sm font-bold">
                          {activeIndex === 0
                            ? 'Carta Huésped Titular'
                            : `Carta Acompañante #${activeIndex}`}
                        </h4>
                      </div>
                    </div>

                    {/* Controles de cambio táctico de carta */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          handleNavigate(Math.max(0, activeIndex - 1))
                        }
                        disabled={activeIndex === 0}
                        title="Carta anterior"
                        className="border-line bg-canvas text-ink-muted hover:text-ink hover:bg-panel grid size-8 cursor-pointer place-items-center rounded-lg border transition active:scale-95 disabled:opacity-30"
                      >
                        <FontAwesomeIcon
                          icon={faChevronLeft}
                          className="size-3"
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleNavigate(
                            Math.min(totalGuests - 1, activeIndex + 1)
                          )
                        }
                        disabled={activeIndex >= totalGuests - 1}
                        title="Carta siguiente"
                        className="border-line bg-canvas text-ink-muted hover:text-ink hover:bg-panel grid size-8 cursor-pointer place-items-center rounded-lg border transition active:scale-95 disabled:opacity-30"
                      >
                        <FontAwesomeIcon
                          icon={faChevronRight}
                          className="size-3"
                        />
                      </button>
                    </div>
                  </div>

                  {/* Transición Cinemática de Intercambio de Carta de Sniper */}
                  <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                      key={activeIndex}
                      custom={direction}
                      variants={sniperCardTransitionVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      className="relative z-10 w-full"
                    >
                      {activeIndex === 0 ? (
                        /* SLOT 0: HUÉSPED TITULAR REGISTRADO */
                        <div className="space-y-4">
                          <div className="border-line flex items-center justify-between border-b pb-3">
                            <div>
                              <h4 className="text-ink text-sm font-bold">
                                Huésped Titular Principal
                              </h4>
                              <p className="text-ink-muted text-xs">
                                Titular a nombre de quien se emitirá la reserva
                                principal.
                              </p>
                            </div>
                            <span className="bg-primary/10 text-primary inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold">
                              <FontAwesomeIcon
                                icon={faUserCheck}
                                className="size-3"
                              />
                              Titular
                            </span>
                          </div>

                          {titularPerson ? (
                            <div className="space-y-3">
                              <div className="space-y-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-4">
                                <div className="flex items-center gap-3">
                                  <div className="grid size-11 place-items-center rounded-xl bg-emerald-500/15 text-base font-bold text-emerald-600 dark:text-emerald-400">
                                    {titularPerson.name
                                      .slice(0, 2)
                                      .toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="text-ink text-sm font-bold">
                                      {titularPerson.name}
                                    </p>
                                    <p className="text-ink-muted text-xs">
                                      Titular seleccionado en el formulario
                                    </p>
                                  </div>
                                </div>

                                <div className="border-line/60 grid grid-cols-1 gap-2 border-t pt-2 text-xs sm:grid-cols-2">
                                  {titularPerson.document_number && (
                                    <div className="text-ink flex items-center gap-2">
                                      <FontAwesomeIcon
                                        icon={faIdCard}
                                        className="text-ink-muted size-3.5"
                                      />
                                      <span>
                                        Doc:{' '}
                                        <strong>
                                          {titularPerson.document_number}
                                        </strong>
                                      </span>
                                    </div>
                                  )}
                                  {titularPerson.email && (
                                    <div className="text-ink flex items-center gap-2">
                                      <FontAwesomeIcon
                                        icon={faEnvelope}
                                        className="text-ink-muted size-3.5"
                                      />
                                      <span className="truncate">
                                        {titularPerson.email}
                                      </span>
                                    </div>
                                  )}
                                  {titularPerson.phone_number && (
                                    <div className="text-ink flex items-center gap-2">
                                      <FontAwesomeIcon
                                        icon={faPhone}
                                        className="text-ink-muted size-3.5"
                                      />
                                      <span>{titularPerson.phone_number}</span>
                                    </div>
                                  )}
                                  {titularPerson.nationality && (
                                    <div className="text-ink flex items-center gap-2">
                                      <FontAwesomeIcon
                                        icon={faGlobe}
                                        className="text-ink-muted size-3.5"
                                      />
                                      <span>{titularPerson.nationality}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex justify-end pt-2">
                                <button
                                  type="button"
                                  onClick={() => handleNavigate(1)}
                                  className="bg-primary hover:bg-primary-hover inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-white transition active:scale-95"
                                >
                                  <span>Ir al Acompañante #1</span>
                                  <FontAwesomeIcon
                                    icon={faArrowRight}
                                    className="size-3"
                                  />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-center">
                              <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                                Aún no has seleccionado al huésped titular en el
                                formulario principal.
                              </p>
                              <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80">
                                Puedes registrar a los acompañantes a
                                continuación y luego seleccionar al titular en
                                el dropdown "Huésped titular registrado".
                              </p>
                              <button
                                type="button"
                                onClick={() => handleNavigate(1)}
                                className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-amber-700 active:scale-95"
                              >
                                <span>Continuar con los acompañantes</span>
                                <FontAwesomeIcon
                                  icon={faArrowRight}
                                  className="size-3"
                                />
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* SLOTS 1..N: FORMULARIO DE REGISTRO DE ACOMPAÑANTE */
                        <ReservaAcompananteForm
                          companionNumber={activeIndex}
                          existingCompanion={companions[activeIndex - 1]}
                          onSuccess={handleCompanionSaved}
                          onCancel={() => {
                            if (activeIndex > 1)
                              handleNavigate(activeIndex - 1);
                            else onClose();
                          }}
                        />
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {/* Footer */}
              <div className="border-line bg-canvas/60 flex items-center justify-between border-t px-6 py-3.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <p className="text-ink-muted text-xs">
                    Acompañantes guardados:{' '}
                    <strong className="text-ink">
                      {companions.length} de {totalCompanionsNeeded}
                    </strong>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="border-line bg-canvas text-ink hover:bg-panel cursor-pointer rounded-xl border px-4 py-2 text-xs font-semibold transition"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
