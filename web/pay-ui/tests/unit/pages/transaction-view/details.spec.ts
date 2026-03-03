import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { nextTick } from 'vue'
import DetailsPage from '~/pages/transaction-view/[id]/[...details].vue'

const {
  mockT,
  mockSetBreadcrumbs,
  mockGetInvoiceComposite,
  mockGetInvoiceRefundHistory,
  mockGetRefundRequest,
  mockPatchRefundRequest,
  mockRefundInvoice,
  mockToastAdd
} = vi.hoisted(() => ({
  mockT: vi.fn(),
  mockSetBreadcrumbs: vi.fn(),
  mockGetInvoiceComposite: vi.fn(),
  mockGetInvoiceRefundHistory: vi.fn(),
  mockGetRefundRequest: vi.fn(),
  mockPatchRefundRequest: vi.fn(),
  mockRefundInvoice: vi.fn(),
  mockToastAdd: vi.fn()
}))

const mockRoute = {
  params: { id: '123', details: [] as string | string[] },
  query: {} as Record<string, string | undefined>
}

mockNuxtImport('useRoute', () => () => mockRoute)
mockNuxtImport('useI18n', () => () => ({ t: mockT }))
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

// We have tests for the individual components, this is mainly to test things like breadcrumbs on the details page
vi.mock('~/pages/transaction-view/[id]/PaymentDetails.vue', () => ({
  default: { name: 'PaymentDetails', template: '<div />' }
}))
vi.mock('~/pages/transaction-view/[id]/TransactionDetails.vue', () => ({
  default: { name: 'TransactionDetails', template: '<div />' }
}))
vi.mock('~/pages/transaction-view/[id]/InvoiceRefundHistory.vue', () => ({
  default: { name: 'InvoiceRefundHistory', template: '<div />' }
}))
vi.mock('~/pages/transaction-view/[id]/RefundDecisionForm.vue', () => ({
  default: { name: 'RefundDecisionForm', template: '<div />' }
}))
vi.mock('~/pages/transaction-view/[id]/RefundRequestForm.vue', () => ({
  default: { name: 'RefundRequestForm', template: '<div />' }
}))
vi.mock('~/pages/transaction-view/[id]/RefundReviewForm.vue', () => ({
  default: { name: 'RefundReviewForm', template: '<div />' }
}))

function setupApiMocks() {
  mockGetInvoiceComposite.mockResolvedValue(null)
  mockGetInvoiceRefundHistory.mockResolvedValue({ items: [] })
  mockGetRefundRequest.mockResolvedValue({})
}

function setupI18nMock() {
  mockT.mockImplementation((key: string, params?: Record<string, unknown>) =>
    params?.id ? `${key}:${params.id}` : key
  )
}

async function mountPage() {
  const wrapper = await mountSuspended(DetailsPage)
  await nextTick()
  await new Promise(resolve => setTimeout(resolve, 100))
  return wrapper
}

describe('TransactionView [...details] page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRoute.params = { id: '123', details: [] }
    mockRoute.query = {}
    setupApiMocks()
    setupI18nMock()
  })

  it('renders the page', async () => {
    const wrapper = await mountPage()
    expect(wrapper.exists()).toBe(true)
  })

  describe('breadcrumbs — view routing slip entry point (returnType = viewRoutingSlip)', () => {
    const slipId = 'RS0000123'
    const returnTo = `/view-routing-slip/${slipId}`

    beforeEach(() => {
      mockRoute.query = {
        returnType: 'viewRoutingSlip',
        returnToId: slipId,
        returnTo
      }
    })

    it('sets FAS Dashboard + routing slip + refund title for initiateRefund mode', async () => {
      mockRoute.params.details = ['initiateRefund']
      await mountPage()

      expect(mockSetBreadcrumbs).toHaveBeenCalledWith([
        { label: 'label.fasDashboard', to: '/home' },
        { label: expect.stringContaining(slipId), to: returnTo },
        { label: 'page.transactionView.transactionRefundTitle' }
      ])
    })

    it('sets FAS Dashboard + routing slip + refund title for refund-request mode', async () => {
      mockRoute.params.details = ['refund-request', '5']
      await mountPage()

      expect(mockSetBreadcrumbs).toHaveBeenCalledWith([
        { label: 'label.fasDashboard', to: '/home' },
        { label: expect.stringContaining(slipId), to: returnTo },
        { label: 'page.transactionView.transactionRefundTitle' }
      ])
    })

    it('sets FAS Dashboard + routing slip + information title for view mode', async () => {
      mockRoute.params.details = ['view']
      await mountPage()

      expect(mockSetBreadcrumbs).toHaveBeenCalledWith([
        { label: 'label.fasDashboard', to: '/home' },
        { label: expect.stringContaining(slipId), to: returnTo },
        { label: 'page.transactionView.transactionInformationTitle' }
      ])
    })

    it('falls back to Transactions breadcrumb when returnToId is missing', async () => {
      // returnType is set but returnToId is absent — condition fails, falls back
      mockRoute.query = { returnType: 'viewRoutingSlip', returnTo }
      mockRoute.params.details = ['initiateRefund']
      await mountPage()

      expect(mockSetBreadcrumbs).toHaveBeenCalledWith([
        { label: 'page.transactionView.breadcrumb.transactions', to: '/transactions' },
        { label: 'page.transactionView.transactionRefundTitle' }
      ])
    })
  })

  describe('breadcrumbs — standard transactions entry point (no returnType)', () => {
    it('sets Transactions + information title for view mode', async () => {
      mockRoute.params.details = ['view']
      await mountPage()

      expect(mockSetBreadcrumbs).toHaveBeenCalledWith([
        { label: 'page.transactionView.breadcrumb.transactions', to: '/transactions' },
        { label: 'page.transactionView.transactionInformationTitle' }
      ])
    })

    it('sets Transactions + refund title for initiateRefund mode', async () => {
      mockRoute.params.details = ['initiateRefund']
      await mountPage()

      expect(mockSetBreadcrumbs).toHaveBeenCalledWith([
        { label: 'page.transactionView.breadcrumb.transactions', to: '/transactions' },
        { label: 'page.transactionView.transactionRefundTitle' }
      ])
    })

    it('sets Transactions + refund title for refund-request mode', async () => {
      mockRoute.params.details = ['refund-request', '5']
      await mountPage()

      expect(mockSetBreadcrumbs).toHaveBeenCalledWith([
        { label: 'page.transactionView.breadcrumb.transactions', to: '/transactions' },
        { label: 'page.transactionView.transactionRefundTitle' }
      ])
    })
  })
})
