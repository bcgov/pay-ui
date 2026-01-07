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

  it('should be defined and return all expected properties', () => {
    const composable = useLoader()
    expect(composable).toBeDefined()
    const { isLoading, isThereActiveCalls, toggleLoading } = composable
    expect(isLoading).toBeDefined()
    expect(isThereActiveCalls).toBeDefined()
    expect(toggleLoading).toBeDefined()
  })

  it('should initialize isLoading as false and handle toggleLoading correctly', () => {
    const { isLoading, toggleLoading } = useLoader()
    expect(isLoading.value).toBe(false)

    toggleLoading(true)
    expect(isLoading.value).toBe(true)

    toggleLoading(false)
    expect(isLoading.value).toBe(false)
  })

  it('should return isThereActiveCalls from useIndicators and update isLoading independently', () => {
    mockIsThereActiveCalls.value = true
    const { isLoading, isThereActiveCalls, toggleLoading } = useLoader()
    expect(isThereActiveCalls.value).toBe(true)

    mockIsThereActiveCalls.value = false
    toggleLoading(true)
    expect(isLoading.value).toBe(true)
    expect(isThereActiveCalls.value).toBe(false)
  })
})
