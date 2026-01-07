import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import useLinkRoutingSlip from '~/composables/viewRoutingSlip/useLinkRoutingSlip'
import { createPinia, setActivePinia } from 'pinia'
import type { LinkedRoutingSlips } from '~/interfaces/routing-slip'

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
  linkedRoutingSlips: undefined as unknown as LinkedRoutingSlips | undefined
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

  it('should be defined, return all expected properties, initialize with defaults, and toggle search', () => {
    const composable = useLinkRoutingSlip()
    expect(composable).toBeDefined()
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
    expect(composable.showSearch.value).toBe(false)
    expect(composable.isLoading.value).toBe(false)

    composable.toggleSearch()
    expect(composable.showSearch.value).toBe(true)
    composable.toggleSearch()
    expect(composable.showSearch.value).toBe(false)
  })

  it('should return childRoutingSlipDetails, parentRoutingSlipDetails, routingSlip, '
    + 'linkedRoutingSlips, and routing slip flags with various store states', () => {
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

    mockStore.linkedRoutingSlips = undefined
    expect(composable.childRoutingSlipDetails.value).toEqual([])

    mockStore.linkedRoutingSlips = {
      children: undefined,
      parent: undefined
    }
    expect(composable.childRoutingSlipDetails.value).toEqual([])

    const parent = { number: '999', status: 'ACTIVE' }
    mockStore.linkedRoutingSlips = {
      children: [],
      parent
    }
    expect(composable.parentRoutingSlipDetails.value).toEqual(parent)

    mockStore.linkedRoutingSlips = {
      children: [],
      parent: undefined
    }
    expect(composable.parentRoutingSlipDetails.value).toEqual({})

    mockStore.linkedRoutingSlips = undefined
    expect(composable.parentRoutingSlipDetails.value).toEqual({})

    expect(composable.routingSlip.value).toEqual(mockStore.routingSlip)

    const linkedSlips = {
      children: [],
      parent: { number: '999' }
    }
    mockStore.linkedRoutingSlips = linkedSlips
    expect(composable.linkedRoutingSlips.value).toEqual(linkedSlips)

    mockIsRoutingSlipLinked.value = true
    expect(composable.isRoutingSlipLinked.value).toBe(true)
    mockIsRoutingSlipLinked.value = false
    expect(composable.isRoutingSlipLinked.value).toBe(false)

    mockIsRoutingSlipAChild.value = true
    expect(composable.isRoutingSlipAChild.value).toBe(true)
    mockIsRoutingSlipAChild.value = false
    expect(composable.isRoutingSlipAChild.value).toBe(false)

    mockIsRoutingSlipVoid.value = true
    expect(composable.isRoutingSlipVoid.value).toBe(true)
    mockIsRoutingSlipVoid.value = false
    expect(composable.isRoutingSlipVoid.value).toBe(false)

    mockInvoiceCount.value = 5
    expect(composable.invoiceCount.value).toBe(5)
    mockInvoiceCount.value = 0
    expect(composable.invoiceCount.value).toBe(0)
  })

  it('should update reactively when store changes and maintain separate state', async () => {
    const composable = useLinkRoutingSlip()
    expect(composable.childRoutingSlipDetails.value).toEqual([])

    const newChildren = [{ number: '333', status: 'ACTIVE' }]
    mockStore.linkedRoutingSlips = {
      children: newChildren,
      parent: undefined
    }
    expect(composable.childRoutingSlipDetails.value).toEqual(newChildren)

    expect(composable.parentRoutingSlipDetails.value).toEqual({})
    const newParent = { number: '888', status: 'COMPLETED' }
    mockStore.linkedRoutingSlips = {
      children: [],
      parent: newParent
    }
    await nextTick()
    expect(composable.parentRoutingSlipDetails.value).toEqual(newParent)
    expect(composable.parentRoutingSlipDetails.value.number).toBe('888')

    expect(composable.routingSlip.value.number).toBe('123456789')
    mockStore.routingSlip.number = '999999999'
    await nextTick()
    expect(composable.routingSlip.value.number).toBe('999999999')

    composable.showSearch.value = true
    composable.isLoading.value = true
    expect(composable.showSearch.value).toBe(true)
    expect(composable.isLoading.value).toBe(true)
    composable.isLoading.value = false
    expect(composable.showSearch.value).toBe(true)
    expect(composable.isLoading.value).toBe(false)
  })
})
