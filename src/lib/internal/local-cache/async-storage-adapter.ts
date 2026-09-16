import AsyncStorage from '@react-native-async-storage/async-storage'

import { compress, decompress } from '@/lib/internal/core-utils'
import { borrarClaves, clavesConPrefijo } from '@/lib/local-store'

import type { PersistAdapter } from './persist-adapter'

const COMPRESS_THRESHOLD = 2000
const CHUNK_SIZE = 200_000
const META_SUFFIX = '::meta'

interface StoredEnvelope {
  compressed: boolean
  chunkCount: number
}

function prefixFor(namespace: string): string {
  return `zion:cache:${namespace}:`
}

function baseKeyFor(namespace: string, key: string): string {
  return `${prefixFor(namespace)}${key}`
}

async function writeValue(baseKey: string, value: unknown): Promise<void> {
  const raw = JSON.stringify(value)
  const compressed = raw.length > COMPRESS_THRESHOLD
  const payload = compressed ? compress(raw) : raw

  const chunks: string[] = []
  for (let i = 0; i < payload.length; i += CHUNK_SIZE) {
    chunks.push(payload.slice(i, i + CHUNK_SIZE))
  }

  const envelope: StoredEnvelope = { compressed, chunkCount: chunks.length }
  await AsyncStorage.setItem(`${baseKey}${META_SUFFIX}`, JSON.stringify(envelope))
  await Promise.all(chunks.map((chunk, index) => AsyncStorage.setItem(`${baseKey}::${index}`, chunk)))
}

async function readValue<T>(baseKey: string): Promise<T | undefined> {
  const metaRaw = await AsyncStorage.getItem(`${baseKey}${META_SUFFIX}`)
  if (!metaRaw) return undefined

  let envelope: StoredEnvelope
  try {
    envelope = JSON.parse(metaRaw) as StoredEnvelope
  } catch {
    return undefined
  }

  const parts: string[] = []
  for (let i = 0; i < envelope.chunkCount; i++) {
    const part = await AsyncStorage.getItem(`${baseKey}::${i}`)
    if (part == null) return undefined
    parts.push(part)
  }

  const joined = parts.join('')
  const raw = envelope.compressed ? decompress(joined) : joined
  try {
    return JSON.parse(raw) as T
  } catch {
    return undefined
  }
}

async function deleteValue(baseKey: string): Promise<void> {
  const metaRaw = await AsyncStorage.getItem(`${baseKey}${META_SUFFIX}`)
  const keys = [`${baseKey}${META_SUFFIX}`]
  if (metaRaw) {
    try {
      const envelope = JSON.parse(metaRaw) as StoredEnvelope
      for (let i = 0; i < envelope.chunkCount; i++) keys.push(`${baseKey}::${i}`)
    } catch {
      keys.length = 1
    }
  }
  await AsyncStorage.multiRemove(keys)
}

export const asyncStorageAdapter: PersistAdapter = {
  async getAll(namespace) {
    const prefix = prefixFor(namespace)
    const allKeys = await clavesConPrefijo(prefix)
    const baseKeys = new Set(
      allKeys.filter((k) => k.endsWith(META_SUFFIX)).map((k) => k.slice(0, -META_SUFFIX.length))
    )

    const result: Record<string, unknown> = {}
    for (const baseKey of baseKeys) {
      const value = await readValue(baseKey)
      if (value !== undefined) result[baseKey.slice(prefix.length)] = value
    }
    return result
  },

  async set(namespace, key, value) {
    await writeValue(baseKeyFor(namespace, key), value)
  },

  async delete(namespace, key) {
    await deleteValue(baseKeyFor(namespace, key))
  },

  async clear(namespace) {
    const keys = await clavesConPrefijo(prefixFor(namespace))
    await borrarClaves(keys)
  },
}
