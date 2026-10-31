/**
 * Resultado estructurado del cálculo de edad a partir de la fecha de nacimiento.
 */
export interface CalculatedAgeResult {
  /** Edad exacta en años enteros (null si la fecha es inválida o futura). */
  age: number | null
  /** Texto legible de la edad (ej: "28 años", "1 año", o cadena vacía si no aplica). */
  text: string
  /** Indica si la fecha de nacimiento coincide con el día y mes actual (¡es su cumpleaños!). */
  isBirthdayToday: boolean
}

/**
 * Calcula la edad exacta en años cumplidos comparando una fecha de nacimiento
 * contra una fecha de referencia (por defecto la fecha actual).
 *
 * Consideraciones clave:
 * - Compara año, mes y día (si el mes actual es menor, o si es el mismo mes pero el día actual es menor que el de nacimiento, resta 1 año).
 * - Acepta tanto un objeto `Date` como una cadena de texto (ej. ISO 8601 o formato YYYY-MM-DD).
 * - Maneja de forma segura años bisiestos (29 de febrero).
 * - Si la fecha es inválida, futura o excede los 130 años, retorna `null`.
 *
 * @param birthDate Fecha de nacimiento seleccionada (Date o string).
 * @param currentDate Fecha actual o de referencia (por defecto new Date()).
 * @returns La edad exacta en años o `null` si no es calculable.
 */
export function calculateAge(
  birthDate: Date | string | null | undefined,
  currentDate: Date = new Date()
): number | null {
  if (!birthDate) return null

  // Normalizar a objeto Date si viene como cadena
  let birth: Date
  if (typeof birthDate === 'string') {
    // Si viene en formato simple 'YYYY-MM-DD', forzar división para evitar desfases horarios de UTC
    const parts = birthDate.split('T')[0].split('-')
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10)
      const month = parseInt(parts[1], 10) - 1
      const day = parseInt(parts[2], 10)
      birth = new Date(year, month, day)
    } else {
      birth = new Date(birthDate)
    }
  } else {
    birth = birthDate
  }

  if (isNaN(birth.getTime())) return null

  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth()
  const currentDay = currentDate.getDate()

  const birthYear = birth.getFullYear()
  const birthMonth = birth.getMonth()
  const birthDay = birth.getDate()

  let age = currentYear - birthYear
  const monthDiff = currentMonth - birthMonth

  // Si no ha llegado el mes de cumpleaños, o si es el mismo mes pero aún no llega el día
  if (monthDiff < 0 || (monthDiff === 0 && currentDay < birthDay)) {
    age--
  }

  // Descartar fechas en el futuro o edades inverosímiles
  if (age < 0 || age > 130) {
    return null
  }

  return age
}

/**
 * Convierte un número de edad en una cadena legible en español.
 *
 * @param age Edad en años enteros.
 * @returns Cadena con singular/plural adecuado (ej: "1 año", "25 años").
 */
export function formatAgeText(age: number | null): string {
  if (age === null || age < 0) return ''
  return age === 1 ? '1 año' : `${age} años`
}

/**
 * Provee la información completa de edad (numérica, formateada y si es su cumpleaños hoy).
 *
 * @param birthDate Fecha de nacimiento seleccionada.
 * @param currentDate Fecha actual o de referencia.
 */
export function getBirthDateAgeInfo(
  birthDate: Date | string | null | undefined,
  currentDate: Date = new Date()
): CalculatedAgeResult {
  const age = calculateAge(birthDate, currentDate)
  if (age === null) {
    return { age: null, text: '', isBirthdayToday: false }
  }

  let birth: Date
  if (typeof birthDate === 'string') {
    const parts = birthDate.split('T')[0].split('-')
    if (parts.length === 3) {
      birth = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10))
    } else {
      birth = new Date(birthDate)
    }
  } else {
    birth = birthDate as Date
  }

  const isBirthdayToday =
    birth.getMonth() === currentDate.getMonth() && birth.getDate() === currentDate.getDate()

  return {
    age,
    text: formatAgeText(age),
    isBirthdayToday,
  }
}

