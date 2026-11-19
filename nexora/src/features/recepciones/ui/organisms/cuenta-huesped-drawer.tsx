import { useMemo, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faMagnifyingGlass,
  faPhone,
  faUtensils,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'
import { Drawer } from '../../../../shared/ui/Drawer'
import { Input } from '../../../../shared/ui/Input'
import { type SalidaHuespedItem } from '../../domain/salida-huesped'
import { PrintingReceiptIcon } from '../atoms/printing-receipt-icon'
import { CargoEstadiaProductItem } from '../molecules/cargo-estadia-product-item'
import { CuentaResumenFooter } from '../molecules/cuenta-resumen-footer'

export interface CuentaHuespedDrawerProps {
  guest: SalidaHuespedItem | null
  isOpen: boolean
  onClose: () => void
  onPay?: (guest: SalidaHuespedItem) => void
}

export function CuentaHuespedDrawer({
  guest,
  isOpen,
  onClose,
  onPay,
}: CuentaHuespedDrawerProps) {
  const [payNoticeGuestKey, setPayNoticeGuestKey] = useState<string | null>(
    null
  )
  const [productSearch, setProductSearch] = useState('')
  const [isHeaderReceiptHover, setIsHeaderReceiptHover] = useState(false)

  const filteredProducts = useMemo(() => {
    if (!guest) return []
    const q = productSearch.trim().toLowerCase()
    if (!q) return guest.serviceRequestProducts
    return guest.serviceRequestProducts.filter(
      (product) =>
        product.name.toLowerCase().includes(q) ||
        (product.note?.toLowerCase().includes(q) ?? false) ||
        (product.statusLabel?.toLowerCase().includes(q) ?? false)
    )
  }, [guest, productSearch])

  if (!guest) return null

  const grandTotal =
    guest.serviceRequestsTotal + guest.reservesTotal + guest.receptionsTotal
  const showPayNotice = payNoticeGuestKey === guest.internalKey

  const handleClose = () => {
    setPayNoticeGuestKey(null)
    setProductSearch('')
    onClose()
  }

  const handlePayClick = () => {
    if (onPay) {
      onPay(guest)
      return
    }
    setPayNoticeGuestKey(guest.internalKey)
  }

  return (
    <Drawer
      isOpen={isOpen}
      onClose={handleClose}
      position="right"
      size="lg"
      iconElement={
        <div
          onMouseEnter={() => setIsHeaderReceiptHover(true)}
          onMouseLeave={() => setIsHeaderReceiptHover(false)}
          className="bg-primary/10 text-primary grid size-10 place-items-center rounded-2xl transition-colors hover:bg-primary/15"
        >
          <PrintingReceiptIcon
            isPrinting={isHeaderReceiptHover}
            className="size-4"
          />
        </div>
      }
      title={guest.name}
      description={
        <span className="inline-flex items-center gap-1.5">
          <FontAwesomeIcon
            icon={faPhone}
            className="text-primary size-3"
            aria-hidden="true"
          />
          <span>{guest.phoneNumber || 'Teléfono no registrado'}</span>
        </span>
      }
      footer={
        <CuentaResumenFooter
          serviceRequestsTotal={guest.serviceRequestsTotal}
          reservesTotal={guest.reservesTotal}
          receptionsTotal={guest.receptionsTotal}
          grandTotal={grandTotal}
          showPayNotice={showPayNotice}
          onClose={handleClose}
          onPay={handlePayClick}
        />
      }
    >
      <div className="space-y-4">
        <div className="border-line flex flex-wrap items-center justify-between gap-2 border-b pb-3">
          <h3 className="text-ink text-sm font-bold sm:text-base">
            Cargo de la estadía
          </h3>
          <span className="border-primary/20 bg-primary/10 text-primary rounded-full border px-3 py-1 text-[11px] font-semibold">
            Alojamiento y servicio de habitación
          </span>
        </div>

        {guest.serviceRequestProducts.length === 0 ? (
          <div className="border-line/70 bg-canvas/50 flex flex-col items-center justify-center rounded-2xl border px-6 py-12 text-center">
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
              Este huésped no registra productos solicitados al servicio a la
              habitación durante su estadía.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <Input
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
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
                    onClick={() => setProductSearch('')}
                    aria-label="Limpiar búsqueda de productos"
                    title="Limpiar búsqueda"
                    className="text-ink-muted hover:text-ink flex size-7 cursor-pointer items-center justify-center rounded-lg transition-colors"
                  >
                    <FontAwesomeIcon icon={faXmark} className="size-3.5" />
                  </button>
                ) : undefined
              }
            />

            {filteredProducts.length === 0 ? (
              <div className="border-line/70 bg-canvas/50 flex flex-col items-center justify-center rounded-2xl border px-6 py-10 text-center">
                <p className="text-ink text-sm font-semibold">
                  No hay productos que coincidan con tu búsqueda
                </p>
                <button
                  type="button"
                  onClick={() => setProductSearch('')}
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
    </Drawer>
  )
}
