import { api } from '../../../lib/api'
import type { Sede, SedeEstado } from '../domain/sede'
import type { SedeRepository } from '../domain/sede-repository'
import { LocalStorageSedeRepository } from './local-storage-sede-repository'

const STATUS_TO_ESTADO: Record<string, SedeEstado> = {
  active: 'activa',
  maintenance: 'mantenimiento',
  inactive: 'inactiva',
}

interface ApiSede {
  id: string
  name: string
  address: string
  city: string
  phone: string
  status: string
  created_by?: string
  created_at?: string
  updated_at?: string
}

function fromApiSede(item: ApiSede): Sede {
  return {
    id: item.id,
    name: item.name,
    address: item.address,
    city: item.city,
    phone: item.phone,
    estado: STATUS_TO_ESTADO[item.status] ?? 'inactiva',
  }
}

function deduplicateSedes(items: Sede[]): Sede[] {
  const seen = new Set<string>()
  return items.filter((item) => {
    if (!item.id || seen.has(item.id)) {
      return false
    }
    seen.add(item.id)
    return true
  })
}

export class ApiSedeRepository implements SedeRepository {
  private cache: Sede[] = []
  private localFallback = new LocalStorageSedeRepository()

  async list(): Promise<Sede[]> {
    try {
      const response = await api.get<ApiSede[]>('/headquarters')
      if (response.status === 200 && Array.isArray(response.data) && response.data.length > 0) {
        this.cache = deduplicateSedes(response.data.map(fromApiSede))
        return this.cache
      }
    } catch {
      // Fallback seguro a datos locales de semillas en caso de que el backend no responda
      const localList = await this.localFallback.list()
      this.cache = deduplicateSedes(localList)
      return this.cache
    }
    const localList = await this.localFallback.list()
    this.cache = deduplicateSedes(localList)
    return this.cache
  }

  save(sede: Sede): void {
    const index = this.cache.findIndex((item) => item.id === sede.id)
    if (index >= 0) {
      this.cache[index] = sede
    } else {
      this.cache.push(sede)
    }
    this.cache = deduplicateSedes(this.cache)
    this.localFallback.save(sede)
  }

  remove(id: string): void {
    this.cache = this.cache.filter((sede) => sede.id !== id)
    this.localFallback.remove(id)
  }

  removeStatic(id: string): void {
    this.cache = this.cache.filter((sede) => sede.id !== id)
    this.localFallback.removeStatic(id)
  }
}