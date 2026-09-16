export interface FormattedError {
  message: string
  code?: string
  retryable: boolean
}

interface PostgrestLikeError {
  code?: string
  message?: string
  details?: string | null
  hint?: string | null
}

const CODE_MESSAGES: Record<string, string> = {
  '23505': 'Ya existe un registro con esos datos.',
  '23503': 'No se pudo completar: hace referencia a algo que ya no existe.',
  '23502': 'Falta un dato obligatorio.',
  '22001': 'Uno de los campos es demasiado largo.',
  '42501': 'No tenés permiso para hacer esto.',
  PGRST301: 'Tu sesión expiró. Iniciá sesión de nuevo.',
  PGRST116: 'No se encontró lo que buscabas.',
}

function isPostgrestLike(error: unknown): error is PostgrestLikeError {
  return typeof error === 'object' && error !== null && ('code' in error || 'details' in error)
}

function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  return /fetch|network|failed to fetch|NetworkError/i.test(error.message)
}

export function formatError(error: unknown): FormattedError {
  if (typeof error === 'string') {
    return { message: error, retryable: false }
  }

  if (isPostgrestLike(error) && error.code) {
    const known = CODE_MESSAGES[error.code]
    if (known) return { message: known, code: error.code, retryable: false }
  }

  if (isNetworkError(error)) {
    return {
      message: 'No hay conexión. Revisá tu internet e intentá de nuevo.',
      retryable: true,
    }
  }

  if (error instanceof Error) {
    return { message: error.message, retryable: false }
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  ) {
    return { message: (error as { message: string }).message, retryable: false }
  }

  return { message: 'Ocurrió un error inesperado.', retryable: false }
}

export function formatErrorMessage(error: unknown): string {
  return formatError(error).message
}
