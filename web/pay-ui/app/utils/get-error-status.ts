export function getErrorStatus(error: unknown): number | undefined {
  if (
    error
    && typeof error === 'object'
    && ('statusCode' in error || 'response' in error)
  ) {
    if ('response' in error && error.response && typeof error.response === 'object' && 'status' in error.response) {
      return error.response.status as number
    }
    if ('statusCode' in error) {
      return error.statusCode as number
    }
  }

  return undefined
}
