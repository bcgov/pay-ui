import type { Invoice, InvoiceDisplay } from '@/interfaces/invoice'
import type { GetRoutingSlipRequestPayload } from '@/interfaces/routing-slip'
import { useRoutingSlip } from '@/composables/useRoutingSlip'
import { usePayApi } from '@/composables/pay-api'
import { useLoader } from '@/composables/common/useLoader'
import { InvoiceStatus } from '@/utils/constants'
import type { TableColumn } from '@nuxt/ui'

interface UseTransactionDataTableProps {
  invoices?: Invoice[]
}

export default function useTransactionDataTable(props: UseTransactionDataTableProps) {
  const { routingSlip, getRoutingSlip } = useRoutingSlip()
  const { cancelRoutingSlipInvoice } = usePayApi()
  const { isLoading } = useLoader()
  const { baseModal } = useConnectModal()

  const selectedInvoiceId = ref<number | null>(null)
  const disableCancelButton = ref(false)

  const invoiceCount = computed<number>(() => {
    return props.invoices?.length || 0
  })

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

  const invoiceDisplay = computed<InvoiceDisplay[]>(() => {
    if (!props.invoices) {
      return []
    }
    return transformInvoices(props.invoices)
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
    return statusCode === InvoiceStatus.CANCELLED
  }

  const cancel = async (invoiceId: number) => {
    selectedInvoiceId.value = invoiceId
    await baseModal.open({
      title: 'Cancel Transaction?',
      description: 'Canceling a transaction will place the transaction amount back to the routing slip.',
      dismissible: true,
      buttons: [
        {
          label: 'Cancel Transaction',
          onClick: async () => {
            await modalDialogConfirm()
          },
          shouldClose: true
        },
        {
          label: 'Cancel',
          variant: 'outline',
          shouldClose: true
        }
      ]
    })
  }

  const modalDialogConfirm = async () => {
    if (!selectedInvoiceId.value) {
      return
    }

    disableCancelButton.value = true
    isLoading.value = true

    try {
      await cancelRoutingSlipInvoice(selectedInvoiceId.value)

      const routingSlipNumber = routingSlip.value?.number
      if (routingSlipNumber) {
        const payload: GetRoutingSlipRequestPayload = { routingSlipNumber, showGlobalLoader: false }
        await getRoutingSlip(payload)
      }

      selectedInvoiceId.value = null
    } catch (error) {
      console.error('Error cancelling invoice:', error)
    } finally {
      isLoading.value = false
      disableCancelButton.value = false
    }
  }

  const getIndexedTag = (baseTag: string, index: number): string => {
    return `${baseTag}-${index}`
  }

  return {
    invoiceDisplay,
    headerTransactions,
    invoiceCount,
    transformInvoices,
    cancel,
    getIndexedTag,
    disableCancelButton,
    isAlreadyCancelled
  }
}
