import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import RefundRequestForm from '~/pages/transaction-view/[id]/RefundRequestForm.vue'
import { RefundType } from '~/interfaces/transaction-view'
import type { RefundFormData, RefundLineItem } from '~/interfaces/transaction-view'

const { mockGetUserInfo, mockEmailRules } = vi.hoisted(() => ({
  mockGetUserInfo: vi.fn(() => ({ fullName: 'Test User' }) as { fullName: string } | null),
  mockEmailRules: vi.fn(() => [
    (v: string | null) => !!v || 'Email is required',
    (v: string | null) => !v || /.+@.+\..+/.test(v) || 'Invalid email'
  ])
}))

vi.mock('~/utils/common-util', () => ({
  default: {
    formatAmount: vi.fn((amount: number) => `$${Number(amount).toFixed(2)}`),
    formatToTwoDecimals: vi.fn((amount: number) => Number(amount).toFixed(2)),
    emailRules: mockEmailRules,
    getUserInfo: mockGetUserInfo
  }
}))

const stubs = {
  NuxtLink: { template: '<a><slot /></a>' },
  UIcon: true,
  UAlert: {
    props: ['description'],
    template: '<div class="alert">{{ description }}</div>'
  },
  UCheckbox: {
    name: 'UCheckbox',
    props: ['modelValue', 'label'],
    emits: ['update:modelValue'],
    template: `<input type="checkbox" class="entire" :checked="modelValue"
      @change="$emit('update:modelValue', $event.target.checked)">`
  },
  UInput: {
    name: 'UInput',
    props: ['modelValue', 'placeholder', 'disabled', 'type'],
    emits: ['update:modelValue'],
    template: `<input :data-ph="placeholder" :value="modelValue" :disabled="disabled"
      @input="$emit('update:modelValue', $event.target.value)">`
  },
  UButton: {
    name: 'UButton',
    props: ['label', 'disabled'],
    emits: ['click'],
    template: '<button :data-label="label" :disabled="disabled" @click="$emit(\'click\')">{{ label }}</button>'
  }
}

const lineItem = (overrides: Partial<RefundLineItem> = {}): RefundLineItem => ({
  id: 1,
  description: 'Item One',
  total: 160,
  filingFees: 100,
  serviceFees: 10,
  priorityFees: 30,
  futureEffectiveFees: 20,
  filingFeesRequested: null,
  serviceFeesRequested: null,
  priorityFeesRequested: null,
  futureEffectiveFeesRequested: null,
  refundEntireItemRequested: false,
  ...overrides
})

const defaultProps = {
  totalTransactionAmount: 160,
  refundLineItems: [lineItem()],
  previousRefundedAmount: 0,
  isPartialRefundAllowed: true,
  isFullRefundAllowed: true,
  invoicePaymentMethod: 'DIRECT_PAY' as string | null,
  refundMethod: null as string | null
}

function createWrapper(props: Partial<typeof defaultProps> = {}) {
  return mount(RefundRequestForm, {
    props: { ...defaultProps, ...props },
    global: { stubs }
  })
}

type Wrapper = ReturnType<typeof createWrapper>

const radio = (w: Wrapper, type: RefundType) => w.find(`input[type="radio"][value="${type}"]`)
const input = (w: Wrapper, ph: string) => w.find(`input[data-ph="${ph}"]`)
const reviewBtn = (w: Wrapper) => w.find('button[data-label="Review and Confirm"]')

async function choose(w: Wrapper, type: RefundType) {
  await radio(w, type).setValue(true)
  await nextTick()
  await nextTick()
}

async function fillRequired(w: Wrapper) {
  await input(w, 'Enter email address').setValue('a@b.com')
  await input(w, 'Enter Reasons for Refund').setValue('Duplicate')
}

describe('RefundRequestForm (transaction view) - flows', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('disables the whole form when a previous refund exists', () => {
    const w = createWrapper({ previousRefundedAmount: 50 })
    expect(w.find('.alert').text()).toContain('$50.00')
    expect(radio(w, RefundType.FULL_REFUND).attributes('disabled')).toBeDefined()
    expect(radio(w, RefundType.PARTIAL_REFUND).attributes('disabled')).toBeDefined()
    expect(input(w, 'Enter email address').attributes('disabled')).toBeDefined()
    expect(input(w, 'Enter Reasons for Refund').attributes('disabled')).toBeDefined()
    expect(input(w, 'Enter Staff Comment (Optional)').attributes('disabled')).toBeDefined()
    expect(reviewBtn(w).attributes('disabled')).toBeDefined()
  })

  it('disables the form and shows hint when no refund type is allowed', () => {
    const w = createWrapper({ isFullRefundAllowed: false, isPartialRefundAllowed: false, invoicePaymentMethod: 'PAD' })
    expect(radio(w, RefundType.FULL_REFUND).attributes('disabled')).toBeDefined()
    expect(input(w, 'Enter email address').attributes('disabled')).toBeDefined()
    expect(w.text()).toContain('Partial Refunds not supported for payment method PAD invoices')
    expect(w.text()).toContain('Refund as Account Credits')
  })

  it('only disables the partial option when partial refunds are not allowed', () => {
    const w = createWrapper({ isPartialRefundAllowed: false })
    expect(radio(w, RefundType.FULL_REFUND).attributes('disabled')).toBeUndefined()
    expect(radio(w, RefundType.PARTIAL_REFUND).attributes('disabled')).toBeDefined()
    expect(input(w, 'Enter email address').attributes('disabled')).toBeUndefined()
  })

  it('only disables the full option when full refunds are not allowed', () => {
    const w = createWrapper({ isFullRefundAllowed: false })
    expect(radio(w, RefundType.FULL_REFUND).attributes('disabled')).toBeDefined()
    expect(radio(w, RefundType.PARTIAL_REFUND).attributes('disabled')).toBeUndefined()
    expect(w.text()).not.toContain('Partial Refunds not supported')
  })

  it('prefers explicit refundMethod prop and leaves method empty without payment method', () => {
    const w1 = createWrapper({ refundMethod: 'Cheque' })
    expect(w1.text()).toContain('Cheque')
    const w2 = createWrapper({ invoicePaymentMethod: null })
    expect(w2.text()).not.toContain('Refund back to')
  })

  it('shows all validation errors and does not emit when submitting an empty form', async () => {
    const w = createWrapper()
    await w.find('form').trigger('submit')
    expect(w.text()).toContain('Refund Type is required')
    expect(w.text()).toContain('Email is required')
    expect(w.text()).toContain('Reasons for Refund is required')
    expect(mockEmailRules).toHaveBeenCalledWith(true)
    expect(w.emitted('onProceedToReview')).toBeUndefined()
  })

  it('shows invalid email error from the second rule', async () => {
    const w = createWrapper()
    await choose(w, RefundType.FULL_REFUND)
    await input(w, 'Enter email address').setValue('bad')
    await input(w, 'Enter Reasons for Refund').setValue('r')
    await w.find('form').trigger('submit')
    expect(w.text()).toContain('Invalid email')
    expect(w.text()).not.toContain('Refund Type is required')
    expect(w.text()).not.toContain('Reasons for Refund is required')
    expect(w.emitted('onProceedToReview')).toBeUndefined()
  })

  it('full refund uses the transaction total and emits review data', async () => {
    const w = createWrapper()
    await w.find('form').trigger('submit')
    await choose(w, RefundType.FULL_REFUND)
    expect(w.text()).toContain('$160.00')
    expect(w.text()).not.toContain('Specify Refund Amount')
    expect(reviewBtn(w).attributes('disabled')).toBeUndefined()
    await fillRequired(w)
    await input(w, 'Enter Staff Comment (Optional)').setValue('note')
    await reviewBtn(w).trigger('click')

    expect(w.text()).not.toContain('Refund Type is required')
    expect(w.text()).not.toContain('Email is required')
    const payload = w.emitted('onProceedToReview')![0]![0] as RefundFormData
    expect(payload).toMatchObject({
      refundType: RefundType.FULL_REFUND,
      totalRefundAmount: 160,
      refundMethod: 'Refund back to Credit Card',
      notificationEmail: 'a@b.com',
      reasonsForRefund: 'Duplicate',
      staffComment: 'note',
      requestedBy: 'Test User'
    })
    expect(typeof payload.requestedTime).toBe('string')
  })

  it('sets requestedBy to null when no user info is available', async () => {
    mockGetUserInfo.mockReturnValueOnce(null)
    const w = createWrapper()
    await choose(w, RefundType.FULL_REFUND)
    await fillRequired(w)
    await reviewBtn(w).trigger('click')
    const payload = w.emitted('onProceedToReview')![0]![0] as RefundFormData
    expect(payload.requestedBy).toBeNull()
  })

  it('partial refund shows fee inputs and sums valid requested amounts', async () => {
    const w = createWrapper()
    await choose(w, RefundType.PARTIAL_REFUND)
    expect(w.text()).toContain('Specify Refund Amount')
    expect(w.text()).toContain('Item One ($160.00)')
    expect(w.text()).toContain('Filing Fees / $100.00')
    expect(w.text()).toContain('Service Fees / $10.00')
    expect(w.text()).toContain('Priority Fees / $30.00')
    expect(w.text()).toContain('Future Effective Fees / $20.00')
    expect(input(w, 'Service Fees').attributes('disabled')).toBeDefined()
    expect(reviewBtn(w).attributes('disabled')).toBeDefined()

    await input(w, 'Filing Fees').setValue('40')
    await input(w, 'Priority Fees').setValue('5.5')
    await input(w, 'Future Effective Fees').setValue('2')
    expect(w.text()).toContain('$47.50')
    expect(reviewBtn(w).attributes('disabled')).toBeUndefined()

    await fillRequired(w)
    await reviewBtn(w).trigger('click')
    const payload = w.emitted('onProceedToReview')![0]![0] as RefundFormData
    expect(payload.refundType).toBe(RefundType.PARTIAL_REFUND)
    expect(payload.totalRefundAmount).toBe(47.5)
    expect(payload.refundLineItems[0]).toMatchObject({ filingFeesRequested: 40, priorityFeesRequested: 5.5 })
  })

  it('shows per-fee validation errors, excludes invalid amounts and disables review', async () => {
    const w = createWrapper()
    await choose(w, RefundType.PARTIAL_REFUND)
    await input(w, 'Filing Fees').setValue('150')
    expect(w.text()).toContain('Refund amount exceeds $100.00')
    await input(w, 'Priority Fees').setValue('-5')
    expect(w.text()).toContain('Refund amount cannot be negative')
    await input(w, 'Future Effective Fees').setValue('1.234')
    expect(w.text()).toContain('Maximum 2 decimal places allowed')
    // only the 1.234 future effective fee is valid for the total
    expect(w.text()).toContain('$1.23')
    expect(reviewBtn(w).attributes('disabled')).toBeDefined()
  })

  it('flags service fee and non-numeric errors', async () => {
    const w = createWrapper({
      refundLineItems: [lineItem({ serviceFeesRequested: 50 as unknown as number, filingFeesRequested: 1 })]
    })
    await choose(w, RefundType.PARTIAL_REFUND)
    expect(w.text()).toContain('Refund amount exceeds $10.00')
    await input(w, 'Filing Fees').setValue('abc')
    expect(w.text()).toContain('Enter a valid number')
  })

  it('refund entire item fills the requested amounts and locks the inputs', async () => {
    const w = createWrapper()
    await choose(w, RefundType.PARTIAL_REFUND)
    await w.find('input.entire').setValue(true)
    await nextTick()
    expect((input(w, 'Filing Fees').element as HTMLInputElement).value).toBe('100.00')
    expect((input(w, 'Priority Fees').element as HTMLInputElement).value).toBe('30.00')
    expect((input(w, 'Future Effective Fees').element as HTMLInputElement).value).toBe('20.00')
    expect(input(w, 'Filing Fees').attributes('disabled')).toBeDefined()
    expect(w.text()).toContain('$150.00')

    await w.find('input.entire').setValue(false)
    await nextTick()
    expect(input(w, 'Filing Fees').attributes('disabled')).toBeUndefined()
    expect(w.text()).toContain('$150.00')
  })

  it('omits inputs for fees that are zero', async () => {
    const w = createWrapper({
      refundLineItems: [
        lineItem({ id: 1, filingFees: 0 }),
        lineItem({ id: 2, description: 'Item Two', serviceFees: 0, priorityFees: 0, futureEffectiveFees: 0 })
      ]
    })
    await choose(w, RefundType.PARTIAL_REFUND)
    expect(w.findAll('input[data-ph="Filing Fees"]')).toHaveLength(1)
    expect(w.findAll('input[data-ph="Service Fees"]')).toHaveLength(0)
    expect(w.findAll('input[data-ph="Priority Fees"]')).toHaveLength(0)
    expect(w.text()).toContain('Item Two')
  })

  it('switching from partial back to full recalculates the total', async () => {
    const w = createWrapper()
    await choose(w, RefundType.PARTIAL_REFUND)
    await input(w, 'Filing Fees').setValue('10')
    expect(w.text()).toContain('$10.00')
    await choose(w, RefundType.FULL_REFUND)
    expect(w.text()).toContain('$160.00')
    expect(w.text()).not.toContain('Specify Refund Amount')
  })

  it('re-syncs line items when the prop changes and does not mutate the prop', async () => {
    const items = [lineItem()]
    const w = createWrapper({ refundLineItems: items })
    await choose(w, RefundType.PARTIAL_REFUND)
    await input(w, 'Filing Fees').setValue('10')
    expect(items[0]!.filingFeesRequested).toBeNull()
    await w.setProps({ refundLineItems: [lineItem({ id: 9, description: 'Replaced' })] })
    expect(w.text()).toContain('Replaced')
    expect(w.text()).not.toContain('Item One')
  })

  it('updates refund method when payment method or refundMethod props change', async () => {
    const w = createWrapper()
    await w.setProps({ invoicePaymentMethod: 'EFT' })
    expect(w.text()).toContain('Refund back to Short Name')
    await w.setProps({ refundMethod: 'Manual' })
    expect(w.text()).toContain('Manual')
  })
})
