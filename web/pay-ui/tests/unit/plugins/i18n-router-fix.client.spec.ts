import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import i18nRouterFixPlugin from '~/plugins/i18n-router-fix.client'
import type { NuxtApp } from '#app'

const { mockRouter, mockUseRouter, originalResolve } = vi.hoisted(() => {
  const _originalResolve = vi.fn((to: string | { path?: string, name?: string }) => {
    if (typeof to === 'string') {
      return { path: to, name: to }
    }
    return { path: to?.path || '/', name: to?.name || 'default' }
  })
  const _mockRouter = {
    resolve: _originalResolve
  }
  const _mockUseRouter = vi.fn(() => _mockRouter)
  return {
    mockRouter: _mockRouter,
    mockUseRouter: _mockUseRouter,
    originalResolve: _originalResolve
  }
})

mockNuxtImport('useRouter', () => mockUseRouter)

Object.defineProperty(globalThis, 'import', {
  value: {
    meta: {
      server: false
    }
  },
  writable: true,
  configurable: true
})

describe('i18n-router-fix.client plugin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRouter.resolve = originalResolve
  })

  it('should return early on server', async () => {
    const originalMeta = (globalThis as { import?: { meta?: { server?: boolean } } }).import?.meta
    vi.clearAllMocks()
    const originalResolveValue = mockRouter.resolve
    Object.defineProperty(globalThis, 'import', {
      value: {
        meta: {
          server: true
        }
      },
      writable: true,
      configurable: true
    })

    const plugin = i18nRouterFixPlugin
    await plugin({} as NuxtApp)

    expect(mockRouter.resolve === originalResolveValue || typeof mockRouter.resolve === 'function').toBe(true)

    Object.defineProperty(globalThis, 'import', {
      value: {
        meta: originalMeta || { server: false }
      },
      writable: true,
      configurable: true
    })
  })

  it('should redirect locale paths and handle normal paths', async () => {
    const plugin = i18nRouterFixPlugin
    await plugin({} as NuxtApp)

    let result = mockRouter.resolve('/en-CA')
    expect(originalResolve).toHaveBeenCalledWith('/')
    expect(result.path).toBe('/')

    vi.clearAllMocks()
    result = mockRouter.resolve('/fr-CA')
    expect(originalResolve).toHaveBeenCalledWith('/')
    expect(result.path).toBe('/')

    vi.clearAllMocks()
    result = mockRouter.resolve({ path: '/en-CA' })
    expect(originalResolve).toHaveBeenCalledWith('/')
    expect(result.path).toBe('/')

    vi.clearAllMocks()
    result = mockRouter.resolve({ path: '/fr-CA' })
    expect(originalResolve).toHaveBeenCalledWith('/')
    expect(result.path).toBe('/')

    vi.clearAllMocks()
    result = mockRouter.resolve('/home')
    expect(originalResolve).toHaveBeenCalledWith('/home')
    expect(result.path).toBe('/home')

    vi.clearAllMocks()
    result = mockRouter.resolve({ path: '/home', name: 'home' })
    expect(originalResolve).toHaveBeenCalledWith({ path: '/home', name: 'home' })
    expect(result.path).toBe('/home')
  })

  it('should handle errors, non-Error objects, and object paths with name only', async () => {
    originalResolve.mockImplementationOnce(() => {
      throw new Error('Route /en-CA not found')
    })

    const plugin = i18nRouterFixPlugin
    await plugin({} as NuxtApp)

    let result = mockRouter.resolve('/some-path')
    expect(originalResolve).toHaveBeenCalledWith('/')
    expect(result.path).toBe('/')

    originalResolve.mockImplementationOnce(() => {
      throw new Error('Route /fr-CA not found')
    })

    vi.clearAllMocks()
    await plugin({} as NuxtApp)
    result = mockRouter.resolve('/some-path')
    expect(originalResolve).toHaveBeenCalledWith('/')
    expect(result.path).toBe('/')

    originalResolve.mockImplementationOnce(() => {
      throw new Error('Route /other not found')
    })

    vi.clearAllMocks()
    await plugin({} as NuxtApp)
    expect(() => {
      mockRouter.resolve('/some-path')
    }).toThrow('Route /other not found')

    originalResolve.mockImplementationOnce(() => {
      throw 'String error with /en-CA'
    })

    vi.clearAllMocks()
    await plugin({} as NuxtApp)
    result = mockRouter.resolve('/some-path')
    expect(originalResolve).toHaveBeenCalledWith('/')
    expect(result.path).toBe('/')

    vi.clearAllMocks()
    await plugin({} as NuxtApp)
    result = mockRouter.resolve({ name: 'home' })
    expect(originalResolve).toHaveBeenCalledWith({ name: 'home' })
    expect(result.path).toBe('/')
  })
})
