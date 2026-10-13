const OSCURO = {
  background: '#0f1117',
  card: '#15171f',
  cardForeground: '#ffffff',
  popover: '#15171f',
  foreground: '#ffffff',
  primary: '#6366f1',
  primaryForeground: '#ffffff',
  secondary: '#1c1f2a',
  secondaryForeground: '#ffffff',
  muted: '#1c1f2a',
  mutedForeground: '#9ca3af',
  accent: '#1c1f2a',
  accentForeground: '#ffffff',
  destructive: '#ef4444',
  border: 'rgba(255, 255, 255, 0.08)',
  input: '#090a0f',
  ring: '#6366f1',
  sidebar: '#090a0f',
  sidebarForeground: '#ffffff',
  sidebarAccent: '#1c1f2a',
  code: '#090a0f',
  online: '#22c55e',
  idle: '#eab308',
  dnd: '#ef4444',
  offline: '#6b7280',
}

const CLARO: typeof OSCURO = {
  background: '#f6f7fb',
  card: '#ffffff',
  cardForeground: '#111827',
  popover: '#ffffff',
  foreground: '#111827',
  primary: '#6366f1',
  primaryForeground: '#ffffff',
  secondary: '#eceef4',
  secondaryForeground: '#111827',
  muted: '#eceef4',
  mutedForeground: '#5f6673',
  accent: '#eceef4',
  accentForeground: '#111827',
  destructive: '#dc2626',
  border: 'rgba(17, 24, 39, 0.10)',
  input: '#ffffff',
  ring: '#6366f1',
  sidebar: '#eef0f6',
  sidebarForeground: '#111827',
  sidebarAccent: '#e2e5ee',
  code: '#eef0f6',
  online: '#16a34a',
  idle: '#ca8a04',
  dnd: '#dc2626',
  offline: '#9ca3af',
}

export const colors = { ...OSCURO }

export type ColorKey = keyof typeof colors

export const ACENTOS: { id: string; label: string; color: string }[] = [
  { id: 'indigo', label: 'Índigo', color: '#6366f1' },
  { id: 'violeta', label: 'Violeta', color: '#8b5cf6' },
  { id: 'azul', label: 'Azul', color: '#3b82f6' },
  { id: 'cian', label: 'Cian', color: '#06b6d4' },
  { id: 'verde', label: 'Verde', color: '#22c55e' },
  { id: 'rosa', label: 'Rosa', color: '#ec4899' },
  { id: 'naranja', label: 'Naranja', color: '#f97316' },
  { id: 'rojo', label: 'Rojo', color: '#ef4444' },
]

export const tema = { claro: false }

export function aplicarPaleta(claro: boolean, acento: string): void {
  Object.assign(colors, claro ? CLARO : OSCURO, { primary: acento, ring: acento })
  tema.claro = claro
}

export function alfa(color: string, opacidad: number): string {
  const hex = color.trim()
  if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r},${g},${b},${opacidad})`
  }
  return color
}
