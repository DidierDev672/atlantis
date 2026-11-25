import { memo, type FormEvent } from 'react'
import { motion } from 'motion/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faEnvelope,
  faEye,
  faEyeSlash,
  faLock,
} from '@fortawesome/free-solid-svg-icons'
import { fadeUp } from '../../../../design-tokens/motion'
import { cn } from '../../../../shared/lib/cn'
import { useDeviceResourceProfile } from '../../../../shared/lib/use-device-resource-profile'
import { Input } from '../../../../shared/ui/Input'
import type { LoginErrors } from '../../domain/login'

export interface LoginFormFieldsProps {
  email: string
  password: string
  showPassword: boolean
  errors: LoginErrors
  loading: boolean
  serverError: string | null
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onToggleShowPassword: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

/**
 * Molécula: Formulario de credenciales de acceso con iconos FontAwesome,
 * validación accesible y botón adaptado al perfil de dispositivo.
 */
export const LoginFormFields = memo(function LoginFormFields({
  email,
  password,
  showPassword,
  errors,
  loading,
  serverError,
  onEmailChange,
  onPasswordChange,
  onToggleShowPassword,
  onSubmit,
}: LoginFormFieldsProps) {
  const {
    policy: { enableAnimations, tier },
  } = useDeviceResourceProfile()
  const allowMotion = enableAnimations && tier !== 'ultra-light'

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
      <Input
        label="Correo electrónico"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="tu@hotel.com"
        value={email}
        onChange={(event) => onEmailChange(event.target.value)}
        error={errors.email}
        icon={<FontAwesomeIcon icon={faEnvelope} className="size-4" />}
      />

      <Input
        label="Contraseña"
        type={showPassword ? 'text' : 'password'}
        autoComplete="current-password"
        placeholder="••••••••"
        value={password}
        onChange={(event) => onPasswordChange(event.target.value)}
        error={errors.password}
        action={
          <button
            type="button"
            onClick={onToggleShowPassword}
            aria-label={
              showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
            }
            aria-pressed={showPassword}
            className="text-ink-soft hover:bg-primary/5 hover:text-ink focus-visible:ring-primary/40 flex size-8 cursor-pointer items-center justify-center rounded-lg transition-colors outline-none focus-visible:ring-2"
          >
            <FontAwesomeIcon
              icon={showPassword ? faEyeSlash : faEye}
              className="size-4"
              aria-hidden="true"
            />
          </button>
        }
        icon={<FontAwesomeIcon icon={faLock} className="size-4" />}
      />

      {serverError &&
        (allowMotion ? (
          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            role="alert"
            className="border-danger/25 bg-danger/10 text-danger rounded-xl border px-4 py-3 text-sm font-medium"
          >
            {serverError}
          </motion.p>
        ) : (
          <p
            role="alert"
            className="border-danger/25 bg-danger/10 text-danger rounded-xl border px-4 py-3 text-sm font-medium"
          >
            {serverError}
          </p>
        ))}

      <button
        type="submit"
        disabled={loading}
        className={cn(
          'bg-primary shadow-primary/25 hover:bg-primary/90 focus-visible:ring-primary/40 focus-visible:ring-offset-panel inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60'
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
      </button>
    </form>
  )
})
