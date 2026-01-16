export interface ApiError {
  response?: {
    data?: {
      message?: string
      detail?: string
    }
    status?: number
  }
  message?: string
}

export function useErrorHandler() {
  const toast = useToast()

  function getErrorMessage(error: unknown): string {
    const apiError = error as ApiError
    return apiError?.response?.data?.message
      || apiError?.response?.data?.detail
      || apiError?.message
      || 'An unexpected error occurred'
  }

  function handleError(error: unknown, context?: string) {
    const message = getErrorMessage(error)
    console.error(context ? `${context}:` : 'Error:', error)

    toast.add({
      title: 'Error',
      description: message,
      icon: 'i-mdi-alert-circle',
      color: 'error'
    })

    return message
  }

  function handleErrorSilent(error: unknown, context?: string): string {
    const message = getErrorMessage(error)
    console.error(context ? `${context}:` : 'Error:', error)
    return message
  }

  return {
    getErrorMessage,
    handleError,
    handleErrorSilent
  }
}
