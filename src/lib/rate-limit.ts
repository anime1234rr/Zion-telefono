const RATE_LIMIT_CODES = new Set([
  'over_email_send_rate_limit',
  'over_sms_send_rate_limit',
  'over_request_rate_limit',
])

export function getRateLimitSeconds(err: unknown): number | null {
  if (typeof err !== 'object' || err === null || !('code' in err)) return null
  const code = (err as { code?: unknown }).code
  if (typeof code !== 'string' || !RATE_LIMIT_CODES.has(code)) return null

  const message = 'message' in err ? String((err as { message?: unknown }).message ?? '') : ''
  const match = message.match(/(\d+)\s*seconds?/i)
  return match ? Number(match[1]) : 60
}
