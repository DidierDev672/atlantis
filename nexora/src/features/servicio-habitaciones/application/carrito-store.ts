import { create } from 'zustand'
import type { ItemMenuProducto } from '../domain/item-menu'

export interface ItemCarrito {
  /** Referencia del producto agregado */
  producto: ItemMenuProducto
  /** Cantidad solicitada */
  cantidad: number
  /** Notas personalizadas o indicaciones especiales de cocina */
  notas?: string
}

export interface CarritoServicioHabitacionesState {
  items: ItemCarrito[]
  /** Índice O(1) de cantidad por clave de producto para evitar `.find()` en cada tarjeta */
  cantidadPorKey: Record<string, number>
  agregarProducto: (producto: ItemMenuProducto, cantidad?: number) => void
  removerProducto: (productoKey: string) => void
  actualizarCantidad: (productoKey: string, nuevaCantidad: number) => void
  incrementarCantidad: (productoKey: string) => void
  decrementarCantidad: (productoKey: string) => void
  actualizarNotas: (productoKey: string, notas: string) => void
  vaciarCarrito: () => void
}

/**
 * Obtiene un identificador seguro para el item del carrito sin exponerlo al usuario.
 */
export function obtenerProductoKey(producto: ItemMenuProducto): string {
  return producto.id || producto.name.trim().toLowerCase()
}

function buildCantidadPorKey(items: ReadonlyArray<ItemCarrito>): Record<string, number> {
  const index: Record<string, number> = {}
  try {
    for (const item of items) {
      index[obtenerProductoKey(item.producto)] = item.cantidad
    }
  } catch {
    return {}
  }
  return index
}

/**
 * Store de Zustand para el Carrito de Pedidos de Room Service.
 */
export const useCarritoStore = create<CarritoServicioHabitacionesState>((set) => ({
  items: [],
  cantidadPorKey: {},

  agregarProducto: (producto, cantidad = 1) =>
    set((state) => {
      const key = obtenerProductoKey(producto)
      const index = state.items.findIndex(
        (i) => obtenerProductoKey(i.producto) === key
      )

      const nextItems =
        index >= 0
          ? state.items.map((item, idx) =>
              idx === index
                ? { ...item, cantidad: item.cantidad + cantidad }
                : item
            )
          : [...state.items, { producto, cantidad, notas: '' }]

      return {
        items: nextItems,
        cantidadPorKey: buildCantidadPorKey(nextItems),
      }
    }),

  removerProducto: (productoKey) =>
    set((state) => {
      const nextItems = state.items.filter(
        (i) => obtenerProductoKey(i.producto) !== productoKey
      )
      return {
        items: nextItems,
        cantidadPorKey: buildCantidadPorKey(nextItems),
      }
    }),

  actualizarCantidad: (productoKey, nuevaCantidad) =>
    set((state) => {
      const nextItems =
        nuevaCantidad <= 0
          ? state.items.filter(
              (i) => obtenerProductoKey(i.producto) !== productoKey
            )
          : state.items.map((i) =>
              obtenerProductoKey(i.producto) === productoKey
                ? { ...i, cantidad: nuevaCantidad }
                : i
            )
      return {
        items: nextItems,
        cantidadPorKey: buildCantidadPorKey(nextItems),
      }
    }),

  incrementarCantidad: (productoKey) =>
    set((state) => {
      const nextItems = state.items.map((i) =>
        obtenerProductoKey(i.producto) === productoKey
          ? { ...i, cantidad: i.cantidad + 1 }
          : i
      )
      return {
        items: nextItems,
        cantidadPorKey: buildCantidadPorKey(nextItems),
      }
    }),

  decrementarCantidad: (productoKey) =>
    set((state) => {
      const item = state.items.find(
        (i) => obtenerProductoKey(i.producto) === productoKey
      )
      if (!item) return state

      const nextItems =
        item.cantidad <= 1
          ? state.items.filter(
              (i) => obtenerProductoKey(i.producto) !== productoKey
            )
          : state.items.map((i) =>
              obtenerProductoKey(i.producto) === productoKey
                ? { ...i, cantidad: i.cantidad - 1 }
                : i
            )

      return {
        items: nextItems,
        cantidadPorKey: buildCantidadPorKey(nextItems),
      }
    }),

  actualizarNotas: (productoKey, notas) =>
    set((state) => ({
      items: state.items.map((i) =>
        obtenerProductoKey(i.producto) === productoKey ? { ...i, notas } : i
      ),
    })),

  vaciarCarrito: () => set({ items: [], cantidadPorKey: {} }),
}))
