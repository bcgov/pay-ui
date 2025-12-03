import { config } from '@vue/test-utils'
import type { Directive } from 'vue'

const canDirective: Directive = {
  mounted: () => {},
  updated: () => {}
}

config.global.directives = {
  ...config.global.directives,
  can: canDirective
}

const originalWarn = console.warn
console.warn = (...args: unknown[]) => {
  if (typeof args[0] === 'string' && args[0].includes('App already provides property with key "Symbol(pinia)"')) {
    return
  }
  originalWarn(...args)
}

vi.mock('keycloak-js', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      init: vi.fn().mockResolvedValue(true),
      login: vi.fn(),
      logout: vi.fn(),
      updateToken: vi.fn().mockResolvedValue(true),
      token: 'mock-token',
      tokenParsed: {},
      authenticated: false
    }))
  }
})
