/* eslint-disable @typescript-eslint/no-explicit-any */
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import type { RouteLocationNormalizedGeneric } from 'vue-router'
import middleware from '~/middleware/pay-auth'

const mockIsAuthenticated = ref(false)
const mockAuthUser = ref({ roles: [] as string[] })
mockNuxtImport('useConnectAuth', () => () => ({
  isAuthenticated: mockIsAuthenticated,
  authUser: mockAuthUser
}))

const { mockCreateError } = vi.hoisted(() => ({ mockCreateError: vi.fn() }))
mockNuxtImport('createError', () => mockCreateError)
const { mockNavigateTo } = vi.hoisted(() => ({ mockNavigateTo: vi.fn() }))
mockNuxtImport('navigateTo', () => mockNavigateTo)

mockNuxtImport('useRuntimeConfig', () => () => ({ public: { baseUrl: 'https://app.example.com/' } }))
mockNuxtImport('useLocalePath', () => () => (path: string) => path)

function createRoute(meta: any = {}) {
  return {
    path: '/some-path',
    fullPath: '/some-path',
    query: {},
    meta
  } as unknown as RouteLocationNormalizedGeneric
}

describe('pay-auth middleware', () => {
  const from = { path: '/another-path' } as unknown as RouteLocationNormalizedGeneric

  beforeEach(() => {
    vi.resetAllMocks()
  })

  describe('Auth Check', () => {
    it('should do nothing if authenticated', async () => {
      mockIsAuthenticated.value = true
      await middleware(createRoute(), from)
      expect(mockNavigateTo).not.toHaveBeenCalled()
    })

    it('should redirect to login page if not authenticated', async () => {
      mockIsAuthenticated.value = false
      await middleware(createRoute(), from)
      const expectedRedirectUrl = '/auth/login?return=http://localhost:3000/some-path'
      expect(mockNavigateTo).toHaveBeenCalledWith(expectedRedirectUrl)
    })
  })

  describe('Roles Check', () => {
    beforeEach(() => {
      mockIsAuthenticated.value = true
    })

    it('should do nothing if has at least 1 allowed role', async () => {
      mockAuthUser.value.roles = [Role.FAS_EDIT]
      const to = createRoute({ allowedRoles: [Role.FAS_EDIT, Role.FAS_CREATE] })

      await middleware(to, from)

      expect(mockNavigateTo).not.toHaveBeenCalled()
      expect(mockCreateError).not.toHaveBeenCalled()
    })

    it('should throw 403 if user has none of the allowedRoles', async () => {
      mockAuthUser.value.roles = [Role.FAS_CREATE]
      const to = createRoute({ allowedRoles: [Role.FAS_CORRECTION, Role.FAS_REFUND] })

      try {
        await middleware(to, from)
        /* eslint-disable-next-line no-empty */
      } catch {}

      expect(mockCreateError).toHaveBeenCalledOnce()
      expect(mockCreateError).toHaveBeenCalledWith({
        statusCode: 403,
        fatal: true,
        message: 'Missing required role.'
      })
    })

    it('should do nothing if no allowedRoles set on route', async () => {
      mockAuthUser.value.roles = ['viewer']
      const to = createRoute()

      await middleware(to, from)

      expect(mockCreateError).not.toHaveBeenCalled()
    })
  })
})
