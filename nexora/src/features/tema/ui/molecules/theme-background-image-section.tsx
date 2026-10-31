import { useState, useRef, type ChangeEvent, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useTemaStore } from '../../application/tema-store'
import { SparklesIcon } from '../../../dashboard/ui/icons'

/**
 * Optimiza y redimensiona el logo del hotel en el cliente a un tamaño adecuado
 * para el badge del menú y del loading (máx 400x400), asegurando alta resolución
 * y almacenamiento liviano.
 */
function processLogoImage(file: File, maxDim = 400, quality = 0.9): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (readerEvent) => {
      const img = new Image()
      img.onload = () => {
        let width = img.width
        let height = img.height

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width)
            width = maxDim
          } else {
            width = Math.round((width * maxDim) / height)
            height = maxDim
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(readerEvent.target?.result as string)
          return
        }

        ctx.drawImage(img, 0, 0, width, height)
        const format = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
        const dataUrl = canvas.toDataURL(format, quality)
        resolve(dataUrl)
      }
      img.onerror = () => reject(new Error('No se pudo procesar la imagen del logo.'))
      img.src = readerEvent.target?.result as string
    }
    reader.onerror = () => reject(new Error('Error al leer el archivo del logo.'))
    reader.readAsDataURL(file)
  })
}

export function ThemeBackgroundImageSection() {
  const hotelLogo = useTemaStore((state) => state.hotelLogo)
  const setHotelLogo = useTemaStore((state) => state.setHotelLogo)
  const clearHotelLogo = useTemaStore((state) => state.clearHotelLogo)
  const hotelName = useTemaStore((state) => state.hotelName)
  const setHotelName = useTemaStore((state) => state.setHotelName)

  const [hotelNameInput, setHotelNameInput] = useState(hotelName)
  const [isProcessing, setIsProcessing] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  useEffect(() => {
    setHotelNameInput(hotelName)
  }, [hotelName])

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setStatusMessage({
        type: 'error',
        text: 'Por favor selecciona un archivo de imagen válido para el logo (PNG, JPG, SVG o WebP).',
      })
      return
    }

    setIsProcessing(true)
    setStatusMessage(null)

    try {
      const optimizedLogo = await processLogoImage(file)
      setHotelLogo(optimizedLogo)
      setStatusMessage({
        type: 'success',
        text: '¡Tu logo se guardó con éxito! Ya puedes verlo en el menú principal y en la pantalla de bienvenida / loading.',
      })
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'No se pudo cargar la imagen. Por favor intenta con otra foto.',
      })
    } finally {
      setIsProcessing(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleHotelNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setHotelNameInput(val)
    setHotelName(val)
  }

  const handleClear = () => {
    clearHotelLogo()
    setStatusMessage({
      type: 'success',
      text: 'Se restableció el ícono original en el menú principal.',
    })
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-panel p-6 shadow-sm sm:p-8 space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-primary">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-3.5"
                aria-hidden="true"
              >
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
              </svg>
              Identidad del Hotel · Menú y Bienvenida
            </span>
            {hotelLogo && (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                Logo activo en el sistema
              </span>
            )}
          </div>
          <h2 className="mt-2 text-lg font-bold text-ink sm:text-xl">
            Logo representativo del hotel
          </h2>
          <p className="mt-1.5 text-xs leading-relaxed text-ink-muted max-w-2xl">
            Personaliza la bienvenida de tu hotel con su propio emblema o imagen de marca. 
            Este logo acompañará a ti y a tu equipo en la parte superior del menú principal 
            izquierdo, justo al lado del nombre <strong>Nexora</strong>, y en las pantallas de 
            carga y bienvenida de la plataforma, transmitiendo profesionalismo y calidez en cada jornada.
          </p>
        </div>

        {hotelLogo && (
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-lg border border-danger/30 bg-danger/10 px-3 py-1.5 text-xs font-semibold text-danger hover:bg-danger/20 transition-colors cursor-pointer"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-3.5"
              aria-hidden="true"
            >
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            Quitar logo
          </button>
        )}
      </div>

      {/* Configuración del Nombre del Hotel (Reemplaza "Hoteles · Operaciones") */}
      <div className="rounded-xl border border-line bg-canvas/40 p-4 sm:p-5">
        <label
          htmlFor="hotel-name-input"
          className="block text-xs font-bold text-ink"
        >
          Nombre del hotel o sede registrada
        </label>
        <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">
          Reemplaza la frase genérica <strong className="text-ink">"Hoteles · Operaciones"</strong> por el nombre oficial de este establecimiento. Así cada hotel o sede registrada cuenta con su propia identidad visible en el menú y en la bienvenida.
        </p>
        <div className="mt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <input
              id="hotel-name-input"
              type="text"
              value={hotelNameInput}
              onChange={handleHotelNameChange}
              placeholder="Ej. Hotel Gran Reserva San Jerónimo"
              maxLength={45}
              className="w-full rounded-lg border border-line bg-panel px-3.5 py-2 text-xs font-medium text-ink placeholder:text-ink-muted/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
            />
          </div>
          {hotelNameInput !== 'Hoteles · Operaciones' && (
            <button
              type="button"
              onClick={() => {
                setHotelNameInput('Hoteles · Operaciones')
                setHotelName('Hoteles · Operaciones')
              }}
              className="rounded-lg border border-line bg-panel px-3 py-2 text-xs font-semibold text-ink-muted hover:text-ink transition-colors cursor-pointer shrink-0"
              title="Volver a Hoteles · Operaciones"
            >
              Restablecer
            </button>
          )}
        </div>
      </div>

      {/* Grid: Zona de subida + Previsualizaciones en Vivo (Menú y Loading) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Zona de subida del archivo de logo */}
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-line bg-canvas/40 px-6 py-8 text-center transition-colors hover:border-primary/40">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/webp, image/svg+xml"
            onChange={handleFileChange}
            className="hidden"
            id="hotel-logo-file-input"
          />
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-7"
              aria-hidden="true"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
            </svg>
          </div>
          <p className="mt-3 text-sm font-semibold text-ink">
            {hotelLogo ? '¿Quieres cambiar el logo de tu hotel?' : 'Sube aquí el logo o emblema del hotel'}
          </p>
          <p className="mt-1 text-xs text-ink-muted">
            Formatos recomendados: PNG con fondo transparente, JPG o SVG. Se adaptará automáticamente con alta nitidez.
          </p>
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:opacity-95 transition-all cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? 'Preparando imagen...' : hotelLogo ? 'Seleccionar otro logo' : 'Elegir imagen de mi equipo'}
          </button>
        </div>

        {/* Bloque de previsualizaciones integradas (Menú principal + Loading de bienvenida) */}
        <div className="flex flex-col justify-between gap-4 rounded-xl border border-line bg-canvas/60 p-5">
          <div className="space-y-4">
            {/* 1. Previsualización en el menú principal */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                  1. En tu menú principal
                </span>
                <span className="text-[10px] text-ink-muted">
                  A la izquierda de "Nexora"
                </span>
              </div>

              <div className="rounded-xl border border-white/10 bg-sidebar p-3.5 shadow-md">
                <div className="flex items-center gap-3">
                  <span className="grid size-11 place-items-center rounded-xl bg-cream text-primary shadow-sm overflow-hidden shrink-0">
                    {hotelLogo ? (
                      <img
                        src={hotelLogo}
                        alt="Logo del hotel cargado"
                        className="size-full object-cover"
                      />
                    ) : (
                      <SparklesIcon className="size-5 text-primary" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-bold text-cream truncate">Nexora</p>
                    <p className="text-xs text-cream/70 truncate" title={hotelName}>
                      {hotelName}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Previsualización en el Loading y Bienvenida de la plataforma */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                  2. En el Loading y Bienvenida
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  Al iniciar sesión y cargar datos
                </span>
              </div>

              <div className="rounded-xl border border-line bg-panel p-3.5 shadow-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="grid size-10 place-items-center rounded-xl bg-cream text-primary shadow-xs overflow-hidden shrink-0">
                    {hotelLogo ? (
                      <img
                        src={hotelLogo}
                        alt="Logo en bienvenida"
                        className="size-full object-cover"
                      />
                    ) : (
                      <SparklesIcon className="size-5 text-primary" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-ink truncate">Nexora · {hotelName}</p>
                    <p className="text-[11px] text-ink-muted flex items-center gap-1.5">
                      <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                      Preparando la plataforma para tu equipo...
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md shrink-0">
                  Carga activa
                </span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-ink-muted border-t border-line/60 pt-2">
            La imagen y el nombre se sincronizan instantáneamente en toda la instalación a través de la store de Zustand.
          </p>
        </div>
      </div>

      {/* Banner de retroalimentación de estado */}
      <AnimatePresence>
        {statusMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`flex items-center justify-between rounded-lg p-3 text-xs ${
              statusMessage.type === 'success'
                ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                : 'border border-danger/20 bg-danger/10 text-danger'
            }`}
          >
            <span>{statusMessage.text}</span>
            <button
              type="button"
              onClick={() => setStatusMessage(null)}
              className="ml-2 font-bold hover:underline cursor-pointer"
            >
              Cerrar
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
