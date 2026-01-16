import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useEftTabCounts } from '~/composables/eft/useEftTabCounts'

const mockPayApi = vi.fn()

mockNuxtImport('useNuxtApp', () => () => ({
  $payApi: mockPayApi
}))

describe('useEftTabCounts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with zero counts', () => {
    const { summaries, linked } = useEftTabCounts()
    expect(summaries.value).toBe(0)
    expect(linked.value).toBe(0)
  })

  it('should fetch and update tab counts successfully', async () => {
    mockPayApi.mockImplementation((url: string) => {
      if (url.includes('/summaries')) {
        return Promise.resolve({ total: 42 })
      }
      if (url.includes('state=LINKED')) {
        return Promise.resolve({ total: 15 })
      }
      return Promise.resolve({ total: 0 })
    })

    const { summaries, linked, fetchTabCounts } = useEftTabCounts()
    await fetchTabCounts()

    expect(summaries.value).toBe(42)
    expect(linked.value).toBe(15)
  })

  it('should handle null response for summaries', async () => {
    mockPayApi.mockImplementation((url: string) => {
      if (url.includes('/summaries')) {
        return Promise.resolve(null)
      }
      return Promise.resolve({ total: 10 })
    })

    const { summaries, linked, fetchTabCounts } = useEftTabCounts()
    await fetchTabCounts()

    expect(summaries.value).toBe(0)
    expect(linked.value).toBe(10)
  })

  it('should handle null response for linked', async () => {
    mockPayApi.mockImplementation((url: string) => {
      if (url.includes('/summaries')) {
        return Promise.resolve({ total: 20 })
      }
      return Promise.resolve(null)
    })

    const { summaries, linked, fetchTabCounts } = useEftTabCounts()
    await fetchTabCounts()

    expect(summaries.value).toBe(20)
    expect(linked.value).toBe(0)
  })

  it('should handle undefined total in response', async () => {
    mockPayApi.mockResolvedValue({})

    const { summaries, linked, fetchTabCounts } = useEftTabCounts()
    await fetchTabCounts()

    expect(summaries.value).toBe(0)
    expect(linked.value).toBe(0)
  })

  it('should call correct API endpoints', async () => {
    mockPayApi.mockResolvedValue({ total: 0 })

    const { fetchTabCounts } = useEftTabCounts()
    await fetchTabCounts()

    expect(mockPayApi).toHaveBeenCalledWith('/eft-shortnames/summaries?limit=1')
    expect(mockPayApi).toHaveBeenCalledWith('/eft-shortnames?state=LINKED&limit=1')
  })
})
