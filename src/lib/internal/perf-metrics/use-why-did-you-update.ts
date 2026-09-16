import { useEffect, useRef } from 'react'

import { isDev } from './env'

export function useWhyDidYouUpdate(label: string, props: Record<string, unknown>): void {
  const previousRef = useRef<Record<string, unknown> | null>(null)

  useEffect(() => {
    if (!isDev) return

    const previous = previousRef.current
    if (previous) {
      const changed: Record<string, { from: unknown; to: unknown }> = {}
      const keys = new Set([...Object.keys(previous), ...Object.keys(props)])
      for (const key of keys) {
        if (!Object.is(previous[key], props[key])) {
          changed[key] = { from: previous[key], to: props[key] }
        }
      }
      if (Object.keys(changed).length > 0) {
        console.warn(`[perf] ${label} se re-renderizo por:`, changed)
      }
    }
    previousRef.current = props
  })
}
