import { useEffect, useRef, useState } from 'react'

import type { TTLCache } from './cache-core'

export interface CachedValueState<V> {
  value: V | undefined
  loading: boolean
  error: unknown
}

function readState<V>(cache: TTLCache<V>, key: string | null): CachedValueState<V> {
  if (!key) return { value: undefined, loading: false, error: null }
  const cached = cache.get(key)
  return { value: cached, loading: cached === undefined, error: null }
}

export function useCachedValue<V>(
  cache: TTLCache<V>,
  key: string | null,
  fetcher: () => Promise<V>,
  ttlMs?: number
): CachedValueState<V> {
  const fetcherRef = useRef(fetcher)
  useEffect(() => {
    fetcherRef.current = fetcher
  })

  const [trackedKey, setTrackedKey] = useState(key)
  const [state, setState] = useState<CachedValueState<V>>(() => readState(cache, key))

  if (trackedKey !== key) {
    setTrackedKey(key)
    setState(readState(cache, key))
  }

  useEffect(() => {
    if (!key) return
    let cancelled = false

    cache
      .getOrSet(key, () => fetcherRef.current(), ttlMs)
      .then((value) => {
        if (!cancelled) setState({ value, loading: false, error: null })
      })
      .catch((error: unknown) => {
        if (!cancelled) setState((prev) => ({ ...prev, loading: false, error }))
      })

    return () => {
      cancelled = true
    }
  }, [cache, key, ttlMs])

  useEffect(() => {
    if (!key) return
    return cache.subscribe((changedKey) => {
      if (changedKey !== key) return
      const value = cache.get(key)
      setState((prev) => ({ ...prev, value }))
    })
  }, [cache, key])

  return state
}
