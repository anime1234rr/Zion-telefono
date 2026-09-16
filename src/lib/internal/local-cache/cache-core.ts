export interface CacheOptions {
  ttlMs?: number
  maxEntries?: number
}

interface CacheEntry<V> {
  value: V
  expiresAt: number
  tags?: string[]
}

const DEFAULT_TTL_MS = 5 * 60_000
const DEFAULT_MAX_ENTRIES = 200

export class TTLCache<V> {
  private readonly store = new Map<string, CacheEntry<V>>()
  private readonly pending = new Map<string, Promise<V>>()
  private readonly listeners = new Set<(key: string) => void>()
  private readonly ttlMs: number
  private readonly maxEntries: number

  constructor(options: CacheOptions = {}) {
    this.ttlMs = options.ttlMs ?? DEFAULT_TTL_MS
    this.maxEntries = options.maxEntries ?? DEFAULT_MAX_ENTRIES
  }

  get(key: string): V | undefined {
    const entry = this.store.get(key)
    if (!entry) return undefined
    if (entry.expiresAt < Date.now()) {
      this.store.delete(key)
      return undefined
    }
    this.store.delete(key)
    this.store.set(key, entry)
    return entry.value
  }

  has(key: string): boolean {
    return this.get(key) !== undefined
  }

  set(key: string, value: V, ttlMs?: number, tags?: string[]): void {
    this.store.delete(key)
    this.store.set(key, { value, expiresAt: Date.now() + (ttlMs ?? this.ttlMs), tags })
    this.evictIfNeeded()
    this.notify(key)
  }

  delete(key: string): void {
    this.store.delete(key)
    this.pending.delete(key)
    this.notify(key)
  }

  clear(): void {
    const keys = [...this.store.keys()]
    this.store.clear()
    this.pending.clear()
    for (const key of keys) this.notify(key)
  }

  invalidateTag(tag: string): number {
    let count = 0
    for (const [key, entry] of this.store) {
      if (entry.tags?.includes(tag)) {
        this.store.delete(key)
        this.pending.delete(key)
        this.notify(key)
        count++
      }
    }
    return count
  }

  invalidateByPrefix(prefix: string): number {
    let count = 0
    for (const key of [...this.store.keys()]) {
      if (key.startsWith(prefix)) {
        this.store.delete(key)
        this.pending.delete(key)
        this.notify(key)
        count++
      }
    }
    return count
  }

  get size(): number {
    return this.store.size
  }

  keys(): string[] {
    return [...this.store.keys()]
  }

  subscribe(listener: (key: string) => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  getOrSet(key: string, factory: () => Promise<V>, ttlMs?: number, tags?: string[]): Promise<V> {
    const cached = this.get(key)
    if (cached !== undefined) return Promise.resolve(cached)

    const inFlight = this.pending.get(key)
    if (inFlight) return inFlight

    const promise = factory()
      .then((value) => {
        this.pending.delete(key)
        this.set(key, value, ttlMs, tags)
        return value
      })
      .catch((error) => {
        this.pending.delete(key)
        throw error
      })

    this.pending.set(key, promise)
    return promise
  }

  private evictIfNeeded(): void {
    while (this.store.size > this.maxEntries) {
      const oldestKey = this.store.keys().next().value
      if (oldestKey === undefined) break
      this.store.delete(oldestKey)
    }
  }

  private notify(key: string): void {
    for (const listener of this.listeners) listener(key)
  }
}

export function createCache<V>(options?: CacheOptions): TTLCache<V> {
  return new TTLCache<V>(options)
}
