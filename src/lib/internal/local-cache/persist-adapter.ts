export interface PersistAdapter {
  getAll(namespace: string): Promise<Record<string, unknown>>
  set(namespace: string, key: string, value: unknown): Promise<void>
  delete(namespace: string, key: string): Promise<void>
  clear(namespace: string): Promise<void>
}

export function withPersistence<V>(
  cache: import('./cache-core').TTLCache<V>,
  namespace: string,
  adapter: PersistAdapter
): () => void {
  adapter
    .getAll(namespace)
    .then((entries) => {
      for (const [key, value] of Object.entries(entries)) {
        if (!cache.has(key)) cache.set(key, value as V)
      }
    })
    .catch(() => {})

  return cache.subscribe((key) => {
    const value = cache.get(key)
    if (value === undefined) {
      void adapter.delete(namespace, key)
    } else {
      void adapter.set(namespace, key, value)
    }
  })
}
