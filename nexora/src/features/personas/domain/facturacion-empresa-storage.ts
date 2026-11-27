export interface DatosEmpresaFacturacion {
  personId: string
  guestName: string
  razonSocial: string
  nit: string
  digitoVerificacion: string
  tipoContribuyente: 'juridica' | 'natural_responsable' | 'gran_contribuyente'
  regimenFiscal: string
  correoFacturacion: string
  telefonoEmpresa: string
  direccionFiscal: string
  ciudad: string
  observaciones: string
  updatedAt: string
}

const STORAGE_KEY = 'nexora.electronic_invoice.companies'

export function loadAllDatosEmpresaFacturacion(): Record<
  string,
  DatosEmpresaFacturacion
> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, DatosEmpresaFacturacion>
    }
  } catch {
    // localStorage no disponible
  }
  return {}
}

export function saveDatosEmpresaFacturacion(
  personKey: string,
  data: DatosEmpresaFacturacion
): Record<string, DatosEmpresaFacturacion> {
  const all = loadAllDatosEmpresaFacturacion()
  const next = { ...all, [personKey]: data }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // localStorage no disponible
  }
  return next
}

export function removeDatosEmpresaFacturacion(
  personKey: string
): Record<string, DatosEmpresaFacturacion> {
  const all = loadAllDatosEmpresaFacturacion()
  const next = { ...all }
  delete next[personKey]
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // localStorage no disponible
  }
  return next
}
