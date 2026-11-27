import { memo } from 'react'
import { motion } from 'motion/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCalendarCheck,
  faFileInvoiceDollar,
  faUserPlus,
} from '@fortawesome/free-solid-svg-icons'

export type PersonasPageTab = 'facturas' | 'registros' | 'nuevo'

export interface PersonasRegistrosTabsBarProps {
  activeTab: PersonasPageTab
  onSelectTab: (tab: PersonasPageTab) => void
}

const TABS: ReadonlyArray<{
  id: PersonasPageTab
  label: string
  icon: typeof faCalendarCheck
}> = [
  {
    id: 'registros',
    label: 'Tabla de registros e historial',
    icon: faCalendarCheck,
  },
  { id: 'facturas', label: 'Factura', icon: faFileInvoiceDollar },
  { id: 'nuevo', label: 'Registrar nueva persona', icon: faUserPlus },
]

/**
 * Molécula: Barra de navegación por pestañas dentro del módulo Registros.
 */
export const PersonasRegistrosTabsBar = memo(function PersonasRegistrosTabsBar({
  activeTab,
  onSelectTab,
}: PersonasRegistrosTabsBarProps) {
  return (
    <div className="border-line flex flex-wrap items-center justify-between gap-3 border-b pb-2">
      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`relative flex cursor-pointer items-center gap-2 px-4 py-2 text-xs font-bold transition ${
                isActive ? 'text-primary' : 'text-ink-muted hover:text-ink'
              }`}
            >
              <FontAwesomeIcon
                icon={tab.icon}
                className="size-3.5"
                aria-hidden="true"
              />
              <span>{tab.label}</span>
              {isActive && (
                <motion.div
                  layoutId="activeRegistrosTabIndicator"
                  className="bg-primary absolute inset-x-0 -bottom-2 h-0.5"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
            </button>
          )
        })}
      </div>

      {activeTab !== 'registros' && (
        <button
          type="button"
          onClick={() => onSelectTab('registros')}
          className="text-primary flex cursor-pointer items-center gap-1 text-xs font-semibold hover:underline"
        >
          ← Volver a la tabla de registros
        </button>
      )}
    </div>
  )
})
