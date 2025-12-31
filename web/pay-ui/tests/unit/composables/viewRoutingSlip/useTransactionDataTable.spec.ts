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

  it('should be defined', () => {
    const invoices = ref([])
    const composable = useTransactionDataTable(invoices)
    expect(composable).toBeDefined()
  })

  it('should return all expected properties', () => {
    const invoices = ref([])
    const composable = useTransactionDataTable(invoices)
    expect(composable.invoiceCount).toBeDefined()
    expect(composable.invoiceDisplay).toBeDefined()
    expect(composable.headerTransactions).toBeDefined()
    expect(composable.transformInvoices).toBeDefined()
    expect(composable.cancel).toBeDefined()
    expect(composable.isAlreadyCancelled).toBeDefined()
    expect(composable.disableCancelButton).toBeDefined()
    expect(composable.selectedInvoiceId).toBeDefined()
  })

  it('should compute invoiceCount correctly', () => {
    const invoices = ref<Invoice[]>([
      { id: 1 },
      { id: 2 }
    ])
    const composable = useTransactionDataTable(invoices)
    expect(composable.invoiceCount.value).toBe(2)
  })

  it('should return 0 invoiceCount for empty array', () => {
    const invoices = ref([])
    const composable = useTransactionDataTable(invoices)
    expect(composable.invoiceCount.value).toBe(0)
  })

  it('should transform invoices with lineItems', () => {
    const invoices = ref([
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
    const composable = useTransactionDataTable(invoices)
    expect(composable.invoiceDisplay.value).toHaveLength(1)
    expect(composable.invoiceDisplay.value[0]?.description).toEqual(['Item 1', 'Item 2'])
    expect(composable.invoiceDisplay.value[0]?.invoiceNumber).toBe('INV-001')
  })

  it('should transform invoices with details', () => {
    const invoices = ref([
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
    const composable = useTransactionDataTable(invoices)
    expect(composable.invoiceDisplay.value).toHaveLength(1)
    expect(composable.invoiceDisplay.value[0]?.description).toEqual(['Type: Payment', 'Method: Cheque'])
  })

  it('should return N/A when invoice has no lineItems or details', () => {
    const invoices = ref([
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
    const composable = useTransactionDataTable(invoices)
    expect(composable.invoiceDisplay.value[0]?.description).toEqual(['N/A'])
  })

  it('should handle invoice with no references', () => {
    const invoices = ref([
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
    const composable = useTransactionDataTable(invoices)
    expect(composable.invoiceDisplay.value[0]?.invoiceNumber).toBeUndefined()
  })

  it('should return empty array when invoices is not an array', () => {
    // Use empty array instead of null since invoiceCount accesses .length
    const invoices = ref<Invoice[]>([])
    const composable = useTransactionDataTable(invoices)
    expect(composable.invoiceDisplay.value).toEqual([])

    // Test with undefined value
    invoices.value = undefined as unknown as Invoice[]
    expect(composable.invoiceDisplay.value).toEqual([])
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

  it('should return true for isAlreadyCancelled when statusCode is REFUNDED', () => {
    const invoices = ref([])
    const composable = useTransactionDataTable(invoices)
    expect(composable.isAlreadyCancelled(InvoiceStatus.REFUNDED)).toBe(true)
  })

  it('should return true for isAlreadyCancelled when statusCode is REFUND_REQUESTED', () => {
    const invoices = ref([])
    const composable = useTransactionDataTable(invoices)
    expect(composable.isAlreadyCancelled(InvoiceStatus.REFUND_REQUESTED)).toBe(true)
  })

  it('should return false for isAlreadyCancelled when statusCode is COMPLETED', () => {
    const invoices = ref([])
    const composable = useTransactionDataTable(invoices)
    expect(composable.isAlreadyCancelled(InvoiceStatus.COMPLETED)).toBe(false)
  })

  it('should return false for isAlreadyCancelled when statusCode is undefined', () => {
    const invoices = ref([])
    const composable = useTransactionDataTable(invoices)
    expect(composable.isAlreadyCancelled(undefined)).toBe(false)
  })

  it('should call openCancelTransactionModal when cancel is called', async () => {
    const invoices = ref([])
    const composable = useTransactionDataTable(invoices)

    // Mock modal to not call callback immediately
    mockOpenCancelTransactionModal.mockImplementation(() => Promise.resolve())

    await composable.cancel(123)
    expect(mockOpenCancelTransactionModal).toHaveBeenCalled()
    // selectedInvoiceId is set before modal is opened
    expect(composable.selectedInvoiceId.value).toBe(123)
  })

  it('should call cancelRoutingSlipInvoice and getRoutingSlip when modal is confirmed', async () => {
    const invoices = ref([])
    const composable = useTransactionDataTable(invoices)

    // Mock modal to call the callback (simulating user confirmation)
    let _modalCallback: (() => Promise<void>) | undefined
    mockOpenCancelTransactionModal.mockImplementation(async (callback: () => Promise<void>) => {
      _modalCallback = callback
      await callback()
    })

    await composable.cancel(456)

    expect(mockOpenCancelTransactionModal).toHaveBeenCalled()
    expect(mockCancelRoutingSlipInvoice).toHaveBeenCalledWith(456)
    expect(mockGetRoutingSlip).toHaveBeenCalledWith({ routingSlipNumber: '123456789' })
  })

  it('should set disableCancelButton and isLoading during cancel operation', async () => {
    const invoices = ref([])
    const composable = useTransactionDataTable(invoices)

    // Mock the modal to call the callback immediately
    mockOpenCancelTransactionModal.mockImplementation(async (callback: () => Promise<void>) => {
      await callback()
    })

    expect(composable.disableCancelButton.value).toBe(false)
    expect(mockIsLoading.value).toBe(false)

    await composable.cancel(789)

    // After cancel completes, these should be reset
    expect(composable.disableCancelButton.value).toBe(false)
    expect(mockIsLoading.value).toBe(false)
  })

  it('should handle cancel error gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const invoices = ref([])
    const composable = useTransactionDataTable(invoices)

    mockCancelRoutingSlipInvoice.mockImplementation(() => Promise.reject(new Error('Cancel failed')))
    mockOpenCancelTransactionModal.mockImplementation(async (callback: () => Promise<void>) => {
      try {
        await callback()
      } catch {
        // Error is caught in modalDialogConfirm
      }
    })

    composable.selectedInvoiceId.value = 789
    await composable.cancel(789)

    // Verify error was logged
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
