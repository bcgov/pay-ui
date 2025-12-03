import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import useViewRoutingSlip from '~/composables/viewRoutingSlip/useViewRoutingSlip'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'

const mockGetRoutingSlip = vi.fn()
const mockGetLinkedRoutingSlips = vi.fn()
const mockUseRoutingSlip = {
  getRoutingSlip: mockGetRoutingSlip,
  getLinkedRoutingSlips: mockGetLinkedRoutingSlips
}

const mockToggleLoading = vi.fn()
const mockIsLoading = ref(false)

const mockStore = {
  routingSlip: {
    number: '123456789'
  }
}

mockNuxtImport('useRoutingSlip', () => () => mockUseRoutingSlip)
mockNuxtImport('useRoutingSlipStore', () => () => ({
  store: mockStore
}))

vi.mock('~/composables/common/useLoader', () => ({
  useLoader: () => ({
    isLoading: mockIsLoading,
    toggleLoading: mockToggleLoading
  })
}))

describe('useViewRoutingSlip', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockIsLoading.value = false
    mockGetRoutingSlip.mockImplementation(() => Promise.resolve({}))
    mockGetLinkedRoutingSlips.mockImplementation(() => Promise.resolve({}))
    mockStore.routingSlip.number = '123456789'
  })

  it('should be defined', () => {
    const composable = useViewRoutingSlip({ slipId: '123456789' })
    expect(composable).toBeDefined()
  })

  it('should return slipId and getRoutingSlipAndLinkedRoutingSlips', () => {
    const composable = useViewRoutingSlip({ slipId: '123456789' })
    expect(composable.slipId).toBeDefined()
    expect(composable.getRoutingSlipAndLinkedRoutingSlips).toBeDefined()
    expect(typeof composable.getRoutingSlipAndLinkedRoutingSlips).toBe('function')
  })

  it('should return slipId as a ref', () => {
    const composable = useViewRoutingSlip({ slipId: '123456789' })
    expect(composable.slipId.value).toBe('123456789')
  })

  it('should call getRoutingSlipAndLinkedRoutingSlips immediately when slipId is provided', async () => {
    await useViewRoutingSlip({ slipId: '123456789' })
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    expect(mockGetRoutingSlip).toHaveBeenCalledWith({ routingSlipNumber: '123456789' })
  })

  it('should call getRoutingSlip when getRoutingSlipAndLinkedRoutingSlips is called', async () => {
    const composable = useViewRoutingSlip({ slipId: '123456789' })
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    vi.clearAllMocks()
    await composable.getRoutingSlipAndLinkedRoutingSlips()

    expect(mockGetRoutingSlip).toHaveBeenCalledWith({ routingSlipNumber: '123456789' })
  })

  it('should call getLinkedRoutingSlips when routingSlip has a number', async () => {
    const composable = useViewRoutingSlip({ slipId: '123456789' })
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    expect(mockGetLinkedRoutingSlips).toHaveBeenCalledWith('123456789')
  })

  it('should not call getLinkedRoutingSlips when routingSlip number is missing', async () => {
    mockStore.routingSlip.number = undefined as any
    const composable = useViewRoutingSlip({ slipId: '123456789' })
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    expect(mockGetRoutingSlip).toHaveBeenCalled()
    expect(mockGetLinkedRoutingSlips).not.toHaveBeenCalled()
  })

  it('should toggle loading to true before and false after operation', async () => {
    const composable = useViewRoutingSlip({ slipId: '123456789' })
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    expect(mockToggleLoading).toHaveBeenCalledWith(true)
    expect(mockToggleLoading).toHaveBeenCalledWith(false)
  })

  it('should toggle loading even when getRoutingSlip fails', async () => {
    mockGetRoutingSlip.mockImplementation(() => Promise.reject(new Error('API Error')))
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const composable = useViewRoutingSlip({ slipId: '123456789' })
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    expect(mockToggleLoading).toHaveBeenCalledWith(true)
    expect(mockToggleLoading).toHaveBeenCalledWith(false)
    expect(consoleErrorSpy).toHaveBeenCalled()
    consoleErrorSpy.mockRestore()
  })

  it('should toggle loading even when getLinkedRoutingSlips fails', async () => {
    mockGetLinkedRoutingSlips.mockImplementation(() => Promise.reject(new Error('API Error')))
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const composable = useViewRoutingSlip({ slipId: '123456789' })
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    expect(mockToggleLoading).toHaveBeenCalledWith(true)
    expect(mockToggleLoading).toHaveBeenCalledWith(false)
    expect(consoleErrorSpy).toHaveBeenCalled()
    consoleErrorSpy.mockRestore()
  })

  it('should watch for slipId changes and call getRoutingSlipAndLinkedRoutingSlips', async () => {
    const props = reactive({ slipId: '123456789' })
    const composable = useViewRoutingSlip(props)
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 200))

    vi.clearAllMocks()

    // Change slipId through props
    props.slipId = '987654321'
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 200))

    expect(mockGetRoutingSlip).toHaveBeenCalledWith({ routingSlipNumber: '987654321' })
  })

  it('should not call getRoutingSlipAndLinkedRoutingSlips when slipId changes to the same value', async () => {
    const composable = useViewRoutingSlip({ slipId: '123456789' })
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    vi.clearAllMocks()

    // Set to same value
    composable.slipId.value = '123456789'
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    expect(mockGetRoutingSlip).not.toHaveBeenCalled()
  })

  it('should not call getRoutingSlipAndLinkedRoutingSlips when slipId is empty', async () => {
    const composable = useViewRoutingSlip({ slipId: '' })
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    expect(mockGetRoutingSlip).not.toHaveBeenCalled()
  })

  it('should handle error and log to console', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockGetRoutingSlip.mockImplementation(() => Promise.reject(new Error('Test Error')))

    const composable = useViewRoutingSlip({ slipId: '123456789' })
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error getting routing slip and linked routing slips:',
      expect.any(Error)
    )
    consoleErrorSpy.mockRestore()
  })

  it('should use updated routingSlip number from store after getRoutingSlip', async () => {
    mockGetRoutingSlip.mockImplementation(() => {
      mockStore.routingSlip.number = '999999999'
      return Promise.resolve({})
    })

    const composable = useViewRoutingSlip({ slipId: '123456789' })
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    expect(mockGetLinkedRoutingSlips).toHaveBeenCalledWith('999999999')
  })

  it('should call getRoutingSlipAndLinkedRoutingSlips manually', async () => {
    const composable = useViewRoutingSlip({ slipId: '123456789' })
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    vi.clearAllMocks()

    await composable.getRoutingSlipAndLinkedRoutingSlips()

    expect(mockGetRoutingSlip).toHaveBeenCalledWith({ routingSlipNumber: '123456789' })
    expect(mockGetLinkedRoutingSlips).toHaveBeenCalledWith('123456789')
  })
})
