import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { computed } from 'vue'
import TransactionDataTable from '~/components/RoutingSlip/TransactionDataTable.vue'
import type { Invoice, InvoiceDisplay } from '~/interfaces/invoice'
import { InvoiceStatus, RefundApprovalStatus } from '~/utils/constants'
import CommonUtils from '~/utils/common-util'

const {
  mockCancel,
  mockNavigateTo,
  mockGetFeatureFlag,
  mockDisplayData
} = vi.hoisted(() => ({
  mockCancel: vi.fn(),
  mockNavigateTo: vi.fn(),
  mockGetFeatureFlag: vi.fn(),
  mockDisplayData: { list: [] as InvoiceDisplay[] }
}))

vi.mock('~/utils/common-util', async () => {
  const actual = await vi.importActual<{ default: Record<string, unknown> }>('~/utils/common-util')
  return {
    default: {
      ...actual.default,
      verifyRoles: () => true,
      isProductRefundViewer: () => true,
      canInitiateProductRefund: () => true,
      canApproveDeclineProductRefund: () => false
    }
  }
})

mockNuxtImport('navigateTo', () => mockNavigateTo)
mockNuxtImport('useConnectLaunchDarkly', () => () => ({
  getFeatureFlag: mockGetFeatureFlag
}))

vi.mock('~/composables/viewRoutingSlip/useTransactionDataTable', () => ({
  default: () => ({
    invoiceDisplay: computed(() => mockDisplayData.list),
    headerTransactions: computed(() => [
      { accessorKey: 'createdOn', header: 'Date' },
      { accessorKey: 'invoiceNumber', header: 'Invoice #' },
      { accessorKey: 'total', header: 'Transaction Amount' },
      { accessorKey: 'description', header: 'Description' },
      { accessorKey: 'createdName', header: 'Initiator' },
      { accessorKey: 'actions', header: 'Actions' }
    ]),
    invoiceCount: computed(() => mockDisplayData.list.length),
    transformInvoices: vi.fn(),
    cancel: mockCancel,
    getIndexedTag: (baseTag: string, index: number) => `${baseTag}-${index}`,
    disableCancelButton: false,
    isAlreadyCancelled: (statusCode?: string) => statusCode === InvoiceStatus.CANCELLED
  })
}))

// InvoiceDisplay is the shaped type the composable returns to the template
const baseInvoices: InvoiceDisplay[] = [
  {
    id: 1,
    createdOn: '2025-11-17T10:00:00Z',
    invoiceNumber: 'REGUT00053322',
    statusCode: InvoiceStatus.COMPLETED,
    total: 30.00,
    createdName: 'Travis Semple',
    description: ['Name Request Renewal fee']
  },
  {
    id: 2,
    createdOn: '2025-11-18T10:00:00Z',
    invoiceNumber: 'REGUT00053323',
    statusCode: InvoiceStatus.CANCELLED,
    total: 50.00,
    createdName: 'John Doe',
    description: ['Fee Type: Annual Report']
  }
]

const defaultDirectives = {
  can: { mounted: () => {}, updated: () => {} }
}

// Stub renders the label prop as text so assertions like button.text() work
const uButtonStub = {
  template: '<button @click="$emit(\'click\')" :data-test="$props.dataTest">{{ label }}</button>',
  props: ['label', 'variant', 'color', 'disabled', 'dataTest']
}

function mountTable() {
  return mountSuspended(TransactionDataTable, {
    props: { invoices: [] as Invoice[] },
    global: {
      directives: defaultDirectives,
      stubs: { UButton: uButtonStub }
    }
  })
}

describe('TransactionDataTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDisplayData.list = [...baseInvoices]
    mockGetFeatureFlag.mockResolvedValue(false)
  })

  it('renders title and invoice count', async () => {
    const wrapper = await mountTable()
    expect(wrapper.find('[data-test="title"]').text()).toBe('Transactions')
    expect(wrapper.text()).toContain(`(${baseInvoices.length})`)
  })

  describe('legacy flow (enableRefundRequestFlow = false)', () => {
    it('shows "Cancelled" text for a cancelled invoice', async () => {
      const wrapper = await mountTable()
      const cancelText = wrapper.find('[data-test="text-cancel-1"]')
      expect(cancelText.exists()).toBe(true)
      expect(cancelText.text()).toBe('Cancelled')
    })

    it('shows "Cancel" button for an active invoice', async () => {
      const wrapper = await mountTable()
      const button = wrapper.find('[data-test="btn-invoice-cancel-0"]')
      expect(button.exists()).toBe(true)
      expect(button.text()).toBe('Cancel')
    })

    it('calls cancel() when the "Cancel" button is clicked, does not navigate', async () => {
      const wrapper = await mountTable()
      await wrapper.find('[data-test="btn-invoice-cancel-0"]').trigger('click')
      expect(mockCancel).toHaveBeenCalledWith(1)
      expect(mockNavigateTo).not.toHaveBeenCalled()
    })
  })

  describe('new flow (enableRefundRequestFlow = true)', () => {
    beforeEach(() => {
      mockGetFeatureFlag.mockResolvedValue(true)
    })

    describe('"View Refund Detail" button', () => {
      it('does not show when the user is not a refund viewer', async () => {
        vi.spyOn(CommonUtils, 'isProductRefundViewer').mockReturnValueOnce(false)
        mockDisplayData.list = [{
          id: 1, statusCode: InvoiceStatus.COMPLETED, total: 30.00,
          latestRefundStatus: RefundApprovalStatus.PENDING_APPROVAL, latestRefundId: 5, description: []
        }]
        const wrapper = await mountTable()
        expect(wrapper.find('[data-test="btn-view-refund-detail-0"]').exists()).toBe(false)
      })

      it('shows for a REFUND_REQUESTED invoice', async () => {
        mockDisplayData.list = [{
          id: 1,
          statusCode: InvoiceStatus.REFUND_REQUESTED,
          total: 30.00,
          latestRefundStatus: RefundApprovalStatus.PENDING_APPROVAL,
          latestRefundId: 5,
          description: []
        }]
        const wrapper = await mountTable()
        const button = wrapper.find('[data-test="btn-view-refund-detail-0"]')
        expect(button.exists()).toBe(true)
        expect(button.text()).toBe('View Refund Detail')
      })

      it.each([
        RefundApprovalStatus.PENDING_APPROVAL,
        RefundApprovalStatus.APPROVED,
        RefundApprovalStatus.APPROVAL_NOT_REQUIRED
      ])('shows for invoice with refund status "%s"', async (refundStatus) => {
        mockDisplayData.list = [{
          id: 1, statusCode: InvoiceStatus.COMPLETED, total: 30.00,
          latestRefundStatus: refundStatus, latestRefundId: 5, description: []
        }]

        const wrapper = await mountTable()
        const button = wrapper.find('[data-test="btn-view-refund-detail-0"]')
        expect(button.exists()).toBe(true)
        expect(button.text()).toBe('View Refund Detail')
      })

      it('navigates to the refund-request page with correct params on click', async () => {
        const invoiceId = 1
        const refundId = 5
        mockDisplayData.list = [{
          id: invoiceId, statusCode: InvoiceStatus.COMPLETED, total: 30.00,
          latestRefundStatus: RefundApprovalStatus.PENDING_APPROVAL,
          latestRefundId: refundId, description: []
        }]

        const wrapper = await mountTable()
        await wrapper.find('[data-test="btn-view-refund-detail-0"]').trigger('click')

        expect(mockNavigateTo).toHaveBeenCalledWith(expect.objectContaining({
          path: `/transaction-view/${invoiceId}/refund-request/${refundId}`,
          query: expect.objectContaining({ returnType: 'viewRoutingSlip' })
        }))
      })
    })

    describe('"Request Refund" button', () => {
      it('shows for a refundable invoice with no prior refund', async () => {
        mockDisplayData.list = [
          { id: 1, statusCode: InvoiceStatus.COMPLETED, total: 30.00,
            fullRefundable: true, product: 'NR', description: [] }
        ]

        const wrapper = await mountTable()
        const button = wrapper.find('[data-test="btn-request-refund-0"]')
        expect(button.exists()).toBe(true)
        expect(button.text()).toBe('Request Refund')
      })

      it('shows for a refundable invoice with a DECLINED refund (re-request)', async () => {
        mockDisplayData.list = [{
          id: 1, statusCode: InvoiceStatus.COMPLETED, total: 30.00,
          fullRefundable: true, product: 'NR',
          latestRefundStatus: RefundApprovalStatus.DECLINED, description: []
        }]

        const wrapper = await mountTable()
        const button = wrapper.find('[data-test="btn-request-refund-0"]')
        expect(button.exists()).toBe(true)
        expect(button.text()).toBe('Request Refund')
      })

      it('navigates to the initiateRefund page on click, does not invoke the legacy cancel', async () => {
        const invoiceId = 1
        mockDisplayData.list = [{
          id: invoiceId, statusCode: InvoiceStatus.COMPLETED, total: 30.00,
          fullRefundable: true, product: 'NR', description: []
        }]

        const wrapper = await mountTable()
        await wrapper.find('[data-test="btn-request-refund-0"]').trigger('click')

        expect(mockNavigateTo).toHaveBeenCalledWith(expect.objectContaining({
          path: `/transaction-view/${invoiceId}/initiateRefund`,
          query: expect.objectContaining({ returnType: 'viewRoutingSlip' })
        }))
        expect(mockCancel).not.toHaveBeenCalled()
      })

      it('does not show for a non-refundable invoice', async () => {
        mockDisplayData.list = [{
          id: 1, statusCode: InvoiceStatus.COMPLETED, total: 30.00,
          fullRefundable: false, partialRefundable: false, description: []
        }]

        const wrapper = await mountTable()
        expect(wrapper.find('[data-test="btn-request-refund-0"]').exists()).toBe(false)
      })

      it('does not show for an invoice with $0 total', async () => {
        mockDisplayData.list = [
          { id: 1, statusCode: InvoiceStatus.COMPLETED, total: 0, fullRefundable: true, product: 'NR', description: [] }
        ]

        const wrapper = await mountTable()
        expect(wrapper.find('[data-test="btn-request-refund-0"]').exists()).toBe(false)
      })
    })
  })

  describe('refund status badge in total column', () => {
    it.each([
      [RefundApprovalStatus.PENDING_APPROVAL, 'REFUND REQUESTED'],
      [RefundApprovalStatus.DECLINED, 'REFUND DECLINED']
    ])('shows badge for %s refund status', async (refundStatus, expectedText) => {
      mockDisplayData.list = [
        { id: 1, statusCode: InvoiceStatus.COMPLETED, total: 30.00, latestRefundStatus: refundStatus, description: [] }
      ]

      const wrapper = await mountTable()
      expect(wrapper.text()).toContain(expectedText)
    })

    it('does not show badge for APPROVED status', async () => {
      mockDisplayData.list = [{
        id: 1, statusCode: InvoiceStatus.COMPLETED, total: 30.00,
        latestRefundStatus: RefundApprovalStatus.APPROVED, description: []
      }]

      const wrapper = await mountTable()
      expect(wrapper.text()).not.toContain('REFUND APPROVED')
    })
  })
})
