import { create } from 'zustand'
import type { Palette } from '../domain/palette'

const STORAGE_KEY = 'nexora.tema.palette'
const HOTEL_LOGO_STORAGE_KEY = 'nexora.tema.hotel_logo'
const HOTEL_NAME_STORAGE_KEY = 'nexora.tema.hotel_name'
const DEFAULT_HOTEL_NAME = 'Hoteles · Operaciones'
export const DEFAULT_HOTEL_LOGO = '/logo-sistema-urbano.svg'

function readPersistedPalette(): Palette | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Palette
    if (!parsed?.name || !Array.isArray(parsed.colors)) return null
    return parsed
  } catch {
    return null
  }
}

function readPersistedHotelLogo(): string | null {
  try {
    return localStorage.getItem(HOTEL_LOGO_STORAGE_KEY)
  } catch {
    return null
  }
}

function readPersistedHotelName(): string {
  try {
    const raw = localStorage.getItem(HOTEL_NAME_STORAGE_KEY)
    return raw && raw.trim() ? raw.trim() : DEFAULT_HOTEL_NAME
  } catch {
    return DEFAULT_HOTEL_NAME
  }
}

interface TemaState {
  appliedPalette: Palette | null
  previewPalette: Palette | null
  /** Logo representativo del hotel que se muestra en el Sidebar y en el loading de la plataforma */
  hotelLogo: string | null
  /** Nombre o razón social del hotel que reemplaza la frase 'Hoteles · Operaciones' */
  hotelName: string
  preview: (palette: Palette) => void
  cancelPreview: () => void
  applyPermanently: () => void
  applyPalette: (palette: Palette) => void
  resetToDefault: () => void
  setHotelLogo: (logo: string | null) => void
  clearHotelLogo: () => void
  setHotelName: (name: string) => void
}

export const useTemaStore = create<TemaState>((set, get) => ({
  appliedPalette: readPersistedPalette(),
  previewPalette: null,
  hotelLogo: readPersistedHotelLogo(),
  hotelName: readPersistedHotelName(),
  preview: (palette) => set({ previewPalette: palette }),
  cancelPreview: () => set({ previewPalette: null }),
  applyPermanently: () => {
    const { previewPalette } = get()
    if (!previewPalette) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(previewPalette))
    } catch {
      // Si localStorage no está disponible, el cambio se mantiene solo en memoria.
    }
    set({ appliedPalette: previewPalette, previewPalette: null })
  },
  applyPalette: (palette: Palette) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(palette))
    } catch {
      // Si localStorage no está disponible, el cambio se mantiene solo en memoria.
    }
    set({ appliedPalette: palette, previewPalette: null })
  },
  resetToDefault: () => {
    try {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(HOTEL_LOGO_STORAGE_KEY)
      localStorage.removeItem(HOTEL_NAME_STORAGE_KEY)
    } catch {
      // Si localStorage no está disponible, el cambio se mantiene solo en memoria.
    }
    set({
      appliedPalette: null,
      previewPalette: null,
      hotelLogo: null,
      hotelName: DEFAULT_HOTEL_NAME,
    })
  },
  setHotelLogo: (logo: string | null) => {
    try {
      if (logo) {
        localStorage.setItem(HOTEL_LOGO_STORAGE_KEY, logo)
      } else {
        localStorage.removeItem(HOTEL_LOGO_STORAGE_KEY)
      }
    } catch (e) {
      console.warn('No se pudo guardar el logo del hotel en localStorage:', e)
    }
    set({ hotelLogo: logo })
  },
  clearHotelLogo: () => {
    try {
      localStorage.removeItem(HOTEL_LOGO_STORAGE_KEY)
    } catch {
      // Memoria
    }
    set({ hotelLogo: null })
  },
  setHotelName: (name: string) => {
    const trimmed = name.trim()
    try {
      if (trimmed) {
        localStorage.setItem(HOTEL_NAME_STORAGE_KEY, trimmed)
      } else {
        localStorage.removeItem(HOTEL_NAME_STORAGE_KEY)
      }
    } catch (e) {
      console.warn('No se pudo guardar el nombre del hotel en localStorage:', e)
    }
    set({ hotelName: trimmed || DEFAULT_HOTEL_NAME })
  },
}))
