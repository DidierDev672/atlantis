import { useState } from 'react'
import { motion } from 'motion/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCartShopping, faPaperPlane } from '@fortawesome/free-solid-svg-icons'
import {
  obtenerProductoKey,
  useCarritoStore,
} from '../../application/carrito-store'
import { formatearMonedaCOP } from '../../domain/item-menu'
import { CarritoModalItemRow } from '../molecules/CarritoModalItemRow'
import {
  ModalConfirmarPedidoCocina,
  type DatosOrdenCocina,
} from '../molecules/ModalConfirmarPedidoCocina'
import { CarritoSupermercadoAnimado } from '../atoms/CarritoSupermercadoAnimado'
import { BasuraAbiertaAnimada } from '../atoms/BasuraAbiertaAnimada'
import { LazyAnimatedWrapper } from '../../../../shared/ui'
import { Drawer } from '../../../../shared/ui/Drawer'

export interface CarritoProductosDrawerProps {
  isOpen: boolean
  onClose: () => void
  onPedidoConfirmado?: (datos: DatosOrdenCocina) => void
}

/**
 * Organismo: Drawer (Menú lateral / Panel deslizante) accesible y suave
 * para consultar los productos del carrito de Room Service y enviar a cocina.
 */
export function CarritoProductosDrawer({
  isOpen,
  onClose,
  onPedidoConfirmado,
}: CarritoProductosDrawerProps) {
  const items = useCarritoStore((s) => s.items)
  const incrementarCantidad = useCarritoStore((s) => s.incrementarCantidad)
  const decrementarCantidad = useCarritoStore((s) => s.decrementarCantidad)
  const removerProducto = useCarritoStore((s) => s.removerProducto)
  const vaciarCarrito = useCarritoStore((s) => s.vaciarCarrito)
  const [isModalConfirmarOpen, setIsModalConfirmarOpen] = useState(false)

  const totalArticulos = items.reduce((acc, curr) => acc + curr.cantidad, 0)
  const subtotalNeto = items.reduce(
    (acc, curr) => acc + curr.producto.price * curr.cantidad,
    0
  )
  const totalImpuestos = items.reduce((acc, curr) => {
    const rate = (curr.producto.tax_percentage ?? 0) / 100
    return acc + curr.producto.price * curr.cantidad * rate
  }, 0)
  const totalGeneral = subtotalNeto + totalImpuestos

  const handleConfirmarOrden = (datos: DatosOrdenCocina) => {
    setIsModalConfirmarOpen(false)
    vaciarCarrito()
    onPedidoConfirmado?.(datos)
  }

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        position="right"
        size="lg"
        iconElement={<CarritoSupermercadoAnimado />}
        title="Productos en el Carrito"
        description={`${totalArticulos} ${
          totalArticulos === 1 ? 'artículo agregado' : 'artículos agregados'
        }`}
        headerActions={
          items.length > 0 && (
            <motion.button
              type="button"
              initial="rest"
              animate="rest"
              whileHover="hover"
              onClick={vaciarCarrito}
              title="Vaciar todos los artículos del carrito"
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-1.5 text-xs font-bold text-rose-500 transition-colors hover:bg-rose-500/20"
            >
              <BasuraAbiertaAnimada />
              <span>Vaciar</span>
            </motion.button>
          )
        }
        footer={
          <div className="space-y-3">
            {items.length > 0 && (
              <div className="space-y-1 text-xs">
                <div className="text-ink-muted flex justify-between">
                  <span>Subtotal neto</span>
                  <span>{formatearMonedaCOP(subtotalNeto)}</span>
                </div>
                <div className="text-ink-muted flex justify-between">
                  <span>Impuestos (IVA)</span>
                  <span>{formatearMonedaCOP(totalImpuestos)}</span>
                </div>
                <div className="border-line text-ink flex items-baseline justify-between border-t pt-2 text-sm font-extrabold">
                  <span>Total estimado</span>
                  <span className="text-primary text-base font-black">
                    {formatearMonedaCOP(totalGeneral)}
                  </span>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="border-line bg-panel text-ink hover:bg-canvas cursor-pointer rounded-2xl border px-4 py-2 text-xs font-bold transition-colors"
              >
                Seguir explorando
              </button>
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    setIsModalConfirmarOpen(true)
                  }}
                  className="bg-primary hover:bg-primary/90 inline-flex cursor-pointer items-center gap-2 rounded-2xl px-4 py-2 text-xs font-bold text-white shadow-sm transition-all"
                >
                  <FontAwesomeIcon icon={faPaperPlane} className="size-3.5" />
                  <span>Confirmar y Enviar a Cocina</span>
                </button>
              )}
            </div>
          </div>
        }
      >
        {/* Lista de productos agregados con animación fade-in y carga perezosa (Motion) */}
        <div className="space-y-3">
          {items.length === 0 ? (
            <div className="py-12 text-center">
              <div className="bg-primary/10 text-primary mx-auto grid size-14 place-items-center rounded-2xl">
                <FontAwesomeIcon icon={faCartShopping} className="size-6" />
              </div>
              <h3 className="text-ink mt-4 font-serif text-base font-bold">
                Tu carrito está vacío
              </h3>
              <p className="text-ink-muted mx-auto mt-1.5 max-w-xs text-xs leading-relaxed">
                Explora las cartas gastronómicas y presiona el botón + para agregar platillos y bebidas aquí.
              </p>
            </div>
          ) : (
            items.map((item, idx) => (
              <LazyAnimatedWrapper
                key={obtenerProductoKey(item.producto)}
                variant="fade"
                viewportMargin="0px"
                amount="some"
                delay={Math.min(idx * 0.05, 0.25)}
                once
              >
                <CarritoModalItemRow
                  item={item}
                  onIncrement={incrementarCantidad}
                  onDecrement={decrementarCantidad}
                  onRemove={removerProducto}
                />
              </LazyAnimatedWrapper>
            ))
          )}
        </div>
      </Drawer>

      <ModalConfirmarPedidoCocina
        isOpen={isModalConfirmarOpen}
        onClose={() => setIsModalConfirmarOpen(false)}
        onConfirmar={handleConfirmarOrden}
        totalArticulos={totalArticulos}
        totalGeneral={totalGeneral}
      />
    </>
  )
}

export default CarritoProductosDrawer
