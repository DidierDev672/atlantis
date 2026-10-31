import { describe, it, expect } from 'vitest'
import { calculateAge, formatAgeText, getBirthDateAgeInfo } from './calculate-age'

describe('calculateAge', () => {
  const referenceDate = new Date(2026, 9, 29) // 29 de octubre de 2026

  it('calcula la edad correctamente cuando el cumpleaños ya pasó en el año actual', () => {
    // Nació el 15 de marzo de 1996 -> en oct 2026 tiene 30 años
    const birth = new Date(1996, 2, 15)
    expect(calculateAge(birth, referenceDate)).toBe(30)
  })

  it('calcula la edad correctamente cuando el cumpleaños NO ha pasado todavía en el año actual', () => {
    // Nació el 15 de diciembre de 1996 -> en oct 2026 todavía tiene 29 años
    const birth = new Date(1996, 11, 15)
    expect(calculateAge(birth, referenceDate)).toBe(29)
  })

  it('calcula la edad correctamente en el mismo mes antes del día del cumpleaños', () => {
    // Cumple el 31 de octubre -> el 29 de octubre aún no cumple
    const birth = new Date(2000, 9, 31)
    expect(calculateAge(birth, referenceDate)).toBe(25)
  })

  it('calcula la edad correctamente en el mismo mes y exactamente el día del cumpleaños', () => {
    // Cumple el 29 de octubre
    const birth = new Date(2000, 9, 29)
    expect(calculateAge(birth, referenceDate)).toBe(26)
  })

  it('calcula la edad correctamente en el mismo mes después del día del cumpleaños', () => {
    // Cumplió el 10 de octubre
    const birth = new Date(2000, 9, 10)
    expect(calculateAge(birth, referenceDate)).toBe(26)
  })

  it('acepta fechas como string en formato YYYY-MM-DD', () => {
    expect(calculateAge('2000-10-29', referenceDate)).toBe(26)
    expect(calculateAge('2000-11-01', referenceDate)).toBe(25)
  })

  it('maneja años bisiestos (29 de febrero)', () => {
    // Nació el 29 de feb de 2004 -> en oct 2026 tiene 22 años
    const leapBirth = new Date(2004, 1, 29)
    expect(calculateAge(leapBirth, referenceDate)).toBe(22)
  })

  it('retorna null para fechas futuras', () => {
    const futureDate = new Date(2027, 0, 1)
    expect(calculateAge(futureDate, referenceDate)).toBeNull()
  })

  it('retorna null para fechas inválidas, null o undefined', () => {
    expect(calculateAge(null, referenceDate)).toBeNull()
    expect(calculateAge(undefined, referenceDate)).toBeNull()
    expect(calculateAge('fecha-invalida', referenceDate)).toBeNull()
  })
})

describe('formatAgeText', () => {
  it('formatea singular y plural correctamente', () => {
    expect(formatAgeText(1)).toBe('1 año')
    expect(formatAgeText(0)).toBe('0 años')
    expect(formatAgeText(25)).toBe('25 años')
    expect(formatAgeText(null)).toBe('')
  })
})

describe('getBirthDateAgeInfo', () => {
  const referenceDate = new Date(2026, 9, 29)

  it('indica si hoy es el cumpleaños de la persona', () => {
    const birthdayToday = new Date(1995, 9, 29)
    const result = getBirthDateAgeInfo(birthdayToday, referenceDate)
    expect(result.age).toBe(31)
    expect(result.text).toBe('31 años')
    expect(result.isBirthdayToday).toBe(true)
  })

  it('indica false cuando hoy no es el cumpleaños', () => {
    const notBirthday = new Date(1995, 9, 28)
    const result = getBirthDateAgeInfo(notBirthday, referenceDate)
    expect(result.isBirthdayToday).toBe(false)
  })
})

