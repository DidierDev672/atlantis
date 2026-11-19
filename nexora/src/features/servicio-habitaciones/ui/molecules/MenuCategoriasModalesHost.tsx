import { Suspense, lazy, memo, type ComponentProps, type ComponentType } from 'react'
import type { MenuCategoria } from '../../domain/menu-categoria'

type MenuCategoriaModalDetalleProps = ComponentProps<
  typeof import('./MenuCategoriaModalDetalle')['MenuCategoriaModalDetalle']
>
type MenuCategoriaModalProductosProps = ComponentProps<
  typeof import('../organisms/MenuCategoriaModalProductos')['MenuCategoriaModalProductos']
>
type AgregarProductoDrawerProps = ComponentProps<
  typeof import('../organisms/AgregarProductoDrawer')['AgregarProductoDrawer']
>
type RegistrarCategoriaDrawerProps = ComponentProps<
  typeof import('../organisms/RegistrarCategoriaDrawer')['RegistrarCategoriaDrawer']
>

const LazyMenuCategoriaModalDetalle = lazy<ComponentType<MenuCategoriaModalDetalleProps>>(
  async () => {
    try {
      const mod = await import('./MenuCategoriaModalDetalle')
      return { default: mod.MenuCategoriaModalDetalle }
    } catch (error) {
      console.error('Error al cargar MenuCategoriaModalDetalle:', error)
      const Fallback: ComponentType<MenuCategoriaModalDetalleProps> = () => null
      return { default: Fallback }
    }
  },
)

const LazyMenuCategoriaModalProductos = lazy<
  ComponentType<MenuCategoriaModalProductosProps>
>(async () => {
  try {
    const mod = await import('../organisms/MenuCategoriaModalProductos')
    return { default: mod.MenuCategoriaModalProductos }
  } catch (error) {
    console.error('Error al cargar MenuCategoriaModalProductos:', error)
    const Fallback: ComponentType<MenuCategoriaModalProductosProps> = () => null
    return { default: Fallback }
  }
})

const LazyAgregarProductoDrawer = lazy<ComponentType<AgregarProductoDrawerProps>>(
  async () => {
    try {
      const mod = await import('../organisms/AgregarProductoDrawer')
      return { default: mod.AgregarProductoDrawer }
    } catch (error) {
      console.error('Error al cargar AgregarProductoDrawer:', error)
      const Fallback: ComponentType<AgregarProductoDrawerProps> = () => null
      return { default: Fallback }
    }
  },
)

const LazyRegistrarCategoriaDrawer = lazy<ComponentType<RegistrarCategoriaDrawerProps>>(
  async () => {
    try {
      const mod = await import('../organisms/RegistrarCategoriaDrawer')
      return { default: mod.RegistrarCategoriaDrawer }
    } catch (error) {
      console.error('Error al cargar RegistrarCategoriaDrawer:', error)
      const Fallback: ComponentType<RegistrarCategoriaDrawerProps> = () => null
      return { default: Fallback }
    }
  },
)

export interface MenuCategoriasModalesHostProps {
  categoriaSeleccionada: MenuCategoria | null
  categoriaProductosModal: MenuCategoria | null
  categoriaAgregarProducto?: MenuCategoria | null
  isRegistrarCategoriaOpen?: boolean
  onCloseDetalle: () => void
  onCloseProductos: () => void
  onCloseAgregarProducto?: () => void
  onCloseRegistrarCategoria?: () => void
  onAgregarProducto?: (categoria: MenuCategoria) => void
  onProductoGuardado?: () => void
  onCategoriaGuardada?: () => void
}

/**
 * Molécula: Orquesta la carga perezosa (`React.lazy`) y el montaje condicional
 * de los modales y drawers de categorías/productos sin cargar DOM mientras están cerrados.
 */
export const MenuCategoriasModalesHost = memo(function MenuCategoriasModalesHost({
  categoriaSeleccionada,
  categoriaProductosModal,
  categoriaAgregarProducto = null,
  isRegistrarCategoriaOpen = false,
  onCloseDetalle,
  onCloseProductos,
  onCloseAgregarProducto,
  onCloseRegistrarCategoria,
  onAgregarProducto,
  onProductoGuardado,
  onCategoriaGuardada,
}: MenuCategoriasModalesHostProps) {
  return (
    <>
      {categoriaSeleccionada && (
        <Suspense fallback={null}>
          <LazyMenuCategoriaModalDetalle
            categoria={categoriaSeleccionada}
            onClose={onCloseDetalle}
            onAgregarProducto={onAgregarProducto}
          />
        </Suspense>
      )}

      {categoriaProductosModal && (
        <Suspense fallback={null}>
          <LazyMenuCategoriaModalProductos
            categoria={categoriaProductosModal}
            onClose={onCloseProductos}
            onAgregarProducto={onAgregarProducto}
          />
        </Suspense>
      )}

      {categoriaAgregarProducto && onCloseAgregarProducto && (
        <Suspense fallback={null}>
          <LazyAgregarProductoDrawer
            categoria={categoriaAgregarProducto}
            onClose={onCloseAgregarProducto}
            onProductoGuardado={onProductoGuardado}
          />
        </Suspense>
      )}

      {isRegistrarCategoriaOpen && onCloseRegistrarCategoria && (
        <Suspense fallback={null}>
          <LazyRegistrarCategoriaDrawer
            isOpen={isRegistrarCategoriaOpen}
            onClose={onCloseRegistrarCategoria}
            onCategoriaGuardada={onCategoriaGuardada}
          />
        </Suspense>
      )}
    </>
  )
})
