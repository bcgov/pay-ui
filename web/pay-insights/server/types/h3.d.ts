import type { InsightsUser } from '../utils/auth'

declare module 'h3' {
  interface H3EventContext {
    user?: InsightsUser
    startedAt?: number
  }
}

export {}
