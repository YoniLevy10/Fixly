export type NormalizedError = {
  message: string
  code?: string
}

export function normalizeError(error: unknown): NormalizedError {
  if (error instanceof Error) {
    return {
      message: error.message,
    }
  }

  if (typeof error === 'string') {
    return {
      message: error,
    }
  }

  return {
    message: 'Unexpected error',
  }
}
