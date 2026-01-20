import { getErrorStatus } from '@/utils/get-error-status'

type PayApiFunction = <T = unknown>(
  url: string,
  options?: {
    method?: string
    body?: unknown
    headers?: Record<string, string>
    showErrorToast?: boolean
    hide400ErrorToast?: boolean
  }
) => Promise<T>

// Global exception handler for Pay API calls - showErrorToast can be used to suppress the toast
export default defineNuxtPlugin((nuxtApp) => {
  const originalPayApi = nuxtApp.$payApi as PayApiFunction

  const wrappedPayApi: PayApiFunction = async <T = unknown>(
    url: string,
    options?: {
      method?: string
      body?: unknown
      headers?: Record<string, string>
      showErrorToast?: boolean
      hide400ErrorToast?: boolean
    }
  ): Promise<T> => {
    const showErrorToast = options?.showErrorToast !== false
    const hide400ErrorToast = options?.hide400ErrorToast !== false

    try {
      return await originalPayApi<T>(url, options)
    } catch (error: unknown) {
      const status = getErrorStatus(error)
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'

      console.error('Pay API Error:', {
        url,
        status,
        error: errorMessage,
        errorObject: error
      })

      const shouldShowToast = showErrorToast && !(hide400ErrorToast && status === 400)

      if (shouldShowToast) {
        const toast = useToast()
        const t = (nuxtApp.$i18n as { t: (key: string, params?: Record<string, unknown>) => string }).t

        const description = status
          ? t('error.api.generic', { status, message: errorMessage }) || `${status}: ${errorMessage}`
          : errorMessage

        toast.add({
          description,
          icon: 'i-mdi-alert',
          color: 'error'
        })
      }

      throw error
    }
  }

  nuxtApp.provide('payApiWithErrorHandling', wrappedPayApi)
})
