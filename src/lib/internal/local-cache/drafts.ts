import { TTLCache } from './cache-core'

const DRAFT_TTL_MS = 24 * 60 * 60 * 1000
const DRAFT_MAX_ENTRIES = 500

export interface DraftStore {
  saveDraft: (scopeId: string, text: string) => void
  getDraft: (scopeId: string) => string
  clearDraft: (scopeId: string) => void
  subscribe: (listener: (scopeId: string) => void) => () => void
}

export function createDraftStore(): DraftStore {
  const cache = new TTLCache<string>({ ttlMs: DRAFT_TTL_MS, maxEntries: DRAFT_MAX_ENTRIES })

  return {
    saveDraft(scopeId, text) {
      if (!text) {
        cache.delete(scopeId)
        return
      }
      cache.set(scopeId, text)
    },
    getDraft(scopeId) {
      return cache.get(scopeId) ?? ''
    },
    clearDraft(scopeId) {
      cache.delete(scopeId)
    },
    subscribe(listener) {
      return cache.subscribe(listener)
    },
  }
}
