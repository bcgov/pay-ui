import { mountSuspended } from '@nuxt/test-utils/runtime'
import { ref, computed } from 'vue'
import TransactionDataTable from '~/components/RoutingSlip/TransactionDataTable.vue'
import type { Invoice } from '~/interfaces/invoice'
import { InvoiceStatus } from '~/utils/constants'

const mockCancel = vi.fn()

vi.mock('~/utils/common-util', async () => {
  const actual = await vi.importActual('~/utils/common-util')
  return {
    default: {
      ...actual.default,
      verifyRoles: () => true
    }
  }
})

vi.mock('~/composables/viewRoutingSlip/useTransactionDataTable', () => ({
  default: () => ({
    invoiceDisplay: computed(() => [
      {
        id: 1,
        createdOn: '2025-11-17T10:00:00Z',
        invoiceNumber: 'REGUT00053322',
        statusCode: InvoiceStatus.COMPLETED,
        total: 30.00,
        createdName: 'Travis Semple',
        description: ['Name Request Renewal fee']
      },
      {
        id: 2,
        createdOn: '2025-11-18T10:00:00Z',
        invoiceNumber: 'REGUT00053323',
        statusCode: InvoiceStatus.CANCELLED,
        total: 50.00,
        createdName: 'John Doe',
        description: ['Fee Type: Annual Report']
      }
    ]),
    headerTransactions: computed(() => [
      { accessorKey: 'createdOn', header: 'Date' },
      { accessorKey: 'invoiceNumber', header: 'Invoice #' },
      { accessorKey: 'total', header: 'Transaction Amount' },
      { accessorKey: 'description', header: 'Description' },
      { accessorKey: 'createdName', header: 'Initiator' },
      { accessorKey: 'actions', header: 'Actions' }
    ]),
    invoiceCount: computed(() => 2),
    transformInvoices: vi.fn(),
    cancel: mockCancel,
    getIndexedTag: (baseTag: string, index: number) => `${baseTag}-${index}`,
    disableCancelButton: ref(false),
    isAlreadyCancelled: (statusCode?: string) => statusCode === InvoiceStatus.CANCELLED
  })
}))

describe('TransactionDataTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders component with title and invoice count', async () => {
    const wrapper = await mountSuspended(TransactionDataTable, {
      props: {
        invoices: [] as Invoice[]
      },
      global: {
        directives: {
          can: { mounted: () => {}, updated: () => {} }
        }
      }
    })

    expect(wrapper.find('[data-test="title"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="title"]').text()).toBe('Transactions')
    expect(wrapper.text()).toContain('(2)')
  })

  it('displays cancelled status for cancelled invoices', async () => {
    const wrapper = await mountSuspended(TransactionDataTable, {
      props: {
        invoices: [] as Invoice[]
      },
      global: {
        directives: {
          can: { mounted: () => {}, updated: () => {} }
        }
      }
    })

    expect(wrapper.find('[data-test="text-cancel-1"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="text-cancel-1"]').text()).toBe('Cancelled')
  })

  it('displays cancel button for active invoices', async () => {
    const wrapper = await mountSuspended(TransactionDataTable, {
      props: {
        invoices: [] as Invoice[]
      },
      global: {
        directives: {
          can: { mounted: () => {}, updated: () => {} }
        }
      }
    })

    expect(wrapper.html()).toContain('btn-invoice-cancel-0')
  })

  it('calls cancel function when cancel button is clicked', async () => {
    const wrapper = await mountSuspended(TransactionDataTable, {
      props: {
        invoices: [] as Invoice[]
      },
      global: {
        directives: {
          can: { mounted: () => {}, updated: () => {} }
        },
        stubs: {
          UButton: {
            template: '<button @click="$emit(\'click\')" :data-test="dataTest"><slot /></button>',
            props: ['label', 'variant', 'color', 'disabled', 'dataTest']
          }
        }
      }
    })

    const button = wrapper.find('[data-test="btn-invoice-cancel-0"]')
    expect(button.exists()).toBe(true)
    await button.trigger('click')

    expect(mockCancel).toHaveBeenCalledWith(1)
  })
})
