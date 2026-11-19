import {
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type ChangeEvent,
} from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { fadeIn } from '../../../../design-tokens/motion'
import { revocarBlobUrlSegura } from '../../domain/item-menu'
import { generarMiniaturaBlobUrl } from '../../infrastructure/image-thumbnail.service'
import { ImagenDropzone } from '../atoms/ImagenDropzone'
import { ImagenPreviewMiniatura } from '../atoms/ImagenPreviewMiniatura'

export interface SeccionCargaImagenProps {
  imageFile: File | null
  imagePreview: string | null
  onImageChange: (file: File | null, previewUrl: string | null) => void
  error?: string | null
}

const MAX_IMAGE_BYTES = 15 * 1024 * 1024

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 KB'
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  return `${(kb / 1024).toFixed(2)} MB`
}

/**
 * Molécula: Sección de selección de imagen con generación de miniatura optimizada
 * (<=160px) para evitar decodificar bitmaps completos en RAM/VRAM.
 */
export function SeccionCargaImagen({
  imageFile,
  imagePreview,
  onImageChange,
  error,
}: SeccionCargaImagenProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const lastBlobUrlRef = useRef<string | null>(null)
  const selectionRequestIdRef = useRef(0)
  const isMountedRef = useRef(true)

  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      selectionRequestIdRef.current += 1
      revocarBlobUrlSegura(lastBlobUrlRef.current)
      lastBlobUrlRef.current = null
    }
  }, [])

  const handleFiles = async (files: FileList | null) => {
    setLocalError(null)
    if (!files || files.length === 0) return

    const file = files[0]
    if (!file.type.startsWith('image/')) {
      setLocalError(
        'El archivo seleccionado no es una imagen válida. Por favor elige una foto (JPG, PNG, WebP o AVIF).'
      )
      return
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setLocalError(
        'La imagen seleccionada supera los 15 MB. Por favor elige una imagen de menor peso.'
      )
      return
    }

    const requestId = ++selectionRequestIdRef.current
    setIsProcessing(true)

    try {
      const thumbnailBlobUrl = await generarMiniaturaBlobUrl(file, {
        maxDimension: 160,
        quality: 0.82,
      })

      // Si el usuario canceló, reemplazó la selección o desmontó el componente, liberar de inmediato
      if (!isMountedRef.current || requestId !== selectionRequestIdRef.current) {
        revocarBlobUrlSegura(thumbnailBlobUrl)
        return
      }

      if (lastBlobUrlRef.current && lastBlobUrlRef.current !== thumbnailBlobUrl) {
        revocarBlobUrlSegura(lastBlobUrlRef.current)
      }
      if (imagePreview && imagePreview !== lastBlobUrlRef.current) {
        revocarBlobUrlSegura(imagePreview)
      }

      lastBlobUrlRef.current = thumbnailBlobUrl
      onImageChange(file, thumbnailBlobUrl)
    } catch (err) {
      if (!isMountedRef.current || requestId !== selectionRequestIdRef.current) {
        return
      }
      const fallbackMessage =
        'No se pudo generar la vista previa optimizada en memoria. Por favor intenta con otra imagen.'
      setLocalError(err instanceof Error && err.message ? err.message : fallbackMessage)
    } finally {
      if (isMountedRef.current && requestId === selectionRequestIdRef.current) {
        setIsProcessing(false)
      }
    }
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    void handleFiles(e.target.files)
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    void handleFiles(e.dataTransfer.files)
  }

  const handleQuitar = () => {
    selectionRequestIdRef.current += 1
    setIsProcessing(false)
    revocarBlobUrlSegura(imagePreview)
    revocarBlobUrlSegura(lastBlobUrlRef.current)
    lastBlobUrlRef.current = null
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onImageChange(null, null)
    setLocalError(null)
  }

  const abrirSelector = () => {
    fileInputRef.current?.click()
  }

  const activeError = error || localError

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="block text-sm font-medium text-ink">
          Fotografía o imagen del servicio
          <span className="ml-1 text-xs font-normal text-ink-muted">
            (Para mostrar en tablets y cartas digitales)
          </span>
        </label>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
        aria-label="Seleccionar imagen o tomar foto desde el dispositivo"
      />

      <AnimatePresence mode="wait">
        {!imagePreview ? (
          <ImagenDropzone
            key="dropzone"
            isDragging={isDragging}
            hasError={Boolean(activeError)}
            isProcessing={isProcessing}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onSelectClick={abrirSelector}
          />
        ) : (
          <ImagenPreviewMiniatura
            key="preview"
            imagePreview={imagePreview}
            imageFile={imageFile}
            formattedSize={imageFile ? formatBytes(imageFile.size) : ''}
            onCambiar={abrirSelector}
            onQuitar={handleQuitar}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeError && (
          <motion.p
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="alert"
            className="text-xs font-medium text-danger"
          >
            {activeError}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
