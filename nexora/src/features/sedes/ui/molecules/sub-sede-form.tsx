import { useState, type FormEvent } from 'react';
import { Rocket } from '../../../../shared/rocket';
import {
  ADDRESS_MAX,
  NAME_MAX,
  PHONE_MAX,
  SEDE_ESTADOS,
  SEDE_ESTADO_LABELS,
  type SedeEstado,
} from '../../domain/sede';
import { Button } from '../atoms/button';
import {
  RecursosDropdown,
  type DropdownOption,
} from '../../../recursos/ui/molecules/recursos-dropdown';
import { TextArea } from '../atoms/text-area';
import { TextField } from '../atoms/text-field';

const ESTADO_OPTIONS: ReadonlyArray<DropdownOption> = SEDE_ESTADOS.map(
  (val) => ({
    value: val,
    label: SEDE_ESTADO_LABELS[val],
  })
);

const PHONE_PATTERN = /^[\d\s()+-]{7,15}$/;

export interface SubSedeFormValues {
  name: string;
  address: string;
  phone: string;
  estado: SedeEstado;
}

export interface SubSedeFormProps {
  parentName: string;
  submitLabel?: string;
  submitting?: boolean;
  submitError?: string | null;
  onSubmit: (values: SubSedeFormValues) => void;
  onCancel: () => void;
}

interface SubSedeErrors {
  name?: string;
  address?: string;
  phone?: string;
}

export function SubSedeForm({
  parentName,
  submitLabel = 'Agregar sub sede',
  submitting = false,
  submitError = null,
  onSubmit,
  onCancel,
}: SubSedeFormProps) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [estado, setEstado] = useState<SedeEstado>('activa');
  const [errors, setErrors] = useState<SubSedeErrors>({});

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: SubSedeErrors = {};
    const cleanName = name.trim();
    const cleanAddress = address.trim();
    const cleanPhone = phone.trim();

    if (!cleanName) {
      nextErrors.name = 'El nombre es obligatorio.';
    } else if (cleanName.length < 2) {
      nextErrors.name = 'El nombre debe tener al menos 2 caracteres.';
    } else if (cleanName.length > NAME_MAX) {
      nextErrors.name = `El nombre no puede superar los ${NAME_MAX} caracteres.`;
    }

    if (!cleanAddress) {
      nextErrors.address = 'La dirección es obligatoria.';
    } else if (cleanAddress.length < 5) {
      nextErrors.address = 'Escribe una dirección más completa.';
    } else if (cleanAddress.length > ADDRESS_MAX) {
      nextErrors.address = `La dirección no puede superar los ${ADDRESS_MAX} caracteres.`;
    }

    if (!cleanPhone) {
      nextErrors.phone = 'El teléfono es obligatorio.';
    } else if (!PHONE_PATTERN.test(cleanPhone)) {
      nextErrors.phone =
        'Usa solo números, espacios, paréntesis o el símbolo +.';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) {
      onSubmit({
        name: cleanName,
        address: cleanAddress,
        phone: cleanPhone,
        estado,
      });
    }
  };

  if (submitting) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex flex-col items-center justify-center py-8 text-center"
      >
        <Rocket
          size="md"
          autoLaunch
          loop
          interactive={false}
          timing={{ ignitionMs: 800, ascentMs: 1800 }}
          className="ring-primary/20 bg-canvas/60 shadow-2xl ring-1"
        />
        <div className="mt-5 max-w-sm space-y-1.5">
          <h4 className="text-ink text-lg font-bold">
            {name ? `Lanzando «${name}» al mapa…` : 'Lanzando nueva sub sede al mapa…'}
          </h4>
          <p className="text-ink-muted text-sm">
            Registrando tu nueva sub sede en «{parentName}» en segundo plano. Tu
            información está segura y lista para operar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <p className="text-ink-muted text-sm leading-relaxed">
        Cada sub sede fortalece tu red dentro de{' '}
        <span className="text-ink font-semibold">«{parentName}»</span>: más
        cerca de tus huéspedes, más fácil de crecer.
      </p>
      <TextField
        label="Nombre"
        value={name}
        onChange={(event) => setName(event.target.value)}
        error={errors.name}
        hint={`${name.length}/${NAME_MAX} caracteres`}
        placeholder="Ej. Sub sede Norte"
        maxLength={NAME_MAX}
        autoFocus
        required
        disabled={submitting}
      />
      <TextArea
        label="Dirección"
        value={address}
        onChange={(event) => setAddress(event.target.value)}
        error={errors.address}
        hint={`${address.length}/${ADDRESS_MAX} caracteres`}
        placeholder="Calle, número y referencia"
        maxLength={ADDRESS_MAX}
        rows={2}
        required
        disabled={submitting}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Teléfono"
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          error={errors.phone}
          hint={`${phone.length}/${PHONE_MAX} caracteres`}
          placeholder="+57 601 745 2000"
          maxLength={PHONE_MAX}
          required
          disabled={submitting}
        />
        <RecursosDropdown
          label="Estado"
          placeholder="Selecciona el estado…"
          options={ESTADO_OPTIONS}
          value={estado}
          onChange={(val) => setEstado(val as SedeEstado)}
          searchable={false}
          required
          disabled={submitting}
        />
      </div>
      <div className="flex items-center justify-end gap-2 pt-1">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                className="size-4 animate-spin"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
                />
              </svg>
              Guardando…
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
      {submitError ? (
        <p role="alert" className="text-danger text-sm font-medium">
          {submitError}
        </p>
      ) : null}
    </form>
  );
}
