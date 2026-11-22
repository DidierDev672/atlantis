import { useState, type FormEvent } from 'react';
import { motion } from 'motion/react';
import { isAxiosError } from 'axios';
import { api } from '../../../lib/api';
import { fadeIn, fadeUp } from '../../../design-tokens/motion';
import { Input } from '../../../shared/ui/Input';
import { cn } from '../../../shared/lib/cn';
import { updateAuthUserFromLoginResponse } from '../../../shared/auth-storage';
import { DEFAULT_HOTEL_LOGO, useTemaStore } from '../../tema/application/tema-store';
import { Rocket } from '../../../shared/rocket';
import { validateStatusCode } from '../../../shared/lib/status-code-validator';
import {
  resolveRoleRedirect,
  type RoleRedirectDecision,
} from '../../roles/domain/role-router';

const TOKEN_KEY = 'nexora.auth.token';

interface LoginProps {
  /** Se invoca al recibir el token, por si la app quiere redirigir o persistir más allá. */
  onSuccess?: (token: string) => void;
  /** Se invoca al pulsar "Continuar a mi hotel", para navegar al dashboard. */
  onContinue?: () => void;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function Login({ onSuccess, onContinue }: LoginProps) {
  const hotelLogo = useTemaStore((state) => state.hotelLogo);
  const hotelName = useTemaStore((state) => state.hotelName);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [welcomeEmail, setWelcomeEmail] = useState<string | null>(null);
  const [roleIssueModalData, setRoleIssueModalData] = useState<{
    isOpen: boolean;
    decision: RoleRedirectDecision;
    rawRole: string;
    userEmail: string;
  } | null>(null);

  // Limpia el error de un campo en cuanto el usuario vuelve a escribir.
  const clearError = (field: 'email' | 'password') => {
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  // Valida campos vacíos y formato del correo.
  const validate = () => {
    const next: typeof errors = {};
    const value = email.trim();

    if (!value) {
      next.email = 'Escribe tu correo para continuar.';
    } else if (!EMAIL_PATTERN.test(value)) {
      next.email = 'Revisa el formato: usuario@correo.com';
    }

    if (!password) {
      next.password = 'Escribe tu contraseña.';
    }

    return next;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (nextErrors.email || nextErrors.password) return;

    setLoading(true);
    setServerError(null);

    try {
      // Consumimos el endpoint en segundo plano mientras el cohete despega
      const [response] = await Promise.all([
        api.post('/login', {
          email: email.trim(),
          password,
        }),
        // Pausa breve para apreciar el despegue del cohete sin cortes abruptos
        new Promise((resolve) => setTimeout(resolve, 1400)),
      ]);

      const validation = validateStatusCode(response.status);

      if (validation.isValid) {
        const token = (response.data?.token ||
          response.data?.access_token ||
          response.data?.data?.token) as string | undefined;
        if (token) {
          localStorage.setItem(TOKEN_KEY, token);
          localStorage.setItem('auth_token', token);
          onSuccess?.(token);
        }

        // Actualizar la información auth_user en localStorage según la respuesta devuelta por la API REST
        updateAuthUserFromLoginResponse(response.data, email.trim(), token);

        // Extraer el item `role` devuelto por el consumo del endpoint POST /login
        const rawRole = (
          response.data?.role ??
          response.data?.user?.role ??
          response.data?.data?.role ??
          ''
        ) as string;

        // Evaluar el rol mediante el switch estructurado de roles
        let decision: RoleRedirectDecision;
        try {
          decision = resolveRoleRedirect(rawRole);
        } catch {
          decision = resolveRoleRedirect('');
        }

        // En caso de presentar problemas con el switch de roles o requerir advertencia:
        if (decision.hasRoleIssue) {
          setRoleIssueModalData({
            isOpen: true,
            decision,
            rawRole,
            userEmail: email.trim(),
          });
        } else {
          // Rol de recepción identificado sin problemas: mostrar pantalla de bienvenida
          setWelcomeEmail(email.trim());
        }
      } else {
        setServerError(
          validation.message ||
            'No fue posible iniciar sesión. Verifica tus datos de acceso.'
        );
      }
    } catch (error) {
      if (isAxiosError(error)) {
        const status = error.response?.status ?? 0;
        const validation = validateStatusCode(status);
        setServerError(
          validation.message ||
            'No pudimos reconocer esas credenciales. Revisa el correo y la contraseña, y vuelve a intentarlo.'
        );
      } else {
        const fallbackValidation = validateStatusCode(0);
        setServerError(
          fallbackValidation.message ||
            'Aloja no pudo conectarse en este momento. Revisa tu conexión y vuelve a intentarlo en un momento.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="via-primary to-secondary flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#2a1710] px-4 py-12 sm:px-6">
      {/* Resplandor decorativo que suaviza el fondo y da profundidad. */}
      <div
        aria-hidden="true"
        className="bg-cream/10 pointer-events-none absolute -top-32 right-8 size-72 rounded-full blur-3xl"
      />

      <section aria-label="Inicio de sesión" className="w-full max-w-md">
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          className="border-line bg-panel rounded-3xl border p-6 shadow-2xl sm:p-8"
        >
          {welcomeEmail ? (
            <SuccessState
              email={welcomeEmail}
              onClose={() => setWelcomeEmail(null)}
              onContinue={onContinue}
            />
          ) : (
            <>
              <div className="text-center">
                <div className="relative mx-auto mb-5 flex size-20 items-center justify-center">
                  <span
                    aria-hidden="true"
                    className="bg-primary/15 absolute inset-2 rounded-full blur-xl"
                  />

                  <motion.span
                    aria-hidden="true"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-primary/70 absolute -top-2 -left-1"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="size-5"
                      fill="currentColor"
                    >
                      <path d="M12 2l2.9 6.26 6.6.8-4.9 4.5 1.3 6.44L12 16.9 6.1 20l1.3-6.44L2.5 9.06l6.6-.8L12 2z" />
                    </svg>
                  </motion.span>

                  <motion.span
                    aria-hidden="true"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.35 }}
                    className="text-secondary/70 absolute top-4 -right-1"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="size-3"
                      fill="currentColor"
                    >
                      <path d="M12 2l2.9 6.26 6.6.8-4.9 4.5 1.3 6.44L12 16.9 6.1 20l1.3-6.44L2.5 9.06l6.6-.8L12 2z" />
                    </svg>
                  </motion.span>

                  <motion.div
                    aria-hidden="true"
                    animate={{ y: [0, -6, 0] }}
                    transition={{
                      duration: 3.5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    className="bg-cream text-primary shadow-primary/25 grid size-16 place-items-center overflow-hidden rounded-2xl shadow-lg"
                  >
                    <img
                      src={hotelLogo || DEFAULT_HOTEL_LOGO}
                      alt={hotelName || 'Logo del proyecto'}
                      className={hotelLogo ? 'size-full object-cover' : 'size-full object-contain p-1.5'}
                    />
                  </motion.div>
                </div>

                <h1 className="text-ink text-2xl font-bold">
                  {hotelName !== 'Hoteles · Operaciones'
                    ? hotelName
                    : 'Tu hotel toma vida en Aloja'}
                </h1>
                <p className="text-ink-muted mt-1 text-sm">
                  {hotelName !== 'Hoteles · Operaciones'
                    ? `Bienvenido al panel de operaciones de ${hotelName}.`
                    : 'Tu hotel ya te espera: entra y retoma el control de cada detalle con un solo clic.'}
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                className="mt-6 space-y-4"
                noValidate
              >
                <Input
                  label="Correo electrónico"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="tu@hotel.com"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    clearError('email');
                  }}
                  error={errors.email}
                  icon={
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="size-4"
                      aria-hidden="true"
                    >
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  }
                />

                <Input
                  label="Contraseña"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    clearError('password');
                  }}
                  error={errors.password}
                  action={
                    <button
                      type="button"
                      onClick={() => setShowPassword((visible) => !visible)}
                      aria-label={
                        showPassword
                          ? 'Ocultar contraseña'
                          : 'Mostrar contraseña'
                      }
                      aria-pressed={showPassword}
                      className="text-ink-soft hover:bg-primary/5 hover:text-ink focus-visible:ring-primary/40 flex size-8 items-center justify-center rounded-lg transition-colors outline-none focus-visible:ring-2"
                    >
                      {showPassword ? (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="size-4"
                          aria-hidden="true"
                        >
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                          <path d="m1 1 22 22" />
                        </svg>
                      ) : (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="size-4"
                          aria-hidden="true"
                        >
                          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  }
                  icon={
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="size-4"
                      aria-hidden="true"
                    >
                      <rect x="3" y="11" width="18" height="11" rx="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  }
                />

                {serverError && (
                  <motion.p
                    variants={fadeUp}
                    initial="hidden"
                    animate="visible"
                    role="alert"
                    className="border-danger/25 bg-danger/10 text-danger rounded-xl border px-4 py-3 text-sm font-medium"
                  >
                    {serverError}
                  </motion.p>
                )}

                <motion.button
                  type="submit"
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  disabled={loading}
                  className={cn(
                    'bg-primary shadow-primary/25 hover:bg-primary/90 focus-visible:ring-primary/40 focus-visible:ring-offset-panel inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60'
                  )}
                >
                  {loading ? (
                    <>
                      <span
                        className="inline-block size-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                        aria-hidden="true"
                      />
                      Verificando…
                    </>
                  ) : (
                    'Entrar'
                  )}
                </motion.button>
              </form>

              <p className="text-ink-soft mt-4 text-center text-xs">
                ¿No es tu equipo?{' '}
                <a
                  href="#"
                  className="text-primary hover:text-primary/80 font-medium"
                >
                  Restablece tu contraseña
                </a>
              </p>
            </>
          )}
        </motion.div>
      </section>

      {loading && (
        <motion.div
          role="status"
          aria-live="polite"
          className="bg-canvas/85 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="border-line bg-panel flex w-full max-w-sm flex-col items-center gap-5 rounded-3xl border p-6 text-center shadow-2xl sm:p-8"
          >
            <div className="relative flex items-center justify-center">
              <Rocket
                size="md"
                autoLaunch
                loop
                interactive={false}
                timing={{ ignitionMs: 800, ascentMs: 1800 }}
                className="ring-primary/20 bg-canvas/60 shadow-2xl ring-1"
              />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-ink text-lg font-bold">
                {hotelName !== 'Hoteles · Operaciones'
                  ? `Despegando hacia ${hotelName}…`
                  : 'Iniciando despegue hacia tu hotel…'}
              </h3>
              <p className="text-ink-muted text-sm">
                Verificando credenciales y preparando el panel en segundo plano.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Modal informativo cuando se presenta un inconveniente al identificar el rol */}
      {roleIssueModalData?.isOpen && (
        <RoleIssueModal
          isOpen={roleIssueModalData.isOpen}
          decision={roleIssueModalData.decision}
          rawRole={roleIssueModalData.rawRole}
          onContinue={onContinue}
          onClose={() => {
            const savedEmail = roleIssueModalData.userEmail;
            setRoleIssueModalData(null);
            setWelcomeEmail(savedEmail);
          }}
        />
      )}
    </main>
  );
}

function SuccessState({
  email,
  onClose,
  onContinue,
}: {
  email: string;
  onClose: () => void;
  onContinue?: () => void;
}) {
  const hotelLogo = useTemaStore((state) => state.hotelLogo);
  const hotelName = useTemaStore((state) => state.hotelName);
  const displayName =
    hotelName !== 'Hoteles · Operaciones' ? hotelName : 'tu hotel';

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center gap-4 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-6 py-12 text-center"
    >
      <span className="bg-cream text-primary grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl shadow-md">
        <img
          src={hotelLogo || DEFAULT_HOTEL_LOGO}
          alt={displayName}
          className={hotelLogo ? 'size-full object-cover' : 'size-full object-contain p-1.5'}
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
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={onContinue}
          className="bg-primary hover:bg-primary/90 focus-visible:ring-primary/40 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors outline-none focus-visible:ring-2"
        >
          Continuar a mi hotel
        </motion.button>
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={onClose}
          className="border-line text-ink-muted hover:bg-primary/5 hover:text-ink focus-visible:ring-primary/30 rounded-lg border px-4 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2"
        >
          Salir
        </motion.button>
      </div>
    </motion.div>
  );
}

/**
 * Modal informativo cuando se presenta una falla o problema al identificar el rol
 * o cuando el rol no cuenta con una vista especializada activada aún.
 * Regla de oro: No expone IDs técnicos ni credenciales en la interfaz de usuario.
 */
function RoleIssueModal({
  isOpen,
  decision,
  rawRole,
  onContinue,
  onClose,
}: {
  isOpen: boolean;
  decision: RoleRedirectDecision;
  rawRole: string;
  onContinue?: () => void;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  // Formato humano amigable del rol sin IDs
  const displayRole = rawRole?.trim() || decision.roleName || 'No especificado';

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="role-issue-modal-title"
      className="bg-canvas/80 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="border-line bg-panel relative flex w-full max-w-md flex-col items-center gap-5 rounded-3xl border p-6 text-center shadow-2xl sm:p-8"
      >
        {/* Botón superior de cierre */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar aviso de rol"
          className="text-ink-muted hover:text-ink hover:bg-canvas/60 focus-visible:ring-primary/40 absolute top-4 right-4 grid size-8 place-items-center rounded-xl transition-colors outline-none focus-visible:ring-2 cursor-pointer"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-4"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Ícono de aviso ético y empático */}
        <div className="relative flex size-16 items-center justify-center">
          <span
            aria-hidden="true"
            className="bg-amber-500/20 absolute inset-0 rounded-full blur-lg"
          />
          <span className="ring-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 grid size-14 place-items-center rounded-2xl ring-1 shadow-xs">
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
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </span>
        </div>

        {/* Título y subtítulo */}
        <div className="space-y-2">
          <h3
            id="role-issue-modal-title"
            className="text-ink text-xl font-bold tracking-tight"
          >
            Aviso de Identificación de Rol
          </h3>

          {/* Chip de rol detectado (Regla de oro: No IDs) */}
          <div className="flex justify-center">
            <span className="border-line bg-canvas/60 text-ink-muted inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold">
              <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
              Rol detectado: <strong className="text-ink capitalize">{displayRole}</strong>
            </span>
          </div>

          <p className="text-ink-muted text-sm leading-relaxed">
            {decision.issueMessage ||
              'Se presentó un inconveniente para identificar el rol del usuario que está iniciando sesión. No te preocupes: tus credenciales son válidas y tus datos están seguros.'}
          </p>

          <p className="text-ink-soft text-xs leading-relaxed">
            Avanzarás a la página que normalmente se utiliza al iniciar sesión en el hotel. Próximamente se incorporarán las vistas especializadas para más roles.
          </p>
        </div>

        {/* Botones de acción */}
        <div className="mt-2 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              onContinue?.();
            }}
            className="bg-primary hover:bg-primary/90 focus-visible:ring-primary/40 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-colors outline-none focus-visible:ring-2 sm:w-auto cursor-pointer"
          >
            <span>Continuar al panel principal</span>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-4"
              aria-hidden="true"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </motion.button>

          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={onClose}
            className="border-line text-ink-muted hover:bg-canvas/60 hover:text-ink focus-visible:ring-primary/30 inline-flex w-full items-center justify-center rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2 sm:w-auto cursor-pointer"
          >
            Cerrar aviso
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
