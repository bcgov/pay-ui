import type { Invoice, InvoiceDisplay } from '@/interfaces/invoice'
import type { GetRoutingSlipRequestPayload } from '@/interfaces/routing-slip'
import { useRoutingSlip } from '@/composables/useRoutingSlip'
import { usePayApi } from '@/composables/pay-api'
import { useLoader } from '@/composables/common/useLoader'
import { InvoiceStatus } from '@/utils/constants'
import type { TableColumn } from '@nuxt/ui'
import { reactive, toRefs } from 'vue'

export default function useTransactionDataTable(invoices: Ref<Invoice[]>) {
  const { getRoutingSlip } = useRoutingSlip()
  const { store } = useRoutingSlipStore()
  const { cancelRoutingSlipInvoice } = usePayApi()
  const { isLoading } = useLoader()
  const modal = usePayModals()

  const transformInvoices = (invoices: Invoice[]): InvoiceDisplay[] => {
    return invoices.map((invoice) => {
      const descriptions: string[] = []

      if (invoice.lineItems && invoice.lineItems.length > 0) {
        invoice.lineItems.forEach((lineItem) => {
          descriptions.push(lineItem.description)
        })
      } else if (invoice.details && invoice.details.length > 0) {
        invoice.details.forEach((detail) => {
          if (detail.label && detail.value) {
            descriptions.push(`${detail.label}: ${detail.value}`)
          }
        })
      }

      const invoiceNumber = invoice.references?.find(ref => ref.invoiceNumber)?.invoiceNumber
        || invoice.references?.[0]?.invoiceNumber

      return {
        id: invoice.id,
        createdOn: invoice.createdOn,
        invoiceNumber,
        statusCode: invoice.statusCode,
        total: invoice.total,
        createdName: invoice.createdName,
        createdBy: invoice.createdBy,
        description: descriptions.length > 0 ? descriptions : ['N/A']
      }
    })
  }

  const state = reactive({
    selectedInvoiceId: null as number | null,
    disableCancelButton: false,
    invoiceCount: computed<number>(() => {
      return invoices.value.length ?? 0
    }),
    invoiceDisplay: computed<InvoiceDisplay[]>(() => {
      const invoicesValue = invoices.value
      if (!invoicesValue || !Array.isArray(invoicesValue)) {
        return []
      }
      return transformInvoices(invoicesValue)
    })
  })

  const headerTransactions = computed<TableColumn<InvoiceDisplay>[]>(() => [
    {
      accessorKey: 'createdOn',
      header: 'Date',
      meta: {
        class: {
          th: 'pl-4',
          td: 'pl-4 font-bold'
        }
      }
    },
    {
      accessorKey: 'invoiceNumber',
      header: 'Invoice #',
      meta: {
        class: {
          td: 'font-bold'
        }
      }
    },
    {
      accessorKey: 'total',
      header: 'Transaction Amount',
      meta: {
        class: {
          th: 'text-right',
          td: 'text-right'
        }
      }
    },
    {
      accessorKey: 'description',
      header: 'Description',
      meta: {
        class: {
          td: 'font-bold'
        }
      }
    },
    {
      accessorKey: 'createdName',
      header: 'Initiator',
      meta: {
        class: {
          td: ''
        }
      }
    },
    {
      accessorKey: 'actions',
      header: 'Actions',
      meta: {
        class: {
          th: 'text-right',
          td: 'text-right'
        }
      }
    }
  ])

  const isAlreadyCancelled = (statusCode?: string): boolean => {
    return [InvoiceStatus.REFUNDED, InvoiceStatus.REFUND_REQUESTED].includes(statusCode as InvoiceStatus)
  }

  const cancel = async (invoiceId: number) => {
    state.selectedInvoiceId = invoiceId
    await modal.openCancelTransactionModal(async () => {
      await modalDialogConfirm()
    })
  }

  const modalDialogConfirm = async () => {
    if (!state.selectedInvoiceId) {
      return
    }

    state.disableCancelButton = true
    isLoading.value = true

    try {
      // Do nothing with this, this will get moved out of FAS in the future.
      await cancelRoutingSlipInvoice(state.selectedInvoiceId)

      const routingSlipNumber = store.routingSlip.number
      if (routingSlipNumber) {
        const payload: GetRoutingSlipRequestPayload = { routingSlipNumber }
        await getRoutingSlip(payload)
      }

      state.selectedInvoiceId = null
    } catch (error) {
      console.error('Error cancelling invoice:', error)
    } finally {
      isLoading.value = false
      state.disableCancelButton = false
    }
  }

  const getIndexedTag = (baseTag: string, index: number): string => {
    return `${baseTag}-${index}`
  }

  return {
    ...toRefs(state),
    headerTransactions,
    transformInvoices,
    cancel,
    getIndexedTag,
    isAlreadyCancelled
  }
}
