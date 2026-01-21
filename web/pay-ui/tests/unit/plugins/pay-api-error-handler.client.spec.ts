import { mockNuxtImport } from '@nuxt/test-utils/runtime'

const {
  mockGetErrorStatus,
  mockUseToast,
  mockI18nT,
  mockOriginalPayApi,
  mockNuxtApp
} = vi.hoisted(() => {
  const _mockGetErrorStatus = vi.fn()
  const _mockUseToast = vi.fn()
  const _mockI18nT = vi.fn()
  const _mockOriginalPayApi = vi.fn()

  const _mockNuxtApp = {
    $payApi: _mockOriginalPayApi,
    $i18n: {
      t: _mockI18nT
    },
    provide: vi.fn()
  }

  return {
    mockGetErrorStatus: _mockGetErrorStatus,
    mockUseToast: _mockUseToast,
    mockI18nT: _mockI18nT,
    mockOriginalPayApi: _mockOriginalPayApi,
    mockNuxtApp: _mockNuxtApp
  }
})

mockNuxtImport('getErrorStatus', () => mockGetErrorStatus)
mockNuxtImport('useToast', () => mockUseToast)

vi.mock('@/utils/get-error-status', () => ({
  getErrorStatus: mockGetErrorStatus
}))

describe('pay-api-error-handler.client.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseToast.mockReturnValue({
      add: vi.fn()
    })
    mockI18nT.mockImplementation((key: string, params?: Record<string, unknown>) => {
      if (params?.status && params?.message) {
        return `${params.status}: ${params.message}`
      }
      return key
    })
  })

  it('should wrap $payApi with error handling', async () => {
    const plugin = await import('~/plugins/pay-api-error-handler.client')
    const defaultExport = plugin.default

    expect(defaultExport).toBeDefined()
    expect(typeof defaultExport).toBe('function')
  })

  it('should call original $payApi when no error occurs', async () => {
    const mockResponse = { data: 'success' }
    mockOriginalPayApi.mockResolvedValue(mockResponse)

    const plugin = await import('~/plugins/pay-api-error-handler.client')
    const defaultExport = plugin.default as (nuxtApp: unknown) => void

    defaultExport(mockNuxtApp as unknown)

    const wrappedPayApi = mockNuxtApp.provide.mock.calls[0]?.[1] as typeof mockOriginalPayApi

    const result = await wrappedPayApi('/test-url')

    expect(mockOriginalPayApi).toHaveBeenCalledWith('/test-url', undefined)
    expect(result).toEqual(mockResponse)
  })

  it('should handle errors and show toast by default', async () => {
    const mockError = new Error('API Error')
    const mockToastAdd = vi.fn()
    mockOriginalPayApi.mockRejectedValue(mockError)
    mockGetErrorStatus.mockReturnValue(500)
    mockUseToast.mockReturnValue({
      add: mockToastAdd
    })

    const plugin = await import('~/plugins/pay-api-error-handler.client')
    const defaultExport = plugin.default as (nuxtApp: unknown) => void

    defaultExport(mockNuxtApp as unknown)

    const wrappedPayApi = mockNuxtApp.provide.mock.calls[0]?.[1] as typeof mockOriginalPayApi
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    await expect(wrappedPayApi('/test-url')).rejects.toThrow('API Error')

    expect(mockGetErrorStatus).toHaveBeenCalledWith(mockError)
    expect(consoleErrorSpy).toHaveBeenCalledWith('Pay API Error:', {
      url: '/test-url',
      status: 500,
      error: 'API Error',
      errorObject: mockError
    })
    expect(mockToastAdd).toHaveBeenCalledWith({
      description: '500: API Error',
      icon: 'i-mdi-alert',
      color: 'error'
    })
    consoleErrorSpy.mockRestore()
  })

  it('should not show toast when showErrorToast is false', async () => {
    const mockError = new Error('API Error')
    const mockToastAdd = vi.fn()
    mockOriginalPayApi.mockRejectedValue(mockError)
    mockGetErrorStatus.mockReturnValue(500)
    mockUseToast.mockReturnValue({
      add: mockToastAdd
    })

    const plugin = await import('~/plugins/pay-api-error-handler.client')
    const defaultExport = plugin.default as (nuxtApp: unknown) => void

    defaultExport(mockNuxtApp as unknown)

    const wrappedPayApi = mockNuxtApp.provide.mock.calls[0]?.[1] as typeof mockOriginalPayApi
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    await expect(wrappedPayApi('/test-url', { showErrorToast: false })).rejects.toThrow('API Error')

    expect(mockToastAdd).not.toHaveBeenCalled()
    consoleErrorSpy.mockRestore()
  })

  it('should handle errors without status code', async () => {
    const mockError = new Error('Network Error')
    const mockToastAdd = vi.fn()
    mockOriginalPayApi.mockRejectedValue(mockError)
    mockGetErrorStatus.mockReturnValue(undefined)
    mockUseToast.mockReturnValue({
      add: mockToastAdd
    })

    const plugin = await import('~/plugins/pay-api-error-handler.client')
    const defaultExport = plugin.default as (nuxtApp: unknown) => void

    defaultExport(mockNuxtApp as unknown)

    const wrappedPayApi = mockNuxtApp.provide.mock.calls[0]?.[1] as typeof mockOriginalPayApi
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    await expect(wrappedPayApi('/test-url')).rejects.toThrow('Network Error')

    expect(mockToastAdd).toHaveBeenCalledWith({
      description: 'Network Error',
      icon: 'i-mdi-alert',
      color: 'error'
    })
    consoleErrorSpy.mockRestore()
  })

  it('should handle non-Error objects', async () => {
    const mockError = { message: 'Custom error' }
    const mockToastAdd = vi.fn()
    mockOriginalPayApi.mockRejectedValue(mockError)
    mockGetErrorStatus.mockReturnValue(500)
    mockUseToast.mockReturnValue({
      add: mockToastAdd
    })

    const plugin = await import('~/plugins/pay-api-error-handler.client')
    const defaultExport = plugin.default as (nuxtApp: unknown) => void

    defaultExport(mockNuxtApp as unknown)

    const wrappedPayApi = mockNuxtApp.provide.mock.calls[0]?.[1] as typeof mockOriginalPayApi
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    await expect(wrappedPayApi('/test-url')).rejects.toEqual(mockError)

    expect(consoleErrorSpy).toHaveBeenCalledWith('Pay API Error:', {
      url: '/test-url',
      status: 500,
      error: 'An error occurred',
      errorObject: mockError
    })
    expect(mockToastAdd).toHaveBeenCalledWith({
      description: '500: An error occurred',
      icon: 'i-mdi-alert',
      color: 'error'
    })
    consoleErrorSpy.mockRestore()
  })

  it('should pass options to original $payApi', async () => {
    const mockResponse = { data: 'success' }
    const options = {
      method: 'POST',
      body: { test: 'data' },
      headers: { 'Content-Type': 'application/json' }
    }
    mockOriginalPayApi.mockResolvedValue(mockResponse)

    const plugin = await import('~/plugins/pay-api-error-handler.client')
    const defaultExport = plugin.default as (nuxtApp: unknown) => void

    defaultExport(mockNuxtApp as unknown)

    const wrappedPayApi = mockNuxtApp.provide.mock.calls[0]?.[1] as typeof mockOriginalPayApi

    await wrappedPayApi('/test-url', options)

    expect(mockOriginalPayApi).toHaveBeenCalledWith('/test-url', options)
  })

  it('should provide payApiWithErrorHandling', async () => {
    const plugin = await import('~/plugins/pay-api-error-handler.client')
    const defaultExport = plugin.default as (nuxtApp: unknown) => void

    defaultExport(mockNuxtApp as unknown)

    expect(mockNuxtApp.provide).toHaveBeenCalledWith('payApiWithErrorHandling', expect.any(Function))
  })
})
