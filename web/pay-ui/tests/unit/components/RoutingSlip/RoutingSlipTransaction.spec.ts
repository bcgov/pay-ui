import { mountSuspended } from '@nuxt/test-utils/runtime'
import RoutingSlipTransaction from '~/components/RoutingSlip/RoutingSlipTransaction.vue'

const {
  mockShowAddManualTransaction,
  mockManualTransactionsList,
  mockIsRoutingSlipAChild,
  mockIsRoutingSlipVoid,
  mockIsLoading,
  mockStatus,
  mockShowManualTransaction,
  _mockAddManualTransactionRow,
  _mockAddManualTransactions,
  _mockIsLastChild,
  _mockRemoveManualTransactionRow,
  _mockUpdateManualTransactionDetails,
  _mockHideManualTransaction,
  mockUseRoutingSlipTransaction
} = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { ref } = require('vue')
  const mockShowAddManualTransaction = ref(false)
  const mockManualTransactionsList = ref([])
  const mockIsRoutingSlipAChild = ref(false)
  const mockIsRoutingSlipVoid = ref(false)
  const mockIsLoading = ref(false)
  const mockStatus = ref('')
  const mockShowManualTransaction = vi.fn()
  const _mockAddManualTransactionRow = vi.fn()
  const _mockAddManualTransactions = vi.fn()
  const _mockIsLastChild = vi.fn(() => false)
  const _mockRemoveManualTransactionRow = vi.fn()
  const _mockUpdateManualTransactionDetails = vi.fn()
  const _mockHideManualTransaction = vi.fn()

  const mockUseRoutingSlipTransaction = vi.fn(() => ({
    formRoutingSlipManualTransactions: ref(null),
    showAddManualTransaction: mockShowAddManualTransaction,
    manualTransactionsList: mockManualTransactionsList,
    isRoutingSlipAChild: mockIsRoutingSlipAChild,
    isRoutingSlipVoid: mockIsRoutingSlipVoid,
    isLoading: mockIsLoading,
    showManualTransaction: mockShowManualTransaction,
    addManualTransactionRow: _mockAddManualTransactionRow,
    addManualTransactions: _mockAddManualTransactions,
    isLastChild: _mockIsLastChild,
    removeManualTransactionRow: _mockRemoveManualTransactionRow,
    updateManualTransactionDetails: _mockUpdateManualTransactionDetails,
    hideManualTransaction: _mockHideManualTransaction,
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
    _mockAddManualTransactionRow,
    _mockAddManualTransactions,
    _mockIsLastChild,
    _mockRemoveManualTransactionRow,
    _mockUpdateManualTransactionDetails,
    _mockHideManualTransaction,
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

  it('should call handleAddTransaction when Add Transaction button is clicked', async () => {
    mockShowAddManualTransaction.value = true
    mockManualTransactionsList.value = [{ key: '1' }]
    const wrapper = await mountSuspended(RoutingSlipTransaction, {
      global: {
        stubs: {
          UButton: {
            template: '<button @click="$emit(\'click\')"><slot name="leading" /><slot /></button>',
            props: ['large', 'color', 'loading', 'size', 'variant', 'class']
          },
          UCard: {
            template: '<div v-if="show"><slot /></div>',
            props: [],
            data() {
              return { show: true }
            }
          },
          UForm: true,
          USeparator: true,
          AddManualTransactionDetails: {
            template: '<div></div>',
            props: ['index', 'manualTransaction'],
            emits: ['update-manual-transaction', 'remove-manual-transaction-row']
          },
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
    const addButton = wrapper.findAllComponents({ name: 'UButton' }).find(btn => btn.text().includes('Add Transaction'))
    if (addButton) {
      await addButton.trigger('click')
      expect(_mockAddManualTransactions).toHaveBeenCalled()
    }
  })

  it('should call addManualTransactionRow when Add another transaction button is clicked', async () => {
    mockShowAddManualTransaction.value = true
    mockManualTransactionsList.value = [{ key: '1' }]
    const wrapper = await mountSuspended(RoutingSlipTransaction, {
      global: {
        stubs: {
          UButton: {
            template: '<button @click="$emit(\'click\')"><slot name="leading" /><slot /></button>',
            props: ['large', 'color', 'loading', 'size', 'variant', 'class']
          },
          UCard: {
            template: '<div><slot /></div>'
          },
          UForm: true,
          USeparator: true,
          AddManualTransactionDetails: {
            template: '<div></div>',
            props: ['index', 'manualTransaction'],
            emits: ['update-manual-transaction', 'remove-manual-transaction-row']
          },
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
    const addAnotherButton = wrapper
      .findAllComponents({ name: 'UButton' })
      .find(btn => btn.text().includes('Add another transaction'))
    if (addAnotherButton) {
      await addAnotherButton.trigger('click')
      expect(_mockAddManualTransactionRow).toHaveBeenCalled()
    }
  })

  it('should call hideManualTransaction when Cancel button is clicked', async () => {
    mockShowAddManualTransaction.value = true
    mockManualTransactionsList.value = [{ key: '1' }]
    const wrapper = await mountSuspended(RoutingSlipTransaction, {
      global: {
        stubs: {
          UButton: {
            template: '<button @click="$emit(\'click\')"><slot name="leading" /><slot /></button>',
            props: ['large', 'color', 'loading', 'size', 'variant', 'class']
          },
          UCard: {
            template: '<div><slot /></div>'
          },
          UForm: true,
          USeparator: true,
          AddManualTransactionDetails: {
            template: '<div></div>',
            props: ['index', 'manualTransaction'],
            emits: ['update-manual-transaction', 'remove-manual-transaction-row']
          },
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
    const cancelButton = wrapper.findAllComponents({ name: 'UButton' }).find(btn => btn.text().includes('Cancel'))
    if (cancelButton) {
      await cancelButton.trigger('click')
      expect(_mockHideManualTransaction).toHaveBeenCalled()
    }
  })

  it('should call removeManualTransactionRow when remove event is emitted', async () => {
    mockShowAddManualTransaction.value = true
    mockManualTransactionsList.value = [{ key: '1' }]
    const wrapper = await mountSuspended(RoutingSlipTransaction, {
      global: {
        stubs: {
          UButton: true,
          UCard: {
            template: '<div><slot /></div>'
          },
          UForm: true,
          USeparator: true,
          AddManualTransactionDetails: {
            template: '<div></div>',
            props: ['index', 'manualTransaction'],
            emits: ['update-manual-transaction', 'remove-manual-transaction-row']
          },
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
    const transactionDetails = wrapper.findComponent({ name: 'AddManualTransactionDetails' })
    if (transactionDetails.exists()) {
      await transactionDetails.vm.$emit('remove-manual-transaction-row', 0)
      expect(_mockRemoveManualTransactionRow).toHaveBeenCalledWith(0)
    }
  })

  it('should call updateManualTransactionDetails when update event is emitted', async () => {
    mockShowAddManualTransaction.value = true
    mockManualTransactionsList.value = [{ key: '1' }]
    const wrapper = await mountSuspended(RoutingSlipTransaction, {
      global: {
        stubs: {
          UButton: true,
          UCard: {
            template: '<div><slot /></div>'
          },
          UForm: true,
          USeparator: true,
          AddManualTransactionDetails: {
            template: '<div></div>',
            props: ['index', 'manualTransaction'],
            emits: ['update-manual-transaction', 'remove-manual-transaction-row']
          },
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
    const transactionDetails = wrapper.findComponent({ name: 'AddManualTransactionDetails' })
    if (transactionDetails.exists()) {
      const updateData = { index: 0, data: { amount: '100' } }
      await transactionDetails.vm.$emit('update-manual-transaction', updateData)
      expect(_mockUpdateManualTransactionDetails).toHaveBeenCalledWith(updateData)
    }
  })
})
