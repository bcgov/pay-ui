import { mountSuspended } from '@nuxt/test-utils/runtime'
import AmountInput from '~/components/common/AmountInput.vue'
import ReviewRoutingSlipChequePayment from '~/components/ReviewRoutingSlip/ReviewRoutingSlipChequePayment.vue'

describe('AmountInput', () => {
  it('renders a number input with the amount and emits typed values', async () => {
    const wrapper = await mountSuspended(AmountInput, {
      props: { id: 'amount', label: 'Amount (CAD$)', modelValue: '520' }
    })
    const input = wrapper.find('input')
    expect(input.attributes('type')).toBe('number')
    expect((input.element as HTMLInputElement).value).toBe('520')

    await input.setValue('520.68')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([520.68])
  })

  it('does not rewrite the input while cents are typed into a cheque amount wired to the real store', async () => {
    const { store } = useRoutingSlipStore()
    store.routingSlip.payments = [{ chequeReceiptNumber: '0001', paymentDate: '2026-09-15', paidAmount: 500 }]
    const Harness = defineComponent({
      setup: () => () => h(ReviewRoutingSlipChequePayment, {
        chequePayment: store.routingSlip.payments,
        isEditable: true
      })
    })
    const wrapper = await mountSuspended(Harness)
    const el = wrapper.find('[data-test="txt-paid-amount-0"]').element as HTMLInputElement

    // In Chrome, any write to a number input's value mid-typing drops a trailing "." and moves the cursor to the start
    const valueProp = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value')!
    const writes: string[] = []
    Object.defineProperty(el, 'value', {
      configurable: true,
      get: () => valueProp.get!.call(el),
      set: (value) => {
        writes.push(String(value))
        valueProp.set!.call(el, value)
      }
    })
    const type = async (text: string) => {
      valueProp.set!.call(el, text)
      el.dispatchEvent(new Event('input'))
      await nextTick()
    }

    for (const text of ['500.', '500.0', '500.05']) {
      await type(text)
    }
    expect(writes).toEqual([])
    expect(el.value).toBe('500.05')
    expect(store.routingSlip.payments?.[0]?.paidAmount).toBe(500.05)
  })
})
