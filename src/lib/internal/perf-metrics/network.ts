import { isDev } from './env'

export interface NetworkSample {
  label: string
  latencyMs: number
  approxBytes: number
  at: number
  failed: boolean
}

const MAX_SAMPLES = 200
const WARN_LATENCY_MS = 800
const samples: NetworkSample[] = []

function approxSize(value: unknown): number {
  try {
    return JSON.stringify(value)?.length ?? 0
  } catch {
    return 0
  }
}

function record(label: string, latencyMs: number, approxBytes: number, failed: boolean): void {
  samples.push({ label, latencyMs, approxBytes, at: Date.now(), failed })
  if (samples.length > MAX_SAMPLES) samples.shift()

  if (failed || latencyMs > WARN_LATENCY_MS) {
    console.warn(
      `[perf] ${label}: ${latencyMs.toFixed(0)}ms, ~${(approxBytes / 1024).toFixed(1)}kB${failed ? ' (fallo)' : ''}`
    )
  }
}

export async function measureNetworkCall<T>(label: string, fn: () => Promise<T>): Promise<T> {
  if (!isDev) return fn()
  const start = performance.now()
  try {
    const result = await fn()
    record(label, performance.now() - start, approxSize(result), false)
    return result
  } catch (err) {
    record(label, performance.now() - start, 0, true)
    throw err
  }
}

export function getNetworkStats(): NetworkSample[] {
  return [...samples]
}

export function clearNetworkStats(): void {
  samples.length = 0
}
