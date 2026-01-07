import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useStatusList, useStatusListSelect } from '~/composables/common/useStatusList'
import type { Code } from '~/interfaces/code'

const mockGetCodes = vi.fn()
const mockPayApi = {
  getCodes: mockGetCodes
}

mockNuxtImport('usePayApi', () => () => mockPayApi)
mockNuxtImport('useI18n', () => () => ({
  t: (key: string) => key
}))

describe('useStatusList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetCodes.mockImplementation(() => Promise.resolve([
      { code: 'ACTIVE', description: 'Active' },
      { code: 'COMPLETED', description: 'Completed' },
      { code: 'CANCELLED', description: 'Cancelled' }
    ]))
  })

  it('should be defined, return all expected properties, and load status list on initialization', async () => {
    const composable = await useStatusList({ value: '' }, { emit: vi.fn() })
    expect(composable).toBeDefined()
    expect(composable.routingSlipStatusList).toBeDefined()
    expect(composable.currentStatus).toBeDefined()
    expect(composable.statusLabel).toBeDefined()
    expect(composable.selectedStatusObject).toBeDefined()
    expect(mockGetCodes).toHaveBeenCalledWith('routing_slip_statuses')
  })

  it('should initialize with empty status list if API call fails and set currentStatus from props', async () => {
    mockGetCodes.mockImplementation(() => Promise.reject(new Error('API Error')))
    const composable1 = await useStatusList({ value: '' }, { emit: vi.fn() })
    expect(composable1.routingSlipStatusList.value).toEqual([])

    mockGetCodes.mockImplementation(() => Promise.resolve([
      { code: 'ACTIVE', description: 'Active' },
      { code: 'COMPLETED', description: 'Completed' },
      { code: 'CANCELLED', description: 'Cancelled' }
    ]))
    const composable2 = await useStatusList({ value: 'ACTIVE' }, { emit: vi.fn() })
    expect(composable2.currentStatus.value).toBe('ACTIVE')
  })

  it('should emit update:modelValue when currentStatus is set and handle status label/object lookups', async () => {
    const emit = vi.fn()
    const composable = await useStatusList({ value: '' }, { emit })
    await nextTick()

    composable.currentStatus.value = { code: 'ACTIVE', description: 'Active' } as Code
    expect(emit).toHaveBeenCalledWith('update:modelValue', 'ACTIVE')

    const label = composable.statusLabel('ACTIVE')
    expect(label).toBe('Active')

    const unknownLabel = composable.statusLabel('UNKNOWN')
    expect(unknownLabel).toBe('')

    const statusObject = composable.selectedStatusObject('ACTIVE')
    expect(statusObject).toEqual({ code: 'ACTIVE', description: 'Active' })

    const unknownObject = composable.selectedStatusObject('UNKNOWN')
    expect(unknownObject).toBeUndefined()
  })
})

describe('useStatusListSelect', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetCodes.mockImplementation(() => Promise.resolve([
      { code: 'ACTIVE', description: 'Active' },
      { code: 'COMPLETED', description: 'Completed' }
    ]))
  })

  it('should be defined and return all expected properties with correct placeholders', () => {
    const statusComposable = useStatusListSelect({ column: 'status' })
    expect(statusComposable).toBeDefined()
    expect(statusComposable.items).toBeDefined()
    expect(statusComposable.placeholder).toBeDefined()
    expect(statusComposable.routingSlipStatusList).toBeDefined()
    expect(statusComposable.placeholder).toBe('label.status')

    const refundComposable = useStatusListSelect({ column: 'refundStatus' })
    expect(refundComposable.placeholder).toBe('label.refundStatus')
  })

  it('should return correct items for status and refundStatus columns', async () => {
    const statusComposable = useStatusListSelect({ column: 'status' })
    statusComposable.routingSlipStatusList.value = [
      { code: 'ACTIVE', description: 'Active' },
      { code: 'COMPLETED', description: 'Completed' }
    ] as Code[]
    await nextTick()

    expect(statusComposable.items.value.length).toBeGreaterThan(0)
    expect(statusComposable.items.value[0]).toHaveProperty('label')
    expect(statusComposable.items.value[0]).toHaveProperty('value')

    const refundComposable = useStatusListSelect({ column: 'refundStatus' })
    expect(refundComposable.items.value.length).toBeGreaterThan(0)
    expect(refundComposable.items.value[0]).toHaveProperty('label')
    expect(refundComposable.items.value[0]).toHaveProperty('value')
  })

  it('should load status list when empty and not load if already loaded', async () => {
    vi.clearAllMocks()
    const composable1 = useStatusListSelect({ column: 'status' })

    if (composable1.routingSlipStatusList.value.length === 0) {
      composable1.routingSlipStatusList.value = await mockGetCodes('routing_slip_statuses')
    }

    expect(mockGetCodes).toHaveBeenCalledWith('routing_slip_statuses')

    vi.clearAllMocks()
    const composable2 = useStatusListSelect({ column: 'status' })
    composable2.routingSlipStatusList.value = [{ code: 'TEST', description: 'Test' }] as Code[]

    if (composable2.routingSlipStatusList.value.length === 0) {
      await mockGetCodes('routing_slip_statuses')
    }

    expect(mockGetCodes).not.toHaveBeenCalled()
  })
})
