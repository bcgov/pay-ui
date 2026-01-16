import { mount } from '@vue/test-utils'
import ShortNameLinkingDialog from '~/components/eft/ShortNameLinkingDialog.vue'

const mockGetStatementId = vi.fn()
const mockLinkShortNameToAccount = vi.fn()
const mockIsAlreadyMappedError = vi.fn()

vi.mock('~/composables/eft/useShortNameLinking', () => ({
  useShortNameLinking: () => ({
    getStatementId: mockGetStatementId,
    linkShortNameToAccount: mockLinkShortNameToAccount,
    isAlreadyMappedError: mockIsAlreadyMappedError
  })
}))

vi.mock('~/utils/common-util', () => ({
  default: {
    formatAmount: vi.fn((amount: number | undefined) => amount ? `$${amount.toFixed(2)}` : '$0.00')
  }
}))

vi.mock('~/utils/short-name-util', () => ({
  default: {
    getShortNameTypeDescription: vi.fn((type: string) => type === 'EFT' ? 'EFT' : 'Wire Transfer')
  }
}))

describe('ShortNameLinkingDialog', () => {
  const defaultProps = {
    open: true,
    shortName: {
      id: 123,
      shortName: 'TEST_SN',
      shortNameType: 'EFT' as const,
      creditsRemaining: 1000,
      linkedAccountsCount: 0
    }
  }

  const createWrapper = (props = {}) => {
    return mount(ShortNameLinkingDialog, {
      props: { ...defaultProps, ...props },
      global: {
        stubs: {
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
            props: ['label', 'loading', 'disabled']
          },
          UIcon: true,
          ShortNameLookup: {
            template: '<div class="short-name-lookup"></div>',
            methods: {
              clearSelection: vi.fn()
            }
          }
        }
      }
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetStatementId.mockResolvedValue(456)
    mockLinkShortNameToAccount.mockResolvedValue({ success: true, data: {} })
    mockIsAlreadyMappedError.mockReturnValue(false)
  })

  it('should render modal when open', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.modal').exists()).toBe(true)
  })

  it('should not render modal when closed', () => {
    const wrapper = createWrapper({ open: false })
    expect(wrapper.find('.modal').exists()).toBe(false)
  })

  it('should display short name in title', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('TEST_SN')
  })

  it('should emit update:open when close button is clicked', async () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as unknown as { closeDialog: () => void }
    vm.closeDialog()

    expect(wrapper.emitted('update:open')).toBeTruthy()
    expect(wrapper.emitted('update:open')![0]).toEqual([false])
  })

  it('should fetch statement ID when account is selected', async () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as unknown as {
      onAccountSelected: (account: { accountId?: string } | null) => void
    }

    await vm.onAccountSelected({ accountId: 'ACC123' })
    await wrapper.vm.$nextTick()

    expect(mockGetStatementId).toHaveBeenCalledWith('ACC123')
  })

  it('should clear statement ID when account is cleared', async () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as unknown as {
      onAccountSelected: (account: null) => void
      statementId: { value: number | null }
    }

    vm.onAccountSelected(null)
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.statementId).toBeNull()
  })

  it('should link account successfully', async () => {
    mockLinkShortNameToAccount.mockResolvedValue({
      success: true,
      data: { shortNameId: 123, accountId: 'ACC1' }
    })

    const wrapper = createWrapper()
    wrapper.vm.selectedAccount = { accountId: 'ACC1', accountName: 'Test', totalDue: 500 }
    await wrapper.vm.$nextTick()

    const vm = wrapper.vm as unknown as { linkAccount: () => Promise<void> }
    await vm.linkAccount()

    expect(mockLinkShortNameToAccount).toHaveBeenCalledWith(123, 'ACC1')
    expect(wrapper.emitted('link-account')).toBeTruthy()
    expect(wrapper.emitted('update:open')).toBeTruthy()
  })

  it('should handle already mapped error', async () => {
    mockLinkShortNameToAccount.mockResolvedValue({
      success: false,
      errorType: 'EFT_SHORT_NAME_ALREADY_MAPPED'
    })
    mockIsAlreadyMappedError.mockReturnValue(true)

    const wrapper = createWrapper()
    wrapper.vm.selectedAccount = { accountId: 'ACC1', accountName: 'Test', totalDue: 500 }

    const vm = wrapper.vm as unknown as { linkAccount: () => Promise<void> }
    await vm.linkAccount()

    expect(wrapper.vm.errorDialogOpen).toBe(true)
    expect(wrapper.vm.errorDialogTitle).toContain('Already Linked')
  })

  it('should handle generic error', async () => {
    mockLinkShortNameToAccount.mockResolvedValue({
      success: false,
      errorType: 'UNKNOWN_ERROR'
    })
    mockIsAlreadyMappedError.mockReturnValue(false)

    const wrapper = createWrapper()
    wrapper.vm.selectedAccount = { accountId: 'ACC1', accountName: 'Test', totalDue: 500 }

    const vm = wrapper.vm as unknown as { linkAccount: () => Promise<void> }
    await vm.linkAccount()

    expect(wrapper.vm.errorDialogOpen).toBe(true)
    expect(wrapper.vm.errorDialogTitle).toContain('Wrong')
  })

  it('should not link if no shortName', async () => {
    const wrapper = createWrapper({ shortName: null })
    wrapper.vm.selectedAccount = { accountId: 'ACC1', accountName: 'Test', totalDue: 500 }

    const vm = wrapper.vm as unknown as { linkAccount: () => Promise<void> }
    await vm.linkAccount()

    expect(mockLinkShortNameToAccount).not.toHaveBeenCalled()
  })

  it('should not link if no selectedAccount', async () => {
    const wrapper = createWrapper()

    const vm = wrapper.vm as unknown as { linkAccount: () => Promise<void> }
    await vm.linkAccount()

    expect(mockLinkShortNameToAccount).not.toHaveBeenCalled()
  })

  it('should detect amount mismatch', () => {
    const wrapper = createWrapper({
      shortName: {
        id: 123,
        shortName: 'TEST',
        shortNameType: 'EFT',
        creditsRemaining: 1000,
        linkedAccountsCount: 0
      }
    })

    wrapper.vm.selectedAccount = { accountId: 'ACC1', accountName: 'Test', totalDue: 500 }
    expect(wrapper.vm.isAmountMismatch).toBe(true)
  })

  it('should not detect mismatch when amounts match', () => {
    const wrapper = createWrapper({
      shortName: {
        id: 123,
        shortName: 'TEST',
        shortNameType: 'EFT',
        creditsRemaining: 500,
        linkedAccountsCount: 0
      }
    })

    wrapper.vm.selectedAccount = { accountId: 'ACC1', accountName: 'Test', totalDue: 500 }
    expect(wrapper.vm.isAmountMismatch).toBe(false)
  })

  it('should reset dialog state when closed', async () => {
    const wrapper = createWrapper()
    wrapper.vm.selectedAccount = { accountId: 'ACC1', accountName: 'Test', totalDue: 500 }
    wrapper.vm.statementId = 789

    await wrapper.setProps({ open: false })
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.selectedAccount).toBeNull()
    expect(wrapper.vm.statementId).toBeNull()
  })

  it('should display short name type description', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('EFT')
  })
})
