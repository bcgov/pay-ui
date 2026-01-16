import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useStatusList, useRoutingSlipStatusList, useChequeRefundStatusList } from '~/composables/common/useStatusList'
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

describe('useRoutingSlipStatusList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetCodes.mockImplementation(() => Promise.resolve([
      { code: 'ACTIVE', description: 'Active' },
      { code: 'COMPLETED', description: 'Completed' }
    ]))
  })

  it('should be defined and return all expected properties', async () => {
    const composable = await useRoutingSlipStatusList()
    expect(composable).toBeDefined()
    expect(composable.list).toBeDefined()
    expect(composable.mapFn).toBeDefined()
    expect(composable.load).toBeDefined()
  })

  it('should return correct items with mapFn', async () => {
    const composable = await useRoutingSlipStatusList()
    await nextTick()

    expect(composable.list.value.length).toBeGreaterThan(0)

    const mapped = composable.mapFn(composable.list.value[0])
    expect(mapped).toHaveProperty('label')
    expect(mapped).toHaveProperty('value')
    expect(mapped.label).toBe('Active')
    expect(mapped.value).toBe('ACTIVE')
  })

  it('should load status list on initialization', async () => {
    vi.clearAllMocks()
    await useRoutingSlipStatusList()
    expect(mockGetCodes).toHaveBeenCalledWith('routing_slip_statuses')
  })
})

describe('useChequeRefundStatusList', () => {
  it('should be defined and return all expected properties', () => {
    const composable = useChequeRefundStatusList()
    expect(composable).toBeDefined()
    expect(composable.list).toBeDefined()
    expect(composable.mapFn).toBeDefined()
  })

  it('should return correct items with mapFn', () => {
    const composable = useChequeRefundStatusList()
    expect(composable.list.value.length).toBeGreaterThan(0)

    const firstItem = composable.list.value[0]
    const mapped = composable.mapFn(firstItem)
    expect(mapped).toHaveProperty('label')
    expect(mapped).toHaveProperty('value')
    expect(mapped.label).toBe(firstItem.text)
    expect(mapped.value).toBe(firstItem.code)
  })
})
