import { Invoice, InvoiceDisplay, LineItem, Reference } from '@/models/Invoice'
import { InvoiceStatus, SlipStatus } from '@/util/constants'
import { computed, reactive, ref, watch } from '@vue/composition-api'

import { GetRoutingSlipRequestPayload } from '@/models/RoutingSlip'
import { useRoutingSlip } from '../useRoutingSlip'

// Composable function to inject Props, options and values to TransactionDataTable component
export default function useTransactionDataTable (props) {
  const { cancelRoutingSlipInvoice, getRoutingSlip, invoiceCount, routingSlip } = useRoutingSlip()
  // ref and i/p variables
  const invoiceDisplay = ref<InvoiceDisplay[]>([])
  const headerTranscations = [
    {
      text: 'Date',
      align: 'start',
      sortable: false,
      value: 'createdOn'
    },
    {
      text: 'Invoice #',
      align: 'start',
      sortable: false,
      value: 'invoiceNumber'
    },
    {
      text: 'Transaction Amount',
      align: 'end',
      sortable: false,
      value: 'total'
    },
    {
      text: 'Description',
      align: 'start',
      value: 'description',
      sortable: false
    },
    {
      text: 'Initiator',
      align: 'start',
      value: 'createdName',
      sortable: false
    },
    {
      text: 'Actions',
      align: 'end',
      value: 'actions',
      sortable: false
    }
  ]

  const modalDialogRef = ref<HTMLFormElement>()
  // modal dialog props and events
  const modalDialogDetails = reactive<any>({
    modalDialogTitle: 'Cancel Transaction?',
    modalDialogText: 'Canceling a transaction will place the transaction amount back to the routing slip.',
    modalDialogOkText: 'Cancel Transaction',
    modalDialogCancelText: 'Cancel',
    modalDialogIcon: 'mdi-alert-circle-outline',
    modalDialogIconColor: 'error'
  })

  // This property stores the current invoice that needs to be cancelled after we confirm in the cancellation modal
  const currentInvoiceIdForCancelling = ref<number>(undefined)
  const isLoading = ref<boolean>(false)

  // We are watching routingslip parent object and if any changes, we update the invoice and pass it along to transaction table to display
  watch(routingSlip, () => {
    if (routingSlip.value?.invoices) {
      transformInvoices(routingSlip.value?.invoices)
    }
  }, { deep: true, immediate: true })

  function transformInvoices (invoices: Invoice[]): void {
    invoiceDisplay.value = []
    for (let i = 0; i < invoices?.length; i++) {
      const invoice: Invoice = invoices[i]
      const invoiceDisplayObject: InvoiceDisplay = {}
      // assign created on date
      invoiceDisplayObject.createdOn = invoice.createdOn
      // concatenate all description from line items
      const description = invoice?.lineItems.map((lineItem: LineItem) => {
        return lineItem?.description
      })
      invoiceDisplayObject.description = description
      // we need invoice number of completed transaction only
      invoiceDisplayObject.invoiceNumber = invoice?.references?.find((reference: Reference) => reference?.statusCode === InvoiceStatus.COMPLETED)?.invoiceNumber
      invoiceDisplayObject.id = invoice.id
      invoiceDisplayObject.total = invoice?.total
      invoiceDisplayObject.createdName = invoice?.createdName || invoice?.createdBy
      invoiceDisplayObject.statusCode = invoice.statusCode
      invoiceDisplay.value.push(invoiceDisplayObject)
    }
  }

  // Cancel Routing slip transaction
  function cancel (invoiceId: number): void {
    currentInvoiceIdForCancelling.value = invoiceId
    modalDialogRef.value.open()
  }

  // Call cancel invoice method
  async function modalDialogConfirm () {
    try {
      if (currentInvoiceIdForCancelling.value) {
        isLoading.value = true
        await cancelRoutingSlipInvoice(currentInvoiceIdForCancelling.value)
        const currentRoutingSlipId = routingSlip.value?.number || ''
        const getRoutingSlipRequestPayload: GetRoutingSlipRequestPayload = { routingSlipNumber: currentRoutingSlipId }
        // Refresh the slip
        await getRoutingSlip(getRoutingSlipRequestPayload)
      }
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.error('error ', error?.response)
    } finally {
      isLoading.value = false
      modalDialogRef.value.close()
      currentInvoiceIdForCancelling.value = undefined
    }
  }

  // If user clicks cancel on the confirmation dialog, close it
  function modalDialogClose () {
    modalDialogRef.value.close()
    currentInvoiceIdForCancelling.value = undefined
  }

  function getIndexedTag (tag, index): string {
    return `${tag}-${index}`
  }

  // disable cancel button in invoice rows if routing slip has any of these statuses
  const disableCancelButton = computed(() => {
    return [SlipStatus.NSF, SlipStatus.REFUNDAUTHORIZED, SlipStatus.REFUNDPROCESSED, SlipStatus.REFUNDREQUEST, SlipStatus.VOID, SlipStatus.CORRECTION].includes(routingSlip.value.status as SlipStatus)
  })

  function isAlreadyCancelled (currentStatus) {
    return [InvoiceStatus.REFUND_REQUESTED, InvoiceStatus.REFUNDED].includes(currentStatus)
  }

  return {
    invoiceDisplay,
    headerTranscations,
    invoiceCount,
    transformInvoices,
    modalDialogRef,
    modalDialogDetails,
    isLoading,
    cancel,
    modalDialogConfirm,
    modalDialogClose,
    getIndexedTag,
    disableCancelButton,
    isAlreadyCancelled
  }
}
