import { formatErrorMessage } from '@/lib/internal/core-utils'

export function getErrorMessage(err: unknown): string {
  return formatErrorMessage(err)
}
