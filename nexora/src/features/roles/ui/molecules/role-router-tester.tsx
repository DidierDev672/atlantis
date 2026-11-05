import { useState } from 'react'
import { motion } from 'motion/react'
import { useRoleRouter } from '../../application/use-role-router'
import { resolveRoleRedirect } from '../../domain/role-router'
import type { NavId } from '../../../dashboard/ui/navigation'

export interface RoleRouterTesterProps {
  onNavigate?: (id: NavId) => void
  className?: string
}

/**
 * Componente visual para inspeccionar y probar en tiempo real la lógica del switch de roles.
 * Muestra los roles consultados con Axios desde GET /roles, la validación de status code
 * y la redirección determinada para el item `name` (con 'reception' como caso prioritario).
 */
export function RoleRouterTester({ onNavigate, className = '' }: RoleRouterTesterProps) {
  const { roles, loading, validationResult, isFallback, reload } = useRoleRouter()
  const [selectedRoleName, setSelectedRoleName] = useState<string>('reception')

  const decision = resolveRoleRedirect(selectedRoleName)

  return (
    <div className={`rounded-2xl border border-line bg-panel p-5 shadow-xs space-y-4 ${className}`}>
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-line pb-3">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4.5">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </span>
          <div>
            <h3 className="text-sm font-bold text-ink">Identificador de Roles (Switch por `name`)</h3>
            <p className="text-xs text-ink-muted">
              Consumo GET /roles con Axios · Validador de status code · Redirección automática
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={reload}
          disabled={loading}
          className="self-start sm:self-auto rounded-lg border border-line bg-canvas px-3 py-1.5 text-xs font-semibold text-primary hover:bg-panel transition cursor-pointer"
        >
          {loading ? 'Consultando /roles…' : 'Refrescar roles'}
        </button>
      </div>

      {/* Estado del endpoint y validación */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-semibold text-ink-muted">Estado del endpoint:</span>
        {validationResult ? (
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-semibold ${
            validationResult.isValid
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
              : 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
          }`}>
            <span className={`size-1.5 rounded-full ${validationResult.isValid ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            HTTP {validationResult.status} ({validationResult.title || (validationResult.isValid ? 'OK' : 'Aviso')})
          </span>
        ) : (
          <span className="text-ink-muted">Cargando…</span>
        )}

        {isFallback && (
          <span className="rounded-md border border-line bg-canvas px-2 py-0.5 text-[11px] text-ink-muted">
            Datos estructurados de respaldo activos
          </span>
        )}
      </div>

      {/* Selector de rol para evaluar el switch */}
      <div className="space-y-1.5">
        <label htmlFor="role-select" className="text-xs font-semibold text-ink">
          Selecciona un rol obtenido de GET /roles para evaluar el switch:
        </label>
        <select
          id="role-select"
          value={selectedRoleName}
          onChange={(e) => setSelectedRoleName(e.target.value)}
          className="w-full rounded-xl border border-line bg-canvas px-3 py-2 text-xs font-medium text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
        >
          {roles.map((r) => (
            <option key={r.id} value={r.name}>
              {r.name} {r.name === 'reception' ? '⭐ (Redirige a Recepción)' : ''} — {r.description || 'Sin descripción'}
            </option>
          ))}
        </select>
      </div>

      {/* Resultado de la evaluación del switch */}
      <div className="rounded-xl border border-line/70 bg-canvas/60 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-ink-muted">Evaluación en switch(role.name):</span>
          {decision.isReception ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="size-3.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Caso: reception (Recepcionista)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-line bg-panel px-2.5 py-0.5 text-xs font-medium text-ink-muted">
              Caso: {decision.roleName}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-[11px] text-ink-muted block">Destino de navegación:</span>
            <span className="font-bold text-ink">Página: '{decision.targetNavId}'</span>
          </div>
          <div>
            <span className="text-[11px] text-ink-muted block">Título resuelto:</span>
            <span className="font-semibold text-primary">{decision.pageTitle}</span>
          </div>
        </div>

        <p className="text-xs text-ink-muted leading-relaxed">
          {decision.description}
        </p>

        {/* Botón de acción para ejecutar la redirección */}
        {onNavigate && (
          <div className="pt-2 border-t border-line/60 flex items-center justify-between">
            <span className="text-[11px] text-ink-muted">
              {decision.isReception
                ? 'El rol `reception` tiene redirección activa al dashboard de recepcionista.'
                : 'Rol pendiente de redirección personalizada futura.'}
            </span>
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate(decision.targetNavId)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:opacity-90 transition cursor-pointer"
            >
              <span>Ir a {decision.pageTitle}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="size-3.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </motion.button>
          </div>
        )}
      </div>
    </div>
  )
}

