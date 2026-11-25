import { parseISODate } from '../../../shared/date-picker';

export interface DatosBasicosHuesped {
  id?: string;
  tipoDocumento: string;
  numeroDocumento: string;
  nombreCompleto: string;
  email?: string;
  fechaNacimiento: string;
  genero: string;
  nacionalidad: string;
  numeroTelefono: string;
  roleId?: string;
  roles?: string[];
}

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

export interface CornerDefinition {
  index: number;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  callsign: string;
  role: string;
  range: string;
  cornerLabel: string;
  containerClasses: string;
  restTransform: {
    y: number;
    x: number;
    rotate: number;
    opacity: number;
    scale: number;
  };
  cardAnchorClasses: string;
}

export const OPCIONES_TIPO_DOCUMENTO = [
  { value: 'Tarjeta de identificacion', label: 'Tarjeta de identificación' },
  { value: 'Identificacion nacional', label: 'Identificación nacional' },
  { value: 'Identificacion extranjera', label: 'Identificación extranjera' },
] as const;

export const OPCIONES_GENERO = [
  { value: 'M', label: 'M (Masculino)' },
  { value: 'F', label: 'F (Femenino)' },
] as const;

export const INITIAL_HUESPED_STATE: DatosBasicosHuesped = {
  tipoDocumento: '',
  numeroDocumento: '',
  nombreCompleto: '',
  email: '',
  fechaNacimiento: '',
  genero: '',
  nacionalidad: 'Colombia',
  numeroTelefono: '',
  roleId: '',
  roles: [],
};

export function mapDocumentTypeToApi(tipoDocumento?: string): string {
  const norm = (tipoDocumento || '').trim().toLowerCase();
  if (norm.includes('nacional') || norm === 'national_id') return 'national_id';
  if (norm.includes('tarjeta') || norm === 'id_card') return 'id_card';
  if (
    norm.includes('extranjera') ||
    norm.includes('pasaporte') ||
    norm === 'foreign_id'
  ) {
    return 'foreign_id';
  }
  return 'national_id';
}

export function mapDocumentTypeToUx(documentType?: string): string {
  const norm = (documentType || '').trim().toLowerCase();
  if (norm === 'national_id' || norm.includes('nacional')) {
    return 'Identificacion nacional';
  }
  if (norm === 'id_card' || norm.includes('tarjeta')) {
    return 'Tarjeta de identificacion';
  }
  if (
    norm === 'foreign_id' ||
    norm.includes('extranjera') ||
    norm.includes('pasaporte')
  ) {
    return 'Identificacion extranjera';
  }
  return 'Identificacion nacional';
}

export function mapGenderToUx(gender?: string): string {
  if (!gender) return '';
  const g = gender.trim().toUpperCase();
  if (g === 'M' || g.startsWith('MASC') || g.includes('(MASCULINO)')) {
    return 'M';
  }
  if (g === 'F' || g.startsWith('FEM') || g.includes('(FEMENINO)')) {
    return 'F';
  }
  return g;
}

export function mapDateOfBirthToUx(dob?: string): string {
  if (!dob) return '';
  if (dob.includes('T')) {
    return dob.split('T')[0];
  }
  return dob;
}

export function parseBirthDate(val?: string): Date | null {
  if (!val) return null;
  const cleanVal = mapDateOfBirthToUx(val).trim();
  return parseISODate(cleanVal);
}

export function parseGuestCount(val?: string | number): number {
  if (val === undefined || val === null || val === '') return 2;
  if (typeof val === 'number') {
    return Math.max(1, Math.min(10, Math.floor(val)));
  }
  const match = String(val).match(/\d+/);
  if (!match) return 2;
  const parsed = parseInt(match[0], 10);
  if (isNaN(parsed) || parsed <= 0) return 2;
  return Math.max(1, Math.min(10, parsed));
}

const CORNER_DEFINITIONS: CornerDefinition[] = [
  {
    index: 1,
    position: 'top-left',
    callsign: 'SNIPER TAC-01',
    role: 'TITULAR',
    range: '320M · LOCK',
    cornerLabel: 'ESQ-01 // NOROESTE',
    containerClasses: '-top-6 -left-6',
    restTransform: { y: 14, x: 14, rotate: -4, opacity: 0.5, scale: 0.98 },
    cardAnchorClasses: 'top-6 left-6 origin-top-left',
  },
  {
    index: 2,
    position: 'top-right',
    callsign: 'SNIPER TAC-02',
    role: 'ACOMP. 1',
    range: '450M · LOCK',
    cornerLabel: 'ESQ-02 // NORESTE',
    containerClasses: '-top-6 -right-6',
    restTransform: { y: 14, x: -14, rotate: 4, opacity: 0.5, scale: 0.98 },
    cardAnchorClasses: 'top-6 right-6 origin-top-right',
  },
  {
    index: 3,
    position: 'bottom-left',
    callsign: 'SNIPER TAC-03',
    role: 'ACOMP. 2',
    range: '580M · LOCK',
    cornerLabel: 'ESQ-03 // SUROESTE',
    containerClasses: '-bottom-6 -left-6',
    restTransform: { y: -14, x: 14, rotate: 4, opacity: 0.5, scale: 0.98 },
    cardAnchorClasses: 'bottom-6 left-6 origin-bottom-left',
  },
  {
    index: 4,
    position: 'bottom-right',
    callsign: 'SNIPER TAC-04',
    role: 'ACOMP. 3',
    range: '750M · LOCK',
    cornerLabel: 'ESQ-04 // SURESTE',
    containerClasses: '-bottom-6 -right-6',
    restTransform: { y: -14, x: -14, rotate: -4, opacity: 0.5, scale: 0.98 },
    cardAnchorClasses: 'bottom-6 right-6 origin-bottom-right',
  },
  {
    index: 5,
    position: 'top-left',
    callsign: 'SNIPER TAC-05',
    role: 'ACOMP. 4',
    range: '890M · LOCK',
    cornerLabel: 'ESQ-05 // APILADO NW',
    containerClasses: '-top-12 left-10',
    restTransform: { y: 10, x: 6, rotate: -8, opacity: 0.45, scale: 0.95 },
    cardAnchorClasses: 'top-6 left-6 origin-top-left',
  },
  {
    index: 6,
    position: 'top-right',
    callsign: 'SNIPER TAC-06',
    role: 'ACOMP. 5',
    range: '980M · LOCK',
    cornerLabel: 'ESQ-06 // APILADO NE',
    containerClasses: '-top-12 right-10',
    restTransform: { y: 10, x: -6, rotate: 8, opacity: 0.45, scale: 0.95 },
    cardAnchorClasses: 'top-6 right-6 origin-top-right',
  },
];

export function getCornerDefinition(index: number): CornerDefinition {
  if (index <= CORNER_DEFINITIONS.length) {
    return CORNER_DEFINITIONS[index - 1];
  }
  const isRight = index % 2 === 0;
  return {
    index,
    position: isRight ? 'top-right' : 'top-left',
    callsign: `SNIPER TAC-0${index}`,
    role: `ACOMP. ${index - 1}`,
    range: `${600 + index * 60}M · LOCK`,
    cornerLabel: `ESQ-0${index}`,
    containerClasses: isRight ? '-top-10 -right-8' : '-top-10 -left-8',
    restTransform: {
      y: 12,
      x: isRight ? -10 : 10,
      rotate: isRight ? 6 : -6,
      opacity: 0.4,
      scale: 0.95,
    },
    cardAnchorClasses: isRight
      ? 'top-6 right-6 origin-top-right'
      : 'top-6 left-6 origin-top-left',
  };
}
