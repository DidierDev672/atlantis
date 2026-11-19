import { useState } from 'react'
import { motion } from 'motion/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCakeCandles,
  faCashRegister,
  faCheck,
  faCopy,
  faIdCard,
} from '@fortawesome/free-solid-svg-icons'
import { Tooltip } from '../../../../shared/ui/Tooltip'
import { PrintingReceiptIcon } from '../atoms/printing-receipt-icon'
import {
  getGuestInitials,
  type SalidaHuespedItem,
} from '../../domain/salida-huesped'
import {
  SalidaGenderBadge,
  SalidaReceptionCountBadge,
  SalidaServiceRequestCountBadge,
  SalidaSourceBadge,
  SalidaWindowBadge,
} from '../atoms/salida-badge'

export interface SalidaHuespedCardProps {
  guest: SalidaHuespedItem
  isServiceRequestsLoading?: boolean
  onViewAccount?: (guest: SalidaHuespedItem) => void
}

/**
 * Card individual de huésped próximo a salir.
 * Implementa exactamente la animación Fade In de `prompt/prompt-fade-in-elementos.md`
 * y muestra únicamente información legible (sin IDs internos).
 */
export function SalidaHuespedCard({
  guest,
  isServiceRequestsLoading = false,
  onViewAccount,
}: SalidaHuespedCardProps) {
  const [copiedDoc, setCopiedDoc] = useState(false)
  const [isReceiptHover, setIsReceiptHover] = useState(false)
  const initials = getGuestInitials(guest.name)

  const handleCopyDocument = () => {
    if (!guest.documentNumber || guest.documentNumber === 'No registrado') return
    void navigator.clipboard.writeText(guest.documentNumber)
    setCopiedDoc(true)
    setTimeout(() => setCopiedDoc(false), 1800)
  }

  return (
    <motion.article
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="border-line bg-panel group flex flex-col justify-between gap-4 rounded-2xl border p-5 shadow-xs transition-shadow duration-200 hover:shadow-md"
    >
      {/* Cabecera: Avatar con iniciales, Nombre completo, Género y Contador de recepciones en esquina superior derecha */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3.5">
          <div className="from-primary to-secondary text-cream relative flex size-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br text-sm font-bold shadow-xs select-none">
            {initials}
          </div>

          <div className="min-w-0">
            <h3 className="text-ink group-hover:text-primary truncate text-base font-bold transition-colors">
              {guest.name}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <SalidaSourceBadge
                kind={guest.sourceKind}
                label={guest.sourceLabel}
              />
              <SalidaGenderBadge
                label={guest.genderLabel}
                tone={guest.genderTone}
              />
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <SalidaServiceRequestCountBadge
            count={guest.serviceRequestCount}
            isLoading={isServiceRequestsLoading}
          />
          <SalidaReceptionCountBadge count={guest.receptionCount} />
        </div>
      </div>

      {/* Documento de identidad: Tipo y Número */}
      <div className="border-line/70 bg-canvas/60 space-y-1.5 rounded-xl border p-3.5">
        <div className="text-ink-muted flex items-center justify-between gap-2 text-xs">
          <span className="flex items-center gap-1.5 font-medium">
            <FontAwesomeIcon
              icon={faIdCard}
              className="text-primary size-3.5"
              aria-hidden="true"
            />
            <span>{guest.documentTypeLabel}</span>
          </span>

          {guest.documentNumber !== 'No registrado' && (
            <button
              type="button"
              onClick={handleCopyDocument}
              title="Copiar número de documento"
              className="text-primary inline-flex cursor-pointer items-center gap-1 text-[11px] font-semibold hover:underline"
            >
              <FontAwesomeIcon
                icon={copiedDoc ? faCheck : faCopy}
                className="size-3"
                aria-hidden="true"
              />
              <span>{copiedDoc ? 'Copiado' : 'Copiar'}</span>
            </button>
          )}
        </div>
        <p className="text-ink font-mono text-sm font-bold tracking-wide">
          {guest.documentNumber}
        </p>
      </div>

      {/* Fecha de nacimiento y programación de salida */}
      <div className="space-y-2.5 pt-0.5 text-xs">
        <div className="border-line/50 flex items-center justify-between gap-2 border-b pb-2.5">
          <span className="text-ink-muted flex items-center gap-1.5">
            <FontAwesomeIcon
              icon={faCakeCandles}
              className="text-secondary size-3.5"
              aria-hidden="true"
            />
            <span>Fecha de nacimiento</span>
          </span>
          <span className="text-ink text-right font-semibold">
            {guest.dateOfBirthFormatted}
            {guest.ageText && (
              <span className="text-ink-muted ml-1 font-normal">
                ({guest.ageText})
              </span>
            )}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-ink-muted font-medium">Estado de salida</span>
          <SalidaWindowBadge
            window={guest.departureWindow}
            label={guest.departureLabel}
          />
        </div>
      </div>

      {/* Acciones de cuenta y cobro */}
      <div className="border-line/60 grid grid-cols-2 gap-2.5 border-t pt-3.5">
        <Tooltip content="Disponible próximamente" className="w-full">
          <button
            type="button"
            disabled
            aria-disabled="true"
            className="border-line bg-canvas text-ink-muted inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold opacity-65"
          >
            <FontAwesomeIcon
              icon={faCashRegister}
              className="size-3.5"
              aria-hidden="true"
            />
            <span>Cobrar</span>
          </button>
        </Tooltip>

        <button
          type="button"
          onClick={() => onViewAccount?.(guest)}
          onMouseEnter={() => setIsReceiptHover(true)}
          onMouseLeave={() => setIsReceiptHover(false)}
          onFocus={() => setIsReceiptHover(true)}
          onBlur={() => setIsReceiptHover(false)}
          className="bg-primary inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-white shadow-xs transition hover:opacity-90"
        >
          <PrintingReceiptIcon isPrinting={isReceiptHover} />
          <span>Ver cuenta</span>
        </button>
      </div>
    </motion.article>
  )
}
