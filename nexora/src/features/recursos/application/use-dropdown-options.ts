import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  validateStatusCode,
  type StatusCodeValidationResult,
} from '../../../shared/lib/status-code-validator';
import {
  getFallbackOptionsForEndpoint,
  type DropdownOption,
} from '../domain/dropdown';
import { fetchDropdownOptionsFromSource } from '../infrastructure/dropdown-options-repository';

export interface UseDropdownOptionsParams {
  externalOptions?: ReadonlyArray<DropdownOption>;
  endpoint?: string;
  externalIsLoading?: boolean;
  onChange?: (value: string) => void;
  onSelectOption?: (option: DropdownOption) => void;
}

/**
 * Hook de aplicación para obtener opciones remotas/externas sin provocar
 * re-fetches en bucle ni `setState` síncrono dentro de `useEffect`.
 */
export function useDropdownOptions({
  externalOptions,
  endpoint,
  externalIsLoading,
  onChange,
  onSelectOption,
}: UseDropdownOptionsParams) {
  const [internalOptions, setInternalOptions] = useState<
    ReadonlyArray<DropdownOption>
  >([]);
  const [internalLoading, setInternalLoading] = useState(
    externalOptions == null
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorValidation, setErrorValidation] =
    useState<StatusCodeValidationResult | null>(null);
  const [rawError, setRawError] = useState<unknown>(null);

  const isMountedRef = useRef(true);
  const onChangeRef = useRef(onChange);
  const onSelectOptionRef = useRef(onSelectOption);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onSelectOptionRef.current = onSelectOption;
  }, [onSelectOption]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadOptions = useCallback(async () => {
    if (externalOptions != null) return;
    setErrorMessage(null);
    setErrorValidation(null);
    setRawError(null);
    setInternalLoading(true);
    try {
      const result = await fetchDropdownOptionsFromSource(endpoint);
      if (!isMountedRef.current) return;

      if (result.errorMessage) {
        setErrorMessage(result.errorMessage);
        setErrorValidation(result.errorValidation ?? null);
        setRawError(result.rawError ?? null);
        return;
      }

      setInternalOptions(result.options);
      if (result.defaultRoleOption) {
        onSelectOptionRef.current?.(result.defaultRoleOption);
        onChangeRef.current?.(
          result.defaultRoleOption.id || result.defaultRoleOption.value
        );
      }
    } catch (err) {
      console.error('Error inesperado cargando opciones del dropdown:', err);
      if (isMountedRef.current) {
        const validation = validateStatusCode(0);
        setErrorMessage(
          validation.message ?? 'No pudimos cargar las opciones disponibles.'
        );
        setErrorValidation(validation);
        setRawError(err);
      }
    } finally {
      if (isMountedRef.current) {
        setInternalLoading(false);
      }
    }
  }, [externalOptions, endpoint]);

  useEffect(() => {
    if (externalOptions != null) return;
    let active = true;
    void Promise.resolve()
      .then(() => (active ? loadOptions() : undefined))
      .catch((err) => {
        console.error('Error al inicializar opciones del dropdown:', err);
      });
    return () => {
      active = false;
    };
  }, [externalOptions, loadOptions]);

  const options = useMemo(() => {
    const raw = externalOptions ?? internalOptions;
    if (raw.length > 0) return raw;
    return getFallbackOptionsForEndpoint(endpoint);
  }, [externalOptions, internalOptions, endpoint]);

  const isOptionsLoading =
    externalOptions != null
      ? Boolean(externalIsLoading)
      : (externalIsLoading ?? internalLoading);

  return {
    options,
    isOptionsLoading,
    errorMessage,
    errorValidation,
    rawError,
    retryLoadOptions: loadOptions,
  };
}
