import { motion } from 'motion/react'
import { fadeUp } from '../../../../design-tokens/motion'

export interface ImagenPreviewMiniaturaProps {
  imagePreview: string
  imageFile: File | null
  formattedSize: string
  onCambiar: () => void
  onQuitar: () => void
}

/**
 * Átomo: Tarjeta de vista previa con miniatura de 80x80 px (`size-20`)
 * decodificada de forma asíncrona desde un `blob:` reducido en memoria.
 */
export function ImagenPreviewMiniatura({
  imagePreview,
  imageFile,
  formattedSize,
  onCambiar,
  onQuitar,
}: ImagenPreviewMiniaturaProps) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="relative flex flex-col gap-4 rounded-2xl border border-line bg-canvas p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-center gap-4">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-xl border border-line shadow-xs">
          <img
            src={imagePreview}
            alt={imageFile?.name || 'Vista previa del servicio'}
            width={80}
            height={80}
            decoding="async"
            loading="lazy"
            className="size-full object-cover"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              Imagen lista
            </span>
            <span className="font-mono text-xs text-ink-muted">
              {formattedSize}
            </span>
          </div>
          <p
            className="max-w-xs truncate text-xs font-semibold text-ink"
            title={imageFile?.name}
          >
            {imageFile?.name || 'imagen_servicio.jpg'}
          </p>
          <p className="text-[11px] text-ink-muted">
            Capturada desde tu dispositivo ({imageFile?.type || 'image/jpeg'})
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center">
        <button
          type="button"
          onClick={onCambiar}
          className="cursor-pointer rounded-xl border border-line bg-panel px-3 py-1.5 text-xs font-semibold text-ink shadow-2xs transition-colors hover:bg-canvas"
        >
          Cambiar foto
        </button>
        <button
          type="button"
          onClick={onQuitar}
          className="cursor-pointer rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/60"
        >
          Eliminar
        </button>
      </div>
    </motion.div>
  )
}
