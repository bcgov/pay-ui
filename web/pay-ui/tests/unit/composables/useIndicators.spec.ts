import { useIndicators } from '~/composables/useIndicators'

describe('useIndicators', () => {
  beforeEach(() => {
    const { activeCalls, hasCallFailed } = useIndicators()
    activeCalls.value = 0
    hasCallFailed.value = false
  })

  it('should be defined', () => {
    const composable = useIndicators()
    expect(composable).toBeDefined()
  })

  it('should return hasCallFailed, activeCalls, and isThereActiveCalls', () => {
    const { hasCallFailed, activeCalls, isThereActiveCalls } = useIndicators()
    expect(hasCallFailed).toBeDefined()
    expect(activeCalls).toBeDefined()
    expect(isThereActiveCalls).toBeDefined()
  })

  it('should initialize with default values', () => {
    const { hasCallFailed, activeCalls, isThereActiveCalls } = useIndicators()
    expect(hasCallFailed.value).toBe(false)
    expect(activeCalls.value).toBe(0)
    expect(isThereActiveCalls.value).toBe(false)
  })

  it('should return true for isThereActiveCalls when activeCalls is greater than 0', () => {
    const { activeCalls, isThereActiveCalls } = useIndicators()
    activeCalls.value = 1
    expect(isThereActiveCalls.value).toBe(true)
  })

  it('should return false for isThereActiveCalls when activeCalls is 0', () => {
    const { activeCalls, isThereActiveCalls } = useIndicators()
    activeCalls.value = 0
    expect(isThereActiveCalls.value).toBe(false)
  })

  it('should update isThereActiveCalls when activeCalls changes', () => {
    const { activeCalls, isThereActiveCalls } = useIndicators()
    activeCalls.value = 0
    expect(isThereActiveCalls.value).toBe(false)

    activeCalls.value = 5
    expect(isThereActiveCalls.value).toBe(true)

    activeCalls.value = 0
    expect(isThereActiveCalls.value).toBe(false)
  })

  it('should allow hasCallFailed to be set', () => {
    const { hasCallFailed } = useIndicators()
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
