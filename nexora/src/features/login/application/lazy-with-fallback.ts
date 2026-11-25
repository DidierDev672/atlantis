import { lazy, type ComponentType } from 'react'

/**
 * Carga perezosa bajo demanda con `async / await` y captura `try / catch`.
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
