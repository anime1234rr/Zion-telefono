export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function debounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  waitMs: number
): ((...args: Args) => void) & { cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | null = null

  function debounced(...args: Args): void {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      fn(...args)
    }, waitMs)
  }

  debounced.cancel = () => {
    if (timer) clearTimeout(timer)
    timer = null
  }

  return debounced
}

export function throttle<Args extends unknown[]>(
  fn: (...args: Args) => void,
  waitMs: number
): (...args: Args) => void {
  let lastCall = 0
  let timer: ReturnType<typeof setTimeout> | null = null
  let pendingArgs: Args | null = null

  return (...args: Args) => {
    const now = Date.now()
    const remaining = waitMs - (now - lastCall)

    if (remaining <= 0) {
      lastCall = now
      fn(...args)
      return
    }

    pendingArgs = args
    if (!timer) {
      timer = setTimeout(() => {
        lastCall = Date.now()
        timer = null
        if (pendingArgs) fn(...pendingArgs)
        pendingArgs = null
      }, remaining)
    }
  }
}
