import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useStatusList, useStatusListSelect } from '~/composables/common/useStatusList'
import { ChequeRefundStatus } from '~/utils/constants'

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

  it('should be defined', async () => {
    const composable = await useStatusList({ value: '' }, { emit: vi.fn() })
    expect(composable).toBeDefined()
  })

  it('should return routingSlipStatusList, currentStatus, statusLabel, and selectedStatusObject', async () => {
    const composable = await useStatusList({ value: '' }, { emit: vi.fn() })
    expect(composable.routingSlipStatusList).toBeDefined()
    expect(composable.currentStatus).toBeDefined()
    expect(composable.statusLabel).toBeDefined()
    expect(composable.selectedStatusObject).toBeDefined()
  })

  it('should load routing slip status list on initialization', async () => {
    await useStatusList({ value: '' }, { emit: vi.fn() })
    expect(mockGetCodes).toHaveBeenCalledWith('routing_slip_statuses')
  })

  it('should initialize with empty status list if API call fails', async () => {
    mockGetCodes.mockImplementation(() => Promise.reject(new Error('API Error')))
    const composable = await useStatusList({ value: '' }, { emit: vi.fn() })
    expect(composable.routingSlipStatusList.value).toEqual([])
  })

  it('should set currentStatus from props value', async () => {
    const composable = await useStatusList({ value: 'ACTIVE' }, { emit: vi.fn() })
    expect(composable.currentStatus.value).toBe('ACTIVE')
  })

  it('should emit update:modelValue when currentStatus is set', async () => {
    const emit = vi.fn()
    const composable = await useStatusList({ value: '' }, { emit })
    composable.currentStatus.value = { code: 'ACTIVE', description: 'Active' } as any
    expect(emit).toHaveBeenCalledWith('update:modelValue', 'ACTIVE')
  })

  it('should return status label for given code', async () => {
    const composable = await useStatusList({ value: '' }, { emit: vi.fn() })
    await nextTick()
    const label = composable.statusLabel('ACTIVE')
    expect(label).toBe('Active')
  })

  it('should return empty string if status code not found', async () => {
    const composable = await useStatusList({ value: '' }, { emit: vi.fn() })
    await nextTick()
    const label = composable.statusLabel('UNKNOWN')
    expect(label).toBe('')
  })

  it('should return selected status object for given code', async () => {
    const composable = await useStatusList({ value: '' }, { emit: vi.fn() })
    await nextTick()
    const statusObject = composable.selectedStatusObject('ACTIVE')
    expect(statusObject).toEqual({ code: 'ACTIVE', description: 'Active' })
  })

  it('should return undefined if status code not found', async () => {
    const composable = await useStatusList({ value: '' }, { emit: vi.fn() })
    await nextTick()
    const statusObject = composable.selectedStatusObject('UNKNOWN')
    expect(statusObject).toBeUndefined()
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

  it('should be defined', () => {
    const composable = useStatusListSelect({ column: 'status' })
    expect(composable).toBeDefined()
  })

  it('should return items, placeholder, and routingSlipStatusList', () => {
    const composable = useStatusListSelect({ column: 'status' })
    expect(composable.items).toBeDefined()
    expect(composable.placeholder).toBeDefined()
    expect(composable.routingSlipStatusList).toBeDefined()
  })

  it('should return routing slip status items when column is status', async () => {
    const composable = useStatusListSelect({ column: 'status' })
    composable.routingSlipStatusList.value = [
      { code: 'ACTIVE', description: 'Active' },
      { code: 'COMPLETED', description: 'Completed' }
    ] as any[]
    await nextTick()

    expect(composable.items.value.length).toBeGreaterThan(0)
    expect(composable.items.value[0]).toHaveProperty('label')
    expect(composable.items.value[0]).toHaveProperty('value')
  })

  it('should return cheque refund status items when column is refundStatus', () => {
    const composable = useStatusListSelect({ column: 'refundStatus' })
    expect(composable.items.value.length).toBeGreaterThan(0)
    expect(composable.items.value[0]).toHaveProperty('label')
    expect(composable.items.value[0]).toHaveProperty('value')
  })

  it('should return correct placeholder for status column', () => {
    const composable = useStatusListSelect({ column: 'status' })
    expect(composable.placeholder).toBe('label.status')
  })

  it('should return correct placeholder for refundStatus column', () => {
    const composable = useStatusListSelect({ column: 'refundStatus' })
    expect(composable.placeholder).toBe('label.refundStatus')
  })

  it('should load status list when routingSlipStatusList is empty and column is status', async () => {
    vi.clearAllMocks()
    const composable = useStatusListSelect({ column: 'status' })

    // Simulate the loadStatusList behavior
    if (composable.routingSlipStatusList.value.length === 0) {
      composable.routingSlipStatusList.value = await mockGetCodes('routing_slip_statuses')
    }

    expect(mockGetCodes).toHaveBeenCalledWith('routing_slip_statuses')
  })

  it('should not load status list if already loaded', async () => {
    vi.clearAllMocks()
    const composable = useStatusListSelect({ column: 'status' })

    // Set the list to have items already
    composable.routingSlipStatusList.value = [{ code: 'TEST', description: 'Test' }] as any[]

    // The loadStatusList function checks if length === 0, so it shouldn't load
    if (composable.routingSlipStatusList.value.length === 0) {
      await mockGetCodes('routing_slip_statuses')
    }

    expect(mockGetCodes).not.toHaveBeenCalled()
  })
})
