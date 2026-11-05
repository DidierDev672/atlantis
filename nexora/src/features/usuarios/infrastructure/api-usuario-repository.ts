import { api } from '../../../lib/api'
import { readAuthUserEmail } from '../../../shared/auth-storage'
import type { UsuarioInput } from '../domain/usuario'
import type { UsuarioRepository } from '../domain/usuario-repository'

const ESTADO_TO_STATUS: Record<string, string> = {
  activo: 'active',
  inactivo: 'inactive',
}

export class ApiUsuarioRepository implements UsuarioRepository {
  async save(input: UsuarioInput): Promise<void> {
    const sedesIds =
      input.sedesIds && input.sedesIds.length > 0
        ? input.sedesIds
        : input.sedeId
          ? [input.sedeId]
          : []
    const primarySedeId = input.sedeId || sedesIds[0] || null

    const primaryRoleId = input.rol || (input.rolesIds && input.rolesIds[0]) || ''
    const rolesIds = input.rolesIds && input.rolesIds.length > 0 ? input.rolesIds : (primaryRoleId ? [primaryRoleId] : [])

    const response = await api.post('/users', {
      name: input.nombre.trim(),
      email: input.email.trim(),
      password: input.password,
      role_id: primaryRoleId,
      roles_ids: rolesIds,
      headquarters_id: primarySedeId,
      headquarters_ids: sedesIds,
      all_headquarters: Boolean(input.todasLasSedes),
      sub_headquarters_id: input.subSedeId ?? null,
      sub_headquarters_ids: input.subSedesIds ?? (input.subSedeId ? [input.subSedeId] : []),
      status: ESTADO_TO_STATUS[input.estado] ?? 'active',
      created_by: readAuthUserEmail(),
    })
    if (response.status !== 201) {
      throw new Error('Registro de usuario no disponible')
    }
  }
}