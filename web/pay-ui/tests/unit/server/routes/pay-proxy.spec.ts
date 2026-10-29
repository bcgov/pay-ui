import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import type { H3Event } from 'h3'

const { runtimeConfig } = vi.hoisted(() => {
  // Nitro auto-imports are not available in the test environment; provide them before the handler module loads
  const g = globalThis as Record<string, unknown>
  g.defineEventHandler = (handler: unknown) => handler
  return { runtimeConfig: { payApiUrl: '' as string | undefined, xApiKey: 'server-key' } }
})

mockNuxtImport('useRuntimeConfig', original => () => ({ ...original(), ...runtimeConfig }))

const getRequestHeader = vi.fn()
const getRouterParam = vi.fn()
const getRequestURL = vi.fn()
const readRawBody = vi.fn()
const sendProxy = vi.fn()

interface FakeEventOptions {
  method?: string
  path?: string | undefined
  search?: string
  headers?: Record<string, string>
  body?: Buffer | string | undefined
}

function fakeEvent(options: FakeEventOptions = {}) {
  const { method = 'GET', search = '', headers, body } = options
  const path = 'path' in options ? options.path : 'api/v1/fees'
  const requestHeaders: Record<string, string> = headers ?? { authorization: 'Bearer token-123' }
  getRequestHeader.mockImplementation((_e: H3Event, name: string) => requestHeaders[name.toLowerCase()])
  getRouterParam.mockImplementation((_e: H3Event, name: string) => (name === 'path' ? path : undefined))
  getRequestURL.mockReturnValue(new URL(`https://pay-ui.test/pay-proxy/x${search}`))
  readRawBody.mockResolvedValue(body)
  return { method } as unknown as H3Event
}

let handler: (event: H3Event) => Promise<unknown>

describe('server/routes/pay-proxy/[...path]', () => {
  beforeAll(async () => {
    handler = (await import('../../../../server/routes/pay-proxy/[...path]')).default as never
  })

  beforeEach(() => {
    runtimeConfig.payApiUrl = 'https://pay-api.test'
    runtimeConfig.xApiKey = 'server-key'
    vi.stubGlobal('getRequestHeader', getRequestHeader)
    vi.stubGlobal('getRouterParam', getRouterParam)
    vi.stubGlobal('getRequestURL', getRequestURL)
    vi.stubGlobal('readRawBody', readRawBody)
    vi.stubGlobal('sendProxy', sendProxy)
    sendProxy.mockResolvedValue('proxied')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('configuration and request guards', () => {
    it.each([undefined, ''])('returns 502 when payApiUrl is %j', async (url) => {
      runtimeConfig.payApiUrl = url
      await expect(handler(fakeEvent())).rejects.toMatchObject({ statusCode: 502 })
      expect(sendProxy).not.toHaveBeenCalled()
    })

    it.each(['HEAD', 'OPTIONS', 'TRACE', 'CONNECT'])('returns 405 for method %s', async (method) => {
      await expect(handler(fakeEvent({ method }))).rejects.toMatchObject({ statusCode: 405 })
      expect(sendProxy).not.toHaveBeenCalled()
    })

    it.each([
      ['missing header', {}],
      ['non-bearer scheme', { authorization: 'Basic dXNlcjpwYXNz' }],
      ['empty bearer token', { authorization: 'Bearer ' }],
      ['token containing whitespace', { authorization: 'Bearer abc def' }],
      ['lowercase scheme', { authorization: 'bearer abc' }]
    ])('returns 401 for %s', async (_label, headers) => {
      await expect(handler(fakeEvent({ headers }))).rejects.toMatchObject({ statusCode: 401 })
      expect(sendProxy).not.toHaveBeenCalled()
    })
  })

  describe('path validation', () => {
    it.each([
      ['encoded dot', 'api/v1/%2e%2e/admin'],
      ['uppercase encoded dot', 'api/v1/%2E%2E/admin'],
      ['encoded slash', 'api/v1/fees%2f..%2fadmin'],
      ['encoded backslash', 'api/v1/fees%5cadmin'],
      ['raw backslash', 'api/v1\\..\\admin'],
      ['dot-dot segment', 'api/v1/../../admin'],
      ['single-dot segment', 'api/v1/./fees'],
      ['disallowed prefix', 'api/v3/fees'],
      ['missing version', 'api/fees'],
      ['prefix without trailing slash', 'api/v1'],
      ['absolute URL', 'https://evil.test/api/v1/x'],
      ['empty path', ''],
      ['missing path param', undefined],
      // Tabs are stripped by the URL parser, so ".\t." becomes ".." only after normalization
      ['traversal revealed by URL normalization', 'api/v1/.\t./x']
    ])('returns 400 for %s', async (_label, path) => {
      await expect(handler(fakeEvent({ path }))).rejects.toMatchObject({ statusCode: 400 })
      expect(sendProxy).not.toHaveBeenCalled()
    })
  })

  describe('forwarding', () => {
    it('proxies a GET request with only allow-listed headers and the server API key', async () => {
      const event = fakeEvent({
        path: 'api/v1/fees/BCR',
        search: '?a=1&b=two',
        headers: {
          'authorization': 'Bearer token-123',
          'account-id': '42',
          'app-name': 'pay-ui',
          'accept': 'application/json',
          'accept-language': 'en',
          'content-type': 'application/json',
          'cookie': 'session=secret',
          'x-apikey': 'client-supplied',
          'x-forwarded-for': '1.2.3.4'
        }
      })

      await expect(handler(event)).resolves.toBe('proxied')

      expect(readRawBody).not.toHaveBeenCalled()
      expect(sendProxy).toHaveBeenCalledWith(event, 'https://pay-api.test/api/v1/fees/BCR?a=1&b=two', {
        fetchOptions: {
          method: 'GET',
          body: undefined,
          headers: {
            'authorization': 'Bearer token-123',
            'account-id': '42',
            'app-name': 'pay-ui',
            'accept': 'application/json',
            'accept-language': 'en',
            'content-type': 'application/json',
            'x-apikey': 'server-key'
          }
        }
      })
    })

    it('omits absent headers and accepts api/v2 paths', async () => {
      const event = fakeEvent({ path: 'api/v2/statements' })

      await handler(event)

      const [, href, options] = sendProxy.mock.calls[0]!
      expect(href).toBe('https://pay-api.test/api/v2/statements')
      expect(options.fetchOptions.headers).toEqual({ 'authorization': 'Bearer token-123', 'x-apikey': 'server-key' })
    })

    it.each([
      'https://pay-api.test/pay-base',
      'https://pay-api.test/pay-base/'
    ])('keeps the base path of the configured pay-api URL %s', async (url) => {
      runtimeConfig.payApiUrl = url
      await handler(fakeEvent({ path: 'api/v1/fees' }))
      expect(sendProxy.mock.calls[0]![1]).toBe('https://pay-api.test/pay-base/api/v1/fees')
    })

    it.each(['POST', 'PUT', 'PATCH', 'DELETE'])('reads and forwards the raw body for %s', async (method) => {
      const event = fakeEvent({ method, body: Buffer.from('{"x":1}') })

      await handler(event)

      expect(readRawBody).toHaveBeenCalledWith(event, false)
      const { fetchOptions } = sendProxy.mock.calls[0]![2]
      expect(fetchOptions.method).toBe(method)
      expect(fetchOptions.body).toBeInstanceOf(Uint8Array)
      expect(Array.from(fetchOptions.body as Uint8Array)).toEqual([123, 34, 120, 34, 58, 49, 125])
    })

    it.each([undefined, ''])('sends no body when the raw body is %j', async (body) => {
      await handler(fakeEvent({ method: 'POST', body }))
      expect(sendProxy.mock.calls[0]![2].fetchOptions.body).toBeUndefined()
    })
  })
})
