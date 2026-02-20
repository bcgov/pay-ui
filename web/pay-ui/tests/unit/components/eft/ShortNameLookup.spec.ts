import { mount } from '@vue/test-utils'
import ShortNameLookup from '~/components/eft/ShortNameLookup.vue'
import { ShortNameStatus } from '~/utils/constants'

const mockSearchEftAccounts = vi.fn()
const mockGetAccountLinkDetails = vi.fn()

vi.mock('~/composables/eft/useShortNameLinking', () => ({
  useShortNameLinking: () => ({
    searchEftAccounts: mockSearchEftAccounts,
    getAccountLinkDetails: mockGetAccountLinkDetails
  })
}))

vi.mock('~/utils/common-util', () => ({
  default: {
    formatAmount: vi.fn((amount: number) => `$${amount.toFixed(2)}`)
  }
}))

vi.mock('@vueuse/core', () => ({
  useDebounceFn: (fn: () => void) => fn
}))

describe('ShortNameLookup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSearchEftAccounts.mockResolvedValue([])
    mockGetAccountLinkDetails.mockResolvedValue(new Map())
  })

  it('should render input field', () => {
    const wrapper = mount(ShortNameLookup, {
      global: {
        stubs: {
          UInput: {
            template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
            props: ['modelValue']
          },
          UIcon: true
        }
      }
    })

    expect(wrapper.find('input').exists()).toBe(true)
  })

  it('should emit account event when account is selected', async () => {
    const mockAccount = {
      accountId: 'ACC1',
      accountName: 'Test Account',
      totalDue: 500,
      statusCode: undefined
    }
    mockSearchEftAccounts.mockResolvedValue([mockAccount])
    mockGetAccountLinkDetails.mockResolvedValue(new Map([
      ['ACC1', { statusCode: undefined, totalDue: 500 }]
    ]))

    const wrapper = mount(ShortNameLookup, {
      global: {
        stubs: {
          UInput: {
            template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
            props: ['modelValue']
          },
          UIcon: true
        }
      }
    })

    const vm = wrapper.vm as unknown as {
      selectAccount: (account: typeof mockAccount) => void
    }
    vm.selectAccount(mockAccount)

    expect(wrapper.emitted('account')).toBeTruthy()
    expect(wrapper.emitted('account')![0]).toEqual([mockAccount])
  })

  it('should emit null when selection is cleared', async () => {
    const wrapper = mount(ShortNameLookup, {
      global: {
        stubs: {
          UInput: {
            template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
            props: ['modelValue']
          },
          UIcon: true
        }
      }
    })

    const vm = wrapper.vm as unknown as {
      clearSelection: (emitReset?: boolean) => void
    }
    vm.clearSelection()

    expect(wrapper.emitted('account')).toBeTruthy()
    expect(wrapper.emitted('account')![0]).toEqual([null])
    expect(wrapper.emitted('reset')).toBeFalsy()
  })

  it('should not emit reset when clearing silently', async () => {
    const wrapper = mount(ShortNameLookup, {
      global: {
        stubs: {
          UInput: {
            template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
            props: ['modelValue']
          },
          UIcon: true
        }
      }
    })

    const vm = wrapper.vm as unknown as {
      clearSelectionSilent: () => void
    }
    vm.clearSelectionSilent()

    expect(wrapper.emitted('account')).toBeTruthy()
    expect(wrapper.emitted('reset')).toBeFalsy()
  })

  it('should expose clearSelection method', () => {
    const wrapper = mount(ShortNameLookup, {
      global: {
        stubs: {
          UInput: true,
          UIcon: true
        }
      }
    })

    expect(typeof (wrapper.vm as unknown as { clearSelection: () => void }).clearSelection).toBe('function')
  })

  it('should disable linked accounts', () => {
    const wrapper = mount(ShortNameLookup, {
      global: {
        stubs: {
          UInput: true,
          UIcon: true
        }
      }
    })

    const vm = wrapper.vm as unknown as {
      isShortNameLinkedOrPending: (account: { statusCode?: string }) => boolean
    }

    expect(vm.isShortNameLinkedOrPending({ statusCode: ShortNameStatus.LINKED })).toBe(true)
    expect(vm.isShortNameLinkedOrPending({ statusCode: ShortNameStatus.PENDING })).toBe(true)
    expect(vm.isShortNameLinkedOrPending({ statusCode: undefined })).toBe(false)
  })

  it('should not allow selecting linked accounts', () => {
    const linkedAccount = {
      accountId: 'ACC1',
      accountName: 'Test',
      totalDue: 100,
      statusCode: ShortNameStatus.LINKED
    }

    const wrapper = mount(ShortNameLookup, {
      global: {
        stubs: {
          UInput: true,
          UIcon: true
        }
      }
    })

    const vm = wrapper.vm as unknown as {
      selectAccount: (account: typeof linkedAccount) => void
    }
    vm.selectAccount(linkedAccount)

    expect(wrapper.emitted('account')).toBeFalsy()
  })

  it('should not allow selecting pending accounts', () => {
    const pendingAccount = {
      accountId: 'ACC1',
      accountName: 'Test',
      totalDue: 100,
      statusCode: ShortNameStatus.PENDING
    }

    const wrapper = mount(ShortNameLookup, {
      global: {
        stubs: {
          UInput: true,
          UIcon: true
        }
      }
    })

    const vm = wrapper.vm as unknown as {
      selectAccount: (account: typeof pendingAccount) => void
    }
    vm.selectAccount(pendingAccount)

    expect(wrapper.emitted('account')).toBeFalsy()
  })

  it('should handle search with short term', async () => {
    const wrapper = mount(ShortNameLookup, {
      global: {
        stubs: {
          UInput: {
            template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
            props: ['modelValue']
          },
          UIcon: true
        }
      }
    })

    const input = wrapper.find('input')
    await input.setValue('ab')
    await wrapper.vm.$nextTick()

    expect(mockSearchEftAccounts).not.toHaveBeenCalled()
  })
})
