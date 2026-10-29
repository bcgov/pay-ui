import type { H3Event } from 'h3'

const { mockLog } = vi.hoisted(() => {
  // Nitro auto-import that is not available in the test environment
  (globalThis as Record<string, unknown>).defineNitroPlugin = (plugin: unknown) => plugin
  return { mockLog: vi.fn() }
})

vi.mock('../../../../server/utils/logger', () => ({ log: mockLog }))

type Hook = (event: H3Event) => void

async function setup() {
  const hooks: Record<string, Hook> = {}
  const nitroApp = { hooks: { hook: (name: string, fn: Hook) => { hooks[name] = fn } } }
  const plugin = (await import('../../../../server/plugins/request-logger')).default as unknown as (
    app: typeof nitroApp) => void
  plugin(nitroApp)
  return hooks
}

function fakeEvent(opts: {
  url?: string
  method?: string
  status?: number
  headers?: Record<string, string>
  startedAt?: number
}): H3Event {
  return {
    context: opts.startedAt === undefined ? {} : { startedAt: opts.startedAt },
    node: {
      req: { url: opts.url, method: opts.method ?? 'GET', headers: opts.headers ?? {} },
      res: { statusCode: opts.status ?? 200 }
    }
  } as unknown as H3Event
}

describe('server/plugins/request-logger', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-01T00:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('registers request and afterResponse hooks', async () => {
    const hooks = await setup()
    expect(Object.keys(hooks).sort()).toEqual(['afterResponse', 'request'])
  })

  it('stamps the request start time and logs latency, client IP and user agent', async () => {
    const hooks = await setup()
    const event = fakeEvent({
      url: '/api/thing?x=1',
      method: 'POST',
      status: 201,
      headers: { 'user-agent': 'jest', 'x-forwarded-for': '10.0.0.1, 10.0.0.2' }
    })

    hooks.request!(event)
    expect(event.context.startedAt).toBe(Date.now())
    vi.advanceTimersByTime(250)
    hooks.afterResponse!(event)

    expect(mockLog).toHaveBeenCalledWith('INFO', 'POST /api/thing?x=1 201', {
      httpRequest: {
        requestMethod: 'POST',
        requestUrl: '/api/thing?x=1',
        status: 201,
        latency: '0.25s',
        userAgent: 'jest',
        remoteIp: '10.0.0.1'
      }
    }, event)
  })

  it.each([
    [500, 'ERROR'],
    [503, 'ERROR'],
    [400, 'WARNING'],
    [404, 'WARNING'],
    [399, 'INFO'],
    [200, 'INFO']
  ])('maps status %i to severity %s', async (status, severity) => {
    const hooks = await setup()
    hooks.afterResponse!(fakeEvent({ url: '/x', status, startedAt: Date.now() }))
    expect(mockLog.mock.calls[0]![0]).toBe(severity)
  })

  it('uses zero latency, an empty URL and no IP when the data is missing', async () => {
    const hooks = await setup()
    const event = fakeEvent({ url: undefined })
    hooks.afterResponse!(event)
    expect(mockLog).toHaveBeenCalledWith('INFO', 'GET  200', {
      httpRequest: {
        requestMethod: 'GET',
        requestUrl: '',
        status: 200,
        latency: '0s',
        userAgent: undefined,
        remoteIp: undefined
      }
    }, event)
  })

  it.each([
    '/_nuxt/entry.js',
    '/__nuxt_error',
    '/favicon.ico',
    '/health',
    '/healthz'
  ])('skips noisy URL %s', async (url) => {
    const hooks = await setup()
    hooks.afterResponse!(fakeEvent({ url }))
    expect(mockLog).not.toHaveBeenCalled()
  })

  it.each(['/healthcheck', '/api/_nuxt/x', '/nuxt'])('does not skip %s', async (url) => {
    const hooks = await setup()
    hooks.afterResponse!(fakeEvent({ url }))
    expect(mockLog).toHaveBeenCalledTimes(1)
  })
})
