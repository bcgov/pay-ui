import { mountSuspended } from '@nuxt/test-utils/runtime'
import PaymentInformation from '~/components/RoutingSlip/PaymentInformation.vue'
import {
  linkedRoutingSlipsWithChildren,
  routingSlipMock } from '../../test-data/mock-routing-slip'

vi.mock('~/composables/useRoutingSlip', () => ({
  useRoutingSlip: () => ({
    routingSlip: ref(routingSlipMock),
    linkedRoutingSlips: ref(linkedRoutingSlipsWithChildren),
    isRoutingSlipAChild: ref(false),
    isRoutingSlipLinked: ref(true),
    updateRoutingSlipChequeNumber: vi.fn(),
    updateRoutingSlipAmount: vi.fn(),
    adjustRoutingSlip: vi.fn(),
    getRoutingSlip: vi.fn()
  })
}))

describe('PaymentInformation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders component with correct elements', async () => {
    const wrapper = await mountSuspended(PaymentInformation, {
      global: {
        stubs: {
          ReviewRoutingSlipCashPayment: true,
          ReviewRoutingSlipChequePayment: true
        }
      }
    })

    expect(wrapper.find('[data-test="btn-view-payment-information"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="total"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="remaining-amount"]').exists()).toBe(true)
  })

  it('populates correct values', async () => {
    const wrapper = await mountSuspended(PaymentInformation, {
      global: {
        stubs: {
          ReviewRoutingSlipCashPayment: true,
          ReviewRoutingSlipChequePayment: true
        }
      }
    })

    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-test="total"]').text()).toContain('$2500.00')
    expect(wrapper.find('[data-test="remaining-amount"]').text()).toContain('$1000.00')
  })

  it('expands and collapses payment information', async () => {
    const wrapper = await mountSuspended(PaymentInformation, {
      global: {
        stubs: {
          ReviewRoutingSlipCashPayment: true,
          ReviewRoutingSlipChequePayment: true
        }
      }
    })

    const viewButton = wrapper.find('[data-test="btn-view-payment-information"]')
    expect(viewButton.exists()).toBe(true)

    // Initially collapsed
    expect(wrapper.find('[data-test="review-routing-slip-cheque-payment"]').exists()).toBe(false)

    // Click to expand
    await viewButton.trigger('click')
    await wrapper.vm.$nextTick()

    // Should be expanded now
    expect(wrapper.find('[data-test="review-routing-slip-cheque-payment"]').exists()).toBe(true)
  })

  it('renders cheque component when payment method is CHEQUE', async () => {
    const wrapper = await mountSuspended(PaymentInformation)

    const viewButton = wrapper.find('[data-test="btn-view-payment-information"]')
    await viewButton.trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-test="review-routing-slip-cheque-payment"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="review-routing-slip-cash-payment"]').exists()).toBe(false)
  })

  it('renders cash component when payment method is CASH', async () => {
    const wrapper = await mountSuspended(PaymentInformation)

    const viewButton = wrapper.find('[data-test="btn-view-payment-information"]')
    await viewButton.trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-test="review-routing-slip-cheque-payment"]').exists()).toBe(true)
  })

  it('renders linked routing slip children', async () => {
    const wrapper = await mountSuspended(PaymentInformation)

    const viewButton = wrapper.find('[data-test="btn-view-payment-information"]')
    await viewButton.trigger('click')
    await wrapper.vm.$nextTick()

    // Check for linked child
    expect(wrapper.find('[data-test="text-review-routing-slip-0"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="text-review-routing-slip-0"]').text()).toBe('987654321')
    expect(wrapper.find('[data-test="cash-child-payment-0"]').exists()).toBe(true)
  })

  it('renders linked cheque routing slip children', async () => {
    const wrapper = await mountSuspended(PaymentInformation)

    const viewButton = wrapper.find('[data-test="btn-view-payment-information"]')
    await viewButton.trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-test="text-review-routing-slip-0"]').exists()).toBe(true)
  })
})
