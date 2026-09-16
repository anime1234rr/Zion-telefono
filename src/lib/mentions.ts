export const MENTION_TOKEN_PATTERN =
  /(@(?:todos|aqu[ií])\b|@[a-zA-Z0-9_]{1,32}\b|:[a-zA-Z0-9_]+:)/gi

export const EVERYONE_MENTION_PATTERN = /^@(todos|aqu[ií])$/i

export function esTokenMencionUsuario(token: string): boolean {
  return /^@[a-zA-Z0-9_]+$/i.test(token) && !EVERYONE_MENTION_PATTERN.test(token)
}

export function esTokenMencionTodos(token: string): boolean {
  return EVERYONE_MENTION_PATTERN.test(token)
}

export function mensajeMeMenciona(content: string, miUsername?: string): boolean {
  if (/@(todos|aqu[ií])\b/i.test(content)) return true
  if (!miUsername) return false
  const re = new RegExp(`@${miUsername.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
  return re.test(content)
}
