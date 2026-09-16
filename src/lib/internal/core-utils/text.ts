const COMBINING_MARKS = new RegExp('[\\u0300-\\u036f]', 'g')

export function truncate(text: string, maxLength: number, suffix = '…'): string {
  const trimmed = text.trim()
  if (trimmed.length <= maxLength) return trimmed
  return `${trimmed.slice(0, maxLength).trimEnd()}${suffix}`
}

export function collapseWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

function isControlCharCode(code: number): boolean {
  return (code >= 0 && code <= 8) || code === 11 || code === 12 || (code >= 14 && code <= 31) || code === 127
}

export function stripControlChars(text: string): string {
  let result = ''
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i)
    if (!isControlCharCode(code)) result += text[i]
  }
  return result
}

export function normalizeDisplayText(text: string): string {
  return stripControlChars(collapseWhitespace(text))
}

export function stripAccents(text: string): string {
  return text.normalize('NFD').replace(COMBINING_MARKS, '')
}

export function initials(name: string, maxChars = 2): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, maxChars).toUpperCase()
  return parts
    .slice(0, maxChars)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export function pluralize(count: number, singular: string, plural: string = `${singular}s`): string {
  return count === 1 ? singular : plural
}

export function formatCompactCount(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(count % 1_000_000 === 0 ? 0 : 1)}M`
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(count % 1_000 === 0 ? 0 : 1)}k`
  }
  return String(count)
}

export function slugify(text: string): string {
  return stripAccents(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
