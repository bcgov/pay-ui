import { mount } from '@vue/test-utils'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import ShortNameAccountLink from '~/components/eft/ShortNameAccountLink.vue'
import { ConfirmationType } from '~/utils/constants'

const mockLoadShortNameLinks = vi.fn()
const mockUnlinkAccount = vi.fn()
const mockApplyPayment = vi.fn()
const mockCancelPayment = vi.fn()
const mockToggleStatementsView = vi.fn()

const mockProcessedRows = ref([])
const mockIsLinked = ref(false)
const mockLoading = ref(false)
const mockExpandedStatements = ref(new Set())

vi.mock('~/composables/eft/useShortNameAccountLink', () => ({
  useShortNameAccountLink: () => ({
    loading: mockLoading,
    processedRows: mockProcessedRows,
    isLinked: mockIsLinked,
    loadShortNameLinks: mockLoadShortNameLinks,
    unlinkAccount: mockUnlinkAccount,
    applyPayment: mockApplyPayment,
    cancelPayment: mockCancelPayment,
    isStatementsExpanded: vi.fn((id: number) => mockExpandedStatements.value.has(id)),
    toggleStatementsView: mockToggleStatementsView,
    showUnlinkAccountButton: vi.fn(item => item.amountOwing === 0 && item.isParentRow),
    showApplyPaymentButton: vi.fn(item => !item.hasPendingPayment && item.amountOwing > 0),
    showCancelPaymentButton: vi.fn(item => item.hasPendingPayment && !item.hasMultipleStatements)
  })
}))

vi.mock('~/utils/common-util', () => ({
  default: {
    formatAmount: vi.fn((amount: number) => `$${amount.toFixed(2)}`),
    formatAccountDisplayName: vi.fn(item => item.accountName || `Account ${item.accountId}`)
  }
}))

mockNuxtImport('useI18n', () => () => ({
  t: vi.fn((key: string, params?: Record<string, string>) => {
    if (key === 'page.eft.shortNameDetails.label.accountsLinkedTo') {
      return `Accounts linked to ${params?.shortName}`
    }
    return key
  })
}))

describe('ShortNameAccountLink', () => {
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
      shortNameType: 'EFT'
    },
    highlightIndex: -1
  }

  const createWrapper = (props = {}) => {
    return mount(ShortNameAccountLink, {
      props: { ...defaultProps, ...props },
      global: {
        stubs: {
          UTable: {
            template: `
              <div class="table">
                <slot name="linkedAccount-cell" :row="{ original: mockRow }" :index="0" />
                <slot name="accountBranch-cell" :row="{ original: mockRow }" />
                <slot name="unpaidStatementIds-cell" :row="{ original: mockRow }" />
                <slot name="amountOwing-cell" :row="{ original: mockRow }" />
                <slot name="actions-cell" :row="{ original: mockRow }" :index="0" />
                <slot name="loading" />
                <slot name="empty" />
              </div>
            `,
            props: ['data', 'columns', 'loading'],
            data: () => ({
              mockRow: {
                id: 1,
                accountId: 100,
                accountName: 'Test Account',
                accountBranch: 'Vancouver',
                isParentRow: true,
                hasMultipleStatements: false,
                hasPendingPayment: false,
                hasPayableStatement: true,
                hasInsufficientFunds: false,
                amountOwing: 500,
                pendingPaymentAmountTotal: 0,
                unpaidStatementIds: '1',
                statementsOwing: [{ statementId: 1, amountOwing: 500 }]
              }
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
            props: ['label', 'loading', 'disabled']
          },
          UIcon: true,
          UTooltip: true,
          UDropdownMenu: true,
          ShortNameLinkingDialog: true
        }
      }
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockProcessedRows.value = []
    mockIsLinked.value = false
    mockLoading.value = false
    mockExpandedStatements.value = new Set()
    mockLoadShortNameLinks.mockResolvedValue(undefined)
    mockUnlinkAccount.mockResolvedValue(true)
    mockApplyPayment.mockResolvedValue(true)
    mockCancelPayment.mockResolvedValue(true)
  })

  it('should render component', () => {
    const wrapper = createWrapper()
    expect(wrapper.exists()).toBe(true)
  })

  it('should display short name in header', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('TEST_SN')
  })

  it('should show link button when not linked', () => {
    mockIsLinked.value = false
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Link to Account')
  })

  it('should load short name links on mount', async () => {
    createWrapper()
    await flushPromises()

    expect(mockLoadShortNameLinks).toHaveBeenCalled()
  })

  it('should open account linking dialog', () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as unknown as { openAccountLinkingDialog: () => void }

    vm.openAccountLinkingDialog()

    expect(wrapper.vm.state.isShortNameLinkingDialogOpen).toBe(true)
  })

  it('should emit on-link-account event', async () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as unknown as { onLinkAccount: (account: unknown) => Promise<void> }

    await vm.onLinkAccount({ accountId: 'ACC1' })

    expect(wrapper.emitted('on-link-account')).toBeTruthy()
    expect(wrapper.emitted('on-payment-action')).toBeTruthy()
  })

  it('should show confirm unlink modal', () => {
    const wrapper = createWrapper()
    const item = {
      id: 1,
      accountId: 100,
      isParentRow: true,
      statementsOwing: [],
      amountOwing: 0,
      statusCode: 'LINKED',
      shortNameId: 123,
      hasMultipleStatements: false,
      hasPendingPayment: false,
      hasPayableStatement: false,
      hasInsufficientFunds: false,
      pendingPaymentAmountTotal: 0,
      unpaidStatementIds: ''
    }

    const vm = wrapper.vm as unknown as {
      showConfirmUnlinkAccountModal: (item: typeof item) => void
    }
    vm.showConfirmUnlinkAccountModal(item)

    expect(wrapper.vm.state.showConfirmDialog).toBe(true)
    expect(wrapper.vm.state.confirmDialogTitle).toBe('Unlink Account')
    expect(wrapper.vm.state.confirmObject?.type).toBe(ConfirmationType.UNLINK_ACCOUNT)
  })

  it('should show confirm cancel payment modal', () => {
    const wrapper = createWrapper()
    const item = {
      id: 1,
      accountId: 100,
      isParentRow: true,
      statementsOwing: [],
      amountOwing: 500,
      statusCode: 'LINKED',
      shortNameId: 123,
      hasMultipleStatements: false,
      hasPendingPayment: true,
      hasPayableStatement: true,
      hasInsufficientFunds: false,
      pendingPaymentAmountTotal: 200,
      unpaidStatementIds: '1'
    }

    const vm = wrapper.vm as unknown as {
      showConfirmCancelPaymentModal: (item: typeof item) => void
    }
    vm.showConfirmCancelPaymentModal(item)

    expect(wrapper.vm.state.showConfirmDialog).toBe(true)
    expect(wrapper.vm.state.confirmDialogTitle).toBe('Cancel Payment')
    expect(wrapper.vm.state.confirmObject?.type).toBe(ConfirmationType.CANCEL_PAYMENT)
  })

  it('should confirm unlink account', async () => {
    const wrapper = createWrapper()
    const item = {
      id: 456,
      accountId: 100,
      isParentRow: true,
      statementsOwing: [],
      amountOwing: 0,
      statusCode: 'LINKED',
      shortNameId: 123,
      hasMultipleStatements: false,
      hasPendingPayment: false,
      hasPayableStatement: false,
      hasInsufficientFunds: false,
      pendingPaymentAmountTotal: 0,
      unpaidStatementIds: ''
    }

    wrapper.vm.state.confirmObject = { item, type: ConfirmationType.UNLINK_ACCOUNT }

    const vm = wrapper.vm as unknown as { dialogConfirm: () => Promise<void> }
    await vm.dialogConfirm()

    expect(mockUnlinkAccount).toHaveBeenCalledWith(456)
    expect(wrapper.vm.state.showConfirmDialog).toBe(false)
  })

  it('should confirm cancel payment', async () => {
    const wrapper = createWrapper()
    const item = {
      id: 1,
      accountId: 100,
      isParentRow: false,
      statementsOwing: [],
      amountOwing: 500,
      statusCode: 'LINKED',
      shortNameId: 123,
      hasMultipleStatements: false,
      hasPendingPayment: true,
      hasPayableStatement: true,
      hasInsufficientFunds: false,
      pendingPaymentAmountTotal: 200,
      unpaidStatementIds: '1',
      statementId: 789
    }

    wrapper.vm.state.confirmObject = { item, type: ConfirmationType.CANCEL_PAYMENT }

    const vm = wrapper.vm as unknown as { dialogConfirm: () => Promise<void> }
    await vm.dialogConfirm()

    expect(mockCancelPayment).toHaveBeenCalledWith(100, 789)
    expect(wrapper.emitted('on-payment-action')).toBeTruthy()
  })

  it('should close confirm dialog', () => {
    const wrapper = createWrapper()
    wrapper.vm.state.showConfirmDialog = true

    const vm = wrapper.vm as unknown as { dialogConfirmClose: () => void }
    vm.dialogConfirmClose()

    expect(wrapper.vm.state.showConfirmDialog).toBe(false)
  })

  it('should handle apply payment', async () => {
    const wrapper = createWrapper()
    const item = {
      id: 1,
      accountId: 100,
      isParentRow: false,
      statementsOwing: [],
      amountOwing: 500,
      statusCode: 'LINKED',
      shortNameId: 123,
      hasMultipleStatements: false,
      hasPendingPayment: false,
      hasPayableStatement: true,
      hasInsufficientFunds: false,
      pendingPaymentAmountTotal: 0,
      unpaidStatementIds: '1',
      statementId: 789
    }

    const vm = wrapper.vm as unknown as {
      handleApplyPayment: (item: typeof item) => Promise<void>
    }
    await vm.handleApplyPayment(item)

    expect(mockApplyPayment).toHaveBeenCalledWith(100, 789)
    expect(wrapper.emitted('on-payment-action')).toBeTruthy()
  })

  it('should handle row toggle', () => {
    const wrapper = createWrapper()
    const item = {
      id: 1,
      accountId: 100,
      isParentRow: true,
      statementsOwing: [
        { statementId: 1, amountOwing: 300 },
        { statementId: 2, amountOwing: 200 }
      ],
      amountOwing: 500,
      statusCode: 'LINKED',
      shortNameId: 123,
      hasMultipleStatements: true,
      hasPendingPayment: false,
      hasPayableStatement: true,
      hasInsufficientFunds: false,
      pendingPaymentAmountTotal: 0,
      unpaidStatementIds: '1, 2'
    }

    const vm = wrapper.vm as unknown as {
      handleRowToggle: (item: typeof item) => void
    }
    vm.handleRowToggle(item)

    expect(mockToggleStatementsView).toHaveBeenCalledWith(100)
  })

  it('should not toggle for non-parent rows', () => {
    const wrapper = createWrapper()
    const item = {
      id: 1,
      accountId: 100,
      isParentRow: false,
      statementsOwing: [{ statementId: 1, amountOwing: 300 }],
      amountOwing: 300,
      statusCode: 'LINKED',
      shortNameId: 123,
      hasMultipleStatements: false,
      hasPendingPayment: false,
      hasPayableStatement: true,
      hasInsufficientFunds: false,
      pendingPaymentAmountTotal: 0,
      unpaidStatementIds: '1'
    }

    const vm = wrapper.vm as unknown as {
      handleRowToggle: (item: typeof item) => void
    }
    vm.handleRowToggle(item)

    expect(mockToggleStatementsView).not.toHaveBeenCalled()
  })

  it('should format currency', () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as unknown as { formatCurrency: (amount: number) => string }

    expect(vm.formatCurrency(1234.56)).toBe('$1234.56')
  })

  it('should format account display name', () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as unknown as {
      formatAccountDisplayName: (item: { accountName?: string, accountId: number }) => string
    }

    expect(vm.formatAccountDisplayName({ accountName: 'Test', accountId: 100 })).toBe('Test')
  })

  it('should reload on shortNameDetails id change', async () => {
    const wrapper = createWrapper()
    await flushPromises()

    mockLoadShortNameLinks.mockClear()
    await wrapper.setProps({
      shortNameDetails: { ...defaultProps.shortNameDetails, id: 456 }
    })
    await flushPromises()

    expect(mockLoadShortNameLinks).toHaveBeenCalled()
  })

  it('should handle unlink account failure', async () => {
    mockUnlinkAccount.mockResolvedValue(false)
    const wrapper = createWrapper()
    const item = {
      id: 456,
      accountId: 100,
      isParentRow: true,
      statementsOwing: [],
      amountOwing: 0,
      statusCode: 'LINKED',
      shortNameId: 123,
      hasMultipleStatements: false,
      hasPendingPayment: false,
      hasPayableStatement: false,
      hasInsufficientFunds: false,
      pendingPaymentAmountTotal: 0,
      unpaidStatementIds: ''
    }

    wrapper.vm.state.confirmObject = { item, type: ConfirmationType.UNLINK_ACCOUNT }

    const vm = wrapper.vm as unknown as { dialogConfirm: () => Promise<void> }
    await vm.dialogConfirm()

    expect(mockUnlinkAccount).toHaveBeenCalledWith(456)
  })

  it('should handle apply payment failure', async () => {
    mockApplyPayment.mockResolvedValue(false)
    const wrapper = createWrapper()
    const item = {
      id: 1,
      accountId: 100,
      isParentRow: false,
      statementsOwing: [],
      amountOwing: 500,
      statusCode: 'LINKED',
      shortNameId: 123,
      hasMultipleStatements: false,
      hasPendingPayment: false,
      hasPayableStatement: true,
      hasInsufficientFunds: false,
      pendingPaymentAmountTotal: 0,
      unpaidStatementIds: '1',
      statementId: 789
    }

    const vm = wrapper.vm as unknown as {
      handleApplyPayment: (item: typeof item) => Promise<void>
    }
    await vm.handleApplyPayment(item)

    expect(mockApplyPayment).toHaveBeenCalledWith(100, 789)
  })

  it('should handle cancel payment failure', async () => {
    mockCancelPayment.mockResolvedValue(false)
    const wrapper = createWrapper()
    const item = {
      id: 1,
      accountId: 100,
      isParentRow: false,
      statementsOwing: [],
      amountOwing: 500,
      statusCode: 'LINKED',
      shortNameId: 123,
      hasMultipleStatements: false,
      hasPendingPayment: true,
      hasPayableStatement: true,
      hasInsufficientFunds: false,
      pendingPaymentAmountTotal: 200,
      unpaidStatementIds: '1',
      statementId: 789
    }

    wrapper.vm.state.confirmObject = { item, type: ConfirmationType.CANCEL_PAYMENT }

    const vm = wrapper.vm as unknown as { dialogConfirm: () => Promise<void> }
    await vm.dialogConfirm()

    expect(mockCancelPayment).toHaveBeenCalledWith(100, 789)
  })

  it('should apply payment without statementId for parent row', async () => {
    const wrapper = createWrapper()
    const item = {
      id: 1,
      accountId: 200,
      isParentRow: true,
      statementsOwing: [],
      amountOwing: 500,
      statusCode: 'LINKED',
      shortNameId: 123,
      hasMultipleStatements: false,
      hasPendingPayment: false,
      hasPayableStatement: true,
      hasInsufficientFunds: false,
      pendingPaymentAmountTotal: 0,
      unpaidStatementIds: '1'
    }

    const vm = wrapper.vm as unknown as {
      handleApplyPayment: (item: typeof item) => Promise<void>
    }
    await vm.handleApplyPayment(item)

    expect(mockApplyPayment).toHaveBeenCalledWith(200, undefined)
  })

  it('should cancel payment without statementId for parent row', async () => {
    const wrapper = createWrapper()
    const item = {
      id: 1,
      accountId: 200,
      isParentRow: true,
      statementsOwing: [],
      amountOwing: 500,
      statusCode: 'LINKED',
      shortNameId: 123,
      hasMultipleStatements: false,
      hasPendingPayment: true,
      hasPayableStatement: true,
      hasInsufficientFunds: false,
      pendingPaymentAmountTotal: 200,
      unpaidStatementIds: '1'
    }

    wrapper.vm.state.confirmObject = { item, type: ConfirmationType.CANCEL_PAYMENT }

    const vm = wrapper.vm as unknown as { dialogConfirm: () => Promise<void> }
    await vm.dialogConfirm()

    expect(mockCancelPayment).toHaveBeenCalledWith(200, undefined)
  })

  it('should close account linking dialog', () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as unknown as { state: { isShortNameLinkingDialogOpen: boolean } }
    vm.state.isShortNameLinkingDialogOpen = true

    vm.state.isShortNameLinkingDialogOpen = false

    expect(vm.state.isShortNameLinkingDialogOpen).toBe(false)
  })

  it('should reload on linked accounts count change', async () => {
    const wrapper = createWrapper()
    await flushPromises()

    mockLoadShortNameLinks.mockClear()
    await wrapper.setProps({
      shortNameDetails: {
        id: 456,
        shortName: 'TEST_SN',
        shortNameType: 'EFT' as string,
        creditsRemaining: 1000,
        linkedAccountsCount: 5
      }
    })
    await flushPromises()

    expect(mockLoadShortNameLinks).toHaveBeenCalled()
  })

  it('should handle error in dialogConfirm with unknown type', async () => {
    const wrapper = createWrapper()
    wrapper.vm.state.confirmObject = {
      item: {
        id: 1,
        accountId: 100,
        isParentRow: true,
        statementsOwing: [],
        amountOwing: 0,
        statusCode: 'LINKED',
        shortNameId: 123,
        hasMultipleStatements: false,
        hasPendingPayment: false,
        hasPayableStatement: false,
        hasInsufficientFunds: false,
        pendingPaymentAmountTotal: 0,
        unpaidStatementIds: ''
      },
      type: 'UNKNOWN_TYPE' as string
    }

    const vm = wrapper.vm as unknown as { dialogConfirm: () => Promise<void> }
    await vm.dialogConfirm()

    expect(wrapper.vm.state.showConfirmDialog).toBe(false)
  })

  it('should have credits remaining in shortNameDetails prop', () => {
    const wrapper = createWrapper()
    expect(wrapper.props('shortNameDetails')?.creditsRemaining).toBe(1000)
  })

  it('should handle zero credits remaining', () => {
    const wrapper = createWrapper({
      shortNameDetails: { ...defaultProps.shortNameDetails, creditsRemaining: 0 }
    })
    const vm = wrapper.vm as unknown as { formatCurrency: (amount: number) => string }
    expect(vm.formatCurrency(0)).toBe('$0.00')
  })

  it('should handle negative credits remaining', () => {
    const wrapper = createWrapper({
      shortNameDetails: { ...defaultProps.shortNameDetails, creditsRemaining: -500 }
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('should format large currency amounts', () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as unknown as { formatCurrency: (amount: number) => string }
    expect(vm.formatCurrency(1234567.89)).toBe('$1234567.89')
  })

  it('should emit on-payment-action after successful apply payment', async () => {
    mockApplyPayment.mockResolvedValue(true)
    const wrapper = createWrapper()
    const item = {
      id: 1,
      accountId: 100,
      isParentRow: true,
      statementsOwing: [],
      amountOwing: 500,
      statusCode: 'LINKED',
      shortNameId: 123,
      hasMultipleStatements: false,
      hasPendingPayment: false,
      hasPayableStatement: true,
      hasInsufficientFunds: false,
      pendingPaymentAmountTotal: 0,
      unpaidStatementIds: '1'
    }

    const vm = wrapper.vm as unknown as {
      handleApplyPayment: (item: typeof item) => Promise<void>
    }
    await vm.handleApplyPayment(item)

    expect(wrapper.emitted('on-payment-action')).toBeTruthy()
  })

  it('should emit on-payment-action after successful cancel payment', async () => {
    mockCancelPayment.mockResolvedValue(true)
    const wrapper = createWrapper()
    const item = {
      id: 1,
      accountId: 100,
      isParentRow: false,
      statementsOwing: [],
      amountOwing: 500,
      statusCode: 'LINKED',
      shortNameId: 123,
      hasMultipleStatements: false,
      hasPendingPayment: true,
      hasPayableStatement: true,
      hasInsufficientFunds: false,
      pendingPaymentAmountTotal: 200,
      unpaidStatementIds: '1',
      statementId: 789
    }

    const vm = wrapper.vm as unknown as {
      state: { confirmObject: { item: typeof item, type: string } }
      dialogConfirm: () => Promise<void>
    }
    vm.state.confirmObject = { item, type: ConfirmationType.CANCEL_PAYMENT }

    await vm.dialogConfirm()

    expect(wrapper.emitted('on-payment-action')).toBeTruthy()
  })

  it('should call unlink account on dialogConfirm', async () => {
    mockUnlinkAccount.mockResolvedValue(true)
    const wrapper = createWrapper()
    const item = {
      id: 456,
      accountId: 100,
      isParentRow: true,
      statementsOwing: [],
      amountOwing: 0,
      statusCode: 'LINKED',
      shortNameId: 123,
      hasMultipleStatements: false,
      hasPendingPayment: false,
      hasPayableStatement: false,
      hasInsufficientFunds: false,
      pendingPaymentAmountTotal: 0,
      unpaidStatementIds: ''
    }

    const vm = wrapper.vm as unknown as {
      state: { confirmObject: { item: typeof item, type: string } }
      dialogConfirm: () => Promise<void>
    }
    vm.state.confirmObject = { item, type: ConfirmationType.UNLINK_ACCOUNT }

    await vm.dialogConfirm()

    expect(mockUnlinkAccount).toHaveBeenCalledWith(456)
  })

  it('should not show toggle button for rows without multiple statements', () => {
    const wrapper = createWrapper()
    const item = {
      id: 1,
      accountId: 100,
      isParentRow: true,
      statementsOwing: [{ statementId: 1, amountOwing: 500 }],
      amountOwing: 500,
      statusCode: 'LINKED',
      shortNameId: 123,
      hasMultipleStatements: false,
      hasPendingPayment: false,
      hasPayableStatement: true,
      hasInsufficientFunds: false,
      pendingPaymentAmountTotal: 0,
      unpaidStatementIds: '1'
    }

    const vm = wrapper.vm as unknown as {
      handleRowToggle: (item: typeof item) => void
    }
    vm.handleRowToggle(item)

    expect(mockToggleStatementsView).not.toHaveBeenCalled()
  })
})

async function flushPromises() {
  return new Promise(resolve => setTimeout(resolve, 0))
}
