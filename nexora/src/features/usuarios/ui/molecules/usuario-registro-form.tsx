import { useMemo, useState, type FormEvent } from 'react'
import type { Role } from '../../../roles/domain/role'
import type { Sede, SubSede } from '../../../sedes/domain/sede'
import { isSuperAdminUser } from '../../../../shared/auth-storage'
import { Input } from '../../../../shared/ui/Input'
import {
  USUARIO_ESTADOS,
  USUARIO_ESTADO_LABELS,
  validateUsuarioInput,
  type UsuarioEstado,
  type UsuarioInput,
  type UsuarioValidationErrors,
} from '../../domain/usuario'
import { Button } from '../atoms/button'
import { RecursosDropdown, type DropdownOption } from '../../../recursos/ui/molecules/recursos-dropdown'

export interface UsuarioRegistroFormProps {
  roles: Role[]
  rolesLoading?: boolean
  sedes: Sede[]
  sedesLoading: boolean
  subSedes: SubSede[]
  subSedesLoading: boolean
  submitting: boolean
  onSedeChange: (sedeId: string) => void
  onSubmit: (values: UsuarioInput) => void
}

export function UsuarioRegistroForm({
  roles,
  rolesLoading = false,
  sedes,
  sedesLoading,
  subSedes,
  subSedesLoading,
  submitting,
  onSedeChange,
  onSubmit,
}: UsuarioRegistroFormProps) {
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rol, setRol] = useState('')
  const [rolesIds, setRolesIds] = useState<string[]>([])
  const [sedeId, setSedeId] = useState('')
  const [sedesIds, setSedesIds] = useState<string[]>([])
  const [subSedeId, setSubSedeId] = useState('')
  const [subSedesIds, setSubSedesIds] = useState<string[]>([])
  const [estado, setEstado] = useState<UsuarioEstado>('activo')
  const [errors, setErrors] = useState<UsuarioValidationErrors>({})

  const isSuperAdmin = isSuperAdminUser()
  const availableRoles = useMemo(
    () =>
      roles.filter((r) => {
        if (isSuperAdmin) return true
        const normalized = r.name.trim().toLowerCase().replace(/[\s-]+/g, '_')
        return normalized !== 'super_admin' && normalized !== 'superadmin'
      }),
    [roles, isSuperAdmin],
  )

  const roleOptions: DropdownOption[] = useMemo(
    () =>
      availableRoles.map((r) => ({
        value: r.id,
        label: r.name,
      })),
    [availableRoles],
  )

  const estadoOptions: DropdownOption[] = useMemo(
    () =>
      USUARIO_ESTADOS.map((val) => ({
        value: val,
        label: USUARIO_ESTADO_LABELS[val],
      })),
    [],
  )

  const sedeOptions: DropdownOption[] = useMemo(
    () =>
      sedes.map((s) => ({
        value: s.id,
        label: s.name,
      })),
    [sedes],
  )

  const subSedeOptions: DropdownOption[] = useMemo(
    () =>
      subSedes.map((sub) => ({
        value: sub.id ?? sub.name,
        label: sub.name,
      })),
    [subSedes],
  )

  const clearError = (field: keyof UsuarioValidationErrors) => {
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev))
  }

  const handleMultiRolChange = (values: string[]) => {
    setRolesIds(values)
    setRol(values[0] ?? '')
    clearError('rol')
  }

  const handleMultiSedeChange = (values: string[]) => {
    setSedesIds(values)
    clearError('sedeId')
    const primary = values[0] ?? ''
    setSedeId(primary)

    if (primary) {
      onSedeChange(primary)
    } else {
      setSubSedesIds([])
      setSubSedeId('')
    }
  }

  const handleMultiSubSedeChange = (values: string[]) => {
    setSubSedesIds(values)
    setSubSedeId(values[0] ?? '')
    clearError('subSedeId')
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const effectiveRolesIds = rolesIds.length > 0 ? rolesIds : rol ? [rol] : []
    const primaryRol = rol || effectiveRolesIds[0] || ''
    const effectiveSedesIds = sedesIds.length > 0 ? sedesIds : sedeId ? [sedeId] : []
    const primarySede = sedeId || effectiveSedesIds[0] || ''

    const values: UsuarioInput = {
      nombre,
      email,
      password,
      rol: primaryRol,
      rolesIds: effectiveRolesIds,
      sedeId: primarySede,
      sedesIds: effectiveSedesIds,
      todasLasSedes: sedes.length > 0 && effectiveSedesIds.length === sedes.length,
      subSedeId: subSedesIds[0] || subSedeId || undefined,
      subSedesIds: subSedesIds.length > 0 ? subSedesIds : undefined,
      estado,
    }
    const nextErrors = validateUsuarioInput(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length === 0) {
      onSubmit(values)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <Input
        label="Nombre"
        placeholder="Ej. Mariana López"
        autoComplete="name"
        maxLength={80}
        required
        value={nombre}
        onChange={(event) => {
          setNombre(event.target.value)
          clearError('nombre')
        }}
        error={errors.nombre}
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
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        }
      />

      <Input
        label="Correo electrónico"
        type="email"
        inputMode="email"
        placeholder="mariana@hotel.com"
        autoComplete="email"
        required
        value={email}
        onChange={(event) => {
          setEmail(event.target.value)
          clearError('email')
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
        type="password"
        placeholder="Mínimo 8 caracteres"
        autoComplete="new-password"
        required
        value={password}
        onChange={(event) => {
          setPassword(event.target.value)
          clearError('password')
        }}
        error={errors.password}
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

      <div className="grid gap-4 sm:grid-cols-2">
        <RecursosDropdown
          label="Rol"
          required
          multiple
          disabled={rolesLoading}
          isLoading={rolesLoading}
          options={roleOptions}
          selectedValues={rolesIds}
          onMultiChange={handleMultiRolChange}
          placeholder={rolesLoading ? 'Cargando roles…' : 'Elige uno o varios roles…'}
          searchPlaceholder="Buscar rol…"
          emptyLabel={rolesLoading ? 'Cargando roles…' : 'No hay roles disponibles'}
          error={errors.rol}
        />

        <RecursosDropdown
          label="Estado"
          required
          multiple={false}
          options={estadoOptions}
          value={estado}
          onChange={(val) => {
            setEstado(val as UsuarioEstado)
            clearError('estado')
          }}
          placeholder="Elige un estado…"
          searchable={false}
          error={errors.estado}
        />
      </div>

      <div className="rounded-xl border border-line bg-canvas/50 p-4 space-y-3">
        <div>
          <span className="text-xs font-bold text-ink block">
            Asignación de Sede(s) Operativa(s)
          </span>
          <span className="text-[11px] text-ink-muted">
            Selecciona en qué sede(s) y sub sede(s) operará este usuario.
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <RecursosDropdown
            label="Sede principal por defecto"
            required
            disabled={sedesLoading}
            isLoading={sedesLoading}
            multiple
            options={sedeOptions}
            selectedValues={sedesIds}
            onMultiChange={handleMultiSedeChange}
            placeholder={sedesLoading ? 'Cargando sedes…' : 'Elige una o varias sedes…'}
            searchPlaceholder="Buscar sede…"
            emptyLabel={sedesLoading ? 'Cargando sedes…' : 'No hay sedes registradas'}
            error={errors.sedeId}
          />

          <RecursosDropdown
            label="Sub sede"
            disabled={!sedeId || sedesIds.length === 0 || subSedesLoading}
            isLoading={subSedesLoading}
            multiple
            options={subSedeOptions}
            selectedValues={subSedesIds}
            onMultiChange={handleMultiSubSedeChange}
            placeholder={
              sedesIds.length === 0
                ? 'Primero elige al menos una sede'
                : subSedesLoading   
                  ? 'Cargando sub sedes…'
                  : subSedeOptions.length === 0
                    ? 'Sin sub sedes registradas'
                    : 'Opcional: elige una o varias sub sedes…'
            }
            searchPlaceholder="Buscar sub sede…"
            emptyLabel={subSedesLoading ? 'Cargando sub sedes…' : 'Sin sub sedes registradas'}
            error={errors.subSedeId}
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-line pt-4">
        <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
          {submitting ? (
            <>
              <span
                className="inline-block size-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                aria-hidden="true"
              />
              Registrando…
            </>
          ) : (
            'Registrar usuario'
          )}
        </Button>
      </div>
    </form>
  )
}