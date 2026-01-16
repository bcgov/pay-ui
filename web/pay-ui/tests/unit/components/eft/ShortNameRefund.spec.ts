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

  it('should render component', () => {
    const wrapper = createWrapper()
    expect(wrapper.exists()).toBe(true)
  })

  it('should display short name refund header', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Short Name Refund')
  })

  it('should show initiate refund button when no refunds', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Initiate Refund')
  })

  it('should load transactions on mount', async () => {
    createWrapper()
    await flushPromises()

    expect(mockGetPendingRefunds).toHaveBeenCalledWith(123)
  })

  it('should navigate to refund selection on initiate', async () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as unknown as { initiateRefund: () => void }

    vm.initiateRefund()

    expect(mockRouterPush).toHaveBeenCalledWith('/eft/shortname-details/123/refund-selection')
  })

  it('should navigate to refund details', async () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as unknown as { viewRefundDetails: (id: number) => void }

    vm.viewRefundDetails(456)

    expect(mockRouterPush).toHaveBeenCalledWith({
      path: '/eft/shortname-details/123/refund',
      query: { eftRefundId: '456' }
    })
  })

  it('should not navigate without valid id', async () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as unknown as { viewRefundDetails: (id: number) => void }

    vm.viewRefundDetails(0)

    expect(mockRouterPush).not.toHaveBeenCalled()
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

  it('should show decline dialog', async () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as unknown as {
      declineRefund: (item: { id: number }) => void
    }

    vm.declineRefund({ id: 789 })

    expect(wrapper.vm.state.showDeclineDialog).toBe(true)
    expect(wrapper.vm.state.currentEftRefund).toEqual({ id: 789 })
  })

  it('should decline refund with reason', async () => {
    mockGetPendingRefunds.mockResolvedValue([
      { id: 789, refundAmount: 500, refundMethod: 'EFT' }
    ])

    const wrapper = createWrapper()
    await flushPromises()

    wrapper.vm.state.currentEftRefund = { id: 789 }
    wrapper.vm.state.declineReason = 'Invalid request'
    wrapper.vm.state.showDeclineDialog = true

    const vm = wrapper.vm as unknown as { dialogDecline: () => Promise<void> }
    await vm.dialogDecline()

    expect(mockDeclineRefund).toHaveBeenCalledWith(789, 'Invalid request')
    expect(wrapper.emitted('on-short-name-refund')).toBeTruthy()
    expect(wrapper.vm.state.showDeclineDialog).toBe(false)
  })

  it('should cancel decline dialog', async () => {
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

  it('should format currency correctly', () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as unknown as { formatCurrency: (amount: number) => string }

    expect(vm.formatCurrency(1234.56)).toBe('$1234.56')
  })

  it('should disable approve for own refund', () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as unknown as {
      disableApproveRefund: (item: { createdBy?: string }) => boolean
    }

    expect(vm.disableApproveRefund({ createdBy: 'TESTUSER' })).toBe(true)
    expect(vm.disableApproveRefund({ createdBy: 'otheruser' })).toBe(false)
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
