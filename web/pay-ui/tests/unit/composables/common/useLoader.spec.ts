import { useLoader } from '~/composables/common/useLoader'

const mockIsThereActiveCalls = ref(false)
const mockActiveCalls = ref(0)
const mockHasCallFailed = ref(false)

vi.mock('~/composables/useIndicators', () => ({
  useIndicators: () => ({
    isThereActiveCalls: mockIsThereActiveCalls,
    activeCalls: mockActiveCalls,
    hasCallFailed: mockHasCallFailed
  })
}))

describe('useLoader', () => {
  beforeEach(() => {
    mockIsThereActiveCalls.value = false
    mockActiveCalls.value = 0
    mockHasCallFailed.value = false
  })

  it('should be defined', () => {
    const composable = useLoader()
    expect(composable).toBeDefined()
  })

  it('should return isLoading, isThereActiveCalls, and toggleLoading', () => {
    const { isLoading, isThereActiveCalls, toggleLoading } = useLoader()
    expect(isLoading).toBeDefined()
    expect(isThereActiveCalls).toBeDefined()
    expect(toggleLoading).toBeDefined()
  })

  it('should initialize isLoading as false', () => {
    const { isLoading } = useLoader()
    expect(isLoading.value).toBe(false)
  })

  it('should set isLoading to true when toggleLoading is called with true', () => {
    const { isLoading, toggleLoading } = useLoader()
    toggleLoading(true)
    expect(isLoading.value).toBe(true)
  })

  it('should set isLoading to false when toggleLoading is called with false', () => {
    const { isLoading, toggleLoading } = useLoader()
    toggleLoading(true)
    expect(isLoading.value).toBe(true)
    toggleLoading(false)
    expect(isLoading.value).toBe(false)
  })

  it('should return isThereActiveCalls from useIndicators', () => {
    mockIsThereActiveCalls.value = true
    const { isThereActiveCalls } = useLoader()
    expect(isThereActiveCalls.value).toBe(true)
  })

  it('should update isLoading independently of isThereActiveCalls', () => {
    const { isLoading, isThereActiveCalls, toggleLoading } = useLoader()
    mockIsThereActiveCalls.value = false
    toggleLoading(true)
    expect(isLoading.value).toBe(true)
    expect(isThereActiveCalls.value).toBe(false)
  })
})
