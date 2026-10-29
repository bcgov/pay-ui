import type { H3Event } from 'h3'

type Severity = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR'

const LEVELS: Severity[] = ['DEBUG', 'INFO', 'WARNING', 'ERROR']

// Minimum level comes from the LOG_LEVEL env var (DEBUG, INFO, WARNING, ERROR); defaults to INFO
const configured = process.env.LOG_LEVEL?.toUpperCase() as Severity
const minLevel = LEVELS.indexOf(LEVELS.includes(configured) ? configured : 'INFO')

// Cloud Run does not set the project id automatically; set it to enable trace correlation
const project = process.env.GOOGLE_CLOUD_PROJECT

function traceOf(event?: H3Event): Record<string, string> {
  const header = event?.node?.req?.headers?.['x-cloud-trace-context']
  const traceId = typeof header === 'string' ? header.split('/')[0] : undefined
  if (!traceId || !project) {
    return {}
  }
  return { 'logging.googleapis.com/trace': `projects/${project}/traces/${traceId}` }
}

export function log(severity: Severity, message: string, fields: Record<string, unknown> = {}, event?: H3Event) {
  if (LEVELS.indexOf(severity) < minLevel) {
    return
  }
  const entry = JSON.stringify({ severity, message, ...fields, ...traceOf(event) })
  // Cloud Logging reads severity from the JSON payload regardless of stream
  if (severity === 'ERROR' || severity === 'WARNING') {
    console.error(entry)
  } else {
    console.info(entry)
  }
}
