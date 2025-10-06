/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { createTestingPinia } from '@pinia/testing'
import { CreateRoutingSlip } from '#components'

const mockUUID = 'mock-uuid'
vi.stubGlobal('crypto', {
  randomUUID: () => mockUUID
})

describe('CreateRoutingSlip', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-09-26T10:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders', async () => {
    const wrapper = await mountSuspended(CreateRoutingSlip, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          CreateRoutingSlipDetails: true,
          CreateRoutingSlipPayment: true,
          CreateRoutingSlipAddress: true,
          UForm: {
            template: '<div><slot /></div>'
          }
        }
      }
    })

    const crsStore = useCreateRoutingSlipStore()

    const details = wrapper.findComponent({ name: 'CreateRoutingSlipDetails' })
    const payment = wrapper.findComponent({ name: 'CreateRoutingSlipPayment' })
    const address = wrapper.findComponent({ name: 'CreateRoutingSlipAddress' })

    expect(details.exists()).toBe(true)
    expect(payment.exists()).toBe(true)
    expect(address.exists()).toBe(true)

    expect(details.props('modelValue')).toEqual(crsStore.state.details)
    expect(payment.props('modelValue')).toEqual(crsStore.state.payment)
    expect(payment.props('isCheque')).toBe(true)
    expect(payment.props('totalCad')).toBe('0.00')
    expect(address.props('modelValue')).toEqual(crsStore.state.address)
  })

  it('should reset payment state and clear form when payment type changes', async () => {
    const wrapper = await mountSuspended(CreateRoutingSlip, {
      global: { plugins: [createTestingPinia()] }
    })

    const crsStore = useCreateRoutingSlipStore()

    const vm = wrapper.vm as any

    const mockClear = vi.fn()
    vm.formRef.clear = mockClear

    const payment = wrapper.findComponent({ name: 'CreateRoutingSlipPayment' })
    await payment.vm.$emit('change:payment-type')

    expect(crsStore.resetPaymentState).toHaveBeenCalledOnce()
    expect(mockClear).toHaveBeenCalledOnce()
    expect(mockClear).toHaveBeenCalledWith(/^payment.*/)
  })

  it('should reset USD amounts and clear usd fields on USD change', async () => {
    const wrapper = await mountSuspended(CreateRoutingSlip, {
      global: { plugins: [createTestingPinia()] }
    })

    const crsStore = useCreateRoutingSlipStore()

    const vm = wrapper.vm as any

    const mockClear = vi.fn()
    vm.formRef.clear = mockClear

    crsStore.state.payment.paymentItems = { 'uuid-1': {}, 'uuid-2': {} } as any

    const payment = wrapper.findComponent({ name: 'CreateRoutingSlipPayment' })
    await payment.vm.$emit('change:usd')

    expect(crsStore.resetUSDAmounts).toHaveBeenCalledOnce()
    expect(mockClear).toHaveBeenCalledTimes(2)
    expect(mockClear).toHaveBeenCalledWith(new RegExp(`^${'payment.paymentItems.uuid-1.amountUSD'}$`))
    expect(mockClear).toHaveBeenCalledWith(new RegExp(`^${'payment.paymentItems.uuid-2.amountUSD'}$`))
  })

  it('should trigger formRef date validation', async () => {
    const wrapper = await mountSuspended(CreateRoutingSlip, {
      global: { plugins: [createTestingPinia()] }
    })

    const vm = wrapper.vm as any

    const mockValidate = vi.fn()
    vm.formRef.validate = mockValidate

    const validationPath = 'payment.paymentItems.uuid-1.date'

    const payment = wrapper.findComponent({ name: 'CreateRoutingSlipPayment' })
    await payment.vm.$emit('validate-date', validationPath)

    expect(mockValidate).toHaveBeenCalledOnce()
    expect(mockValidate).toHaveBeenCalledWith({ name: validationPath, silent: true })
  })
})
