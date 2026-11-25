import { lazy, type ComponentType } from 'react'

/**
 * Envuelve `React.lazy` con `async / await` y manejo de errores `try / catch`,
 * devolviendo un fallback seguro si la descarga del chunk falla.
 */
export function lazyWithFallback<TProps extends object>(
  loader: () => Promise<ComponentType<TProps>>,
  label: string
) {
  return lazy<ComponentType<TProps>>(async () => {
    try {
      const Component = await loader()
      return { default: Component }
    } catch (error) {
      console.error(`Error cargando ${label}:`, error)
      const Fallback: ComponentType<TProps> = () => null
      return { default: Fallback }
    }
  })
}
