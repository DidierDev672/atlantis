import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { useEffect, useState, type ReactNode } from 'react'
import type { NavId } from '../navigation'
import {
  BedIcon,
  BriefcaseIcon,
  BuildingIcon,
  CalendarIcon,
  ChevronDownIcon,
  ClipboardCheckIcon,
  CloseIcon,
  ConciergeBellIcon,
  CubeIcon,
  HomeIcon,
  PaletteIcon,
  SettingsIcon,
  ShieldIcon,
  SparklesIcon,
  TagIcon,
  UserIcon,
  UsersIcon,
  UtensilsIcon,
} from '../icons'
import { SidebarNavItem } from '../molecules/sidebar-nav-item'
import { useTemaStore } from '../../../tema/application/tema-store'
import { cn } from '../lib/cn'

const NAV_ICONS: Record<NavId, ReactNode> = {
  home: <HomeIcon className="size-[18px]" />,
  sedes: <BuildingIcon className="size-[18px]" />,
  habitacion: <BedIcon className="size-[18px]" />,
  tarifas: <TagIcon className="size-[18px]" />,
  cama: <CubeIcon className="size-[18px]" />,
  reservas: <CalendarIcon className="size-[18px]" />,
  recepcion: <ConciergeBellIcon className="size-[18px]" />,
  auditoria: <ClipboardCheckIcon className="size-[18px]" />,
  usuarios: <UsersIcon className="size-[18px]" />,
  personas: <UserIcon className="size-[18px]" />,
  recursos: <ShieldIcon className="size-[18px]" />,
  paletas: <PaletteIcon className="size-[18px]" />,
  configuracion: <SettingsIcon className="size-[18px]" />,
  perfil: <UserIcon className="size-[18px]" />,
  servicios: <UtensilsIcon className="size-[18px]" />,
}

interface OperacionSubItem {
  id: NavId
  label: string
}

/**
 * Submódulos operativos del hotel pertenecientes al acordeón "Operación".
 * Orden solicitado: Habitaciones, Recepción, Reservas, Servicios de habitaciones.
 */
const OPERACION_SUB_ITEMS: readonly OperacionSubItem[] = [
  { id: 'habitacion', label: 'Habitaciones' },
  { id: 'recepcion', label: 'Recepción' },
  { id: 'reservas', label: 'Reservas' },
  { id: 'servicios', label: 'Servicios de habitaciones' },
] as const

interface SidebarBodyProps {
  activeId: NavId
  onNavigate: (id: NavId) => void
  onClose?: () => void
  isMobile?: boolean
}

function SidebarBody({
  activeId,
  onNavigate,
  onClose,
  isMobile = false,
}: SidebarBodyProps) {
  const hotelLogo = useTemaStore((state) => state.hotelLogo)
  const hotelName = useTemaStore((state) => state.hotelName)

  // Determinar si alguna de las pantallas hijas de Operación está activa
  const isOperacionActive = OPERACION_SUB_ITEMS.some((item) => item.id === activeId)
  const [userToggle, setUserToggle] = useState<{ activeId: NavId; isOpen: boolean } | null>(null)

  // Respetar toggle manual del usuario para el estado actual; de lo contrario, auto-expandir si un hijo está activo
  const operacionOpen =
    userToggle && userToggle.activeId === activeId
      ? userToggle.isOpen
      : isOperacionActive

  return (
    <div className="flex h-full flex-col">
      {/* Branding / Encabezado del hotel */}
      <div className="flex items-center justify-between gap-3 px-5 pt-6 pb-5">
        <div className="flex items-center gap-3 min-w-0">
          <span className="grid size-10 place-items-center rounded-xl bg-cream text-primary shadow-sm overflow-hidden shrink-0">
            {hotelLogo ? (
              <img
                src={hotelLogo}
                alt={hotelName || 'Logo del hotel'}
                className="size-full object-cover"
              />
            ) : (
              <SparklesIcon className="size-5" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-base font-bold text-cream truncate">Nexora</p>
            <p className="text-[11px] text-cream/70 truncate" title={hotelName}>
              {hotelName}
            </p>
          </div>
        </div>

        {/* Botón de cierre en vista móvil */}
        {isMobile && onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú de navegación"
            className="grid size-8 place-items-center rounded-lg text-cream/70 hover:bg-white/10 hover:text-cream transition-colors lg:hidden cursor-pointer"
          >
            <CloseIcon className="size-4" />
          </button>
        )}
      </div>

      {/* Navegación principal */}
      <nav className="flex-1 space-y-1.5 px-3" aria-label="Navegación principal">
        {/* 1. Home */}
        <SidebarNavItem
          active={activeId === 'home'}
          icon={NAV_ICONS.home}
          label="Home"
          onClick={() => onNavigate('home')}
        />

        {/* 2. Acordeón "Operación" con efecto Fade In (prompt/prompt-fade-in.md) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="space-y-1"
        >
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            whileTap={{ scale: 0.98 }}
            onClick={() =>
              setUserToggle({
                activeId,
                isOpen: !operacionOpen,
              })
            }
            aria-expanded={operacionOpen}
            className={cn(
              'relative flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-cream/40 cursor-pointer',
              isOperacionActive
                ? 'text-cream bg-white/10 font-semibold'
                : 'text-cream/70 hover:bg-sidebar-hover hover:text-cream',
            )}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="relative shrink-0 text-cream/90">
                <BriefcaseIcon className="size-[18px]" />
              </span>
              <span className="relative truncate">Operación</span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-cream/70">
                4
              </span>
              <motion.span
                animate={{ rotate: operacionOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="text-cream/60"
              >
                <ChevronDownIcon className="size-4" />
              </motion.span>
            </div>
          </motion.button>

          {/* Sub-items del acordeón con animación Fade In */}
          <AnimatePresence initial={false}>
            {operacionOpen && (
              <motion.div
                key="operacion-accordion-content"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="overflow-hidden"
              >
                <div className="ml-4 space-y-0.5 border-l border-white/15 pl-2.5 pt-1 pb-1">
                  {OPERACION_SUB_ITEMS.map((subItem) => {
                    const isSubActive = activeId === subItem.id
                    return (
                      <motion.button
                        key={subItem.id}
                        type="button"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onNavigate(subItem.id)}
                        aria-current={isSubActive ? 'page' : undefined}
                        className={cn(
                          'relative flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-cream/40 cursor-pointer',
                          isSubActive
                            ? 'text-cream bg-white/15 font-semibold shadow-2xs'
                            : 'text-cream/65 hover:bg-white/10 hover:text-cream',
                        )}
                      >
                        {isSubActive && (
                          <motion.span
                            layoutId="sidebar-subitem-active"
                            className="absolute inset-0 rounded-lg bg-white/10"
                            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                          />
                        )}
                        <span className="relative shrink-0 text-cream/80">
                          {NAV_ICONS[subItem.id]}
                        </span>
                        <span className="relative truncate">{subItem.label}</span>
                      </motion.button>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* 3. Configuración */}
        <SidebarNavItem
          active={activeId === 'configuracion'}
          icon={NAV_ICONS.configuracion}
          label="Configuración"
          onClick={() => onNavigate('configuracion')}
        />
      </nav>

      {/* Pie de versión */}
      <div className="border-t border-white/10 px-5 py-4">
        <p className="text-[11px] text-cream/40">Nexora v1.0 · Panel de operaciones</p>
      </div>
    </div>
  )
}

export interface SidebarProps {
  open: boolean
  onClose: () => void
  activeId: NavId
  onNavigate: (id: NavId) => void
}

export function Sidebar({ open, onClose, activeId, onNavigate }: SidebarProps) {
  // Manejo de bloqueo de scroll y atajo de teclado Escape en móvil
  useEffect(() => {
    if (!open) return

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  return (
    <>
      {/* Versión fija para Desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 bg-sidebar lg:block">
        <LayoutGroup>
          <SidebarBody activeId={activeId} onNavigate={onNavigate} />
        </LayoutGroup>
      </aside>

      {/* Versión Drawer interactivo para Móvil / Tablet */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="sidebar-overlay"
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              aria-hidden="true"
            />
            <motion.aside
              key="sidebar-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Menú principal de navegación"
              className="fixed inset-y-0 left-0 z-50 w-64 bg-sidebar shadow-2xl lg:hidden"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
            >
              <LayoutGroup>
                <SidebarBody
                  activeId={activeId}
                  onNavigate={onNavigate}
                  onClose={onClose}
                  isMobile
                />
              </LayoutGroup>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
