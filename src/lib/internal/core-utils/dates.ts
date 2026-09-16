const MINUTE_MS = 60_000
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS
const WEEK_MS = 7 * DAY_MS

export function relativeTime(iso: string, now: number = Date.now()): string {
  const target = new Date(iso).getTime()
  const diff = now - target
  if (Number.isNaN(target)) return ''
  if (diff < MINUTE_MS) return 'ahora'
  if (diff < HOUR_MS) return `hace ${Math.floor(diff / MINUTE_MS)} min`
  if (diff < DAY_MS) return `hace ${Math.floor(diff / HOUR_MS)} h`
  if (diff < WEEK_MS) return `hace ${Math.floor(diff / DAY_MS)} d`
  return new Date(iso).toLocaleDateString('es-AR')
}

export function formatFullDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatClockDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export function isSameDay(a: string | Date, b: string | Date): boolean {
  const dateA = typeof a === 'string' ? new Date(a) : a
  const dateB = typeof b === 'string' ? new Date(b) : b
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  )
}
