import { log } from '../utils/logger'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('error', (error, { event }) => {
    const req = event?.node?.req
    // 4xx (not signed in, no role, invalid filters) are expected: log a warning, not an error report
    const statusCode = (error as { statusCode?: number }).statusCode ?? 500
    if (statusCode < 500) {
      log('WARNING', `${req?.method} ${req?.url} ${statusCode} ${error.message}`, {
        httpRequest: req && { requestMethod: req.method, requestUrl: req.url, status: statusCode }
      }, event)
      return
    }
    // "stack_trace" + serviceContext lets Cloud Error Reporting group these errors
    log('ERROR', error.message, {
      stack_trace: error.stack,
      serviceContext: { service: process.env.K_SERVICE ?? 'pay-insights', version: process.env.K_REVISION },
      httpRequest: req && {
        requestMethod: req.method,
        requestUrl: req.url,
        userAgent: req.headers['user-agent']
      }
    }, event)
  })
})
