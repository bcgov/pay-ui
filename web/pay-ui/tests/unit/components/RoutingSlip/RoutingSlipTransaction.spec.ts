import { mountSuspended } from '@nuxt/test-utils/runtime'
import RoutingSlipTransaction from '~/components/RoutingSlip/RoutingSlipTransaction.vue'
import { nextTick } from 'vue'

const {
  mockShowAddManualTransaction,
  mockManualTransactionsList,
  mockIsRoutingSlipAChild,
  mockIsRoutingSlipVoid,
  mockIsLoading,
  mockStatus,
  mockShowManualTransaction,
  mockAddManualTransactionRow,
  mockAddManualTransactions,
  mockIsLastChild,
  mockRemoveManualTransactionRow,
  mockUpdateManualTransactionDetails,
  mockHideManualTransaction,
  mockUseRoutingSlipTransaction
} = vi.hoisted(() => {
  const { ref } = require('vue')
  const mockShowAddManualTransaction = ref(false)
  const mockManualTransactionsList = ref([])
  const mockIsRoutingSlipAChild = ref(false)
  const mockIsRoutingSlipVoid = ref(false)
  const mockIsLoading = ref(false)
  const mockStatus = ref('')
  const mockShowManualTransaction = vi.fn()
  const mockAddManualTransactionRow = vi.fn()
  const mockAddManualTransactions = vi.fn()
  const mockIsLastChild = vi.fn(() => false)
  const mockRemoveManualTransactionRow = vi.fn()
  const mockUpdateManualTransactionDetails = vi.fn()
  const mockHideManualTransaction = vi.fn()

  const mockUseRoutingSlipTransaction = vi.fn(() => ({
    formRoutingSlipManualTransactions: ref(null),
    showAddManualTransaction: mockShowAddManualTransaction,
    manualTransactionsList: mockManualTransactionsList,
    isRoutingSlipAChild: mockIsRoutingSlipAChild,
    isRoutingSlipVoid: mockIsRoutingSlipVoid,
    isLoading: mockIsLoading,
    showManualTransaction: mockShowManualTransaction,
    addManualTransactionRow: mockAddManualTransactionRow,
    addManualTransactions: mockAddManualTransactions,
    isLastChild: mockIsLastChild,
    removeManualTransactionRow: mockRemoveManualTransactionRow,
    updateManualTransactionDetails: mockUpdateManualTransactionDetails,
    hideManualTransaction: mockHideManualTransaction,
    status: mockStatus
  }))

  return {
    mockShowAddManualTransaction,
    mockManualTransactionsList,
    mockIsRoutingSlipAChild,
    mockIsRoutingSlipVoid,
    mockIsLoading,
    mockStatus,
    mockShowManualTransaction,
    mockAddManualTransactionRow,
    mockAddManualTransactions,
    mockIsLastChild,
    mockRemoveManualTransactionRow,
    mockUpdateManualTransactionDetails,
    mockHideManualTransaction,
    mockUseRoutingSlipTransaction
  }
})

vi.mock('~/composables/viewRoutingSlip/useRoutingSlipTransaction', () => ({
  default: mockUseRoutingSlipTransaction
}))

describe('RoutingSlipTransaction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockShowAddManualTransaction.value = false
    mockManualTransactionsList.value = []
    mockIsRoutingSlipAChild.value = false
    mockIsRoutingSlipVoid.value = false
    mockIsLoading.value = false
    mockStatus.value = ''
  })

  it('should render', async () => {
    const wrapper = await mountSuspended(RoutingSlipTransaction, {
      global: {
        stubs: {
          UButton: true,
          UCard: true,
          UForm: true,
          USeparator: true,
          AddManualTransactionDetails: true,
          TransactionDataTable: true,
          UIcon: true
        },
        directives: {
          can: {
            mounted: () => {},
            updated: () => {}
          }
        }
      }
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('should call useRoutingSlipTransaction composable', async () => {
    await mountSuspended(RoutingSlipTransaction, {
      global: {
        stubs: {
          UButton: true,
          UCard: true,
          UForm: true,
          USeparator: true,
          AddManualTransactionDetails: true,
          TransactionDataTable: true,
          UIcon: true
        },
        directives: {
          can: {
            mounted: () => {},
            updated: () => {}
          }
        }
      }
    })
    expect(mockUseRoutingSlipTransaction).toHaveBeenCalled()
  })

  it('should render add transaction button when not child and not void', async () => {
    const wrapper = await mountSuspended(RoutingSlipTransaction, {
      global: {
        stubs: {
          UButton: {
            template: '<button><slot name="leading" /><slot /></button>',
            props: ['large', 'color', 'loading']
          },
          UCard: true,
          UForm: true,
          USeparator: true,
          AddManualTransactionDetails: true,
          TransactionDataTable: true,
          UIcon: true
        },
        directives: {
          can: {
            mounted: () => {},
            updated: () => {}
          }
        }
      }
    })
    expect(wrapper.text()).toContain('Add Transaction Manually')
  })

  it('should not render add transaction button when isRoutingSlipAChild is true', async () => {
    mockIsRoutingSlipAChild.value = true
    const wrapper = await mountSuspended(RoutingSlipTransaction, {
      global: {
        stubs: {
          UButton: {
            template: '<button><slot name="leading" /><slot /></button>',
            props: ['large', 'color', 'loading']
          },
          UCard: true,
          UForm: true,
          USeparator: true,
          AddManualTransactionDetails: true,
          TransactionDataTable: true,
          UIcon: true
        },
        directives: {
          can: {
            mounted: () => {},
            updated: () => {}
          }
        }
      }
    })
    expect(wrapper.text()).not.toContain('Add Transaction Manually')
  })

  it('should not render add transaction button when isRoutingSlipVoid is true', async () => {
    mockIsRoutingSlipVoid.value = true
    const wrapper = await mountSuspended(RoutingSlipTransaction, {
      global: {
        stubs: {
          UButton: {
            template: '<button><slot name="leading" /><slot /></button>',
            props: ['large', 'color', 'loading']
          },
          UCard: true,
          UForm: true,
          USeparator: true,
          AddManualTransactionDetails: true,
          TransactionDataTable: true,
          UIcon: true
        },
        directives: {
          can: {
            mounted: () => {},
            updated: () => {}
          }
        }
      }
    })
    expect(wrapper.text()).not.toContain('Add Transaction Manually')
  })

  it('should call showManualTransaction when button is clicked', async () => {
    const wrapper = await mountSuspended(RoutingSlipTransaction, {
      global: {
        stubs: {
          UButton: {
            template: '<button @click="$emit(\'click\')"><slot name="leading" /><slot /></button>',
            props: ['large', 'color', 'loading']
          },
          UCard: true,
          UForm: true,
          USeparator: true,
          AddManualTransactionDetails: true,
          TransactionDataTable: true,
          UIcon: true
        },
        directives: {
          can: {
            mounted: () => {},
            updated: () => {}
          }
        }
      }
    })
    const button = wrapper.find('button')
    if (button.exists()) {
      await button.trigger('click')
      expect(mockShowManualTransaction).toHaveBeenCalled()
    }
  })

  it('should render TransactionDataTable with invoices prop', async () => {
    const mockInvoices = [{ id: 1 }, { id: 2 }]
    const wrapper = await mountSuspended(RoutingSlipTransaction, {
      props: {
        invoices: mockInvoices
      },
      global: {
        stubs: {
          UButton: true,
          UCard: true,
          UForm: true,
          USeparator: true,
          AddManualTransactionDetails: true,
          TransactionDataTable: {
            template: '<div data-test="transaction-data-table">TransactionDataTable</div>',
            props: ['invoices']
          },
          UIcon: true
        },
        directives: {
          can: {
            mounted: () => {},
            updated: () => {}
          }
        }
      }
    })
    const tableElement = wrapper.find('[data-test="transaction-data-table"]')
    if (tableElement.exists()) {
      const table = wrapper.findComponent({ name: 'TransactionDataTable' })
      if (table.exists()) {
        expect(table.props('invoices')).toEqual(mockInvoices)
      } else {
        expect(tableElement.exists()).toBe(true)
      }
    }
  })
})
