import axios from 'axios';
import { api } from '../../../lib/api';
import {
  validateStatusCode,
  type StatusCodeValidationResult,
} from '../../../shared/lib/status-code-validator';
import { executeBalancedRequest } from '../../reservas/infrastructure/api-load-balancer';
import {
  isHuespedOption,
  isRolesEndpointPath,
  type DropdownOption,
} from '../domain/dropdown';
import { ApiModuleRepository } from './api-module-repository';

const apiModuleRepository = new ApiModuleRepository();

const RESOURCE_ERROR_MESSAGE =
  'Tranqui, no es algo que hayas hecho vos: se nos cruzó algo del otro lado y la lista no llegó a destino. Ya lo estamos resolviendo. Probá de nuevo en un instante y vas a poder elegir tu recurso.';
const UNEXPECTED_ERROR_MESSAGE =
  'Se nos complicó traer tus recursos. No es tu culpa: estamos revisándolo. Probá otra vez en un momento y seguimos.';
const ROLES_ERROR_400 =
  '¡Tranqui, que no cunda el pánico! ✨ Se nos presentó una pequeña situación técnica con el servidor al consultar los roles (código 400), pero toda tu información sigue completamente a salvo. Dale una segunda oportunidad con "Volver a intentar" y los traemos de inmediato.';
const ROLES_UNEXPECTED_ERROR =
  '¡Respira con calma! 🌿 Tuvimos un breve contratiempo de red al intentar traer los roles. Tus datos siguen intactos aquí. Presiona "Volver a intentar" en un momento.';

export interface FetchDropdownOptionsResult {
  options: DropdownOption[];
  defaultRoleOption?: DropdownOption;
  errorMessage: string | null;
  errorValidation?: StatusCodeValidationResult | null;
  rawError?: unknown;
}

interface RawGenericOption {
  id?: string;
  value?: string;
  name?: string;
  label?: string;
  description?: string;
}

function extractArrayItems(raw: unknown): RawGenericOption[] {
  if (Array.isArray(raw)) return raw as RawGenericOption[];
  if (!raw || typeof raw !== 'object') return [];

  const obj = raw as Record<string, unknown>;
  if (Array.isArray(obj.data)) return obj.data as RawGenericOption[];
  if (Array.isArray(obj.categories)) return obj.categories as RawGenericOption[];
  if (Array.isArray(obj.items)) return obj.items as RawGenericOption[];
  if ('name' in obj || 'id' in obj) return [obj as RawGenericOption];
  return [];
}

function mapRoleItems(items: ReadonlyArray<RawGenericOption>): DropdownOption[] {
  return items
    .filter((role) => typeof role.name === 'string')
    .map((role) => {
      const name = String(role.name);
      const lower = name.trim().toLowerCase();
      const isGuest =
        lower === 'guest' || lower === 'huesped' || lower === 'huésped';
      const id = String(role.id ?? name);
      return {
        value: id,
        label: isGuest ? 'Huesped' : name,
        id,
        rawName: name,
      };
    });
}

function mapGenericItems(
  items: ReadonlyArray<RawGenericOption>
): DropdownOption[] {
  return items.map((item) => ({
    value: item.id ?? item.value ?? item.name ?? String(item),
    label: item.name ?? item.label ?? String(item),
    id: item.id,
    rawName: item.name,
  }));
}

/**
 * Consulta remota para `RecursosDropdown` usando balanceo de carga y validación de status code.
 */
export async function fetchDropdownOptionsFromSource(
  endpoint?: string
): Promise<FetchDropdownOptionsResult> {
  const isRoles = isRolesEndpointPath(endpoint);

  try {
    if (isRoles && endpoint) {
      const response = await executeBalancedRequest(
        () => api.get<unknown>(endpoint, { validateStatus: () => true }),
        { maxRetries: 2 }
      );
      const validation = validateStatusCode(response.status);
      if (!validation.isValid) {
        return {
          options: [],
          errorMessage:
            validation.message ||
            (response.status === 400 ? ROLES_ERROR_400 : ROLES_UNEXPECTED_ERROR),
          errorValidation: validation,
          rawError: response.data,
        };
      }

      const roleOptions = mapRoleItems(extractArrayItems(response.data));
      const defaultRoleOption =
        roleOptions.find(isHuespedOption) ?? roleOptions[0];

      return {
        options: roleOptions,
        defaultRoleOption,
        errorMessage: null,
        errorValidation: null,
      };
    }

    if (endpoint) {
      const response = await executeBalancedRequest(
        () => api.get<unknown>(endpoint, { validateStatus: () => true }),
        { maxRetries: 2 }
      );
      const validation = validateStatusCode(response.status);
      if (!validation.isValid) {
        return {
          options: [],
          errorMessage:
            validation.message ||
            (response.status === 400 ? ROLES_ERROR_400 : UNEXPECTED_ERROR_MESSAGE),
          errorValidation: validation,
          rawError: response.data,
        };
      }

      return {
        options: mapGenericItems(extractArrayItems(response.data)),
        errorMessage: null,
        errorValidation: null,
      };
    }

    const resources = await apiModuleRepository.listResources();
    return {
      options: resources.map((resource) => ({
        value: resource.id,
        label: resource.name,
      })),
      errorMessage: null,
      errorValidation: null,
    };
  } catch (err) {
    const status = axios.isAxiosError(err) ? (err.response?.status ?? 0) : 0;
    const validation = validateStatusCode(status);
    return {
      options: [],
      errorMessage:
        validation.message ||
        (isRoles ? ROLES_UNEXPECTED_ERROR : RESOURCE_ERROR_MESSAGE),
      errorValidation: validation,
      rawError: err,
    };
  }
}
