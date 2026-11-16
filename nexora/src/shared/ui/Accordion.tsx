import { useState, useId, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown } from '@fortawesome/free-solid-svg-icons'

export interface AccordionItem {
  id: string
  title: ReactNode
  content: ReactNode
}

export interface AccordionProps {
  items: AccordionItem[]
  /** Si es `true`, solo un elemento puede estar abierto a la vez; si es `false`, pueden expandirse varios simultáneamente */
  singleOpen?: boolean
  /** IDs abiertos inicialmente */
  defaultOpenIds?: string[]
  className?: string
}

export function Accordion({
  items,
  singleOpen = true,
  defaultOpenIds = [],
  className = '',
}: AccordionProps) {
  const baseId = useId()
  const [openIds, setOpenIds] = useState<string[]>(() =>
    singleOpen ? defaultOpenIds.slice(0, 1) : defaultOpenIds
  )

  const activeOpenIds = singleOpen ? openIds.slice(0, 1) : openIds

  const handleToggle = (id: string) => {
    setOpenIds((prev) => {
      const estaAbierto = prev.includes(id)
      if (singleOpen) {
        return estaAbierto ? [] : [id]
      }
      return estaAbierto ? prev.filter((item) => item !== id) : [...prev, id]
    })
  }

  return (
    <div className={`space-y-2 ${className}`.trim()}>
      {items.map((item) => {
        const isOpen = activeOpenIds.includes(item.id)
        const triggerId = `${baseId}-trigger-${item.id}`
        const panelId = `${baseId}-panel-${item.id}`

        return (
          <div
            key={item.id}
            className="overflow-hidden rounded-2xl border border-line/70 bg-canvas/40 transition-colors hover:border-line"
          >
            <button
              id={triggerId}
              type="button"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => handleToggle(item.id)}
              className="flex w-full items-center justify-between gap-3 px-3.5 py-3 text-left transition-colors hover:bg-canvas/70 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            >
              <div className="min-w-0 flex-1">{item.title}</div>
              <FontAwesomeIcon
                icon={faChevronDown}
                className={`size-3 shrink-0 text-ink-muted transition-transform duration-200 ${
                  isOpen ? 'rotate-180 text-primary' : ''
                }`}
              />
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={panelId}
                  role="region"
                  aria-labelledby={triggerId}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-line/60 px-3.5 py-3 text-xs text-ink-muted">
                    {item.content}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
