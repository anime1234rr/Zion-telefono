export const LIMITS = {
  messageMaxLength: 4000,
  serverNameMinLength: 2,
  serverNameMaxLength: 60,
  channelNameMinLength: 1,
  channelNameMaxLength: 80,
  displayNameMaxLength: 60,
  bioMaxLength: 300,
}

export function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function isValidAvatarUrl(value: string | null | undefined): boolean {
  if (!value) return false
  return isValidHttpUrl(value)
}

export function isWithinLength(value: string, max: number, min = 0): boolean {
  const length = value.trim().length
  return length >= min && length <= max
}

export function validateServerName(name: string): string | null {
  const trimmed = name.trim()
  if (trimmed.length < LIMITS.serverNameMinLength) {
    return `El nombre debe tener al menos ${LIMITS.serverNameMinLength} caracteres.`
  }
  if (trimmed.length > LIMITS.serverNameMaxLength) {
    return `El nombre no puede superar los ${LIMITS.serverNameMaxLength} caracteres.`
  }
  return null
}

export function validateChannelName(name: string): string | null {
  const trimmed = name.trim()
  if (trimmed.length < LIMITS.channelNameMinLength) {
    return 'El canal necesita un nombre.'
  }
  if (trimmed.length > LIMITS.channelNameMaxLength) {
    return `El nombre no puede superar los ${LIMITS.channelNameMaxLength} caracteres.`
  }
  return null
}

export function validateMessageLength(text: string): string | null {
  if (text.length > LIMITS.messageMaxLength) {
    return `El mensaje no puede superar los ${LIMITS.messageMaxLength} caracteres.`
  }
  return null
}

export function validateDisplayName(name: string): string | null {
  const trimmed = name.trim()
  if (trimmed.length > LIMITS.displayNameMaxLength) {
    return `El nombre no puede superar los ${LIMITS.displayNameMaxLength} caracteres.`
  }
  return null
}

export function validateBio(text: string): string | null {
  if (text.length > LIMITS.bioMaxLength) {
    return `La biografía no puede superar los ${LIMITS.bioMaxLength} caracteres.`
  }
  return null
}
