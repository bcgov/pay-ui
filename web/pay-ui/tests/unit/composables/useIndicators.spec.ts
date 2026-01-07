import { useIndicators } from '~/composables/useIndicators'

describe('useIndicators', () => {
  beforeEach(() => {
    const { activeCalls, hasCallFailed } = useIndicators()
    activeCalls.value = 0
    hasCallFailed.value = false
  })

  it('should be defined, return all expected properties, and initialize with default values', () => {
    const composable = useIndicators()
    expect(composable).toBeDefined()
    const { hasCallFailed, activeCalls, isThereActiveCalls } = composable
    expect(hasCallFailed).toBeDefined()
    expect(activeCalls).toBeDefined()
    expect(isThereActiveCalls).toBeDefined()
    expect(hasCallFailed.value).toBe(false)
    expect(activeCalls.value).toBe(0)
    expect(isThereActiveCalls.value).toBe(false)
  })

  it('should update isThereActiveCalls based on activeCalls value and allow hasCallFailed to be set', () => {
    const { activeCalls, isThereActiveCalls, hasCallFailed } = useIndicators()

    activeCalls.value = 0
    expect(isThereActiveCalls.value).toBe(false)

    activeCalls.value = 1
    expect(isThereActiveCalls.value).toBe(true)

    activeCalls.value = 5
    expect(isThereActiveCalls.value).toBe(true)

    activeCalls.value = 0
    expect(isThereActiveCalls.value).toBe(false)

    hasCallFailed.value = true
    expect(hasCallFailed.value).toBe(true)

    hasCallFailed.value = false
    expect(hasCallFailed.value).toBe(false)
  })

  it('should share state across multiple instances', () => {
    const instance1 = useIndicators()
    const instance2 = useIndicators()

    instance1.activeCalls.value = 3
    expect(instance2.activeCalls.value).toBe(3)
    expect(instance2.isThereActiveCalls.value).toBe(true)
  })
})
