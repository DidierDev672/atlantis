import type { ApiHabitacionListaRepository } from './api-habitacion-lista-repository'

let repositoryInstance: ApiHabitacionListaRepository | null = null

/**
 * Carga perezosa (singleton) del repositorio de habitaciones y catálogos
 * mediante `import(...)` dinámico bajo demanda con `async / await` y `try / catch`.
 */
export async function getHabitacionListaRepository(): Promise<ApiHabitacionListaRepository> {
  if (repositoryInstance) return repositoryInstance
  try {
    const { ApiHabitacionListaRepository: RepoClass } = await import(
      './api-habitacion-lista-repository'
    )
    repositoryInstance = new RepoClass()
    return repositoryInstance
  } catch (err) {
    console.error('Error al cargar ApiHabitacionListaRepository:', err)
    throw err
  }
}
