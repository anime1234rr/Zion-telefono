import { Profiler, type ProfilerOnRenderCallback, type ReactNode } from 'react'

import { isDev } from './env'

const DEFAULT_WARN_MS = 16
const BURST_WINDOW_MS = 1000
const BURST_LIMIT = 12

const recentRenders = new Map<string, number[]>()

function onRenderFactory(label: string, warnAfterMs: number): ProfilerOnRenderCallback {
  return (_id, _phase, actualDuration) => {
    if (actualDuration > warnAfterMs) {
      console.warn(`[perf] ${label} tardo ${actualDuration.toFixed(1)}ms en renderizar (limite ${warnAfterMs}ms)`)
    }

    const now = performance.now()
    const history = recentRenders.get(label) ?? []
    const recent = history.filter((t) => now - t < BURST_WINDOW_MS)
    recent.push(now)
    recentRenders.set(label, recent)

    if (recent.length > BURST_LIMIT) {
      console.warn(
        `[perf] ${label} se re-renderizo ${recent.length} veces en ${BURST_WINDOW_MS}ms - posible loop de renders`
      )
    }
  }
}

export function PerfProfiler({
  id,
  warnAfterMs = DEFAULT_WARN_MS,
  children,
}: {
  id: string
  warnAfterMs?: number
  children: ReactNode
}): ReactNode {
  if (!isDev) return children
  return (
    <Profiler id={id} onRender={onRenderFactory(id, warnAfterMs)}>
      {children}
    </Profiler>
  )
}
