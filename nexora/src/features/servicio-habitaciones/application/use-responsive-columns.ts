import { useEffect, useState } from 'react'

function resolveViewportColumns(): number {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 1
  }

  try {
    if (window.matchMedia('(min-width: 1280px)').matches) return 4
    if (window.matchMedia('(min-width: 1024px)').matches) return 3
    if (window.matchMedia('(min-width: 640px)').matches) return 2
    return 1
  } catch {
    return 1
  }
}

/**
 * Hook auxiliar que devuelve la cantidad de columnas responsivas
 * alineada con los breakpoints de Tailwind (`sm:2`, `lg:3`, `xl:4`),
 * permitiendo un Masonry sin CSS Multi-column (`columns-*`).
 */
export function useResponsiveColumns(): number {
  const [columns, setColumns] = useState<number>(resolveViewportColumns)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }

    try {
      const queries = [
        window.matchMedia('(min-width: 1280px)'),
        window.matchMedia('(min-width: 1024px)'),
        window.matchMedia('(min-width: 640px)'),
      ]

      const updateColumns = () => {
        setColumns(resolveViewportColumns())
      }

      queries.forEach((mq) => mq.addEventListener('change', updateColumns))
      return () => {
        queries.forEach((mq) => mq.removeEventListener('change', updateColumns))
      }
    } catch {
      return undefined
    }
  }, [])

  return columns
}
