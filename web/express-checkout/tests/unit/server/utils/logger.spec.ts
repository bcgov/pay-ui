import type { H3Event } from 'h3'

type LoggerModule = typeof import('../../../../server/utils/logger')

async function loadLogger(env: { LOG_LEVEL?: string, GOOGLE_CLOUD_PROJECT?: string } = {}): Promise<LoggerModule> {
  vi.resetModules()
  for (const key of ['LOG_LEVEL', 'GOOGLE_CLOUD_PROJECT'] as const) {
    if (env[key] === undefined) {
      vi.stubEnv(key, undefined)
    } else {
      vi.stubEnv(key, env[key])
    }
  }
  return import('../../../../server/utils/logger')
}

function eventWithTrace(header: unknown): H3Event {
  return { node: { req: { headers: { 'x-cloud-trace-context': header } } } } as unknown as H3Event
}

function lastJson(spy: ReturnType<typeof vi.spyOn>) {
  return JSON.parse(spy.mock.calls.at(-1)![0] as string)
}

describe('server/utils/logger', () => {
  let infoSpy: ReturnType<typeof vi.spyOn>
  let errorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('defaults to INFO: drops DEBUG and writes INFO to stdout as structured JSON', async () => {
    const { log } = await loadLogger()

    log('DEBUG', 'hidden')
    expect(infoSpy).not.toHaveBeenCalled()

    log('INFO', 'hello', { foo: 'bar' })
    expect(infoSpy).toHaveBeenCalledTimes(1)
    expect(lastJson(infoSpy)).toEqual({ severity: 'INFO', message: 'hello', foo: 'bar' })
    expect(errorSpy).not.toHaveBeenCalled()
  })

  it.each(['WARNING', 'ERROR'] as const)('writes %s entries to stderr', async (severity) => {
    const { log } = await loadLogger()
    log(severity, 'problem')
    expect(infoSpy).not.toHaveBeenCalled()
    expect(lastJson(errorSpy)).toEqual({ severity, message: 'problem' })
  })

  it('honours a lower-case LOG_LEVEL of debug', async () => {
    const { log } = await loadLogger({ LOG_LEVEL: 'debug' })
    log('DEBUG', 'visible')
    expect(lastJson(infoSpy)).toEqual({ severity: 'DEBUG', message: 'visible' })
  })

  it('suppresses entries below a configured ERROR level', async () => {
    const { log } = await loadLogger({ LOG_LEVEL: 'ERROR' })
    log('INFO', 'no')
    log('WARNING', 'no')
    expect(infoSpy).not.toHaveBeenCalled()
    expect(errorSpy).not.toHaveBeenCalled()
    log('ERROR', 'yes')
    expect(errorSpy).toHaveBeenCalledTimes(1)
  })

  it('falls back to INFO for an unknown LOG_LEVEL', async () => {
    const { log } = await loadLogger({ LOG_LEVEL: 'verbose' })
    log('DEBUG', 'hidden')
    expect(infoSpy).not.toHaveBeenCalled()
    log('INFO', 'shown')
    expect(infoSpy).toHaveBeenCalledTimes(1)
  })

  it('adds the Cloud Trace id when the project and trace header are present', async () => {
    const { log } = await loadLogger({ GOOGLE_CLOUD_PROJECT: 'my-proj' })
    log('INFO', 'traced', {}, eventWithTrace('abc123/456;o=1'))
    expect(lastJson(infoSpy)).toEqual({
      'severity': 'INFO',
      'message': 'traced',
      'logging.googleapis.com/trace': 'projects/my-proj/traces/abc123'
    })
  })

  it.each([
    ['no event', undefined],
    ['an event without node', {} as H3Event],
    ['a missing header', eventWithTrace(undefined)],
    ['a non-string header', eventWithTrace(['abc/1'])],
    ['an empty trace id', eventWithTrace('/1')]
  ])('omits the trace for %s', async (_label, event) => {
    const { log } = await loadLogger({ GOOGLE_CLOUD_PROJECT: 'my-proj' })
    log('INFO', 'untraced', {}, event)
    expect(lastJson(infoSpy)).not.toHaveProperty('logging.googleapis.com/trace')
  })

  it('omits the trace when GOOGLE_CLOUD_PROJECT is not set', async () => {
    const { log } = await loadLogger()
    log('INFO', 'untraced', {}, eventWithTrace('abc123/1'))
    expect(lastJson(infoSpy)).toEqual({ severity: 'INFO', message: 'untraced' })
  })
})
