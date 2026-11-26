import { memo, useCallback, useId, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faChevronDown,
  faMagnifyingGlass,
  faReceipt,
  faUtensils,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'
import { useDeviceResourceProfile } from '../../../../shared/lib/use-device-resource-profile'
import { Input } from '../../../../shared/ui/Input'
import type { GuestServiceRequestProduct } from '../../domain/salida-huesped'
import { CargoEstadiaProductItem } from './cargo-estadia-product-item'

export interface CuentaCargoEstadiaSectionProps {
  guestKey: string
  products: GuestServiceRequestProduct[]
}

/**
 * Molécula: Acordeón de "Cargo de la estadía" con búsqueda en tiempo real y
 * estados vacíos diferenciados para los consumos del huésped.
 */
export const CuentaCargoEstadiaSection = memo(
  function CuentaCargoEstadiaSection({
    guestKey,
    products,
  }: CuentaCargoEstadiaSectionProps) {
    const contentId = useId()
    const { policy } = useDeviceResourceProfile()
    const [openForKey, setOpenForKey] = useState<string | null>(null)
    const [searchState, setSearchState] = useState<{
      guestKey: string
      query: string
    }>({ guestKey: '', query: '' })

    const isOpen = openForKey === guestKey
    const productSearch =
      searchState.guestKey === guestKey ? searchState.query : ''

    const filteredProducts = useMemo(() => {
      const q = productSearch.trim().toLowerCase()
      if (!q) return products
      return products.filter(
        (product) =>
          product.name.toLowerCase().includes(q) ||
          (product.note?.toLowerCase().includes(q) ?? false) ||
          (product.statusLabel?.toLowerCase().includes(q) ?? false)
      )
    }, [productSearch, products])

    const handleToggle = useCallback(() => {
      setOpenForKey((prev) => (prev === guestKey ? null : guestKey))
    }, [guestKey])

    const handleSearchChange = useCallback(
      (value: string) => {
        setSearchState({ guestKey, query: value })
      },
      [guestKey]
    )

    return (
      <section
        aria-label="Cargo de la estadía"
        className="border-line/70 bg-canvas/50 overflow-hidden rounded-2xl border"
      >
        <button
          type="button"
          onClick={handleToggle}
          aria-expanded={isOpen}
          aria-controls={contentId}
          className="hover:bg-canvas/80 focus-visible:ring-primary/50 flex w-full cursor-pointer items-center justify-between gap-3 px-3.5 py-3 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="bg-primary/10 text-primary grid size-9 shrink-0 place-items-center rounded-xl">
              <FontAwesomeIcon
                icon={faReceipt}
                className="size-4"
                aria-hidden="true"
              />
            </span>
            <span className="min-w-0">
              <span className="text-ink flex flex-wrap items-center gap-2 text-xs font-bold sm:text-sm">
                <span>Cargo de la estadía</span>
                <span className="border-primary/20 bg-primary/10 text-primary rounded-full border px-2 py-0.5 text-[10px] font-semibold tabular-nums">
                  {products.length}
                </span>
              </span>
              <span className="text-ink-muted block truncate text-[11px]">
                Alojamiento y servicio de habitación
              </span>
            </span>
          </span>

          <FontAwesomeIcon
            icon={faChevronDown}
            aria-hidden="true"
            className={`text-ink-muted size-3.5 shrink-0 transition-transform duration-200 ${
              isOpen ? 'text-primary rotate-180' : ''
            }`}
          />
        </button>

        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              id={contentId}
              initial={
                policy.enableAnimations ? { height: 0, opacity: 0 } : false
              }
              animate={{ height: 'auto', opacity: 1 }}
              exit={
                policy.enableAnimations ? { height: 0, opacity: 0 } : undefined
              }
              transition={{
                duration: policy.enableAnimations ? 0.22 : 0,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="overflow-hidden"
            >
              <div className="border-line/60 border-t p-3.5">
                {products.length === 0 ? (
                  <div className="border-line/70 bg-panel/60 flex flex-col items-center justify-center rounded-2xl border px-6 py-10 text-center">
                    <span className="bg-primary/10 text-primary mb-3 grid size-11 place-items-center rounded-xl">
                      <FontAwesomeIcon
                        icon={faUtensils}
                        className="size-4"
                        aria-hidden="true"
                      />
                    </span>
                    <p className="text-ink text-sm font-semibold">
                      Sin consumos de servicio a la habitación
                    </p>
                    <p className="text-ink-muted mt-1 max-w-xs text-xs leading-relaxed">
                      Este huésped no registra productos solicitados al servicio
                      a la habitación durante su estadía.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Input
                      value={productSearch}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      placeholder="Buscar producto por nombre, nota o estado…"
                      aria-label="Buscar producto solicitado en tiempo real"
                      icon={
                        <FontAwesomeIcon
                          icon={faMagnifyingGlass}
                          className="size-3.5"
                          aria-hidden="true"
                        />
                      }
                      action={
                        productSearch ? (
                          <button
                            type="button"
                            onClick={() => handleSearchChange('')}
                            aria-label="Limpiar búsqueda de productos"
                            title="Limpiar búsqueda"
                            className="text-ink-muted hover:text-ink flex size-7 cursor-pointer items-center justify-center rounded-lg transition-colors"
                          >
                            <FontAwesomeIcon
                              icon={faXmark}
                              className="size-3.5"
                              aria-hidden="true"
                            />
                          </button>
                        ) : undefined
                      }
                    />

                    {filteredProducts.length === 0 ? (
                      <div className="border-line/70 bg-panel/60 flex flex-col items-center justify-center rounded-2xl border px-6 py-10 text-center">
                        <p className="text-ink text-sm font-semibold">
                          No hay productos que coincidan con tu búsqueda
                        </p>
                        <button
                          type="button"
                          onClick={() => handleSearchChange('')}
                          className="text-primary mt-2 cursor-pointer text-xs font-semibold hover:underline"
                        >
                          Limpiar búsqueda
                        </button>
                      </div>
                    ) : (
                      <ul
                        aria-label="Lista de productos solicitados al servicio a la habitación"
                        className="space-y-2.5"
                      >
                        {filteredProducts.map((product) => (
                          <CargoEstadiaProductItem
                            key={product.internalKey}
                            product={product}
                          />
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    )
  }
)
