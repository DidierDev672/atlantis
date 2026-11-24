import { AnimatePresence, motion } from 'motion/react'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { cn } from '../lib/cn'

interface MenuPopoverContextValue {
  close: () => void
}

const MenuPopoverContext = createContext<MenuPopoverContextValue | null>(null)

export function useMenuPopover() {
  return useContext(MenuPopoverContext)
}

export interface MenuPopoverProps {
  /** Texto accesible del botón que abre el menú. */
  label: string
  /** Función que dibuja el contenido del botón; recibe si está abierto. */
  renderTrigger: (open: boolean) => ReactNode
  /** Contenido del panel desplegable. */
  children: ReactNode | ((helpers: { close: () => void }) => ReactNode)
  align?: 'left' | 'right'
  triggerClassName?: string
  panelClassName?: string
}

export function MenuPopover({
  label,
  renderTrigger,
  children,
  align = 'right',
  triggerClassName,
  panelClassName,
}: MenuPopoverProps) {
  const [open, setOpen] = useState(false)

  const handleClose = () => setOpen(false)

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <MenuPopoverContext.Provider value={{ close: handleClose }}>
      <div className="relative">
        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label={label}
          className={cn(
            'inline-flex size-9 items-center justify-center gap-2 rounded-lg border border-line bg-panel text-ink-muted outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-primary/40 cursor-pointer',
            triggerClassName,
          )}
        >
          {renderTrigger(open)}
        </motion.button>

        {open && (
          <div
            className="fixed inset-0 z-40"
            onClick={handleClose}
            aria-hidden="true"
          />
        )}

        <AnimatePresence>
          {open && (
            <motion.div
              role="menu"
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
              className={cn(
                'absolute top-full z-50 mt-2 w-72 rounded-2xl border border-line bg-panel p-1.5 shadow-xl',
                align === 'right' ? 'right-0' : 'left-0',
                panelClassName,
              )}
            >
              {typeof children === 'function' ? children({ close: handleClose }) : children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MenuPopoverContext.Provider>
  )
}

export interface MenuItemProps {
  icon: ReactNode
  label: string
  onClick?: () => void
  danger?: boolean
}

export function MenuItem({ icon, label, onClick, danger }: MenuItemProps) {
  const popover = useContext(MenuPopoverContext)

  const handleClick = () => {
    onClick?.()
    popover?.close()
  }

  return (
    <button
      type="button"
      role="menuitem"
      onClick={handleClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/30 cursor-pointer',
        danger
          ? 'text-danger hover:bg-danger/10'
          : 'text-ink hover:bg-primary/5 hover:text-primary',
      )}
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/8 text-ink-muted">
        {icon}
      </span>
      {label}
    </button>
  )
}