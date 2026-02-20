<script setup lang="ts">
import { useTransactionView } from '~/composables/transactions/useTransactionView'
import PaymentDetails from '~/pages/transaction-view/[id]/PaymentDetails.vue'
import TransactionDetails from '~/pages/transaction-view/[id]/TransactionDetails.vue'
import InvoiceRefundHistory from '~/pages/transaction-view/[id]/InvoiceRefundHistory.vue'
import RefundDecisionForm from '~/pages/transaction-view/[id]/RefundDecisionForm.vue'
import RefundRequestForm from '~/pages/transaction-view/[id]/RefundRequestForm.vue'
import RefundReviewForm from '~/pages/transaction-view/[id]/RefundReviewForm.vue'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const toast = useToast()

const invoiceId = computed(() => Number(route.params.id))

// Get additional path params - mode and refundId
const details = computed(() => {
  const raw = route.params.details
  return Array.isArray(raw) ? raw : (raw ? [raw] : [])
})

const mode = computed(() => details.value[0] || null)
const refundId = computed(() => details.value[1] ? Number(details.value[1]) : null)

definePageMeta({
  layout: 'connect-auth',
  middleware: ['pay-auth'],
  allowedRoles: [Role.ProductRefundViewer],
  hideBreadcrumbs: false
})

useHead({
  title: t('page.transactions.title')
})

enum RefundLineTypes {
  BASE_FEES = 'BASE_FEES',
  FUTURE_EFFECTIVE_FEES = 'FUTURE_EFFECTIVE_FEES',
  PRIORITY_FEES = 'PRIORITY_FEES',
  SERVICE_FEES = 'SERVICE_FEES'
}

const state = reactive({
  dataLoading: 0,
  paymentData: {
    accountName: null,
    folioNumber: null,
    initiatedBy: null,
    paymentMethod: null,
    paymentStatus: null,
    totalTransactionAmount: 0
  } as PaymentData,
  transactionData: {
    invoiceId: null,
    transactionDate: null,
    invoiceReferenceId: null,
    invoiceStatusCode: null,
    invoiceCreatedOn: null,
    transactionAmount: 0,
    applicationName: null,
    applicationType: null,
    businessIdentifier: null,
    applicationDetails: null,
    routingSlip: null,
    partialRefundable: false,
    fullRefundable: false
  } as TransactionData,
  refundHistoryData: [],
  refundRequestData: {
    invoiceId: null,
    refundId: null,
    refundStatus: null,
    refundType: null,
    refundMethod: null,
    notificationEmail: null,
    refundReason: null,
    staffComment: null,
    requestedBy: null,
    requestedDate: null,
    declineReason: null,
    decisionBy: null,
    decisionDate: null,
    refundAmount: 0,
    transactionAmount: 0,
    paymentMethod: null,
    partialRefundLines: []
  } as RefundRequestResult,
  refundFormData: {
    refundType: null,
    refundLineItems: [],
    totalRefundAmount: 0,
    refundMethod: null,
    notificationEmail: null,
    reasonsForRefund: null,
    staffComment: null,
    requestedBy: null,
    requestedTime: null,
    decisionBy: null,
    decisionTime: null
  } as RefundFormData,
  refundLineItems: [] as RefundLineItem[],
  refundFormStage: RefundRequestStage.REQUEST_FORM as RefundRequestStage,
  refundMethods: [
    { value: 'refund-as-account-credits', text: 'Refund as Account Credits' }
  ],
  previousRefundedAmount: 0,
  isProcessing: false,
  invoicePaymentMethod: null as null | string,
  invoiceProduct: null as null | string
})

const { getInvoiceComposite, getInvoiceRefundHistory, getRefundRequest, patchRefundRequest,
  refundInvoice } = useTransactionView()

function getTransactionPageTitle() {
  const result = ['initiateRefund', 'refund-request'].includes(mode.value ?? '')
    ? 'page.transactionView.transactionRefundTitle'
    : 'page.transactionView.transactionInformationTitle'
  return result
}

function setPaymentData(invoice: Invoice) {
  state.paymentData = {
    accountName: invoice.paymentAccount?.accountName,
    folioNumber: invoice.folioNumber,
    initiatedBy: invoice.createdBy,
    paymentMethod: invoice.paymentMethod,
    paymentStatus: invoice.statusCode,
    totalTransactionAmount: invoice.total || 0
  }
}

function setTransactionData(invoice: Invoice) {
  state.transactionData = {
    invoiceId: invoice.id,
    transactionDate: invoice.createdOn,
    invoiceReferenceId: invoice.references?.find(f => f.statusCode === 'COMPLETED')?.invoiceNumber,
    transactionAmount: invoice.total || 0,
    applicationName: getProductDisplayName(invoice.corpTypeCode ?? ''),
    applicationType: invoice.lineItems?.[0]?.description,
    businessIdentifier: invoice.businessIdentifier,
    applicationDetails: invoice.details,
    invoiceStatusCode: invoice.statusCode,
    invoiceCreatedOn: invoice.createdOn,
    routingSlip: invoice.routingSlip,
    latestRefundId: invoice.latestRefundId,
    latestRefundStatus: invoice.latestRefundStatus,
    partialRefundable: invoice.partialRefundable,
    fullRefundable: invoice.fullRefundable
  }
}

function setRefundLineItems(lineItems: LineItem[]) {
  state.refundLineItems = lineItems.map(lineItem => ({
    id: lineItem.id,
    description: lineItem.description,
    filingFees: lineItem.filingFees,
    serviceFees: lineItem.serviceFees,
    priorityFees: lineItem.priorityFees,
    futureEffectiveFees: lineItem.futureEffectiveFees,
    total: lineItem.total
  }))
}

async function fetchInvoice(invoiceId: number) {
  try {
    state.dataLoading += 1
    const invoice = await getInvoiceComposite(invoiceId)
    if (invoice) {
      setPaymentData(invoice)
      setTransactionData(invoice)
      setRefundLineItems(invoice.lineItems)
      state.previousRefundedAmount = invoice.refund || 0
      state.invoicePaymentMethod = invoice.paymentMethod ?? null
      state.invoiceProduct = invoice.product ?? null
    }
  } catch (error: unknown) {
    console.error('Failed to fetch invoice:', error)
  } finally {
    state.dataLoading -= 1
  }
}

async function fetchRefundHistory(invoiceId: number) {
  try {
    state.dataLoading += 1
    const refundData: RefundRequestListResponse = await getInvoiceRefundHistory(invoiceId)
    state.refundHistoryData = refundData.items || []
  } catch (error: unknown) {
    console.error('Failed to fetch refund history', error)
  } finally {
    state.dataLoading -= 1
  }
}

async function fetchRefundRequest(refundId: number) {
  try {
    state.dataLoading += 1
    const refundData: RefundRequestResult = await getRefundRequest(refundId)
    state.refundRequestData = refundData
  } catch (error: unknown) {
    console.error('Failed to fetch refund request', error)
  } finally {
    state.dataLoading -= 1
  }
}

const showRefundHistory = computed(() =>
  state.refundHistoryData.length > 0 && mode.value === 'view'
)

const showRefundRequestForm = computed(() => {
  const excludedStatuses = [RefundApprovalStatus.APPROVED, RefundApprovalStatus.APPROVAL_NOT_REQUIRED,
    RefundApprovalStatus.PENDING_APPROVAL]
  return mode.value === 'initiateRefund' && !excludedStatuses.includes(state.transactionData.latestRefundStatus)
})

const showRefundDecisionForm = computed(() =>
  mode.value === 'refund-request' && refundId.value
)

function onProceedToReview(formData: RefundFormData) {
  state.refundFormData = formData
  state.refundFormStage = RefundRequestStage.DATA_VALIDATED
}

function onProceedToRequestForm() {
  state.refundFormStage = RefundRequestStage.REQUEST_FORM
}

async function onProceedToConfirm() {
  try {
    state.isProcessing = true
    await refundInvoice(invoiceId.value, getRefundPayload())
    toast.add({
      description: 'Refund request submitted.',
      icon: 'i-mdi-check-circle',
      color: 'success'
    })
    if (state.refundFormStage === RefundRequestStage.DATA_VALIDATED) {
      goToTransactionList()
    }
  } catch (error) {
    console.error(`Refund request failed: ${error}`)
    toast.add({
      description: 'Refund failed.',
      icon: 'i-mdi-alert-circle',
      color: 'error'
    })
  } finally {
    state.isProcessing = false
  }
}

function getRefundPayload() {
  const refundRevenues: RefundRevenueType[] = []
  if (state.refundFormData.refundType === RefundType.PARTIAL_REFUND) {
    const refundLineItems = state.refundFormData.refundLineItems
    refundLineItems?.forEach((refundLineItem) => {
      const feeTypes = [
        { key: 'filingFeesRequested', type: RefundLineTypes.BASE_FEES },
        { key: 'priorityFeesRequested', type: RefundLineTypes.PRIORITY_FEES },
        { key: 'futureEffectiveFeesRequested', type: RefundLineTypes.FUTURE_EFFECTIVE_FEES },
        { key: 'serviceFeesRequested', type: RefundLineTypes.SERVICE_FEES }
      ]

      feeTypes.forEach((fee) => {
        if (refundLineItem[fee.key] > 0 && fee.type !== RefundLineTypes.SERVICE_FEES) {
          refundRevenues.push({
            paymentLineItemId: refundLineItem.id,
            refundAmount: parseFloat(refundLineItem[fee.key]),
            refundType: fee.type
          })
        }
      })
    })
  }
  return {
    reason: state.refundFormData.reasonsForRefund,
    staffComment: state.refundFormData.staffComment,
    notificationEmail: state.refundFormData.notificationEmail,
    refundMethod: state.refundFormData.refundMethod,
    refundRevenue: refundRevenues
  }
}

async function onDeclineRefund(declineReason: string) {
  try {
    if (!invoiceId.value || !refundId.value) {
      return
    }

    state.isProcessing = true
    const refundPayload = {
      status: RefundApprovalStatus.DECLINED,
      declineReason: declineReason
    }
    await patchRefundRequest(invoiceId.value, refundId.value, refundPayload)
    toast.add({
      description: 'Refund request declined successfully.',
      icon: 'i-mdi-check-circle',
      color: 'success'
    })
    goToViewTransaction()
    await fetchInvoice(invoiceId.value)
    await fetchRefundHistory(invoiceId.value)
  } catch (error) {
    console.error(`Refund request decline failed: ${error}`)
    toast.add({
      description: 'Failed to decline refund request.',
      icon: 'i-mdi-alert-circle',
      color: 'error'
    })
  } finally {
    state.isProcessing = false
  }
}

async function onApproveRefund() {
  try {
    if (!invoiceId.value || !refundId.value) {
      return
    }
    state.isProcessing = true
    const refundPayload = {
      status: RefundApprovalStatus.APPROVED
    }
    await patchRefundRequest(invoiceId.value, refundId.value, refundPayload)
    toast.add({
      description: 'Refund request approved.',
      icon: 'i-mdi-check-circle',
      color: 'success'
    })
    await fetchInvoice(invoiceId.value)
    await fetchRefundHistory(invoiceId.value)
    goToViewTransaction()
  } catch (error) {
    console.error(`Refund request approve failed: ${error}`)
    toast.add({
      description: 'Failed to approve refund request.',
      icon: 'i-mdi-alert-circle',
      color: 'error'
    })
  } finally {
    state.isProcessing = false
  }
}

function goToViewTransaction() {
  router.push({
    path: `/transaction-view/${invoiceId.value}/view`
  })
}

function goToTransactionList() {
  router.push({
    path: '/transactions'
  })
}

function onCancel() {
  goToTransactionList()
}

onMounted(async () => {
  await fetchInvoice(invoiceId.value)
  await fetchRefundHistory(invoiceId.value)
  if (refundId.value) {
    await fetchRefundRequest(refundId.value)
  }

  setBreadcrumbs([
    {
      label: t('page.transactionView.breadcrumb.transactions'),
      to: '/transactions'
    },
    {
      label: t(getTransactionPageTitle())
    }
  ])
})
</script>

<template>
  <div class="flex flex-col">
    <div class="flex-shrink-0 mb-2 mt-4">
      <h1 class="text-gray-900 mb-4">
        {{ $t(getTransactionPageTitle()) }}
      </h1>
      <div
        v-if="state.dataLoading"
        class="absolute inset-0 z-50 flex items-center justify-center bg-white/60"
      >
        <UIcon
          name="i-mdi-loading"
          class="animate-spin text-4xl text-primary"
        />
      </div>
      <div v-if="!state.dataLoading">
        <PaymentDetails
          :payment-data="state.paymentData"
          class="mb-12"
        />

        <TransactionDetails
          :transaction-data="state.transactionData"
          class="mb-12"
        />

        <InvoiceRefundHistory
          v-if="showRefundHistory"
          :refund-history-data="state.refundHistoryData"
          class="mb-12"
        />
        <template v-if="showRefundRequestForm">
          <RefundRequestForm
            v-show="state.refundFormStage === RefundRequestStage.REQUEST_FORM"
            class="mb-12"
            :total-transaction-amount="state.paymentData.totalTransactionAmount"
            :refund-line-items="state.refundLineItems"
            :refund-methods="state.refundMethods"
            :previous-refunded-amount="state.previousRefundedAmount"
            :is-partial-refund-allowed="state.transactionData.partialRefundable"
            :is-full-refund-allowed="state.transactionData.fullRefundable"
            :invoice-payment-method="state.invoicePaymentMethod"
            @on-cancel="onCancel"
            @on-proceed-to-review="onProceedToReview"
          />
          <RefundReviewForm
            v-show="state.refundFormStage === RefundRequestStage.DATA_VALIDATED"
            class="mb-12"
            :refund-form-data="state.refundFormData"
            :refund-methods="state.refundMethods"
            :is-processing="state.isProcessing"
            @on-proceed-to-confirm="onProceedToConfirm"
            @on-proceed-to-request-form="onProceedToRequestForm"
          />
        </template>
        <template v-if="showRefundDecisionForm">
          <RefundDecisionForm
            class="mb-12"
            :refund-request-data="state.refundRequestData"
            :invoice-product="state.invoiceProduct"
            :is-processing="state.isProcessing"
            @on-decline-refund="onDeclineRefund"
            @on-approve-refund="onApproveRefund"
            @on-cancel="onCancel"
          />
        </template>
      </div>
    </div>
  </div>
</template>
