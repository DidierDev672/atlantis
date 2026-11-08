import { useState } from 'react'
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  type PanInfo,
} from 'motion/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUsers,
  faIdCard,
  faCircleCheck,
  faEnvelope,
  faPhone,
  faBed,
  faArrowsLeftRight,
  faRotateRight,
  faChevronLeft,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons'
import { cn } from '../../../../shared/lib/cn'

export interface StackedGuestCardItem {
  id: string
  title: string
  description: string
  bgClass: string
  index?: number
  isTitular?: boolean
  name?: string
  roomName?: string
  documentType?: string
  documentNumber?: string
  email?: string
  phoneNumber?: string
  statusLabel?: string
}

export interface ReservaHuespedesStackedCardsProps {
  /** Lista de tarjetas de huéspedes a renderizar en la pila */
  cards: StackedGuestCardItem[]
  /** Callback opcional al descartar una tarjeta por arrastre o acción */
  onCardDismiss?: (card: StackedGuestCardItem, direction: 'left' | 'right') => void
  /** Callback al restaurar la pila completa */
  onReset?: () => void
  /** Clase personalizada para el contenedor */
  className?: string
}

interface SingleCardProps {
  card: StackedGuestCardItem
  index: number
  totalInDeck: number
  isFront: boolean
  dismissDirection: 'left' | 'right' | null
  onDismiss: (direction: 'left' | 'right') => void
}

function SingleCard({
  card,
  index,
  totalInDeck,
  isFront,
  dismissDirection,
  onDismiss,
}: SingleCardProps) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-16, 16])
  const opacity = useTransform(x, [-160, -80, 0, 80, 160], [0.55, 0.9, 1, 0.9, 0.55])

  // Indicadores visuales durante el arrastre (Swipe indicators)
  const leftIndicatorOpacity = useTransform(x, [-120, -30], [1, 0])
  const rightIndicatorOpacity = useTransform(x, [30, 120], [0, 1])

  const initials =
    (card.name || card.title)
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join('') || (card.isTitular ? 'HT' : `A${(card.index ?? 2) - 1}`)

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    const swipeThreshold = 95
    const velocityThreshold = 380

    if (info.offset.x > swipeThreshold || info.velocity.x > velocityThreshold) {
      onDismiss('right')
    } else if (
      info.offset.x < -swipeThreshold ||
      info.velocity.x < -velocityThreshold
    ) {
      onDismiss('left')
    }
  }

  // Estilos de profundidad y escala según la posición en la pila
  const depthScale = Math.max(0.85, 1 - index * 0.045)
  const depthY = index * 12
  const depthOpacity = Math.max(0.4, 1 - index * 0.16)
  const zIndex = totalInDeck - index

  return (
    <motion.div
      layout
      style={{
        zIndex,
        ...(isFront ? { x, rotate, opacity } : {}),
      }}
      initial={{
        scale: depthScale,
        y: depthY,
        opacity: 0,
      }}
      animate={{
        scale: depthScale,
        y: depthY,
        opacity: depthOpacity,
      }}
      exit={{
        x: dismissDirection === 'left' ? -380 : 380,
        opacity: 0,
        rotate: dismissDirection === 'left' ? -22 : 22,
        transition: { duration: 0.28, ease: 'easeOut' },
      }}
      transition={{
        type: 'spring',
        stiffness: 320,
        damping: 24,
      }}
      drag={isFront ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.75}
      onDragEnd={isFront ? handleDragEnd : undefined}
      whileTap={isFront ? { cursor: 'grabbing' } : undefined}
      className={cn(
        'absolute inset-0 select-none rounded-2xl border p-4.5 shadow-md backdrop-blur-xs transition-colors',
        card.bgClass || 'border-line/80 bg-panel text-ink',
        isFront ? 'cursor-grab touch-pan-y shadow-lg' : 'pointer-events-none'
      )}
    >
      {/* Indicadores flotantes de Swipe al arrastrar */}
      {isFront && (
        <>
          <motion.div
            style={{ opacity: rightIndicatorOpacity }}
            className="pointer-events-none absolute top-3.5 right-3.5 z-30 rounded-lg border border-emerald-500/40 bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-300 shadow-xs"
          >
            Siguiente ➔
          </motion.div>
          <motion.div
            style={{ opacity: leftIndicatorOpacity }}
            className="pointer-events-none absolute top-3.5 left-3.5 z-30 rounded-lg border border-blue-500/40 bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-300 shadow-xs"
          >
            ⬅ Descartar
          </motion.div>
        </>
      )}

      {/* Cabecera de la tarjeta: Avatar, Título y Rol */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-xs font-bold text-primary shadow-2xs">
            {initials}
          </div>

          <div className="min-w-0">
            <h4 className="truncate text-sm font-bold text-ink" title={card.title}>
              {card.title}
            </h4>
            <p className="truncate text-[11px] text-ink-muted">
              {card.isTitular ? 'Titular principal' : `Acompañante #${(card.index ?? 2) - 1}`}
            </p>
          </div>
        </div>

        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-line bg-surface/70 px-2 py-0.5 text-[10px] font-bold text-ink-muted">
          <FontAwesomeIcon
            icon={card.isTitular ? faCircleCheck : faUsers}
            className="size-2.5 text-primary"
          />
          <span>{card.isTitular ? 'Titular' : 'Acompañante'}</span>
        </span>
      </div>

      {/* Descripción concisa del ítem */}
      <p className="mt-2 text-xs text-ink-muted line-clamp-1">
        {card.description}
      </p>

      {/* Metadatos del Huésped */}
      <div className="mt-2.5 space-y-1.5 border-t border-line/60 pt-2 text-xs">
        {card.documentNumber ? (
          <div className="flex items-center gap-2 text-ink">
            <FontAwesomeIcon icon={faIdCard} className="size-3 text-ink-muted shrink-0" />
            <span className="truncate">
              {card.documentType ? `${card.documentType}: ` : 'Doc: '}
              <strong>{card.documentNumber}</strong>
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-[11px] text-ink-muted italic">
            <FontAwesomeIcon icon={faIdCard} className="size-3 text-neutral/50 shrink-0" />
            <span>{card.isTitular ? 'Identificación registrada' : 'Registrado con el titular'}</span>
          </div>
        )}

        {card.email && (
          <div className="flex items-center gap-2 text-[11px] text-ink">
            <FontAwesomeIcon icon={faEnvelope} className="size-3 text-ink-muted shrink-0" />
            <span className="truncate">{card.email}</span>
          </div>
        )}

        {card.phoneNumber && (
          <div className="flex items-center gap-2 text-[11px] text-ink">
            <FontAwesomeIcon icon={faPhone} className="size-3 text-ink-muted shrink-0" />
            <span>{card.phoneNumber}</span>
          </div>
        )}
      </div>

      {/* Pie de la tarjeta */}
      <div className="mt-3 flex items-center justify-between border-t border-line/50 pt-2 text-[10px] text-ink-muted">
        {card.roomName ? (
          <span className="inline-flex items-center gap-1.5 truncate">
            <FontAwesomeIcon icon={faBed} className="size-2.5 text-primary/70 shrink-0" />
            <span className="truncate">{card.roomName}</span>
          </span>
        ) : (
          <span className="text-[10px] text-ink-muted font-medium">
            Huésped #{card.index ?? 1}
          </span>
        )}

        {isFront ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-primary">
            <FontAwesomeIcon icon={faArrowsLeftRight} className="size-2.5" />
            <span>Arrastra para pasar</span>
          </span>
        ) : (
          <span className="font-medium text-neutral/70">
            {card.statusLabel || 'En estadía'}
          </span>
        )}
      </div>
    </motion.div>
  )
}

/**
 * Componente de tarjetas apiladas con efecto Tinder / Swipe usando Framer Motion.
 * Permite visualizar la información de los huéspedes con sensación de profundidad y arrastre táctil.
 */
export function ReservaHuespedesStackedCards({
  cards,
  onCardDismiss,
  onReset,
  className,
}: ReservaHuespedesStackedCardsProps) {
  const [deck, setDeck] = useState<StackedGuestCardItem[]>(cards)
  const [dismissDirection, setDismissDirection] = useState<'left' | 'right' | null>(null)

  // Sincronizar deck cuando cambian las cards entrantes (en fase de render según React)
  const [prevCards, setPrevCards] = useState<StackedGuestCardItem[]>(cards)
  if (cards !== prevCards) {
    setPrevCards(cards)
    setDeck(cards)
  }

  const handleDismiss = (card: StackedGuestCardItem, direction: 'left' | 'right') => {
    setDismissDirection(direction)
    setDeck((prev) => prev.filter((c) => c.id !== card.id))
    onCardDismiss?.(card, direction)
  }

  const handleDismissTop = (direction: 'left' | 'right') => {
    if (deck.length === 0) return
    const topCard = deck[0]
    handleDismiss(topCard, direction)
  }

  const handleReset = () => {
    setDismissDirection(null)
    setDeck(cards)
    onReset?.()
  }

  // Índice actual para el indicador (cuántos quedan vs cuántos son en total)
  const reviewedCount = cards.length - deck.length
  const currentIndex = cards.length > 0 ? Math.min(reviewedCount + 1, cards.length) : 0

  return (
    <div className={cn('flex flex-col space-y-3', className)}>
      {/* Contenedor relativo de la pila de tarjetas */}
      <div className="relative h-[245px] w-full">
        <AnimatePresence mode="popLayout" custom={dismissDirection}>
          {deck.length > 0 ? (
            deck
              .slice(0, 3)
              .map((card, idx) => (
                <SingleCard
                  key={card.id}
                  card={card}
                  index={idx}
                  totalInDeck={deck.length}
                  isFront={idx === 0}
                  dismissDirection={dismissDirection}
                  onDismiss={(dir) => handleDismiss(card, dir)}
                />
              ))
          ) : (
            <motion.div
              key="deck-empty-state"
              initial={{ opacity: 0, scale: 0.92, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-line/80 bg-canvas/70 p-5 text-center shadow-xs"
            >
              <div className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary mb-2.5">
                <FontAwesomeIcon icon={faCircleCheck} className="size-5" />
              </div>
              <p className="text-sm font-bold text-ink">Huéspedes revisados</p>
              <p className="mt-1 text-xs text-ink-muted max-w-xs">
                Has examinado la información de los {cards.length}{' '}
                {cards.length === 1 ? 'huésped' : 'huéspedes'} de esta reserva.
              </p>
              <button
                type="button"
                onClick={handleReset}
                className="mt-3.5 inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink shadow-2xs hover:bg-canvas transition-colors"
              >
                <FontAwesomeIcon icon={faRotateRight} className="size-3 text-primary" />
                <span>Restaurar tarjetas</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controles de navegación y estado de la pila */}
      {cards.length > 1 && (
        <div className="flex items-center justify-between pt-1 text-xs">
          {/* Botón descartar hacia la izquierda */}
          <button
            type="button"
            disabled={deck.length === 0}
            onClick={() => handleDismissTop('left')}
            aria-label="Descartar hacia la izquierda"
            className="inline-flex items-center gap-1.5 rounded-xl border border-line/70 bg-surface/60 px-2.5 py-1 text-[11px] font-medium text-ink-muted hover:bg-surface hover:text-ink disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <FontAwesomeIcon icon={faChevronLeft} className="size-2.5" />
            <span>Descartar</span>
          </button>

          {/* Indicador de posición y puntos de progreso */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-ink-muted">
              {deck.length > 0
                ? `${currentIndex} de ${cards.length}`
                : `${cards.length} de ${cards.length}`}
            </span>
            <div className="flex items-center gap-1">
              {cards.map((c) => {
                const isSwiped = !deck.some((d) => d.id === c.id)
                const isCurrent = deck[0]?.id === c.id
                return (
                  <span
                    key={c.id}
                    className={cn(
                      'h-1.5 rounded-full transition-all duration-300',
                      isCurrent
                        ? 'w-4 bg-primary'
                        : isSwiped
                        ? 'w-1.5 bg-line/80'
                        : 'w-1.5 bg-line'
                    )}
                  />
                )
              })}
            </div>
          </div>

          {/* Botón reiniciar o siguiente */}
          {deck.length > 0 ? (
            <button
              type="button"
              onClick={() => handleDismissTop('right')}
              aria-label="Siguiente huésped"
              className="inline-flex items-center gap-1.5 rounded-xl border border-line/70 bg-surface/60 px-2.5 py-1 text-[11px] font-medium text-ink-muted hover:bg-surface hover:text-ink transition-colors"
            >
              <span>Siguiente</span>
              <FontAwesomeIcon icon={faChevronRight} className="size-2.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleReset}
              aria-label="Reiniciar tarjetas"
              className="inline-flex items-center gap-1.5 rounded-xl border border-line/70 bg-surface/60 px-2.5 py-1 text-[11px] font-medium text-primary hover:bg-surface transition-colors"
            >
              <FontAwesomeIcon icon={faRotateRight} className="size-2.5" />
              <span>Reiniciar</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
