import {
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';
import { AnimatePresence, motion, type Variants } from 'motion/react';
import { fadeIn } from '../../design-tokens/motion';
import { cn } from '../lib/cn';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Etiqueta superior del campo. Si se omite, el input queda sin label. */
  label?: string;
  /** Mensaje de error de validación, mostrado en rojo. */
  error?: string;
  /** Texto de ayuda bajo el campo. Se oculta mientras haya un error. */
  hint?: ReactNode;
  /** Icono opcional dentro del input (lado izquierdo o derecho). */
  icon?: ReactNode;
  /** Lado donde se coloca el icono. Por defecto `left`. */
  iconPosition?: 'left' | 'right';
  /** Elemento interactivo opcional al final del input (ej. botón para mostrar/ocultar). */
  action?: ReactNode;
  required?: boolean;
  /** Estado deshabilitado del campo (alias de `disabled`). */
  isDisabled?: boolean;
  /** Clases CSS adicionales específicas para el elemento <input>. */
  inputClassName?: string;
  /** Habilita/deshabilita el botón de alternar mostrar u ocultar contraseña cuando type="password". Por defecto true. */
  showPasswordToggle?: boolean;
}

/** Variantes de Framer Motion para el anillo de foco animado y suave */
const focusRingVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.99,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.2,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  exit: {
    opacity: 0,
    scale: 0.99,
    transition: {
      duration: 0.15,
      ease: 'easeOut',
    },
  },
};

export function Input({
  label,
  error,
  hint,
  icon,
  iconPosition = 'left',
  action,
  required,
  isDisabled,
  disabled,
  className,
  inputClassName,
  id,
  onFocus,
  onBlur,
  type = 'text',
  showPasswordToggle = true,
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const isInputDisabled = isDisabled ?? disabled;
  const autoId = useId();
  const fieldId = id ?? autoId;
  const errorId = `${fieldId}-error`;
  const hasIcon = icon != null;

  // Logica de password
  const isPassword = type === 'password';
  const resolvedType = isPassword && showPassword ? 'text' : type;

  // El toggle aparece si es password, showPasswordToggle está activo y el consumidor no pasó su propio `action`
  const passwordToggle =
    isPassword && showPasswordToggle && !action ? (
      <button
        type="button"
        onClick={() => setShowPassword((prev) => !prev)}
        onMouseDown={(e) => e.preventDefault()} // mantiene el foco en el input
        disabled={isInputDisabled}
        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        aria-pressed={showPassword}
        aria-controls={fieldId}
        className="text-ink-soft hover:text-ink focus-visible:ring-primary/40 flex size-8 items-center justify-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
      >
        <FontAwesomeIcon
          icon={showPassword ? faEyeSlash : faEye}
          className="size-4"
          aria-hidden="true"
        />
      </button>
    ) : null;

  const actionNode = action ?? passwordToggle;
  const hasAction = Boolean(actionNode);

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label
          htmlFor={fieldId}
          className="text-ink mb-1.5 block text-sm font-medium"
        >
          {label}
          {required && (
            <span aria-hidden="true" className="text-danger ml-0.5">
              *
            </span>
          )}
        </label>
      )}

      <div className="relative">
        {hasIcon && (
          <span
            aria-hidden="true"
            className={cn(
              'text-ink-soft pointer-events-none absolute inset-y-0 z-10 flex items-center',
              iconPosition === 'left' ? 'left-3.5' : 'right-3.5'
            )}
          >
            {icon}
          </span>
        )}

        <input
          id={fieldId}
          type={resolvedType}
          disabled={isInputDisabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          className={cn(
            'bg-panel text-ink placeholder:text-ink-soft w-full rounded-xl border px-4 py-2.5 text-sm shadow-xs transition-colors outline-none',
            hasIcon && (iconPosition === 'left' ? 'pl-10' : 'pr-10'),
            hasAction && 'pr-11',
            Boolean(action) && 'pr-11',
            error
              ? 'border-danger/60 focus:border-danger'
              : 'border-line hover:border-ink-soft focus:border-primary',
            'disabled:cursor-not-allowed disabled:opacity-50',
            inputClassName
          )}
          {...props}
        />

        {/* Anillo de foco animado con Framer Motion: sutil ring y boxShadow que emerge suavemente */}
        <AnimatePresence>
          {isFocused && !isInputDisabled && (
            <motion.div
              aria-hidden="true"
              variants={focusRingVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={cn(
                'pointer-events-none absolute inset-0 rounded-xl ring-2',
                error
                  ? 'ring-danger/30 shadow-[0_0_0_3px_rgba(156,59,49,0.12),0_0_14px_rgba(156,59,49,0.15)]'
                  : 'ring-primary/25 shadow-[0_0_0_3px_rgba(90,49,31,0.12),0_0_14px_rgba(90,49,31,0.15)] dark:shadow-[0_0_0_3px_rgba(212,199,183,0.1),0_0_14px_rgba(212,199,183,0.12)]'
              )}
            />
          )}
        </AnimatePresence>

        {actionNode && (
          <span className="pointer-events-none absolute inset-y-0 right-1.5 z-10 flex items-center [&_button]:pointer-events-auto">
            {actionNode}
          </span>
        )}
      </div>

      <AnimatePresence initial={false}>
        {error && (
          <motion.p
            key={errorId}
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            id={errorId}
            role="alert"
            className="text-danger mt-1.5 text-xs font-medium"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {!error && hint != null && (
        <p className="text-ink-soft mt-1.5 text-xs leading-relaxed">{hint}</p>
      )}
    </div>
  );
}
