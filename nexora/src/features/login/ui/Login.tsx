import { Suspense, memo, useCallback } from 'react'
import { MotionConfig, motion } from 'motion/react'
import { fadeIn } from '../../../design-tokens/motion'
import { useDeviceResourceProfile } from '../../../shared/lib/use-device-resource-profile'
import { useTemaStore } from '../../tema/application/tema-store'
import { lazyWithFallback } from '../application/lazy-with-fallback'
import { useLogin } from '../application/use-login'
import { DEFAULT_HOTEL_NAME, type LoginProps } from '../domain/login'
import { LoginLogo } from './atoms/login-logo'
import { LoginFormFields } from './molecules/login-form-fields'
import type { LoginLoadingOverlayProps } from './molecules/login-loading-overlay'
import type { LoginSuccessStateProps } from './molecules/login-success-state'
import type { RoleIssueModalProps } from './molecules/role-issue-modal'

const LazyLoginSuccessState = lazyWithFallback<LoginSuccessStateProps>(
  () =>
    import('./molecules/login-success-state').then((m) => m.LoginSuccessState),
  'LoginSuccessState'
)

const LazyLoginLoadingOverlay = lazyWithFallback<LoginLoadingOverlayProps>(
  () =>
    import('./molecules/login-loading-overlay').then(
      (m) => m.LoginLoadingOverlay
    ),
  'LoginLoadingOverlay'
)

const LazyRoleIssueModal = lazyWithFallback<RoleIssueModalProps>(
  () => import('./molecules/role-issue-modal').then((m) => m.RoleIssueModal),
  'RoleIssueModal'
)

/**
 * Vista principal de inicio de sesión estructurada con Atomic Design,
 * `React.memo`, carga perezosa (`React.lazy` + `async/await`) y perfilado de hardware.
 */
export const Login = memo(function Login({ onSuccess, onContinue }: LoginProps) {
  const hotelLogo = useTemaStore((state) => state.hotelLogo)
  const hotelName = useTemaStore((state) => state.hotelName)
  const {
    policy: { enableAnimations, enableBackdropBlur, tier },
  } = useDeviceResourceProfile()

  const {
    email,
    password,
    showPassword,
    errors,
    loading,
    serverError,
    welcomeEmail,
    roleIssueModalData,
    handleEmailChange,
    handlePasswordChange,
    toggleShowPassword,
    handleDismissWelcome,
    handleCloseRoleIssueModal,
    handleSubmit,
  } = useLogin({ onSuccess })

  const handleFormSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      void handleSubmit(event).catch((error) => {
        console.error('Error inesperado en envío de login:', error)
      })
    },
    [handleSubmit]
  )

  const allowMotion = enableAnimations && tier !== 'ultra-light'
  const isCustomHotel = hotelName !== DEFAULT_HOTEL_NAME

  const cardBody = welcomeEmail ? (
    <Suspense fallback={<div className="min-h-64" aria-hidden="true" />}>
      <LazyLoginSuccessState
        email={welcomeEmail}
        onClose={handleDismissWelcome}
        onContinue={onContinue}
      />
    </Suspense>
  ) : (
    <>
      <div className="text-center">
        <LoginLogo
          hotelLogo={hotelLogo}
          hotelName={hotelName}
          showSparkles={tier === 'full'}
        />

        <h1 className="text-ink text-2xl font-bold">
          {isCustomHotel ? hotelName : 'Tu hotel toma vida en Aloja'}
        </h1>
        <p className="text-ink-muted mt-1 text-sm">
          {isCustomHotel
            ? `Bienvenido al panel de operaciones de ${hotelName}.`
            : 'Tu hotel ya te espera: entra y retoma el control de cada detalle con un solo clic.'}
        </p>
      </div>

      <LoginFormFields
        email={email}
        password={password}
        showPassword={showPassword}
        errors={errors}
        loading={loading}
        serverError={serverError}
        onEmailChange={handleEmailChange}
        onPasswordChange={handlePasswordChange}
        onToggleShowPassword={toggleShowPassword}
        onSubmit={handleFormSubmit}
      />

      <p className="text-ink-soft mt-4 text-center text-xs">
        ¿No es tu equipo?{' '}
        <a
          href="#"
          onClick={(e) => e.preventDefault()}
          className="text-primary hover:text-primary/80 font-medium"
        >
          Restablece tu contraseña
        </a>
      </p>
    </>
  )

  const cardClass =
    'border-line bg-panel rounded-3xl border p-6 shadow-2xl sm:p-8'

  return (
    <MotionConfig reducedMotion={enableAnimations ? 'user' : 'always'}>
      <main className="via-primary to-secondary relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#2a1710] px-4 py-12 sm:px-6">
        {enableBackdropBlur && (
          <div
            aria-hidden="true"
            className="bg-cream/10 pointer-events-none absolute -top-32 right-8 size-72 rounded-full blur-3xl"
          />
        )}

        <section
          aria-label="Inicio de sesión"
          className="relative z-10 w-full max-w-md"
        >
          {allowMotion ? (
            <motion.div
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              className={cardClass}
            >
              {cardBody}
            </motion.div>
          ) : (
            <div className={cardClass}>{cardBody}</div>
          )}
        </section>

        {loading && (
          <Suspense fallback={null}>
            <LazyLoginLoadingOverlay visible={loading} hotelName={hotelName} />
          </Suspense>
        )}

        {roleIssueModalData?.isOpen && (
          <Suspense fallback={null}>
            <LazyRoleIssueModal
              isOpen={roleIssueModalData.isOpen}
              decision={roleIssueModalData.decision}
              rawRole={roleIssueModalData.rawRole}
              onContinue={onContinue}
              onClose={handleCloseRoleIssueModal}
            />
          </Suspense>
        )}
      </main>
    </MotionConfig>
  )
})

export default Login
