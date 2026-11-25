import { useCallback, useRef, useState, type FormEvent } from 'react'
import { isAxiosError } from 'axios'
import { updateAuthUserFromLoginResponse } from '../../../shared/auth-storage'
import { validateStatusCode } from '../../../shared/lib/status-code-validator'
import {
  resolveRoleRedirect,
  type RoleRedirectDecision,
} from '../../roles/domain/role-router'
import {
  TOKEN_KEY,
  extractAuthToken,
  extractRawRole,
  validateLoginCredentials,
  type LoginErrors,
  type RoleIssueModalData,
} from '../domain/login'
import { loginWithCredentials } from '../infrastructure/api-login-repository'

export interface UseLoginParams {
  onSuccess?: (token: string) => void
}

/**
 * Hook de aplicación para el flujo de autenticación:
 * validación de formulario, envío protegido contra doble clic,
 * persistencia de sesión/rol y manejo de errores `try / catch`.
 */
export function useLogin({ onSuccess }: UseLoginParams = {}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<LoginErrors>({})
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [welcomeEmail, setWelcomeEmail] = useState<string | null>(null)
  const [roleIssueModalData, setRoleIssueModalData] =
    useState<RoleIssueModalData | null>(null)
  const submittingRef = useRef(false)

  const clearError = useCallback((field: 'email' | 'password') => {
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev))
  }, [])

  const handleEmailChange = useCallback(
    (value: string) => {
      setEmail(value)
      clearError('email')
    },
    [clearError]
  )

  const handlePasswordChange = useCallback(
    (value: string) => {
      setPassword(value)
      clearError('password')
    },
    [clearError]
  )

  const toggleShowPassword = useCallback(() => {
    setShowPassword((prev) => !prev)
  }, [])

  const handleDismissWelcome = useCallback(() => {
    setWelcomeEmail(null)
  }, [])

  const handleCloseRoleIssueModal = useCallback(() => {
    try {
      const savedEmail = roleIssueModalData?.userEmail
      setRoleIssueModalData(null)
      if (savedEmail) {
        setWelcomeEmail(savedEmail)
      }
    } catch (error) {
      console.error('Error al cerrar modal de rol:', error)
      setRoleIssueModalData(null)
    }
  }, [roleIssueModalData])

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      if (submittingRef.current) return

      try {
        const nextErrors = validateLoginCredentials(email, password)
        setErrors(nextErrors)
        if (nextErrors.email || nextErrors.password) return
      } catch (validationErr) {
        console.error('Error validando credenciales:', validationErr)
        return
      }

      submittingRef.current = true
      setLoading(true)
      setServerError(null)

      try {
        const response = await loginWithCredentials(email, password)
        const validation = validateStatusCode(response.status)

        if (!validation.isValid) {
          setServerError(
            validation.message ||
              'No fue posible iniciar sesión. Verifica tus datos de acceso.'
          )
          return
        }

        const token = extractAuthToken(response.data)
        if (token) {
          try {
            localStorage.setItem(TOKEN_KEY, token)
            localStorage.setItem('auth_token', token)
          } catch (storageErr) {
            console.warn('No se pudo persistir token en localStorage:', storageErr)
          }
          onSuccess?.(token)
        }

        const cleanEmail = email.trim()
        const updatedUser = updateAuthUserFromLoginResponse(
          response.data,
          cleanEmail,
          token
        )
        const rawRole = extractRawRole(response.data, updatedUser)

        let decision: RoleRedirectDecision
        try {
          decision = resolveRoleRedirect(rawRole)
        } catch {
          decision = resolveRoleRedirect('')
        }

        if (decision.hasRoleIssue) {
          setRoleIssueModalData({
            isOpen: true,
            decision,
            rawRole,
            userEmail: cleanEmail,
          })
        } else {
          setWelcomeEmail(cleanEmail)
        }
      } catch (error) {
        if (isAxiosError(error)) {
          const status = error.response?.status ?? 0
          const validation = validateStatusCode(status)
          setServerError(
            validation.message ||
              'No pudimos reconocer esas credenciales. Revisa el correo y la contraseña, y vuelve a intentarlo.'
          )
        } else {
          const fallbackValidation = validateStatusCode(0)
          setServerError(
            fallbackValidation.message ||
              'Aloja no pudo conectarse en este momento. Revisa tu conexión y vuelve a intentarlo en un momento.'
          )
        }
      } finally {
        setLoading(false)
        submittingRef.current = false
      }
    },
    [email, onSuccess, password]
  )

  return {
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
  }
}
