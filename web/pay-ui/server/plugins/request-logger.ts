import { log } from '../utils/logger'

const SKIPPED = /^\/(_nuxt\/|__nuxt|favicon\.ico|healthz?$)/

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('request', (event) => {
    event.context.startedAt = Date.now()
  })

  nitroApp.hooks.hook('afterResponse', (event) => {
    const req = event.node.req
    const url = req.url ?? ''
    if (SKIPPED.test(url)) {
      return
    }
    const status = event.node.res.statusCode
    const latencyMs = Date.now() - (event.context.startedAt ?? Date.now())
    log(status >= 500 ? 'ERROR' : status >= 400 ? 'WARNING' : 'INFO', `${req.method} ${url} ${status}`, {
      httpRequest: {
        requestMethod: req.method,
        requestUrl: url,
        status,
        latency: `${latencyMs / 1000}s`,
        userAgent: req.headers['user-agent'],
        remoteIp: String(req.headers['x-forwarded-for'] ?? '').split(',')[0] || undefined
      }
    }, event)
  })
})
