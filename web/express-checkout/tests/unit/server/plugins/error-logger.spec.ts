import type { H3Event } from 'h3'

const { mockLog } = vi.hoisted(() => {
  // Nitro auto-import that is not available in the test environment
  (globalThis as Record<string, unknown>).defineNitroPlugin = (plugin: unknown) => plugin
  return { mockLog: vi.fn() }
})

vi.mock('../../../../server/utils/logger', () => ({ log: mockLog }))

type ErrorHook = (error: Error, ctx: { event?: H3Event }) => void

async function setup() {
  let errorHook: ErrorHook | undefined
  const hookNames: string[] = []
  const nitroApp = {
    hooks: {
      hook: (name: string, fn: ErrorHook) => {
        hookNames.push(name)
        errorHook = fn
      }
    }
  }
  const plugin = (await import('../../../../server/plugins/error-logger')).default as unknown as (
    app: typeof nitroApp) => void
  plugin(nitroApp)
  expect(hookNames).toEqual(['error'])
  return errorHook!
}

describe('server/plugins/error-logger', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('logs the error with stack trace, service context and request details', async () => {
    vi.stubEnv('K_SERVICE', 'pay-ui-prod')
    vi.stubEnv('K_REVISION', 'rev-7')
    const hook = await setup()
    const error = new Error('boom')
    const event = {
      node: { req: { method: 'PUT', url: '/x?y=1', headers: { 'user-agent': 'ua' } } }
    } as unknown as H3Event

    hook(error, { event })

    expect(mockLog).toHaveBeenCalledWith('ERROR', 'boom', {
      stack_trace: error.stack,
      serviceContext: { service: 'pay-ui-prod', version: 'rev-7' },
      httpRequest: { requestMethod: 'PUT', requestUrl: '/x?y=1', userAgent: 'ua' }
    }, event)
  })

  it('defaults the service name and omits request details when there is no event', async () => {
    vi.stubEnv('K_SERVICE', undefined)
    vi.stubEnv('K_REVISION', undefined)
    const hook = await setup()
    const error = new Error('no event')

    hook(error, {})

    expect(mockLog).toHaveBeenCalledWith('ERROR', 'no event', {
      stack_trace: error.stack,
      serviceContext: { service: 'express-checkout', version: undefined },
      httpRequest: undefined
    }, undefined)
  })

  it('omits request details when the event has no node request', async () => {
    const hook = await setup()
    const event = {} as H3Event
    hook(new Error('x'), { event })
    expect(mockLog.mock.calls[0]![2]).toMatchObject({ httpRequest: undefined })
  })
})
