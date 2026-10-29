import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import type { H3Event } from 'h3'

const { mockLog, runtimeConfig } = vi.hoisted(() => {
  // Nitro auto-import that is not available in the test environment
  (globalThis as Record<string, unknown>).defineEventHandler = (handler: unknown) => handler
  return { mockLog: vi.fn(), runtimeConfig: { cspExtra: undefined as string | undefined } }
})

vi.mock('../../../../server/utils/logger', () => ({ log: mockLog }))
mockNuxtImport('useRuntimeConfig', () => () => ({ ...runtimeConfig }))

const setResponseHeader = vi.fn()

async function loadMiddleware() {
  // Reset the module-level "warned" flag between tests
  vi.resetModules()
  return (await import('../../../../server/middleware/csp')).default as unknown as (event: H3Event) => void
}

describe('server/middleware/csp', () => {
  const event = { id: 'evt' } as unknown as H3Event

  beforeEach(() => {
    vi.stubGlobal('setResponseHeader', setResponseHeader)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sets the trimmed Content-Security-Policy header from runtime config', async () => {
    runtimeConfig.cspExtra = "  default-src 'self'; frame-ancestors 'none'  "
    const middleware = await loadMiddleware()

    middleware(event)

    expect(setResponseHeader).toHaveBeenCalledWith(event, 'content-security-policy',
      "default-src 'self'; frame-ancestors 'none'")
    expect(mockLog).not.toHaveBeenCalled()
  })

  it.each([undefined, '', '   '])('warns only once and sets no header when cspExtra is %j', async (value) => {
    runtimeConfig.cspExtra = value
    const middleware = await loadMiddleware()

    middleware(event)
    middleware(event)
    middleware(event)

    expect(setResponseHeader).not.toHaveBeenCalled()
    expect(mockLog).toHaveBeenCalledTimes(1)
    expect(mockLog).toHaveBeenCalledWith('WARNING', expect.stringContaining('NUXT_CSP_EXTRA is not set'))
  })

  it('applies the header once configured, even after warning', async () => {
    runtimeConfig.cspExtra = undefined
    const middleware = await loadMiddleware()
    middleware(event)
    runtimeConfig.cspExtra = "default-src 'self'"
    middleware(event)

    expect(mockLog).toHaveBeenCalledTimes(1)
    expect(setResponseHeader).toHaveBeenCalledWith(event, 'content-security-policy', "default-src 'self'")
  })
})
