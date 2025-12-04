import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import Index from '~/pages/index.vue'

const { mockNavigateTo } = vi.hoisted(() => {
  const _mockNavigateTo = vi.fn()
  return {
    mockNavigateTo: _mockNavigateTo
  }
})

mockNuxtImport('navigateTo', () => mockNavigateTo)

describe('Index Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should navigate to /home when mounted', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await mountSuspended(Index)
    expect(mockNavigateTo).toHaveBeenCalledWith('/home')
    consoleWarnSpy.mockRestore()
  })

  it('should call navigateTo exactly once', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await mountSuspended(Index)
    expect(mockNavigateTo).toHaveBeenCalledTimes(1)
    consoleWarnSpy.mockRestore()
  })
})
