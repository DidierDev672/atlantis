import { lazy, type ComponentType } from 'react'

/**
 * Envuelve `React.lazy` con carga asíncrona (`async/await`) y captura de errores (`try/catch`),
 * retornando un componente nulo seguro si el chunk falla al descargarse.
 */
export function lazyWithFallback<TProps extends object>(
  loader: () => Promise<ComponentType<TProps>>,
  label: string,
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
