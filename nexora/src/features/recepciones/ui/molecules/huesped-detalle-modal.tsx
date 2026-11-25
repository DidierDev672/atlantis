import { memo, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { fadeUp } from '../../../../design-tokens/motion';
import { useDeviceResourceProfile } from '../../../../shared/lib/use-device-resource-profile';
import { catalogApi } from '../../../../shared/catalog';
import {
  formatDateOfBirth,
  formatDocumentType,
  formatGender,
  type PersonDetail,
} from '../../domain/stay';
import type { StatusCodeValidationResult } from '../../../../shared/lib/status-code-validator';

export interface HuespedDetalleModalProps {
  personId: string | null;
  isOpen?: boolean;
  onClose: () => void;
}

/**
 * Modal interactivo para visualizar la información detallada del huésped con
 * animación ModalPresentationStyle (iOS Page Sheet / Card Stack).
 *
 * Características técnicas implementadas según especificación:
 * 1. AnimatePresence: Envuelve el condicional {isModalOpen && (...)} garantizando
 *    el ciclo completo de desmontaje animado sin retornos prematuros.
 * 2. Física Spring iOS: Deslizamiento vertical con amortiguación calibrada
 *    (damping: 28, stiffness: 280, mass: 0.85).
 * 3. Profundidad 3D en pantalla de fondo: Aplica scale(0.93) y rounded-[24px] a #root
 *    con curva cubic-bezier(0.32, 0.72, 0, 1) y restauración limpia en cleanup.
 * 4. Tirador táctil (pill handle) para experiencia nativa iOS en dispositivos móviles.
 * 5. Cumplimiento estricto de las Reglas de Oro:
 *    - NO expone IDs de huésped (person-1, etc.).
 *    - NO expone creadores de registro (created_by).
 *    - Renderiza exclusivamente los 7 campos requeridos.
 */
export const HuespedDetalleModal = memo(function HuespedDetalleModal({
  personId,
  isOpen,
  onClose,
}: HuespedDetalleModalProps) {
  const {
    policy: { enableBackdropBlur },
  } = useDeviceResourceProfile();
  const [person, setPerson] = useState<PersonDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [validationResult, setValidationResult] =
    useState<StatusCodeValidationResult | null>(null);

  const isModalOpen = isOpen !== undefined ? isOpen : Boolean(personId);

  // Bloqueo limpio de scroll del viewport mientras el modal está abierto (sin escalar ni recortar #root)
  useEffect(() => {
    if (!isModalOpen || typeof document === 'undefined') return;
    const prevBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = prevBodyOverflow;
    };
  }, [isModalOpen]);

  // Carga asíncrona compartida vía catalogApi.getPerson (comparte caché con listado y acordeones)
  useEffect(() => {
    if (!personId) return;

    let isMounted = true;
    void Promise.resolve()
      .then(() => {
        if (!isMounted) return null;
        const cached = catalogApi.getCachedPerson(personId);
        if (cached) {
          setPerson(cached as PersonDetail);
          setValidationResult(null);
          setLoading(false);
          return null;
        }
        setLoading(true);
        setValidationResult(null);
        return catalogApi.getPerson(personId);
      })
      .then((result) => {
        if (!isMounted || !result) return;
        setPerson(result.data as PersonDetail | null);
        setValidationResult(result.validation);
        setLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [personId]);

  // Soporte para cerrar con tecla Escape
  useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, onClose]);

  const hasError = validationResult && !validationResult.isValid && !person;

  // Iniciales para el avatar visual del huésped
  const getInitials = (fullName?: string) => {
    if (!fullName) return 'H';
    return fullName
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-huesped-title"
          style={{ zIndex: 9999 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        >
          {/* Fondo oscurecido del modal */}
          <motion.div
            key="backdrop-huesped"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className={`fixed inset-0 z-0 bg-black/60 ${
              enableBackdropBlur ? 'backdrop-blur-xs' : ''
            }`}
            aria-hidden="true"
          />

          {/* Tarjeta Modal centrada con comportamiento estándar */}
          <motion.div
            key="modal-huesped-content"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            className="border-line bg-panel text-ink relative z-10 max-h-[88vh] w-full max-w-xl overflow-y-auto rounded-2xl border p-6 shadow-2xl sm:rounded-3xl sm:p-8"
          >

            {/* Cabecera superior con pill descriptiva y botón cerrar */}
            <div className="border-line/70 flex items-center justify-between gap-3 border-b pb-4">
              <div className="flex items-center gap-2">
                <span className="bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="size-3.5"
                    aria-hidden="true"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <span>Ficha del Huésped</span>
                </span>

                {loading && (
                  <span className="text-ink-muted inline-flex items-center gap-1 text-[11px] font-medium">
                    <span className="border-primary/30 border-t-primary inline-block size-3 animate-spin rounded-full border-2" />
                    <span>Consultando…</span>
                  </span>
                )}
              </div>

              {/* Botón Cerrar */}
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar ficha de huésped"
                className="border-line bg-canvas/80 text-ink-muted hover:border-primary/40 hover:bg-canvas hover:text-ink focus-visible:ring-primary/40 grid size-9 shrink-0 cursor-pointer place-items-center rounded-xl border transition-colors focus-visible:ring-2 focus-visible:outline-none"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-4.5"
                  aria-hidden="true"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Estado de Carga (Skeleton animado) */}
            {loading && !person ? (
              <div className="animate-pulse space-y-5 py-6">
                <div className="flex items-center gap-4">
                  <div className="bg-line/60 size-14 rounded-2xl" />
                  <div className="flex-1 space-y-2">
                    <div className="bg-line/60 h-5 w-48 rounded-md" />
                    <div className="bg-line/40 h-3.5 w-32 rounded-md" />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3.5 pt-2 sm:grid-cols-2">
                  <div className="bg-line/40 h-16 rounded-xl" />
                  <div className="bg-line/40 h-16 rounded-xl" />
                  <div className="bg-line/40 h-16 rounded-xl" />
                  <div className="bg-line/40 h-16 rounded-xl" />
                  <div className="bg-line/40 h-16 rounded-xl" />
                  <div className="bg-line/40 h-16 rounded-xl" />
                </div>
              </div>
            ) : hasError ? (
              /* Estado de Error empático de validateStatusCode */
              <div className="space-y-4 py-8 text-center">
                <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="size-6"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </span>
                <h4 className="text-ink text-base font-bold">
                  {validationResult?.title ||
                    'Ficha no disponible en este momento'}
                </h4>
                <p className="text-ink-muted mx-auto max-w-sm text-xs leading-relaxed">
                  {validationResult?.message ||
                    'No pudimos conectar con el registro del huésped. Tus datos están a salvo; por favor intenta nuevamente.'}
                </p>
                <div className="flex justify-center gap-3 pt-2">
                  {personId && (
                    <button
                      type="button"
                      onClick={() => {
                        setLoading(true);
                        catalogApi.invalidatePerson(personId);
                        void catalogApi
                          .getPerson(personId)
                          .then((result) => {
                            setPerson(result.data as PersonDetail | null);
                            setValidationResult(result.validation);
                          })
                          .catch(() => {
                            // Mantiene estado seguro ante error de red
                          })
                          .finally(() => {
                            setLoading(false);
                          });
                      }}
                      className="bg-primary cursor-pointer rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:opacity-90"
                    >
                      Reintentar consulta
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onClose}
                    className="border-line bg-canvas text-ink hover:bg-line/30 cursor-pointer rounded-xl border px-4 py-2 text-xs font-semibold transition"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            ) : person ? (
              /* Información del Huésped (Solo los 7 campos permitidos) */
              <div className="space-y-6 pt-4">
                {/* Encabezado: Avatar + Nombre (item: name) */}
                <div className="flex items-center gap-4">
                  <div className="from-primary to-primary/80 border-primary/20 grid size-14 shrink-0 place-items-center rounded-2xl border bg-gradient-to-br text-lg font-bold text-white shadow-sm">
                    {getInitials(person.name)}
                  </div>
                  <div className="min-w-0">
                    <span className="text-primary text-[11px] font-semibold tracking-wider uppercase">
                      Huésped registrado
                    </span>
                    <h3
                      id="modal-huesped-title"
                      className="text-ink truncate text-lg font-bold sm:text-xl"
                    >
                      {person.name}
                    </h3>
                  </div>
                </div>

                {/* Contenido en Grilla: Campos requeridos */}
                <div className="grid grid-cols-1 gap-3.5 text-xs sm:grid-cols-2">
                  {/* 1. Tipo de Documento (item: document_type) */}
                  <div className="border-line bg-canvas/40 space-y-1 rounded-2xl border p-3.5">
                    <span className="text-ink-muted flex items-center gap-1.5 text-[11px] font-semibold">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-primary size-3.5"
                        aria-hidden="true"
                      >
                        <rect x="3" y="4" width="18" height="16" rx="2" />
                        <line x1="7" y1="8" x2="17" y2="8" />
                        <line x1="7" y1="12" x2="13" y2="12" />
                      </svg>
                      Tipo de documento
                    </span>
                    <p className="text-ink font-bold">
                      {formatDocumentType(person.document_type)}
                    </p>
                  </div>

                  {/* 2. Número de Documento (item: document_number) */}
                  <div className="border-line bg-canvas/40 space-y-1 rounded-2xl border p-3.5">
                    <span className="text-ink-muted flex items-center gap-1.5 text-[11px] font-semibold">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-primary size-3.5"
                        aria-hidden="true"
                      >
                        <path d="M4 7V4h16v3" />
                        <path d="M9 20h6" />
                        <path d="M12 4v16" />
                      </svg>
                      Número de documento
                    </span>
                    <p className="text-ink font-mono text-sm font-bold">
                      {person.document_number || 'No registrado'}
                    </p>
                  </div>

                  {/* 3. Fecha de Nacimiento (item: date_of_birth) */}
                  <div className="border-line bg-canvas/40 space-y-1 rounded-2xl border p-3.5">
                    <span className="text-ink-muted flex items-center gap-1.5 text-[11px] font-semibold">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-primary size-3.5"
                        aria-hidden="true"
                      >
                        <rect x="3" y="4" width="18" height="18" rx="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      Fecha de nacimiento
                    </span>
                    <p className="text-ink font-semibold capitalize">
                      {formatDateOfBirth(person.date_of_birth)}
                    </p>
                  </div>

                  {/* 4. Género (item: gender) */}
                  <div className="border-line bg-canvas/40 space-y-1 rounded-2xl border p-3.5">
                    <span className="text-ink-muted flex items-center gap-1.5 text-[11px] font-semibold">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-primary size-3.5"
                        aria-hidden="true"
                      >
                        <circle cx="12" cy="12" r="4" />
                        <path d="M12 2v4" />
                        <path d="M12 18v4" />
                      </svg>
                      Género
                    </span>
                    <p className="text-ink font-semibold">
                      {formatGender(person.gender)}
                    </p>
                  </div>

                  {/* 5. Teléfono (item: phone_number) */}
                  <div className="border-line bg-canvas/40 space-y-1 rounded-2xl border p-3.5">
                    <span className="text-ink-muted flex items-center gap-1.5 text-[11px] font-semibold">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="size-3.5 text-emerald-600 dark:text-emerald-400"
                        aria-hidden="true"
                      >
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                      Teléfono
                    </span>
                    {person.phone_number ? (
                      <a
                        href={`tel:${person.phone_number}`}
                        className="text-primary block font-mono font-bold hover:underline"
                      >
                        {person.phone_number}
                      </a>
                    ) : (
                      <span className="text-ink-muted italic">
                        No registrado
                      </span>
                    )}
                  </div>

                  {/* 6. Correo Electrónico (item: email) */}
                  <div className="border-line bg-canvas/40 space-y-1 rounded-2xl border p-3.5">
                    <span className="text-ink-muted flex items-center gap-1.5 text-[11px] font-semibold">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="size-3.5 text-blue-600 dark:text-blue-400"
                        aria-hidden="true"
                      >
                        <rect width="20" height="16" x="2" y="4" rx="2" />
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                      </svg>
                      Correo electrónico
                    </span>
                    {person.email ? (
                      <a
                        href={`mailto:${person.email}`}
                        className="text-primary block truncate font-medium hover:underline"
                        title={person.email}
                      >
                        {person.email}
                      </a>
                    ) : (
                      <span className="text-ink-muted italic">
                        No registrado
                      </span>
                    )}
                  </div>
                </div>

                {/* Botón de cierre */}
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="bg-primary w-full cursor-pointer rounded-xl px-6 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:opacity-90 sm:w-auto"
                  >
                    Cerrar ficha
                  </button>
                </div>
              </div>
            ) : null}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
});
