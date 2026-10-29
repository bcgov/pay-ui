import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import DetailsPage from '~/pages/transaction-view/[id]/[...details].vue'
import { RefundType } from '~/interfaces/transaction-view'
import { RefundApprovalStatus } from '~/utils/constants'

const {
  mockSetBreadcrumbs,
  mockGetInvoiceComposite,
  mockGetInvoiceRefundHistory,
  mockGetRefundRequest,
  mockPatchRefundRequest,
  mockRefundInvoice,
  mockToastAdd,
  mockPush
} = vi.hoisted(() => ({
  mockSetBreadcrumbs: vi.fn(),
  mockGetInvoiceComposite: vi.fn(),
  mockGetInvoiceRefundHistory: vi.fn(),
  mockGetRefundRequest: vi.fn(),
  mockPatchRefundRequest: vi.fn(),
  mockRefundInvoice: vi.fn(),
  mockToastAdd: vi.fn(),
  mockPush: vi.fn()
}))

const mockRoute = {
  params: { id: '123', details: [] as string | string[] },
  query: {} as Record<string, string | undefined>
}

mockNuxtImport('useRoute', () => () => mockRoute)
mockNuxtImport('useRouter', original => () =>
  new Proxy(original(), {
    get: (target, key, receiver) => key === 'push' ? mockPush : Reflect.get(target, key, receiver)
  })
)
mockNuxtImport('useI18n', () => () => ({ t: (key: string) => key }))
mockNuxtImport('useToast', () => () => ({ add: mockToastAdd }))
mockNuxtImport('setBreadcrumbs', () => mockSetBreadcrumbs)

vi.mock('~/composables/transactions/useTransactionView', () => ({
  useTransactionView: () => ({
    getInvoiceComposite: mockGetInvoiceComposite,
    getInvoiceRefundHistory: mockGetInvoiceRefundHistory,
    getRefundRequest: mockGetRefundRequest,
    patchRefundRequest: mockPatchRefundRequest,
    refundInvoice: mockRefundInvoice
  })
}))

vi.mock('~/pages/transaction-view/[id]/PaymentDetails.vue', () => ({
  default: { name: 'PaymentDetails', props: ['paymentData'], template: '<div />' }
}))
vi.mock('~/pages/transaction-view/[id]/TransactionDetails.vue', () => ({
  default: { name: 'TransactionDetails', props: ['transactionData'], template: '<div />' }
}))
vi.mock('~/pages/transaction-view/[id]/InvoiceRefundHistory.vue', () => ({
  default: { name: 'InvoiceRefundHistory', props: ['refundHistoryData'], template: '<div />' }
}))
vi.mock('~/pages/transaction-view/[id]/RefundDecisionForm.vue', () => ({
  default: {
    name: 'RefundDecisionForm',
    props: ['refundRequestData', 'invoiceProduct', 'isProcessing'],
    template: '<div />'
  }
}))
vi.mock('~/pages/transaction-view/[id]/RefundRequestForm.vue', () => ({
  default: {
    name: 'RefundRequestForm',
    props: ['totalTransactionAmount', 'refundLineItems', 'refundMethods', 'previousRefundedAmount',
      'isPartialRefundAllowed', 'isFullRefundAllowed', 'invoicePaymentMethod'],
    template: '<div />'
  }
}))
vi.mock('~/pages/transaction-view/[id]/RefundReviewForm.vue', () => ({
  default: {
    name: 'RefundReviewForm',
    props: ['refundFormData', 'refundMethods', 'isProcessing'],
    template: '<div />'
  }
}))

const invoice = {
  id: 123,
  paymentAccount: { accountName: 'Acme' },
  folioNumber: 'F1',
  createdBy: 'user1',
  paymentMethod: 'DIRECT_PAY',
  statusCode: 'PAID',
  total: 100,
  createdOn: '2025-01-01',
  references: [
    { statusCode: 'CANCELLED', invoiceNumber: 'INV-0' },
    { statusCode: 'COMPLETED', invoiceNumber: 'INV-1' }
  ],
  corpTypeCode: 'BC',
  lineItems: [{
    id: 9,
    description: 'Incorporation',
    filingFees: 70,
    serviceFees: 1.5,
    priorityFees: 20,
    futureEffectiveFees: 10,
    total: 101.5
  }],
  businessIdentifier: 'BC123',
  details: [{ label: 'Name', value: 'X' }],
  routingSlip: 'RS1',
  latestRefundId: 5,
  latestRefundStatus: null as string | null,
  partialRefundable: true,
  fullRefundable: true,
  refund: 25,
  product: 'BUSINESS'
}

async function mountPage() {
  const wrapper = await mountSuspended(DetailsPage)
  await flushPromises()
  return wrapper
}

function isShown(w: { attributes: (k: string) => string | undefined }) {
  return !(w.attributes('style') ?? '').includes('display: none')
}

function deferred<T = unknown>() {
  let resolve!: (v: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

describe('TransactionView [...details] page — data & flows', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRoute.params = { id: '123', details: [] }
    mockRoute.query = {}
    mockGetInvoiceComposite.mockResolvedValue({ ...invoice, latestRefundStatus: null })
    mockGetInvoiceRefundHistory.mockResolvedValue({ items: [] })
    mockGetRefundRequest.mockResolvedValue({ refundId: 5, refundStatus: 'PENDING_APPROVAL' })
    mockPatchRefundRequest.mockResolvedValue({})
    mockRefundInvoice.mockResolvedValue({})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  describe('data loading', () => {
    it('maps invoice into payment and transaction data props', async () => {
      mockRoute.params.details = ['view']
      const wrapper = await mountPage()

      expect(mockGetInvoiceComposite).toHaveBeenCalledWith(123)
      expect(mockGetInvoiceRefundHistory).toHaveBeenCalledWith(123)
      expect(mockGetRefundRequest).not.toHaveBeenCalled()

      const payment = wrapper.findComponent({ name: 'PaymentDetails' }).props('paymentData')
      expect(payment).toEqual({
        accountName: 'Acme',
        folioNumber: 'F1',
        initiatedBy: 'user1',
        paymentMethod: 'DIRECT_PAY',
        paymentStatus: 'PAID',
        totalTransactionAmount: 100
      })
      const tx = wrapper.findComponent({ name: 'TransactionDetails' }).props('transactionData')
      expect(tx.invoiceId).toBe(123)
      expect(tx.invoiceReferenceId).toBe('INV-1')
      expect(tx.applicationType).toBe('Incorporation')
      expect(tx.transactionAmount).toBe(100)
      expect(tx.routingSlip).toBe('RS1')
      expect(tx.partialRefundable).toBe(true)
    })

    it('defaults totals to 0 and handles missing optional invoice fields', async () => {
      mockRoute.params.details = ['initiateRefund']
      mockGetInvoiceComposite.mockResolvedValue({
        ...invoice,
        total: undefined,
        paymentAccount: undefined,
        references: undefined,
        corpTypeCode: undefined,
        refund: undefined,
        paymentMethod: undefined,
        product: undefined
      })
      const wrapper = await mountPage()
      const payment = wrapper.findComponent({ name: 'PaymentDetails' }).props('paymentData')
      expect(payment.totalTransactionAmount).toBe(0)
      expect(payment.accountName).toBeUndefined()
      const tx = wrapper.findComponent({ name: 'TransactionDetails' }).props('transactionData')
      expect(tx.invoiceReferenceId).toBeUndefined()
      expect(tx.transactionAmount).toBe(0)
      const form = wrapper.findComponent({ name: 'RefundRequestForm' })
      expect(form.props('previousRefundedAmount')).toBe(0)
      expect(form.props('invoicePaymentMethod')).toBeNull()
    })

    it('shows a loading spinner while data is loading', async () => {
      const d = deferred()
      mockGetInvoiceComposite.mockReturnValue(d.promise)
      const wrapper = await mountSuspended(DetailsPage)
      await nextTick()
      expect(wrapper.find('.animate-spin').exists()).toBe(true)
      expect(wrapper.findComponent({ name: 'PaymentDetails' }).exists()).toBe(false)
      d.resolve(null)
      await flushPromises()
      expect(wrapper.find('.animate-spin').exists()).toBe(false)
      expect(wrapper.findComponent({ name: 'PaymentDetails' }).exists()).toBe(true)
    })

    it('logs errors and still renders when fetching fails', async () => {
      mockRoute.params.details = ['refund-request', '5']
      mockGetInvoiceComposite.mockRejectedValue(new Error('inv'))
      mockGetInvoiceRefundHistory.mockRejectedValue(new Error('hist'))
      mockGetRefundRequest.mockRejectedValue(new Error('req'))
      const wrapper = await mountPage()
      expect(console.error).toHaveBeenCalledWith('Failed to fetch invoice:', expect.any(Error))
      expect(console.error).toHaveBeenCalledWith('Failed to fetch refund history', expect.any(Error))
      expect(console.error).toHaveBeenCalledWith('Failed to fetch refund request', expect.any(Error))
      expect(wrapper.find('.animate-spin').exists()).toBe(false)
      expect(mockSetBreadcrumbs).toHaveBeenCalled()
    })

    it('accepts a non-array details param', async () => {
      mockRoute.params.details = 'view'
      mockGetInvoiceRefundHistory.mockResolvedValue({ items: [{ refundId: 1 }] })
      const wrapper = await mountPage()
      expect(wrapper.text()).toContain('Transaction Information')
      expect(wrapper.findComponent({ name: 'InvoiceRefundHistory' }).props('refundHistoryData'))
        .toEqual([{ refundId: 1 }])
    })

    it('treats empty details param as no mode', async () => {
      mockRoute.params.details = ''
      mockGetInvoiceRefundHistory.mockResolvedValue({})
      const wrapper = await mountPage()
      expect(wrapper.findComponent({ name: 'InvoiceRefundHistory' }).exists()).toBe(false)
      expect(wrapper.findComponent({ name: 'RefundRequestForm' }).exists()).toBe(false)
      expect(wrapper.findComponent({ name: 'RefundDecisionForm' }).exists()).toBe(false)
    })
  })

  describe('conditional sections', () => {
    it('hides refund history in non-view modes even when history exists', async () => {
      mockRoute.params.details = ['initiateRefund']
      mockGetInvoiceRefundHistory.mockResolvedValue({ items: [{ refundId: 1 }] })
      const wrapper = await mountPage()
      expect(wrapper.findComponent({ name: 'InvoiceRefundHistory' }).exists()).toBe(false)
    })

    it.each([
      RefundApprovalStatus.APPROVED,
      RefundApprovalStatus.APPROVAL_NOT_REQUIRED,
      RefundApprovalStatus.PENDING_APPROVAL
    ])('hides refund request form when latest refund status is %s', async (status) => {
      mockRoute.params.details = ['initiateRefund']
      mockGetInvoiceComposite.mockResolvedValue({ ...invoice, latestRefundStatus: status })
      const wrapper = await mountPage()
      expect(wrapper.findComponent({ name: 'RefundRequestForm' }).exists()).toBe(false)
    })

    it('shows refund request form (with line items) when latest refund was declined', async () => {
      mockRoute.params.details = ['initiateRefund']
      mockGetInvoiceComposite.mockResolvedValue({ ...invoice, latestRefundStatus: RefundApprovalStatus.DECLINED })
      const wrapper = await mountPage()
      const form = wrapper.findComponent({ name: 'RefundRequestForm' })
      expect(form.exists()).toBe(true)
      expect(form.props('totalTransactionAmount')).toBe(100)
      expect(form.props('previousRefundedAmount')).toBe(25)
      expect(form.props('invoicePaymentMethod')).toBe('DIRECT_PAY')
      expect(form.props('refundLineItems')).toEqual([{
        id: 9,
        description: 'Incorporation',
        filingFees: 70,
        serviceFees: 1.5,
        priorityFees: 20,
        futureEffectiveFees: 10,
        total: 101.5
      }])
    })

    it('does not show decision form in refund-request mode without refund id', async () => {
      mockRoute.params.details = ['refund-request']
      const wrapper = await mountPage()
      expect(wrapper.findComponent({ name: 'RefundDecisionForm' }).exists()).toBe(false)
      expect(mockGetRefundRequest).not.toHaveBeenCalled()
    })

    it('shows decision form with refund request data and product', async () => {
      mockRoute.params.details = ['refund-request', '5']
      const wrapper = await mountPage()
      expect(mockGetRefundRequest).toHaveBeenCalledWith(5)
      const form = wrapper.findComponent({ name: 'RefundDecisionForm' })
      expect(form.props('refundRequestData')).toEqual({ refundId: 5, refundStatus: 'PENDING_APPROVAL' })
      expect(form.props('invoiceProduct')).toBe('BUSINESS')
      expect(form.props('isProcessing')).toBe(false)
    })
  })

  describe('refund request flow', () => {
    beforeEach(() => {
      mockRoute.params.details = ['initiateRefund']
    })

    const partialFormData = {
      refundType: RefundType.PARTIAL_REFUND,
      refundLineItems: [{
        id: 9,
        description: 'Incorporation',
        filingFeesRequested: '10.50',
        priorityFeesRequested: 5,
        futureEffectiveFeesRequested: 0,
        serviceFeesRequested: 1.5
      }],
      totalRefundAmount: 17,
      refundMethod: 'refund-as-account-credits',
      notificationEmail: 'a@b.com',
      reasonsForRefund: 'dup',
      staffComment: 'note',
      requestedBy: null,
      requestedTime: null,
      decisionBy: null,
      decisionTime: null
    }

    it('switches between request and review stages', async () => {
      const wrapper = await mountPage()
      const request = wrapper.findComponent({ name: 'RefundRequestForm' })
      const review = wrapper.findComponent({ name: 'RefundReviewForm' })
      expect(isShown(request)).toBe(true)
      expect(isShown(review)).toBe(false)

      request.vm.$emit('on-proceed-to-review', partialFormData)
      await nextTick()
      expect(isShown(request)).toBe(false)
      expect(isShown(review)).toBe(true)
      expect(review.props('refundFormData')).toEqual(partialFormData)

      review.vm.$emit('on-proceed-to-request-form')
      await nextTick()
      expect(isShown(request)).toBe(true)
      expect(isShown(review)).toBe(false)
    })

    it('submits partial refund payload excluding service fees and zero amounts, then goes to list', async () => {
      const wrapper = await mountPage()
      wrapper.findComponent({ name: 'RefundRequestForm' }).vm.$emit('on-proceed-to-review', partialFormData)
      await nextTick()
      wrapper.findComponent({ name: 'RefundReviewForm' }).vm.$emit('on-proceed-to-confirm')
      await flushPromises()

      expect(mockRefundInvoice).toHaveBeenCalledWith(123, {
        reason: 'dup',
        staffComment: 'note',
        notificationEmail: 'a@b.com',
        refundMethod: 'refund-as-account-credits',
        refundRevenue: [
          { paymentLineItemId: 9, refundAmount: 10.5, refundType: 'BASE_FEES' },
          { paymentLineItemId: 9, refundAmount: 5, refundType: 'PRIORITY_FEES' }
        ]
      })
      expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({
        description: 'Refund request submitted.', color: 'success'
      }))
      expect(mockPush).toHaveBeenCalledWith({ path: '/transactions' })
      expect(wrapper.findComponent({ name: 'RefundReviewForm' }).props('isProcessing')).toBe(false)
    })

    it('submits full refund with empty revenue and returns to returnTo', async () => {
      mockRoute.query = { returnTo: '/view-routing-slip/RS1' }
      const wrapper = await mountPage()
      wrapper.findComponent({ name: 'RefundRequestForm' }).vm.$emit('on-proceed-to-review', {
        ...partialFormData,
        refundType: RefundType.FULL_REFUND
      })
      await nextTick()
      wrapper.findComponent({ name: 'RefundReviewForm' }).vm.$emit('on-proceed-to-confirm')
      await flushPromises()
      expect(mockRefundInvoice).toHaveBeenCalledWith(123, expect.objectContaining({ refundRevenue: [] }))
      expect(mockPush).toHaveBeenCalledWith('/view-routing-slip/RS1')
    })

    it('shows processing state while submitting', async () => {
      const d = deferred()
      mockRefundInvoice.mockReturnValue(d.promise)
      const wrapper = await mountPage()
      const review = wrapper.findComponent({ name: 'RefundReviewForm' })
      review.vm.$emit('on-proceed-to-confirm')
      await nextTick()
      expect(review.props('isProcessing')).toBe(true)
      d.resolve({})
      await flushPromises()
      expect(review.props('isProcessing')).toBe(false)
    })

    it('does not navigate when confirm is triggered from request-form stage', async () => {
      const wrapper = await mountPage()
      wrapper.findComponent({ name: 'RefundReviewForm' }).vm.$emit('on-proceed-to-confirm')
      await flushPromises()
      expect(mockRefundInvoice).toHaveBeenCalled()
      expect(mockPush).not.toHaveBeenCalled()
    })

    it('shows error toast when refund submission fails', async () => {
      mockRefundInvoice.mockRejectedValue(new Error('boom'))
      const wrapper = await mountPage()
      wrapper.findComponent({ name: 'RefundRequestForm' }).vm.$emit('on-proceed-to-review', partialFormData)
      await nextTick()
      wrapper.findComponent({ name: 'RefundReviewForm' }).vm.$emit('on-proceed-to-confirm')
      await flushPromises()
      expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({
        description: 'Refund failed.', color: 'error'
      }))
      expect(mockPush).not.toHaveBeenCalled()
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Refund request failed'))
    })

    it('cancel navigates to returnTo when present', async () => {
      mockRoute.query = { returnTo: '/somewhere' }
      const wrapper = await mountPage()
      wrapper.findComponent({ name: 'RefundRequestForm' }).vm.$emit('on-cancel')
      expect(mockPush).toHaveBeenCalledWith('/somewhere')
    })

    it('cancel navigates to transaction list by default', async () => {
      const wrapper = await mountPage()
      wrapper.findComponent({ name: 'RefundRequestForm' }).vm.$emit('on-cancel')
      expect(mockPush).toHaveBeenCalledWith({ path: '/transactions' })
    })
  })

  describe('refund decision flow', () => {
    beforeEach(() => {
      mockRoute.params.details = ['refund-request', '5']
    })

    it('approves refund, refetches and navigates to view', async () => {
      const wrapper = await mountPage()
      mockGetInvoiceComposite.mockClear()
      mockGetInvoiceRefundHistory.mockClear()
      wrapper.findComponent({ name: 'RefundDecisionForm' }).vm.$emit('on-approve-refund')
      await flushPromises()
      expect(mockPatchRefundRequest).toHaveBeenCalledWith(123, 5, { status: RefundApprovalStatus.APPROVED })
      expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({
        description: 'Refund request approved.', color: 'success'
      }))
      expect(mockGetInvoiceComposite).toHaveBeenCalledWith(123)
      expect(mockGetInvoiceRefundHistory).toHaveBeenCalledWith(123)
      expect(mockPush).toHaveBeenCalledWith({ path: '/transaction-view/123/view' })
    })

    it('shows error toast when approve fails', async () => {
      mockPatchRefundRequest.mockRejectedValue(new Error('x'))
      const wrapper = await mountPage()
      wrapper.findComponent({ name: 'RefundDecisionForm' }).vm.$emit('on-approve-refund')
      await flushPromises()
      expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({
        description: 'Failed to approve refund request.', color: 'error'
      }))
      expect(mockPush).not.toHaveBeenCalled()
    })

    it('declines refund with reason and navigates to view', async () => {
      const wrapper = await mountPage()
      wrapper.findComponent({ name: 'RefundDecisionForm' }).vm.$emit('on-decline-refund', 'bad')
      await flushPromises()
      expect(mockPatchRefundRequest).toHaveBeenCalledWith(123, 5, {
        status: RefundApprovalStatus.DECLINED,
        declineReason: 'bad'
      })
      expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({
        description: 'Refund request declined successfully.', color: 'success'
      }))
      expect(mockPush).toHaveBeenCalledWith({ path: '/transaction-view/123/view' })
    })

    it('shows error toast when decline fails', async () => {
      mockPatchRefundRequest.mockRejectedValue(new Error('x'))
      const wrapper = await mountPage()
      wrapper.findComponent({ name: 'RefundDecisionForm' }).vm.$emit('on-decline-refund', 'bad')
      await flushPromises()
      expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({
        description: 'Failed to decline refund request.', color: 'error'
      }))
      expect(wrapper.findComponent({ name: 'RefundDecisionForm' }).props('isProcessing')).toBe(false)
    })

    it('does nothing on approve/decline when invoice id is invalid', async () => {
      mockRoute.params.id = '0'
      const wrapper = await mountPage()
      const form = wrapper.findComponent({ name: 'RefundDecisionForm' })
      form.vm.$emit('on-approve-refund')
      form.vm.$emit('on-decline-refund', 'r')
      await flushPromises()
      expect(mockPatchRefundRequest).not.toHaveBeenCalled()
      expect(mockToastAdd).not.toHaveBeenCalled()
    })

    it('cancel from decision form goes to transaction list', async () => {
      const wrapper = await mountPage()
      wrapper.findComponent({ name: 'RefundDecisionForm' }).vm.$emit('on-cancel')
      expect(mockPush).toHaveBeenCalledWith({ path: '/transactions' })
    })
  })
})
