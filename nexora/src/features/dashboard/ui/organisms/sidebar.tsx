import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { useEffect, useState, type ReactNode } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDoorOpen, faThumbTack } from '@fortawesome/free-solid-svg-icons'
import type { NavId } from '../navigation'
import {
  BedIcon,
  BuildingIcon,
  CalendarIcon,
  ClipboardCheckIcon,
  CloseIcon,
  ConciergeBellIcon,
  CubeIcon,
  HomeIcon,
  PaletteIcon,
  SettingsIcon,
  ShieldIcon,
  TagIcon,
  UserIcon,
  UsersIcon,
  UtensilsIcon,
} from '../icons'
import { SidebarNavItem } from '../molecules/sidebar-nav-item'
import { DEFAULT_HOTEL_LOGO, useTemaStore } from '../../../tema/application/tema-store'
import { canAccessRoute } from '../../../../shared/auth-storage'
import { cn } from '../lib/cn'

const NAV_ICONS: Record<NavId, ReactNode> = {
  home: <HomeIcon className="size-[18px]" />,
  sedes: <BuildingIcon className="size-[18px]" />,
  habitacion: <BedIcon className="size-[18px]" />,
  tarifas: <TagIcon className="size-[18px]" />,
  cama: <CubeIcon className="size-[18px]" />,
  reservas: <CalendarIcon className="size-[18px]" />,
  recepcion: <ConciergeBellIcon className="size-[18px]" />,
  salidas: <FontAwesomeIcon icon={faDoorOpen} className="size-[18px]" aria-hidden="true" />,
  auditoria: <ClipboardCheckIcon className="size-[18px]" />,
  usuarios: <UsersIcon className="size-[18px]" />,
  personas: <ClipboardCheckIcon className="size-[18px]" />,
  recursos: <ShieldIcon className="size-[18px]" />,
  paletas: <PaletteIcon className="size-[18px]" />,
  configuracion: <SettingsIcon className="size-[18px]" />,
  perfil: <UserIcon className="size-[18px]" />,
  servicios: <UtensilsIcon className="size-[18px]" />,
}

interface OperacionNavItem {
  id: NavId
  label: string
}

/**
 * Módulos operativos del hotel expuestos de manera directa e independiente en el Sidebar.
 * - Habitaciones: Operación por piso, Check-in y cargos a la habitación.
 * - Registros: Tabla maestra diaria e histórica de huéspedes, saldos, Check-out y Facturación Electrónica.
 * - Reservas: Gestión de reservas futuras.
 * - Servicios de habitaciones: Pedidos de tienda y restaurante.
 */
const OPERACION_NAV_ITEMS: readonly OperacionNavItem[] = [
  { id: 'habitacion', label: 'Habitaciones' },
  { id: 'personas', label: 'Registros' },
  { id: 'reservas', label: 'Reservas' },
  { id: 'servicios', label: 'Servicios de habitaciones' },
] as const

interface SidebarBodyProps {
  activeId: NavId
  onNavigate: (id: NavId) => void
  onClose?: () => void
  isMobile?: boolean
  collapsed?: boolean
  pinned?: boolean
  onTogglePin?: () => void
}

function SidebarBody({
  activeId,
  onNavigate,
  onClose,
  isMobile = false,
  collapsed = false,
  pinned = false,
  onTogglePin,
}: SidebarBodyProps) {
  const hotelLogo = useTemaStore((state) => state.hotelLogo)
  const hotelName = useTemaStore((state) => state.hotelName)
  const [, setAuthTick] = useState(0)

  useEffect(() => {
    const handleAuthChange = () => setAuthTick((prev) => prev + 1)
    window.addEventListener('nexora:auth-change', handleAuthChange)
    return () => window.removeEventListener('nexora:auth-change', handleAuthChange)
  }, [])

  const showHome = canAccessRoute('home')
  const showConfiguracion = canAccessRoute('configuracion')
  const visibleOperacionItems = OPERACION_NAV_ITEMS.filter((item) =>
    canAccessRoute(item.id),
  )

  return (
    <div className="flex h-full flex-col">
      {/* Branding / Encabezado del hotel (Clickeable en desktop para fijar/desfijar el menú) */}
      <div
        className={cn(
          'flex items-center justify-between gap-2 pt-5 pb-4 transition-all duration-200',
          collapsed ? 'px-3 justify-center' : 'px-4',
        )}
      >
        <button
          type="button"
          onClick={!isMobile ? onTogglePin : undefined}
          title={
            !isMobile
              ? pinned
                ? 'Menú fijado · Clic en Aloja para contraer automáticamente con el mouse'
                : 'Clic en Aloja para dejar el menú fijo abierto'
              : undefined
          }
          className={cn(
            'group flex items-center min-w-0 rounded-xl p-1.5 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-cream/40',
            !isMobile && 'cursor-pointer hover:bg-white/10',
            collapsed ? 'justify-center' : 'gap-3 flex-1',
          )}
        >
          <span className="relative grid size-10 place-items-center rounded-xl text-primary shadow-sm overflow-hidden shrink-0 ring-1 ring-white/15">
            <img
              src={hotelLogo || DEFAULT_HOTEL_LOGO}
              alt={hotelName || 'Logo del proyecto'}
              className={hotelLogo ? 'size-full object-cover' : 'size-full object-contain'}
            />
            {!isMobile && pinned && collapsed && (
              <span className="absolute top-0.5 right-0.5 size-2 rounded-full bg-emerald-400" />
            )}
          </span>

          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-base font-bold text-cream truncate">Aloja</p>
                {!isMobile && (
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold transition-colors',
                      pinned
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                        : 'bg-white/10 text-cream/60 group-hover:text-cream/90',
                    )}
                  >
                    <FontAwesomeIcon
                      icon={faThumbTack}
                      className={cn('size-2.5 transition-transform', !pinned && 'rotate-45')}
                      aria-hidden="true"
                    />
                    <span>{pinned ? 'Fijo' : 'Auto'}</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-cream/70 truncate" title={hotelName}>
                {hotelName}
              </p>
            </div>
          )}
        </button>

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

      {/* Navegación principal filtrada por permisos del rol */}
      <nav className="flex-1 space-y-1.5 px-3 overflow-y-auto" aria-label="Navegación principal">
        {/* 1. Home (solo roles con permiso a Home) */}
        {showHome && (
          <SidebarNavItem
            active={activeId === 'home'}
            icon={NAV_ICONS.home}
            label="Home"
            collapsed={collapsed}
            onClick={() => onNavigate('home')}
          />
        )}

        {/* 2. Módulos operativos independientes */}
        {visibleOperacionItems.map((item) => (
          <SidebarNavItem
            key={item.id}
            active={activeId === item.id}
            icon={NAV_ICONS[item.id]}
            label={item.label}
            collapsed={collapsed}
            onClick={() => onNavigate(item.id)}
          />
        ))}

        {/* 3. Configuración (solo para roles administrativos) */}
        {showConfiguracion && (
          <SidebarNavItem
            active={activeId === 'configuracion'}
            icon={NAV_ICONS.configuracion}
            label="Configuración"
            collapsed={collapsed}
            onClick={() => onNavigate('configuracion')}
          />
        )}
      </nav>

      {/* Pie de versión */}
      <div
        className={cn(
          'border-t border-white/10 py-3.5 transition-all duration-200 overflow-hidden',
          collapsed ? 'px-2 text-center' : 'px-5',
        )}
      >
        {collapsed ? (
          <p className="text-[10px] font-semibold text-cream/40">v1.0</p>
        ) : (
          <p className="text-[11px] text-cream/40 truncate">
            Aloja v1.0 · {pinned ? 'Menú fijo' : 'Clic en Aloja para fijar'}
          </p>
        )}
      </div>
    </div>
  )
}

export interface SidebarProps {
  open: boolean
  onClose: () => void
  activeId: NavId
  onNavigate: (id: NavId) => void
  pinned?: boolean
  onTogglePin?: () => void
}

export function Sidebar({
  open,
  onClose,
  activeId,
  onNavigate,
  pinned = false,
  onTogglePin,
}: SidebarProps) {
  const [isHovered, setIsHovered] = useState(false)

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

  const isExpandedDesktop = pinned || isHovered

  const handleTogglePin = () => {
    if (pinned) {
      // Si estaba fijado y el usuario da clic en Aloja para cerrarlo, también limpiamos hover inmediato
      setIsHovered(false)
    }
    onTogglePin?.()
  }

  return (
    <>
      {/* Versión colapsable / expandible con el mouse para Desktop */}
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          'fixed inset-y-0 left-0 z-45 hidden bg-sidebar transition-[width,box-shadow] duration-200 ease-out lg:block',
          isExpandedDesktop ? 'w-64 shadow-2xl' : 'w-20',
        )}
      >
        <LayoutGroup id="desktop-sidebar">
          <SidebarBody
            activeId={activeId}
            onNavigate={onNavigate}
            collapsed={!isExpandedDesktop}
            pinned={pinned}
            onTogglePin={handleTogglePin}
          />
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
              <LayoutGroup id="mobile-sidebar">
                <SidebarBody
                  activeId={activeId}
                  onNavigate={onNavigate}
                  onClose={onClose}
                  isMobile
                  collapsed={false}
                />
              </LayoutGroup>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
