import { memo, type DragEvent } from 'react'
import { motion } from 'motion/react'
import { fadeIn } from '../../../../design-tokens/motion'

export interface ImagenDropzoneProps {
  isDragging: boolean
  hasError: boolean
  isProcessing?: boolean
  onDragOver: (e: DragEvent<HTMLDivElement>) => void
  onDragLeave: (e: DragEvent<HTMLDivElement>) => void
  onDrop: (e: DragEvent<HTMLDivElement>) => void
  onSelectClick: () => void
}

/**
 * Átomo: Zona interactiva de arrastre/selección de archivos de imagen.
 */
export const ImagenDropzone = memo(function ImagenDropzone({
  isDragging,
  hasError,
  isProcessing = false,
  onDragOver,
  onDragLeave,
  onDrop,
  onSelectClick,
}: ImagenDropzoneProps) {
  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      exit="exit"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={onSelectClick}
      role="button"
      tabIndex={0}
      aria-busy={isProcessing}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelectClick()
        }
      }}
      className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
        isDragging
          ? 'border-primary bg-primary/10 scale-[1.01]'
          : hasError
            ? 'border-rose-400 bg-rose-50/50 dark:border-rose-800 dark:bg-rose-950/20'
            : 'border-line bg-canvas/60 hover:border-primary/60 hover:bg-canvas'
      }`}
    >
      <div className="mb-3 flex size-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-xs transition-transform group-hover:scale-110">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="size-7"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"
          />
        </svg>
      </div>

      <p className="text-sm font-semibold text-ink">
        {isProcessing
          ? 'Optimizando vista previa en miniatura…'
          : 'Haz clic o arrastra una fotografía aquí'}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-ink-muted">
        En móviles puedes <strong>tomar una foto</strong> o elegir de tu galería; en computador selecciona cualquier archivo.
      </p>
      <div className="mt-3 flex items-center gap-2 text-[11px] font-medium text-ink-soft">
        <span className="rounded bg-black/5 px-2 py-0.5 dark:bg-white/5">
          JPG, PNG, WebP, AVIF
        </span>
        <span>•</span>
        <span>Hasta 15 MB</span>
      </div>
    </motion.div>
  )
})
