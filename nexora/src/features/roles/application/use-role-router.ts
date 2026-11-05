import { useState, useEffect, useCallback } from 'react';
import type { NavId } from '../../dashboard/ui/navigation';
import {
  type ApiRole,
  type RoleRedirectDecision,
  resolveRoleRedirect,
} from '../domain/role-router';
import { fetchRoles } from '../infrastructure/api-roles';
import { readAuthUser } from '../../../shared/auth-storage';
import type { StatusCodeValidationResult } from '../../../shared/lib/status-code-validator';

export interface UseRoleRouterReturn {
  /** Lista completa de roles obtenidos del endpoint GET /roles */
  roles: ApiRole[];
  /** Nombre del rol detectado para el usuario actual */
  detectedRoleName: string;
  /** Decisión de navegación generada por el switch sobre el item `name` */
  decision: RoleRedirectDecision;
  /** Indica si el rol corresponde a recepcionista ('reception') */
  isReception: boolean;
  /** ID de navegación en el dashboard (ej. 'recepcion' para recepcionista) */
  targetNavId: NavId;
  /** Estado de carga de los roles */
  loading: boolean;
  /** Resultado de la validación del status code */
  validationResult: StatusCodeValidationResult | null;
  /** Indica si se están utilizando datos de muestra de respaldo */
  isFallback: boolean;
  /** Función para evaluar manualmente cualquier nombre de rol con el switch */
  evaluateRole: (name: string) => RoleRedirectDecision;
  /** Ejecuta la redirección pasando la función navigate del dashboard */
  executeRedirect: (navigate: (id: NavId) => void) => void;
  /** Recarga la lista de roles desde el endpoint */
  reload: () => void;
}

/**
 * Extrae el nombre o id de rol del usuario autenticado guardado en localStorage (`auth_user`).
 */
function getStoredUserRole(): { roleName: string; roleId?: string } {
  const authUser = readAuthUser();
  if (!authUser) return { roleName: '' };

  const roleNameCandidate =
    (typeof authUser.role === 'string' && authUser.role.trim()) ||  
    (typeof authUser.role_name === 'string' && authUser.role_name.trim()) ||
    (typeof authUser.roleName === 'string' && authUser.roleName.trim()) ||
    (typeof authUser.cargo === 'string' && authUser.cargo.trim()) ||
    '';

  const roleIdCandidate =
    (typeof authUser.role_id === 'string' && authUser.role_id.trim()) ||  
    (typeof authUser.roleId === 'string' && authUser.roleId.trim()) ||
    undefined;      

  return {
    roleName: roleNameCandidate,
    roleId: roleIdCandidate,
  };
}

/**
 * Hook de aplicación para gestionar la identificación de roles y la redirección basada en switch.
 * Consume GET /roles con Axios, valida el código HTTP con `status-code-validator.ts`
 * y evalúa el atributo `name` para determinar la página destino.
 */
export function useRoleRouter(): UseRoleRouterReturn {
  const [roles, setRoles] = useState<ApiRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [validationResult, setValidationResult] =
    useState<StatusCodeValidationResult | null>(null);
  const [isFallback, setIsFallback] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Consulta de roles al endpoint /roles
  useEffect(() => {
    let active = true;

    fetchRoles()
      .then((res) => {
        if (!active) return;
        setRoles(res.roles);
        setValidationResult(res.validation);
        setIsFallback(res.isFallback);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [reloadKey]);

  // Obtener rol del usuario autenticado
  const { roleName, roleId } = getStoredUserRole();

  // Buscar coincidencia en la lista de roles por id o por name
  const matchedRole = roles.find((r) => {
    if (roleId && r.id === roleId) return true;
    if (r.name.toLowerCase() === roleName.toLowerCase()) return true;
    return false;
  });

  // Nombre final del rol evaluado en el switch
  const effectiveRoleName = matchedRole?.name || roleName;

  // Evaluación mediante el switch con el item `name`
  const decision = resolveRoleRedirect(effectiveRoleName);

  const executeRedirect = useCallback(
    (navigate: (id: NavId) => void) => {
      // Redirige al destino calculado por el switch (ej. 'recepcion' si es 'reception')
      navigate(decision.targetNavId);
    },
    [decision.targetNavId]
  );

  const reload = useCallback(() => {
    setLoading(true);
    setReloadKey((prev) => prev + 1);
  }, []);

  return {
    roles,
    detectedRoleName: effectiveRoleName,
    decision,
    isReception: decision.isReception,
    targetNavId: decision.targetNavId,
    loading,
    validationResult,
    isFallback,
    evaluateRole: resolveRoleRedirect,
    executeRedirect,
    reload,
  };
}
