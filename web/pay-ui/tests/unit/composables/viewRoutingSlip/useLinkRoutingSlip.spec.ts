import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import useLinkRoutingSlip from '~/composables/viewRoutingSlip/useLinkRoutingSlip'
import { createPinia, setActivePinia } from 'pinia'

const mockInvoiceCount = ref(0)
const mockIsRoutingSlipAChild = ref(false)
const mockIsRoutingSlipLinked = ref(false)
const mockIsRoutingSlipVoid = ref(false)
const mockUseRoutingSlip = {
  invoiceCount: mockInvoiceCount,
  isRoutingSlipAChild: mockIsRoutingSlipAChild,
  isRoutingSlipLinked: mockIsRoutingSlipLinked,
  isRoutingSlipVoid: mockIsRoutingSlipVoid
}

const mockStore = reactive({
  routingSlip: {
    number: '123456789',
    status: 'ACTIVE'
  },
  linkedRoutingSlips: undefined as any
})

mockNuxtImport('useRoutingSlip', () => () => mockUseRoutingSlip)
mockNuxtImport('useRoutingSlipStore', () => () => ({
  store: mockStore
}))

describe('useLinkRoutingSlip', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockInvoiceCount.value = 0
    mockIsRoutingSlipAChild.value = false
    mockIsRoutingSlipLinked.value = false
    mockIsRoutingSlipVoid.value = false
    mockStore.routingSlip = {
      number: '123456789',
      status: 'ACTIVE'
    }
    mockStore.linkedRoutingSlips = undefined
  })

  it('should be defined', () => {
    const composable = useLinkRoutingSlip()
    expect(composable).toBeDefined()
  })

  it('should return all expected properties', () => {
    const composable = useLinkRoutingSlip()
    expect(composable.showSearch).toBeDefined()
    expect(composable.isLoading).toBeDefined()
    expect(composable.childRoutingSlipDetails).toBeDefined()
    expect(composable.parentRoutingSlipDetails).toBeDefined()
    expect(composable.routingSlip).toBeDefined()
    expect(composable.linkedRoutingSlips).toBeDefined()
    expect(composable.toggleSearch).toBeDefined()
    expect(composable.isRoutingSlipLinked).toBeDefined()
    expect(composable.isRoutingSlipAChild).toBeDefined()
    expect(composable.isRoutingSlipVoid).toBeDefined()
    expect(composable.invoiceCount).toBeDefined()
  })

  it('should initialize with default values', () => {
    const composable = useLinkRoutingSlip()
    expect(composable.showSearch.value).toBe(false)
    expect(composable.isLoading.value).toBe(false)
  })

  it('should toggle showSearch when toggleSearch is called', () => {
    const composable = useLinkRoutingSlip()
    expect(composable.showSearch.value).toBe(false)

    composable.toggleSearch()
    expect(composable.showSearch.value).toBe(true)

    composable.toggleSearch()
    expect(composable.showSearch.value).toBe(false)
  })

  it('should return childRoutingSlipDetails from store', () => {
    const children = [
      { number: '111', status: 'ACTIVE' },
      { number: '222', status: 'COMPLETED' }
    ]
    mockStore.linkedRoutingSlips = {
      children,
      parent: undefined
    }

    const composable = useLinkRoutingSlip()
    expect(composable.childRoutingSlipDetails.value).toEqual(children)
  })

  it('should return empty array when linkedRoutingSlips is undefined', () => {
    const composable = useLinkRoutingSlip()
    mockStore.linkedRoutingSlips = undefined

    expect(composable.childRoutingSlipDetails.value).toEqual([])
  })

  it('should return empty array when children is undefined', () => {
    const composable = useLinkRoutingSlip()
    mockStore.linkedRoutingSlips = {
      children: undefined,
      parent: undefined
    }

    expect(composable.childRoutingSlipDetails.value).toEqual([])
  })

  it('should return parentRoutingSlipDetails from store', () => {
    const parent = { number: '999', status: 'ACTIVE' }
    mockStore.linkedRoutingSlips = {
      children: [],
      parent
    }

    const composable = useLinkRoutingSlip()
    expect(composable.parentRoutingSlipDetails.value).toEqual(parent)
  })

  it('should return empty object when parent is undefined', () => {
    const composable = useLinkRoutingSlip()
    mockStore.linkedRoutingSlips = {
      children: [],
      parent: undefined
    }

    expect(composable.parentRoutingSlipDetails.value).toEqual({})
  })

  it('should return empty object when linkedRoutingSlips is undefined', () => {
    const composable = useLinkRoutingSlip()
    mockStore.linkedRoutingSlips = undefined

    expect(composable.parentRoutingSlipDetails.value).toEqual({})
  })

  it('should return routingSlip from store', () => {
    const composable = useLinkRoutingSlip()
    expect(composable.routingSlip.value).toEqual(mockStore.routingSlip)
  })

  it('should return linkedRoutingSlips from store', () => {
    const linkedSlips = {
      children: [],
      parent: { number: '999' }
    }
    mockStore.linkedRoutingSlips = linkedSlips

    const composable = useLinkRoutingSlip()
    expect(composable.linkedRoutingSlips.value).toEqual(linkedSlips)
  })

  it('should return isRoutingSlipLinked from useRoutingSlip', () => {
    const composable = useLinkRoutingSlip()
    mockIsRoutingSlipLinked.value = true
    expect(composable.isRoutingSlipLinked.value).toBe(true)

    mockIsRoutingSlipLinked.value = false
    expect(composable.isRoutingSlipLinked.value).toBe(false)
  })

  it('should return isRoutingSlipAChild from useRoutingSlip', () => {
    const composable = useLinkRoutingSlip()
    mockIsRoutingSlipAChild.value = true
    expect(composable.isRoutingSlipAChild.value).toBe(true)

    mockIsRoutingSlipAChild.value = false
    expect(composable.isRoutingSlipAChild.value).toBe(false)
  })

  it('should return isRoutingSlipVoid from useRoutingSlip', () => {
    const composable = useLinkRoutingSlip()
    mockIsRoutingSlipVoid.value = true
    expect(composable.isRoutingSlipVoid.value).toBe(true)

    mockIsRoutingSlipVoid.value = false
    expect(composable.isRoutingSlipVoid.value).toBe(false)
  })

  it('should return invoiceCount from useRoutingSlip', () => {
    const composable = useLinkRoutingSlip()
    mockInvoiceCount.value = 5
    expect(composable.invoiceCount.value).toBe(5)

    mockInvoiceCount.value = 0
    expect(composable.invoiceCount.value).toBe(0)
  })

  it('should update childRoutingSlipDetails reactively when store changes', () => {
    const composable = useLinkRoutingSlip()
    expect(composable.childRoutingSlipDetails.value).toEqual([])

    const newChildren = [{ number: '333', status: 'ACTIVE' }]
    mockStore.linkedRoutingSlips = {
      children: newChildren,
      parent: undefined
    }

    expect(composable.childRoutingSlipDetails.value).toEqual(newChildren)
  })

  it('should update parentRoutingSlipDetails reactively when store changes', async () => {
    const composable = useLinkRoutingSlip()
    expect(composable.parentRoutingSlipDetails.value).toEqual({})

    const newParent = { number: '888', status: 'COMPLETED' }
    mockStore.linkedRoutingSlips = {
      children: [],
      parent: newParent
    }
    await nextTick()

    // Computed properties should reflect the store change
    expect(composable.parentRoutingSlipDetails.value).toEqual(newParent)
    expect(composable.parentRoutingSlipDetails.value.number).toBe('888')
  })

  it('should return routingSlip from store as computed', async () => {
    const composable = useLinkRoutingSlip()
    expect(composable.routingSlip.value).toBeDefined()
    expect(composable.routingSlip.value.number).toBe('123456789')

    // Update store property directly
    mockStore.routingSlip.number = '999999999'
    await nextTick()
    expect(composable.routingSlip.value.number).toBe('999999999')
  })

  it('should maintain separate state for showSearch and isLoading', () => {
    const composable = useLinkRoutingSlip()
    composable.showSearch.value = true
    composable.isLoading.value = true

    expect(composable.showSearch.value).toBe(true)
    expect(composable.isLoading.value).toBe(true)

    composable.isLoading.value = false
    expect(composable.showSearch.value).toBe(true) // Unchanged
    expect(composable.isLoading.value).toBe(false)
  })
})
