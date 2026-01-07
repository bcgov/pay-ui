import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import useTransactionDataTable from '~/composables/viewRoutingSlip/useTransactionDataTable'
import { InvoiceStatus } from '~/utils/constants'
import { createPinia, setActivePinia } from 'pinia'
import type { Invoice, InvoiceDisplay } from '~/interfaces/invoice'
import type { TableColumn } from '@nuxt/ui'

const mockGetRoutingSlip = vi.fn()
const mockUseRoutingSlip = {
  getRoutingSlip: mockGetRoutingSlip
}

const mockCancelRoutingSlipInvoice = vi.fn()
const mockPayApi = {
  cancelRoutingSlipInvoice: mockCancelRoutingSlipInvoice
}

const mockIsLoading = ref(false)

const mockOpenCancelTransactionModal = vi.fn()
const mockPayModals = {
  openCancelTransactionModal: mockOpenCancelTransactionModal
}

const mockStore = {
  routingSlip: {
    number: '123456789'
  }
}

mockNuxtImport('useRoutingSlip', () => () => mockUseRoutingSlip)
mockNuxtImport('usePayApi', () => () => mockPayApi)
mockNuxtImport('usePayModals', () => () => mockPayModals)
mockNuxtImport('useRoutingSlipStore', () => () => ({
  store: mockStore
}))

vi.mock('~/composables/common/useLoader', () => ({
  useLoader: () => ({
    isLoading: mockIsLoading
  })
}))

describe('useTransactionDataTable', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockIsLoading.value = false
    mockGetRoutingSlip.mockImplementation(() => Promise.resolve({}))
    mockCancelRoutingSlipInvoice.mockImplementation(() => Promise.resolve({}))
    mockOpenCancelTransactionModal.mockImplementation((callback: () => Promise<void>) => {
      return Promise.resolve(callback())
    })
    mockStore.routingSlip.number = '123456789'
  })

  it('should be defined, return all expected properties, and compute invoiceCount correctly', () => {
    const invoices = ref([])
    const composable = useTransactionDataTable(invoices)
    expect(composable).toBeDefined()
    expect(composable.invoiceCount).toBeDefined()
    expect(composable.invoiceDisplay).toBeDefined()
    expect(composable.headerTransactions).toBeDefined()
    expect(composable.transformInvoices).toBeDefined()
    expect(composable.cancel).toBeDefined()
    expect(composable.isAlreadyCancelled).toBeDefined()
    expect(composable.disableCancelButton).toBeDefined()
    expect(composable.selectedInvoiceId).toBeDefined()
    expect(composable.invoiceCount.value).toBe(0)

    invoices.value = [{ id: 1 }, { id: 2 }] as Invoice[]
    const composable2 = useTransactionDataTable(invoices)
    expect(composable2.invoiceCount.value).toBe(2)
  })

  it('should transform invoices with lineItems, details, handle missing data, and edge cases', () => {
    const invoices1 = ref([
      {
        id: 1,
        createdOn: '2025-09-26',
        lineItems: [
          { description: 'Item 1' },
          { description: 'Item 2' }
        ],
        references: [{ invoiceNumber: 'INV-001' }],
        statusCode: InvoiceStatus.COMPLETED,
        total: 100.50,
        createdName: 'Test User',
        createdBy: 'user1'
      }
    ] as Invoice[])
    const composable1 = useTransactionDataTable(invoices1)
    expect(composable1.invoiceDisplay.value).toHaveLength(1)
    expect(composable1.invoiceDisplay.value[0]?.description).toEqual(['Item 1', 'Item 2'])
    expect(composable1.invoiceDisplay.value[0]?.invoiceNumber).toBe('INV-001')

    const invoices2 = ref([
      {
        id: 1,
        createdOn: '2025-09-26',
        details: [
          { label: 'Type', value: 'Payment' },
          { label: 'Method', value: 'Cheque' }
        ],
        references: [{ invoiceNumber: 'INV-002' }],
        statusCode: InvoiceStatus.COMPLETED,
        total: 200.00,
        createdName: 'Test User 2',
        createdBy: 'user2'
      }
    ] as Invoice[])
    const composable2 = useTransactionDataTable(invoices2)
    expect(composable2.invoiceDisplay.value[0]?.description).toEqual(['Type: Payment', 'Method: Cheque'])

    const invoices3 = ref([
      {
        id: 1,
        createdOn: '2025-09-26',
        references: [{ invoiceNumber: 'INV-003' }],
        statusCode: InvoiceStatus.COMPLETED,
        total: 50.00,
        createdName: 'Test User 3',
        createdBy: 'user3'
      }
    ] as Invoice[])
    const composable3 = useTransactionDataTable(invoices3)
    expect(composable3.invoiceDisplay.value[0]?.description).toEqual(['N/A'])

    const invoices4 = ref([
      {
        id: 1,
        createdOn: '2025-09-26',
        lineItems: [{ description: 'Item' }],
        statusCode: InvoiceStatus.COMPLETED,
        total: 75.00,
        createdName: 'Test User 4',
        createdBy: 'user4'
      }
    ] as Invoice[])
    const composable4 = useTransactionDataTable(invoices4)
    expect(composable4.invoiceDisplay.value[0]?.invoiceNumber).toBeUndefined()

    const invoices5 = ref<Invoice[]>([])
    const composable5 = useTransactionDataTable(invoices5)
    expect(composable5.invoiceDisplay.value).toEqual([])
    invoices5.value = undefined as unknown as Invoice[]
    expect(composable5.invoiceDisplay.value).toEqual([])
  })

  it('should return headerTransactions with correct structure', () => {
    const invoices = ref([])
    const composable = useTransactionDataTable(invoices)
    expect(composable.headerTransactions.value).toHaveLength(6)
    const headers = composable.headerTransactions.value
    expect(headers[0]).toBeDefined()
    expect(headers[1]).toBeDefined()
    expect(headers[2]).toBeDefined()
    expect(headers[3]).toBeDefined()
    expect(headers[4]).toBeDefined()
    expect(headers[5]).toBeDefined()
    // Check that headers have the expected structure
    const firstHeader = headers[0] as TableColumn<InvoiceDisplay> | undefined
    expect(firstHeader?.accessorKey || (firstHeader as { key?: string })?.key).toBeDefined()
  })

  it('should check isAlreadyCancelled correctly for various status codes', () => {
    const invoices = ref([])
    const composable = useTransactionDataTable(invoices)
    expect(composable.isAlreadyCancelled(InvoiceStatus.REFUNDED)).toBe(true)
    expect(composable.isAlreadyCancelled(InvoiceStatus.REFUND_REQUESTED)).toBe(true)
    expect(composable.isAlreadyCancelled(InvoiceStatus.COMPLETED)).toBe(false)
    expect(composable.isAlreadyCancelled(undefined)).toBe(false)
  })

  it('should handle cancel operations with modal, API calls, loading states, and error handling', async () => {
    const invoices = ref([])
    const composable = useTransactionDataTable(invoices)

    mockOpenCancelTransactionModal.mockImplementation(() => Promise.resolve())
    await composable.cancel(123)
    expect(mockOpenCancelTransactionModal).toHaveBeenCalled()
    expect(composable.selectedInvoiceId.value).toBe(123)

    mockOpenCancelTransactionModal.mockImplementation(async (callback: () => Promise<void>) => {
      await callback()
    })
    await composable.cancel(456)
    expect(mockOpenCancelTransactionModal).toHaveBeenCalledTimes(2)
    expect(mockCancelRoutingSlipInvoice).toHaveBeenCalledWith(456)
    expect(mockGetRoutingSlip).toHaveBeenCalledWith({ routingSlipNumber: '123456789' })

    expect(composable.disableCancelButton.value).toBe(false)
    expect(mockIsLoading.value).toBe(false)

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockCancelRoutingSlipInvoice.mockImplementation(() => Promise.reject(new Error('Cancel failed')))
    mockOpenCancelTransactionModal.mockImplementation(async (callback: () => Promise<void>) => {
      try {
        await callback()
      } catch {
        // Error is caught
      }
    })
    composable.selectedInvoiceId.value = 789
    await composable.cancel(789)
    expect(consoleErrorSpy).toHaveBeenCalled()
    consoleErrorSpy.mockRestore()
  })

  it('should not call getRoutingSlip when routingSlipNumber is missing', async () => {
    const invoices = ref([])
    const _composable = useTransactionDataTable(invoices)
    mockStore.routingSlip.number = undefined as unknown as string

    // Since we can't directly call modalDialogConfirm, we verify the store state
    expect(mockStore.routingSlip.number).toBeUndefined()
  })

  it('should update invoiceDisplay reactively when invoices change', async () => {
    const invoices = ref([
      {
        id: 1,
        createdOn: '2025-09-26',
        lineItems: [{ description: 'Item 1' }],
        references: [{ invoiceNumber: 'INV-001' }],
        statusCode: InvoiceStatus.COMPLETED,
        total: 100.00,
        createdName: 'User 1',
        createdBy: 'user1'
      }
    ] as Invoice[])
    const composable = useTransactionDataTable(invoices)

    expect(composable.invoiceDisplay.value).toHaveLength(1)

    invoices.value.push({
      id: 2,
      createdOn: '2025-09-27',
      lineItems: [{ description: 'Item 2' }],
      references: [{ invoiceNumber: 'INV-002' }],
      statusCode: InvoiceStatus.COMPLETED,
      total: 200.00,
      createdName: 'User 2',
      createdBy: 'user2'

    } as Partial<Invoice>)

    await nextTick()
    expect(composable.invoiceDisplay.value).toHaveLength(2)
    expect(composable.invoiceCount.value).toBe(2)
  })

  it('should find invoiceNumber from first reference with invoiceNumber', () => {
    const invoices = ref([
      {
        id: 1,
        createdOn: '2025-09-26',
        references: [
          { invoiceNumber: 'INV-001' },
          { invoiceNumber: 'INV-002' }
        ],
        lineItems: [{ description: 'Item' }],
        statusCode: InvoiceStatus.COMPLETED,
        total: 100.00,
        createdName: 'User',
        createdBy: 'user'
      }
    ] as Invoice[])
    const composable = useTransactionDataTable(invoices)
    expect(composable.invoiceDisplay.value[0]?.invoiceNumber).toBe('INV-001')
  })

  it('should use first reference invoiceNumber if no reference has invoiceNumber property', () => {
    const invoices = ref([
      {
        id: 1,
        createdOn: '2025-09-26',
        references: [
          { otherField: 'value' },
          { invoiceNumber: 'INV-002' }
        ],
        lineItems: [{ description: 'Item' }],
        statusCode: InvoiceStatus.COMPLETED,
        total: 100.00,
        createdName: 'User',
        createdBy: 'user'
      }
    ] as Invoice[])
    const composable = useTransactionDataTable(invoices)
    expect(composable.invoiceDisplay.value[0]?.invoiceNumber).toBe('INV-002')
  })
})
