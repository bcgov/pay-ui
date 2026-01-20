import { mount } from '@vue/test-utils'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import ShortNameRefund from '~/components/eft/ShortNameRefund.vue'
import '~/utils/constants'

const mockGetPendingRefunds = vi.fn()
const mockApproveRefund = vi.fn()
const mockDeclineRefund = vi.fn()
const mockRouterPush = vi.fn()

mockNuxtImport('useRouter', () => () => ({
  push: mockRouterPush
}))

vi.mock('~/composables/eft/useEftRefund', () => ({
  useEftRefund: () => ({
    getPendingRefunds: mockGetPendingRefunds,
    approveRefund: mockApproveRefund,
    declineRefund: mockDeclineRefund
  })
}))

vi.mock('~/utils/common-util', () => ({
  default: {
    formatAmount: vi.fn((amount: number) => `$${amount.toFixed(2)}`),
    isEftRefundApprover: vi.fn(() => true),
    getUserInfo: vi.fn(() => ({ userName: 'testuser' }))
  }
}))

describe('ShortNameRefund', () => {
  const defaultProps = {
    shortNameDetails: {
      id: 123,
      shortName: 'TEST_SN',
      shortNameType: 'EFT',
      creditsRemaining: 1000,
      linkedAccountsCount: 2
    },
    shortName: {
      id: 123,
      shortName: 'TEST_SN',
      shortNameType: 'EFT',
      casSupplierNumber: 'SUP123'
    },
    unsettledAmount: '$1,000.00'
  }

  const createWrapper = (props = {}) => {
    return mount(ShortNameRefund, {
      props: { ...defaultProps, ...props },
      global: {
        stubs: {
          UTable: {
            template: `
              <div class="table">
                <slot name="refundMethod-cell" :row="{ original: mockRow }" />
                <slot name="refundAmount-cell" :row="{ original: mockRow }" />
                <slot name="actions-cell" :row="{ original: mockRow }" />
              </div>
            `,
            props: ['data', 'columns', 'loading'],
            data: () => ({
              mockRow: { id: 1, refundMethod: 'EFT', refundAmount: 500 }
            })
          },
          UModal: {
            template: `
              <div v-if="open" class="modal">
                <slot name="header" />
                <slot name="body" />
                <slot name="footer" />
              </div>
            `,
            props: ['open']
          },
          UButton: {
            template: '<button @click="$emit(\'click\')" :disabled="disabled"><slot />{{ label }}</button>',
            props: ['label', 'loading', 'disabled', 'icon']
          },
          UInput: {
            template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
            props: ['modelValue', 'placeholder']
          },
          UIcon: true
        }
      }
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetPendingRefunds.mockResolvedValue([])
    mockApproveRefund.mockResolvedValue(undefined)
    mockDeclineRefund.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should render component with header and button', async () => {
    const wrapper = createWrapper()
    await flushPromises()

    expect(wrapper.exists()).toBe(true)
    expect(wrapper.text()).toContain('Short Name Refund')
    expect(wrapper.text()).toContain('Initiate Refund')
    expect(mockGetPendingRefunds).toHaveBeenCalledWith(123)
  })

  it('should navigate to refund selection and details', () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as any

    vm.initiateRefund()
    expect(mockRouterPush).toHaveBeenCalledWith('/eft/shortname-details/123/refund-selection')

    mockRouterPush.mockClear()
    vm.viewRefundDetails(456)
    expect(mockRouterPush).toHaveBeenCalledWith({ path: '/eft/shortname-details/123/refund', query: { eftRefundId: '456' } })

    wrapper.unmount()
  })

  it('should approve refund', async () => {
    mockGetPendingRefunds.mockResolvedValue([
      { id: 789, refundAmount: 500, refundMethod: 'EFT', createdBy: 'otheruser' }
    ])

    const wrapper = createWrapper()
    await flushPromises()

    const vm = wrapper.vm as unknown as {
      approveRefund: (item: { id: number }) => Promise<void>
    }
    await vm.approveRefund({ id: 789 })

    expect(mockApproveRefund).toHaveBeenCalledWith(789)
    expect(wrapper.emitted('on-short-name-refund')).toBeTruthy()
  })

  it('should show and handle decline dialog', async () => {
    mockGetPendingRefunds.mockResolvedValue([
      { id: 789, refundAmount: 500, refundMethod: 'EFT' }
    ])

    const wrapper = createWrapper()
    await flushPromises()

    const vm = wrapper.vm as any
    vm.declineRefund({ id: 789 })

    expect(wrapper.vm.state.showDeclineDialog).toBe(true)
    expect(wrapper.vm.state.currentEftRefund).toEqual({ id: 789 })

    wrapper.vm.state.declineReason = 'Invalid request'
    await vm.dialogDecline()

    expect(mockDeclineRefund).toHaveBeenCalledWith(789, 'Invalid request')
    expect(wrapper.emitted('on-short-name-refund')).toBeTruthy()
    expect(wrapper.vm.state.showDeclineDialog).toBe(false)
  })

  it('should cancel decline dialog and reset state', () => {
    const wrapper = createWrapper()
    wrapper.vm.state.showDeclineDialog = true
    wrapper.vm.state.currentEftRefund = { id: 789 }
    wrapper.vm.state.declineReason = 'Some reason'

    const vm = wrapper.vm as unknown as { dialogCancel: () => void }
    vm.dialogCancel()

    expect(wrapper.vm.state.showDeclineDialog).toBe(false)
    expect(wrapper.vm.state.currentEftRefund).toBeNull()
    expect(wrapper.vm.state.declineReason).toBe('')
  })

  it('should format currency and check approval permissions', () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as any

    expect(vm.formatCurrency(1234.56)).toBe('$1234.56')
    expect(vm.disableApproveRefund({ createdBy: 'TESTUSER' })).toBe(true)
    expect(vm.disableApproveRefund({ createdBy: 'otheruser' })).toBe(false)

    wrapper.unmount()
  })

  it('should reload on shortNameDetails change', async () => {
    const wrapper = createWrapper()
    await flushPromises()

    mockGetPendingRefunds.mockClear()
    await wrapper.setProps({
      shortNameDetails: { ...defaultProps.shortNameDetails, id: 456 }
    })
    await flushPromises()

    expect(mockGetPendingRefunds).toHaveBeenCalledWith(456)
  })

  it('should not navigate without shortNameDetails', () => {
    const wrapper = createWrapper({ shortNameDetails: null })
    const vm = wrapper.vm as unknown as { initiateRefund: () => void }

    vm.initiateRefund()

    expect(mockRouterPush).not.toHaveBeenCalled()
  })
})

async function flushPromises() {
  return new Promise(resolve => setTimeout(resolve, 0))
}
