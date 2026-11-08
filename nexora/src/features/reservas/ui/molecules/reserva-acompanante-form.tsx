import {
  useState,
  useEffect,
  useMemo,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheck,
  faUserPlus,
  faCircleNotch,
  faMagnifyingGlass,
} from '@fortawesome/free-solid-svg-icons';
import { Input } from '../../../../shared/ui/Input';
import {
  DatePicker,
  toISODate,
  parseISODate,
} from '../../../../shared/date-picker';
import {
  RecursosDropdown,
  type DropdownOption,
} from '../../../recursos/ui/molecules/recursos-dropdown';
import { Loader } from '../../../tema/ui/atoms/loader';
import { Loading } from '../../../../shared/loading';
import { api } from '../../../../lib/api';
import { validateStatusCode } from '../../../../shared/lib/status-code-validator';
import { executeBalancedRequest } from '../../infrastructure/api-load-balancer';
import {
  readTokenEmail,
  readAuthTokenEmail,
} from '../../../../shared/auth-storage';
import { useHuespedesRegistradosStore } from '../../application/use-huespedes-registrados-store';
import type { PersonApiResponse } from '../../domain/reserva';

export interface PersonByDocumentResponse {
  id: string;
  document_type: string;
  document_number: string;
  name: string;
  phone_number?: string;
  email?: string;
  date_of_birth?: string;
  gender?: string;
  nationality?: string;
  roles?: string[];
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ReservaAcompananteFormProps {
  companionNumber: number;
  existingCompanion?: PersonApiResponse | null;
  onSuccess: (newPerson: PersonApiResponse) => void;
  onCancel?: () => void;
}

const OPCIONES_TIPO_DOC: DropdownOption[] = [
  { value: 'tarjeta de identidad', label: 'tarjeta de identidad' },
  { value: 'Número de identificación', label: 'Número de identificación' },
  { value: 'Tarjeta de extranjería', label: 'Tarjeta de extranjería' },
];

const OPCIONES_GENERO: DropdownOption[] = [
  { value: 'Masculina', label: 'Masculina' },
  { value: 'Femenino', label: 'Femenino' },
  { value: 'Otro', label: 'Otro' },
];

const DEFAULT_ROLE_ID = '52cbc30fd9e6ec72';
const DEFAULT_ROLE_NAME = 'huesped';

/**
 * Obtiene el email del usuario creador desde el JSON 'auth_user' de localStorage
 */
function getCreatedByEmail(): string {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem('auth_user');
      if (raw) {
        const parsed = JSON.parse(raw) as {
          email?: string;
          user?: { email?: string };
        };
        const email = parsed?.email || parsed?.user?.email;
        if (typeof email === 'string' && email.trim().length > 0) {
          return email.trim();
        }
      }
    }
  } catch {
    // Manejo preventivo si el json es inválido o localStorage no está disponible
  }
  return readTokenEmail() || readAuthTokenEmail() || 'ariasdev672@gmail.com';
}

/**
 * Normaliza el tipo de documento hacia los códigos de la API (national_id, id_card, foreign_id)
 */
function normalizeDocType(val: string): string {
  const norm = val.trim().toLowerCase();
  if (norm.includes('tarjeta de identidad') || norm === 'id_card')
    return 'id_card';
  if (norm.includes('extranjer') || norm === 'foreign_id') return 'foreign_id';
  if (norm.includes('identificaci') || norm === 'national_id')
    return 'national_id';
  return val || 'national_id';
}

export function ReservaAcompananteForm({
  companionNumber,
  existingCompanion,
  onSuccess,
  onCancel,
}: ReservaAcompananteFormProps) {
  // Store Zustand para almacenar los IDs de los huéspedes registrados independientemente
  const addHuespedId = useHuespedesRegistradosStore((s) => s.addHuespedId);

  // 1. Tipo de documento -> opciones [tarjeta de identidad, Número de identificación, Tarjeta de extranjería]
  const [documentType, setDocumentType] = useState<string>(() => {
    if (!existingCompanion?.document_type) return 'Número de identificación';
    const dt = existingCompanion.document_type.toLowerCase();
    if (dt === 'id_card') return 'tarjeta de identidad';
    if (dt === 'foreign_id') return 'Tarjeta de extranjería';
    if (dt === 'national_id') return 'Número de identificación';
    return existingCompanion.document_type;
  });

  // 2. Número de documento
  const [documentNumber, setDocumentNumber] = useState<string>(
    existingCompanion?.document_number || ''
  );

  // 3. Nombre completo
  const [name, setName] = useState<string>(existingCompanion?.name || '');

  // 4. Correo electrónico
  const [email, setEmail] = useState<string>(existingCompanion?.email || '');

  // 5. Número de teléfono
  const [phoneNumber, setPhoneNumber] = useState<string>(
    existingCompanion?.phone_number || ''
  );

  // 6. Fecha de nacimiento (formato YYYY-MM-DD ej: "1997-01-07")
  const [dateOfBirth, setDateOfBirth] = useState<string>(
    existingCompanion?.date_of_birth
      ? existingCompanion.date_of_birth.slice(0, 10)
      : ''
  );

  // Fecha parseada para el DatePicker reutilizable (/shared/date-picker)
  const parsedDob = useMemo(() => {
    if (!dateOfBirth) return null;
    const cleanDate = dateOfBirth.includes('T')
      ? dateOfBirth.slice(0, 10)
      : dateOfBirth;
    return parseISODate(cleanDate);
  }, [dateOfBirth]);

  const maxBirthDate = useMemo(() => new Date(), []);

  // 7. Género -> [Masculina, Femenino, Otro]
  const [genre, setGenre] = useState<string>(() => {
    if (existingCompanion?.gender === 'F') return 'Femenino';
    if (existingCompanion?.gender === 'O') return 'Otro';
    return 'Masculina';
  });

  // 8. Nacionalidad -> ej: "CO"
  const [nationality, setNationality] = useState<string>(
    existingCompanion?.nationality || 'CO'
  );

  // 9. Rol: consumiendo GET /roles con axios y validateStatusCode, isDisabled=true
  const [roleOptions, setRoleOptions] = useState<DropdownOption[]>([
    {
      value: DEFAULT_ROLE_ID,
      label: DEFAULT_ROLE_NAME,
      id: DEFAULT_ROLE_ID,
      rawName: DEFAULT_ROLE_NAME,
    },
  ]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>(DEFAULT_ROLE_ID);
  const [loadingRoles, setLoadingRoles] = useState<boolean>(true);

  // Estados de retroalimentación psicológica y de carga
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [independentSuccess, setIndependentSuccess] = useState<{
    id: string;
    name: string;
    message: string;
  } | null>(null);

  // Estados para búsqueda balanceada de huésped por documento (/persons/by-document)
  const [isSearching, setIsSearching] = useState(false);
  const [searchFeedback, setSearchFeedback] = useState<{
    type: 'success' | 'info' | 'warning' | 'error';
    message: string;
  } | null>(null);
  const [existingPersonId, setExistingPersonId] = useState<string | null>(
    existingCompanion?.id || null
  );

  /**
   * Consulta GET /persons/by-document con axios y api-load-balancer al presionar Enter o Esc.
   * Valida el status code con status-code-validator y autocompleta los campos del acompañante.
   */
  const handleSearchByDocument = async () => {
    const docNum = documentNumber.trim();
    if (!docNum) {
      setErrors((prev) => ({
        ...prev,
        documentNumber: 'Ingresa un número de documento para buscar.',
      }));
      return;
    }

    setIsSearching(true);
    setSearchFeedback(null);
    if (errors.documentNumber) {
      setErrors((p) => ({ ...p, documentNumber: '' }));
    }

    const docTypeApi = normalizeDocType(documentType);

    try {
      const response = await executeBalancedRequest(
        async () => {
          try {
            return await api.get<PersonByDocumentResponse>(
              '/persons/by-document',
              {
                params: {
                  document_type: docTypeApi,
                  document_number: docNum,
                },
                validateStatus: () => true,
              }
            );
          } catch {
            return await api.get<PersonByDocumentResponse>(
              '/person/by-document',
              {
                params: {
                  document_type: docTypeApi,
                  document_number: docNum,
                },
                validateStatus: () => true,
              }
            );
          }
        },
        { maxRetries: 1 }
      );

      const status = response?.status ?? 0;
      const validation = validateStatusCode(status);

      if (validation.isValid && response?.data) {
        const data = response.data;
        setExistingPersonId(data.id);
        if (data.name) setName(data.name);
        if (data.email) setEmail(data.email);
        if (data.phone_number) setPhoneNumber(data.phone_number);
        if (data.date_of_birth) {
          setDateOfBirth(data.date_of_birth.slice(0, 10));
        }
        if (data.gender) {
          const g = data.gender.toUpperCase();
          setGenre(g === 'F' ? 'Femenino' : g === 'O' ? 'Otro' : 'Masculina');
        }
        if (data.nationality) {
          setNationality(data.nationality);
        }
        if (data.document_type) {
          const dt = data.document_type.toLowerCase();
          if (dt.includes('id_card')) {
            setDocumentType('tarjeta de identidad');
          } else if (dt.includes('foreign_id')) {
            setDocumentType('Tarjeta de extranjería');
          } else {
            setDocumentType('Número de identificación');
          }
        }
        if (data.roles && data.roles.length > 0 && data.roles[0]) {
          setSelectedRoleId(data.roles[0]);
        }

        // Limpiar errores previos en campos autocompletados
        setErrors({});

        setSearchFeedback({
          type: 'success',
          message: `Huésped encontrado: ${data.name}. Datos autocompletados con éxito.`,
        });
      } else if (status === 404) {
        setSearchFeedback({
          type: 'info',
          message:
            'Documento no registrado previamente. Puedes completar los datos manualmente para registrarlo.',
        });
      } else {
        setSearchFeedback({
          type: validation.category,
          message: validation.message || 'No se pudo verificar el documento.',
        });
      }
    } catch {
      const netValidation = validateStatusCode(0);
      setSearchFeedback({
        type: 'warning',
        message:
          netValidation.message ||
          'Error al conectar con el servicio. Puedes ingresar los datos manualmente.',
      });
    } finally {
      setIsSearching(false);
    }
  };

  /** Manejador de teclado para Enter y Esc en el campo Número de documento */
  const handleDocumentKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      e.nativeEvent.stopImmediatePropagation();
      void handleSearchByDocument();
    }
  };

  // Consumir el endpoint "/roles" con el método GET y validar status code con status-code-validator.ts
  useEffect(() => {
    let isMounted = true;

    const fetchRoles = async () => {
      try {
        setLoadingRoles(true);
        const response = await api.get<
          { id: string; name: string; description?: string }[]
        >('/roles', { validateStatus: () => true });

        const validation = validateStatusCode(response.status);

        if (validation.isValid) {
          const rawData = response.data;
          const rolesList = Array.isArray(rawData)
            ? rawData
            : rawData &&
                typeof rawData === 'object' &&
                Array.isArray((rawData as { data?: unknown[] }).data)
              ? (
                  rawData as {
                    data: { id: string; name: string; description?: string }[];
                  }
                ).data
              : [rawData as { id: string; name: string; description?: string }];

          if (isMounted && rolesList.length > 0) {
            // El item que vamos a utilizar para el dropdown es: name
            const mappedOptions: DropdownOption[] = rolesList.map((item) => ({
              value: item.id || item.name,
              label: item.name,
              id: item.id,
              rawName: item.name,
            }));

            setRoleOptions(mappedOptions);

            // Por defecto seleccionamos el rol 'huesped'
            const huespedRole =
              rolesList.find(
                (r) =>
                  r.name?.trim().toLowerCase() === 'huesped' ||
                  r.name?.trim().toLowerCase() === 'guest'
              ) || rolesList[0];

            if (huespedRole?.id) {
              setSelectedRoleId(huespedRole.id);
            }
          }
        }
      } catch {
        // Fallback seguro manteniendo el rol 'huesped' con ID DEFAULT_ROLE_ID
        if (isMounted) {
          setRoleOptions([
            {
              value: DEFAULT_ROLE_ID,
              label: DEFAULT_ROLE_NAME,
              id: DEFAULT_ROLE_ID,
              rawName: DEFAULT_ROLE_NAME,
            },
          ]);
          setSelectedRoleId(DEFAULT_ROLE_ID);
        }
      } finally {
        if (isMounted) setLoadingRoles(false);
      }
    };

    fetchRoles();

    return () => {
      isMounted = false;
    };
  }, []);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!documentType) errs.documentType = 'El tipo de documento es requerido.';
    if (!documentNumber.trim())
      errs.documentNumber = 'El número de documento es requerido.';
    if (!name.trim())
      errs.name = 'El nombre completo del acompañante es requerido.';
    if (!email.trim()) {
      errs.email = 'El correo electrónico es requerido.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Ingresa un correo electrónico válido.';
    }
    if (!phoneNumber.trim())
      errs.phoneNumber = 'El número de teléfono es requerido.';
    if (!dateOfBirth) errs.dateOfBirth = 'La fecha de nacimiento es requerida.';
    if (!genre) errs.genre = 'El género es requerido.';
    if (!nationality.trim()) errs.nationality = 'La nacionalidad es requerida.';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // 1. Mostrar Loader mientras se construye el payload en segundo plano
    setSubmitting(true);
    setSubmitError(null);
    setIndependentSuccess(null);

    // 2. Construcción en segundo plano del payload exacto solicitado
    const backendDocType = normalizeDocType(documentType);
    const formattedDateOfBirth = dateOfBirth.includes('T')
      ? dateOfBirth.slice(0, 10)
      : dateOfBirth;
    const backendGender =
      genre === 'Femenino' ? 'F' : genre === 'Otro' ? 'O' : 'M';
    const createdBy = getCreatedByEmail();

    const payload = {
      document_type: backendDocType,
      document_number: documentNumber.trim(),
      name: name.trim(),
      phone_number: phoneNumber.trim(),
      email: email.trim(),
      date_of_birth: formattedDateOfBirth,
      gender: backendGender,
      nationality: nationality.trim().toUpperCase() || 'CO',
      roles: [selectedRoleId || DEFAULT_ROLE_ID],
      created_by: createdBy,
    };

    try {
      // 3. Envío al endpoint "/persons" con el método POST
      let response;
      try {
        response = await api.post('/persons', payload, {
          validateStatus: () => true,
        });
      } catch {
        response = await api.post('/person', payload, {
          validateStatus: () => true,
        });
      }

      // 4. Validar el status code utilizando status-code-validator.ts
      const validation = validateStatusCode(response?.status ?? 0);

      if (validation.isValid) {
        const responseData = response.data as
          { id?: string; data?: { id?: string } } | undefined;
        const newId =
          responseData?.id ||
          responseData?.data?.id ||
          existingPersonId ||
          (existingCompanion?.id ?? `guest-${Date.now()}`);

        const cleanId = String(newId);

        // 5. Almacenar el ID del huésped en el store de Zustand
        addHuespedId(cleanId, {
          name: payload.name,
          document_number: payload.document_number,
          document_type: payload.document_type,
          email: payload.email,
          phone_number: payload.phone_number,
          isTitular: false,
        });

        // 6. Mensaje empático en pantalla confirmando el registro independiente del huésped
        const friendlyMessage =
          validation.message ||
          `¡Excelente trabajo! El acompañante ${payload.name} quedó registrado de manera independiente con su propio expediente (ID: ${cleanId}). Sus datos están completamente seguros e integrados a la reserva.`;

        setIndependentSuccess({
          id: cleanId,
          name: payload.name,
          message: friendlyMessage,
        });

        const createdCompanion: PersonApiResponse = {
          id: cleanId,
          document_type: backendDocType,
          document_number: payload.document_number,
          name: payload.name,
          phone_number: payload.phone_number,
          email: payload.email,
          date_of_birth: payload.date_of_birth,
          gender: payload.gender,
          genre: payload.gender,
          nationality: payload.nationality,
        };

        // Notificar al modal padre para avanzar el mazo
        onSuccess(createdCompanion);
      } else {
        // Psicología empática orientada al recepcionista para preservar la calma
        let userFacingError = validation.message;
        if (response?.status === 409) {
          userFacingError =
            '¡Respira con tranquilidad! Tus datos siguen intactos en pantalla. Ya existe una persona registrada con este número de documento o correo en el sistema.';
        } else if (response?.status === 400) {
          userFacingError =
            '¡Toda la información está a salvo! Por favor verifica que el correo electrónico y el documento tengan el formato correcto e inténtalo nuevamente.';
        } else if ((response?.status ?? 0) >= 500) {
          userFacingError =
            '¡No te preocupes! El servidor tuvo una pequeña pausa momentánea. Tus datos no se perdieron; espera un momento y vuelve a presionar "Registrar acompañante".';
        }

        setSubmitError(
          userFacingError ||
            'Tus datos siguen aquí seguros en el formulario. Por favor verifica los campos e inténtalo nuevamente.'
        );
      }
    } catch {
      const netVal = validateStatusCode(0);
      setSubmitError(
        netVal.message ||
          'Tuvimos una pequeña pausa de conexión con el servidor. No te preocupes: tus datos no se perdieron. Prueba de nuevo en un instante.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative space-y-4">
      {/* Componente Loading reutilizable mientras se consume /persons/by-document mediante balanceo preventivo */}
      <Loading
        visible={isSearching}
        variant="overlay"
        size="md"
        label="Buscando datos del acompañante…"
        description="Consultando /persons/by-document mediante balanceo preventivo de carga…"
        delay={0}
        className="z-30 rounded-2xl"
      />

      {/* Componente Loader reutilizable con overlay mientras se procesa la creación en segundo plano */}
      <Loader
        overlay
        visible={submitting}
        label={`Registrando acompañante #${companionNumber} de forma independiente en /persons…`}
        size={36}
      />

      <div className="border-line flex items-center justify-between border-b pb-3">
        <div>
          <h4 className="text-ink text-sm font-bold">
            Acompañante #{companionNumber}
          </h4>
          <p className="text-ink-muted text-xs">
            Ingresa la información personal del acompañante. Cada huésped cuenta
            con su propio registro independiente.
          </p>
        </div>
        {existingCompanion && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
            <FontAwesomeIcon icon={faCheck} className="size-3" />
            Ya registrado
          </span>
        )}
      </div>

      {/* Confirmación psicológica en pantalla de registro independiente completado */}
      {independentSuccess && (
        <div
          role="status"
          className="animate-in fade-in flex items-start gap-3 rounded-2xl border border-emerald-500/35 bg-emerald-500/10 p-4 text-emerald-900 shadow-xs dark:text-emerald-100"
        >
          <span className="mt-0.5 shrink-0 text-xl">🌿</span>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <strong className="block text-xs font-bold sm:text-sm">
                ¡Registro independiente creado con éxito!
              </strong>
              <span className="rounded-md border border-emerald-500/30 bg-emerald-500/20 px-2 py-0.5 font-mono text-[10px] font-semibold">
                ID: {independentSuccess.id}
              </span>
            </div>
            <p className="text-xs leading-relaxed text-emerald-800/90 dark:text-emerald-200/90">
              {independentSuccess.message}
            </p>
          </div>
        </div>
      )}

      {/* Mensaje de error empático si la petición falla */}
      {submitError && (
        <div
          role="alert"
          className="border-danger/30 bg-danger/10 text-danger rounded-xl border p-3 text-xs leading-relaxed"
        >
          {submitError}
        </div>
      )}

      {/* 1. Tipo de documento y 2. Número de documento */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <RecursosDropdown
          id={`tipo-doc-comp-${companionNumber}`}
          label="Tipo de documento"
          options={OPCIONES_TIPO_DOC}
          value={documentType}
          onChange={(val) => {
            setDocumentType(val);
            if (errors.documentType)
              setErrors((p) => ({ ...p, documentType: '' }));
          }}
          error={errors.documentType}
          disabled={submitting}
          required
        />

        <Input
          id={`num-doc-comp-${companionNumber}`}
          label="Número de documento"
          placeholder="Ej: 1038134311 (Enter o Esc para buscar)"
          value={documentNumber}
          onChange={(e) => {
            setDocumentNumber(e.target.value);
            if (errors.documentNumber)
              setErrors((p) => ({ ...p, documentNumber: '' }));
          }}
          onKeyDown={handleDocumentKeyDown}
          error={errors.documentNumber}
          disabled={submitting || isSearching}
          required
          action={
            <button
              type="button"
              onClick={() => void handleSearchByDocument()}
              disabled={submitting || isSearching || !documentNumber.trim()}
              className="text-ink-muted hover:text-primary grid size-8 cursor-pointer place-items-center rounded-lg transition disabled:cursor-not-allowed disabled:opacity-40"
              title="Buscar huésped por documento (o presiona Enter / Esc)"
              aria-label="Buscar huésped por documento"
            >
              <FontAwesomeIcon icon={faMagnifyingGlass} className="size-3.5" />
            </button>
          }
          hint={
            searchFeedback ? (
              <span
                className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${
                  searchFeedback.type === 'success'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : searchFeedback.type === 'info'
                      ? 'text-sky-600 dark:text-sky-400'
                      : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                <span>{searchFeedback.message}</span>
              </span>
            ) : (
              <span className="text-ink-muted text-[10px]">
                Presiona{' '}
                <kbd className="border-line bg-canvas/80 rounded border px-1 py-0.5 font-mono text-[9px]">
                  Enter
                </kbd>{' '}
                o{' '}
                <kbd className="border-line bg-canvas/80 rounded border px-1 py-0.5 font-mono text-[9px]">
                  Esc
                </kbd>{' '}
                para buscar en el sistema
              </span>
            )
          }
        />
      </div>

      {/* 3. Nombre completo y 4. Correo electrónico */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input
          id={`nombre-comp-${companionNumber}`}
          label="Nombre completo"
          placeholder="Ej: DIDIER YESID ARIAS ESPEJO"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (errors.name) setErrors((p) => ({ ...p, name: '' }));
          }}
          error={errors.name}
          disabled={submitting}
          required
        />

        <Input
          id={`email-comp-${companionNumber}`}
          type="email"
          label="Correo electrónico"
          placeholder="ariasd672@gmail.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors((p) => ({ ...p, email: '' }));
          }}
          error={errors.email}
          disabled={submitting}
          required
        />
      </div>

      {/* 5. Número de teléfono y 6. Fecha de nacimiento */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input
          id={`tel-comp-${companionNumber}`}
          type="tel"
          label="Número de teléfono"
          placeholder="Ej: 3242834033"
          value={phoneNumber}
          onChange={(e) => {
            setPhoneNumber(e.target.value);
            if (errors.phoneNumber)
              setErrors((p) => ({ ...p, phoneNumber: '' }));
          }}
          error={errors.phoneNumber}
          disabled={submitting}
          required
        />

        <DatePicker
          id={`fecha-nac-comp-${companionNumber}`}
          label="Fecha de nacimiento"
          placeholder="Elegir fecha de nacimiento…"
          value={parsedDob}
          onChange={(date) => {
            const iso = date ? toISODate(date) : '';
            setDateOfBirth(iso);
            if (errors.dateOfBirth)
              setErrors((p) => ({ ...p, dateOfBirth: '' }));
          }}
          maxDate={maxBirthDate}
          minYear={1920}
          maxYear={new Date().getFullYear()}
          error={errors.dateOfBirth}
          disabled={submitting || isSearching}
          required
          clearable
        />
      </div>

      {/* 7. Género y 8. Nacionalidad */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <RecursosDropdown
          id={`genero-comp-${companionNumber}`}
          label="Género"
          options={OPCIONES_GENERO}
          value={genre}
          onChange={(val) => {
            setGenre(val);
            if (errors.genre) setErrors((p) => ({ ...p, genre: '' }));
          }}
          error={errors.genre}
          disabled={submitting}
          required
        />

        <Input
          id={`nacionalidad-comp-${companionNumber}`}
          label="Nacionalidad"
          placeholder="Ej: CO"
          value={nationality}
          onChange={(e) => {
            setNationality(e.target.value);
            if (errors.nationality)
              setErrors((p) => ({ ...p, nationality: '' }));
          }}
          error={errors.nationality}
          disabled={submitting}
          required
        />
      </div>

      {/* 9. Rol: con el valor 'name' del endpoint /roles y propiedad isDisabled */}
      <div>
        <RecursosDropdown
          id={`rol-comp-${companionNumber}`}
          label="Rol"
          options={roleOptions}
          value={selectedRoleId}
          onChange={setSelectedRoleId}
          isDisabled={true}
          disabled={true}
          placeholder={loadingRoles ? 'Cargando rol (/roles)…' : 'huesped'}
          required
        />
      </div>

      {/* Botones de acción */}
      <div className="border-line flex items-center justify-end gap-3 border-t pt-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="border-line bg-canvas text-ink hover:bg-panel cursor-pointer rounded-xl border px-4 py-2 text-xs font-semibold transition disabled:opacity-50"
          >
            Cancelar
          </button>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="bg-primary shadow-primary/20 hover:bg-primary-hover inline-flex cursor-pointer items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-md transition active:scale-95 disabled:opacity-50"
        >
          {submitting ? (
            <>
              <FontAwesomeIcon
                icon={faCircleNotch}
                className="size-3.5 animate-spin"
              />
              <span>Registrando acompañante…</span>
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faUserPlus} className="size-3.5" />
              <span>
                {existingCompanion
                  ? 'Actualizar acompañante'
                  : 'Registrar acompañante'}
              </span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
