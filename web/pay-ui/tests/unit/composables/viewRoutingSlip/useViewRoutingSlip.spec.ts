import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import useViewRoutingSlip from '~/composables/viewRoutingSlip/useViewRoutingSlip'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick, reactive, ref } from 'vue'

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

  it('should be defined, return expected properties, call APIs correctly, handle loading, and errors', async () => {
    const composable = useViewRoutingSlip({ slipId: '123456789' })
    expect(composable).toBeDefined()
    expect(composable.slipId).toBeDefined()
    expect(composable.getRoutingSlipAndLinkedRoutingSlips).toBeDefined()
    expect(typeof composable.getRoutingSlipAndLinkedRoutingSlips).toBe('function')
    expect(composable.slipId.value).toBe('123456789')

    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))
    expect(mockGetRoutingSlip).toHaveBeenCalledWith({ routingSlipNumber: '123456789' })
    expect(mockGetLinkedRoutingSlips).toHaveBeenCalledWith('123456789')
    expect(mockToggleLoading).toHaveBeenCalledWith(true)
    expect(mockToggleLoading).toHaveBeenCalledWith(false)

    vi.clearAllMocks()
    await composable.getRoutingSlipAndLinkedRoutingSlips()
    expect(mockGetRoutingSlip).toHaveBeenCalledWith({ routingSlipNumber: '123456789' })

    mockStore.routingSlip.number = undefined as unknown as string
    vi.clearAllMocks()
    await useViewRoutingSlip({ slipId: '123456789' })
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))
    expect(mockGetRoutingSlip).toHaveBeenCalled()
    expect(mockGetLinkedRoutingSlips).not.toHaveBeenCalled()
    mockStore.routingSlip.number = '123456789'

    mockGetRoutingSlip.mockImplementation(() => Promise.reject(new Error('API Error')))
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.clearAllMocks()
    await useViewRoutingSlip({ slipId: '123456789' })
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))
    expect(mockToggleLoading).toHaveBeenCalledWith(true)
    expect(mockToggleLoading).toHaveBeenCalledWith(false)
    expect(consoleErrorSpy).toHaveBeenCalled()
    consoleErrorSpy.mockRestore()

    mockGetRoutingSlip.mockImplementation(() => Promise.resolve({}))
    mockGetLinkedRoutingSlips.mockImplementation(() => Promise.reject(new Error('API Error')))
    const consoleErrorSpy2 = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.clearAllMocks()
    await useViewRoutingSlip({ slipId: '123456789' })
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))
    expect(mockToggleLoading).toHaveBeenCalledWith(true)
    expect(mockToggleLoading).toHaveBeenCalledWith(false)
    expect(consoleErrorSpy2).toHaveBeenCalled()
    consoleErrorSpy2.mockRestore()
  })

  it('should watch slipId changes, handle empty values, errors, and use updated store values', async () => {
    const props = reactive({ slipId: '123456789' })
    await useViewRoutingSlip(props)
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 200))

    vi.clearAllMocks()
    props.slipId = '987654321'
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 200))
    expect(mockGetRoutingSlip).toHaveBeenCalledWith({ routingSlipNumber: '987654321' })

    const composable = useViewRoutingSlip({ slipId: '123456789' })
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))
    vi.clearAllMocks()
    composable.slipId.value = '123456789'
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))
    expect(mockGetRoutingSlip).not.toHaveBeenCalled()

    await useViewRoutingSlip({ slipId: '' })
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))
    expect(mockGetRoutingSlip).not.toHaveBeenCalled()

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockGetRoutingSlip.mockImplementation(() => Promise.reject(new Error('Test Error')))
    await useViewRoutingSlip({ slipId: '123456789' })
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error getting routing slip and linked routing slips:',
      expect.any(Error)
    )
    consoleErrorSpy.mockRestore()

    mockGetRoutingSlip.mockImplementation(() => {
      mockStore.routingSlip.number = '999999999'
      return Promise.resolve({})
    })
    vi.clearAllMocks()
    await useViewRoutingSlip({ slipId: '123456789' })
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

  it('should handle error when getLinkedRoutingSlips fails after successful getRoutingSlip', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockGetRoutingSlip.mockResolvedValue({})
    mockGetLinkedRoutingSlips.mockRejectedValue(new Error('Linked slips error'))

    useViewRoutingSlip({ slipId: '123456789' })
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    expect(mockToggleLoading).toHaveBeenCalledWith(true)
    expect(mockToggleLoading).toHaveBeenCalledWith(false)
    expect(consoleErrorSpy).toHaveBeenCalled()
    consoleErrorSpy.mockRestore()
  })

  it('should handle case when routingSlip number is empty string', async () => {
    mockStore.routingSlip.number = ''
    await useViewRoutingSlip({ slipId: '123456789' })
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    expect(mockGetRoutingSlip).toHaveBeenCalled()
    expect(mockGetLinkedRoutingSlips).not.toHaveBeenCalled()
  })

  it('should handle case when routingSlip number is null', async () => {
    mockStore.routingSlip.number = null as unknown as string
    await useViewRoutingSlip({ slipId: '123456789' })
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    expect(mockGetRoutingSlip).toHaveBeenCalled()
    expect(mockGetLinkedRoutingSlips).not.toHaveBeenCalled()
  })

  it('should handle watch when slipId changes from empty to valid', async () => {
    const props = reactive({ slipId: '' })
    await useViewRoutingSlip(props)
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    vi.clearAllMocks()

    props.slipId = '123456789'
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 200))

    expect(mockGetRoutingSlip).toHaveBeenCalledWith({ routingSlipNumber: '123456789' })
  })

  it('should handle watch when slipId changes from valid to empty', async () => {
    const props = reactive({ slipId: '123456789' })
    await useViewRoutingSlip(props)
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 200))

    vi.clearAllMocks()

    props.slipId = ''
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    expect(mockGetRoutingSlip).not.toHaveBeenCalled()
  })

  it('should handle multiple sequential calls to getRoutingSlipAndLinkedRoutingSlips', async () => {
    const composable = useViewRoutingSlip({ slipId: '123456789' })
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    vi.clearAllMocks()

    await composable.getRoutingSlipAndLinkedRoutingSlips()
    await composable.getRoutingSlipAndLinkedRoutingSlips()

    expect(mockGetRoutingSlip).toHaveBeenCalledTimes(2)
    expect(mockGetLinkedRoutingSlips).toHaveBeenCalledTimes(2)
  })
})
