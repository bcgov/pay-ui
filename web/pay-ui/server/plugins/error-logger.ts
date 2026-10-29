import { log } from '../utils/logger'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('error', (error, { event }) => {
    const req = event?.node?.req
    // "stack_trace" + serviceContext lets Cloud Error Reporting group these errors
    log('ERROR', error.message, {
      stack_trace: error.stack,
      serviceContext: { service: process.env.K_SERVICE ?? 'pay-ui', version: process.env.K_REVISION },
      httpRequest: req && {
        requestMethod: req.method,
        requestUrl: req.url,
        userAgent: req.headers['user-agent']
      }
    }, event)
  })
})
