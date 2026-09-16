// The nuxt-auth layer's `connect-account-bootstrap.client` plugin runs during
// Nuxt test bootstrap and calls a pinia store before any test has activated a
// pinia instance. It logs a noisy "getActivePinia() was called..." error via
// console.error that isn't relevant to these tests — filter it out.
const originalError = console.error
console.error = (...args: unknown[]) => {
  const first = args[0]
  if (typeof first === 'string' && first.includes('[nuxt] error caught during app initialization')) {
    const second = args[1]
    if (second instanceof Error && second.message.includes('getActivePinia()')) {
      return
    }
  }
  originalError(...args)
}

vi.mock('keycloak-js', () => ({
  default: vi.fn().mockImplementation(() => ({
    init: vi.fn().mockResolvedValue(true),
    login: vi.fn(),
    logout: vi.fn(),
    updateToken: vi.fn().mockResolvedValue(true),
    token: 'mock-token',
    tokenParsed: {},
    authenticated: false
  }))
}))

afterEach(() => {
  vi.clearAllMocks()
  vi.clearAllTimers()

  if (document.body.innerHTML) {
    document.body.innerHTML = ''
  }
})
