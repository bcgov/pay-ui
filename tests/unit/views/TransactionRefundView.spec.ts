import { createLocalVue, shallowMount } from '@vue/test-utils'
import Vuetify from 'vuetify'
import VueCompositionAPI from '@vue/composition-api'
import TransactionRefundView from '@/views/transactionRefund/TransactionRefundView.vue'
import { RefundRequestStage, RefundType } from '@/models/transaction-refund'
import type { Invoice } from '@/models/Invoice'
import CommonUtils from '@/util/common-util'

// Mocks for store methods so we can assert calls and control returns
const getInvoiceMock = vi.fn()
const refundInvoiceMock = vi.fn()

vi.mock('@/store/org', () => ({
  useOrgStore: () => ({
    getInvoice: getInvoiceMock,
    refundInvoice: refundInvoiceMock
  })
}))

describe('TransactionRefundView.vue', () => {
  const localVue = createLocalVue()
  localVue.use(VueCompositionAPI)
  const vuetify = new Vuetify({})

  const mockInvoice: Invoice = {
    id: 9876,
    createdOn: '2025-08-20T10:00:00Z',
    createdBy: 'idir\nJane',
    paymentAccount: { accountName: 'Acme Corp' },
    folioNumber: 'FOL-123',
    paymentMethod: 'DIRECT_PAY',
    statusCode: 'COMPLETED',
    total: 231.5,
    refund: 10,
    corpTypeCode: 'BC',
    businessIdentifier: 'BC1234567',
    references: [{ statusCode: 'COMPLETED', invoiceNumber: 'INV-001' }],
    details: [{ label: 'Item', value: 'Service X' }],
    lineItems: [
      {
        id: 101,
        description: 'Service X',
        filingFees: 30,
        serviceFees: 1.5,
        priorityFees: 100,
        futureEffectiveFees: 100,
        total: 231.5
      }
    ]
  }

  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    getInvoiceMock.mockResolvedValue(mockInvoice)
    refundInvoiceMock.mockResolvedValue({ refundAmount: 250 })
  })

  it('renders and loads invoice on mount', async () => {
    const wrapper: any = shallowMount(TransactionRefundView, {
      localVue,
      vuetify,
      propsData: { invoiceId: 'INV-001' },
      directives: { can () {} }
    })

    await wrapper.vm.$nextTick()
    await Promise.resolve()

    expect(getInvoiceMock).toHaveBeenCalled()
    expect(getInvoiceMock).toHaveBeenCalledWith({ invoiceId: 'INV-001' })
    expect(wrapper.text()).toContain('Transaction Refund')
  })

  it('moves to review stage when onProceedToReview is called', async () => {
    const wrapper: any = shallowMount(TransactionRefundView, {
      localVue,
      vuetify,
      propsData: { invoiceId: 'INV-001' },
      directives: { can () {} }
    })
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.refundFormStage).toBe(RefundRequestStage.REQUEST_FORM)

    const formData = {
      refundType: RefundType.FULL_REFUND,
      refundLineItems: [],
      totalRefundAmount: 231.5,
      refundMethod: 'credit-card',
      notificationEmail: 'user@example.com',
      reasonsForRefund: 'Reason',
      staffComment: 'Comment',
      requestedBy: 'Jane',
      requestedTime: '2025-08-20T10:00:00Z'
    }

    wrapper.vm.onProceedToReview(formData)
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.refundFormStage).toBe(RefundRequestStage.DATA_VALIDATED)
    expect(wrapper.vm.refundFormData.totalRefundAmount).toBe(231.5)
  })

  it('builds refund payload for partial refunds (ignores service fees)', async () => {
    const wrapper: any = shallowMount(TransactionRefundView, {
      localVue,
      vuetify,
      propsData: { invoiceId: 'INV-001' }
    })
    await wrapper.vm.$nextTick()

    wrapper.vm.refundFormData = {
      refundType: RefundType.PARTIAL_REFUND,
      refundLineItems: [
        {
          id: 101,
          description: 'Service X',
          filingFeesRequested: '30',
          priorityFeesRequested: '100',
          futureEffectiveFeesRequested: '0',
          serviceFeesRequested: '1.5', // should be ignored
          refundEntireItemRequested: false
        }
      ],
      totalRefundAmount: 130,
      refundMethod: 'credit-card',
      notificationEmail: 'user@example.com',
      reasonsForRefund: 'Partial reason',
      staffComment: 'Partial',
      requestedBy: 'Jane',
      requestedTime: '2025-08-20T10:00:00Z'
    }

    await wrapper.vm.onProceedToConfirm()
    expect(refundInvoiceMock).toHaveBeenCalled()
    const [, payload] = refundInvoiceMock.mock.calls[0]
    expect(payload.reason).toBe('Partial reason')
    expect(payload.refundRevenue).toBeTruthy()
    expect(payload.refundRevenue.length).toBe(2)
    const amounts = payload.refundRevenue.map((r: any) => r.refundAmount).sort((a: number, b: number) => a - b)
    expect(amounts).toEqual([30, 100])
  })

  it('calls refund endpoint', async () => {
    const wrapper: any = shallowMount(TransactionRefundView, {
      localVue,
      vuetify,
      propsData: { invoiceId: 'INV-001' }
    })
    await wrapper.vm.$nextTick()

    wrapper.vm.refundFormData = {
      refundType: RefundType.FULL_REFUND,
      refundLineItems: [],
      totalRefundAmount: 250,
      refundMethod: 'credit-card',
      notificationEmail: 'user@example.com',
      reasonsForRefund: 'Reason',
      staffComment: 'Comment',
      requestedBy: 'Jane',
      requestedTime: '2025-08-20T10:00:00Z'
    }
    wrapper.vm.refundFormStage = RefundRequestStage.DATA_VALIDATED

    await wrapper.vm.onProceedToConfirm()

    expect(refundInvoiceMock).toHaveBeenCalledTimes(1)
    expect(refundInvoiceMock.mock.calls[0][0]).toBe('INV-001')
  })
})
