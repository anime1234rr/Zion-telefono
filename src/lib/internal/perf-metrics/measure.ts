import { isDev } from './env'

const DEFAULT_WARN_MS = 16

function reportIfSlow(label: string, elapsedMs: number, warnAfterMs: number): void {
  if (elapsedMs <= warnAfterMs) return
  console.warn(`[perf] ${label}: ${elapsedMs.toFixed(1)}ms (limite ${warnAfterMs}ms)`)
}

export function measureSync<T>(label: string, fn: () => T, warnAfterMs: number = DEFAULT_WARN_MS): T {
  if (!isDev) return fn()
  const start = performance.now()
  const result = fn()
  reportIfSlow(label, performance.now() - start, warnAfterMs)
  return result
}

export async function measureAsync<T>(
  label: string,
  fn: () => Promise<T>,
  warnAfterMs: number = DEFAULT_WARN_MS
): Promise<T> {
  if (!isDev) return fn()
  const start = performance.now()
  try {
    return await fn()
  } finally {
    reportIfSlow(label, performance.now() - start, warnAfterMs)
  }
}
