<template>
  <v-app>
    <v-container>
      <h2 class="mb-4">
      {{ getTransactionPageTitle() }}
      </h2>
      <v-overlay :value="dataLoading">
        <v-progress-circular indeterminate size="56" color="primary" />
      </v-overlay>
      <div v-if="!dataLoading">
        <PaymentDetails
          :payment-data="paymentData"
          class="mb-12"
        />
        <TransactionDetails
          :transaction-data="transactionData"
          class="mb-12"
        />
        <InvoiceRefundHistory
          :refund-history-data="refundHistoryData"
          class="mb-12"
          v-if="showRefundHistory"
        />
        <template v-if="showRefundRequestForm">
          <RefundRequestForm v-show="refundFormStage === RefundRequestStage.REQUEST_FORM"
                             class="mb-12"
                             :total-transaction-amount="paymentData.totalTransactionAmount"
                             :refund-line-items="refundLineItems"
                             :refund-methods="refundMethods"
                             :previous-refunded-amount="previousRefundedAmount"
                             :is-partial-refund-allowed="isPartialRefundAllowed"
                             :invoice-payment-method="invoicePaymentMethod"
                             @onCancel="onCancel"
                             @onProceedToReview="onProceedToReview"
          />
          <RefundReviewForm v-show="refundFormStage === RefundRequestStage.DATA_VALIDATED"
                            class="mb-12"
                            :refund-form-data="refundFormData"
                            :refund-methods="refundMethods"
                            :is-processing="isProcessing"
                            @onProceedToConfirm="onProceedToConfirm"
                            @onProceedToRequestForm="onProceedToRequestForm"
          />
        </template>
        <template v-if="showRefundDecisionForm">
          <RefundDecisionForm
                            class="mb-12"
                            :refund-request-data="refundRequestData"
                            :invoice-product="invoiceProduct"
                            :is-processing="isProcessing"
                            @onDeclineRefund="onDeclineRefund"
                            @onApproveRefund="onApproveRefund"
                            @onCancel="onCancel"
          />
        </template>
      </div>
    </v-container>
  </v-app>
</template>

<script lang="ts">
import { defineComponent, onMounted, reactive, toRefs, computed, watch } from '@vue/composition-api'
import PaymentDetails from '@/components/TransactionView/PaymentDetails.vue'
import TransactionDetails from '@/components/TransactionView/TransactionDetails.vue'
import RefundRequestForm from '@/components/TransactionView/RefundRequestForm.vue'
import RefundReviewForm from '@/components/TransactionView/RefundReviewForm.vue'
import RefundDecisionForm from '@/components/TransactionView/RefundDecisionForm.vue'
import { PaymentData, RefundFormData, RefundType, TransactionData, RefundRequestStage, RefundLineItem } from '@/models/transaction-refund'
import { Invoice, LineItem } from '@/models/Invoice'
import { useOrgStore } from '@/store/org'
import { getProductDisplayName } from '@/util/product-display'
import { RefundRequest, RefundRevenueType } from '@/models/refund'
import { InvoiceStatus, RefundStatus, RouteNames } from '@/util/constants'
import InvoiceRefundHistory from '@/components/TransactionView/InvoiceRefundHistory.vue'
import { RefundRequestListResponse, RefundRequestResult } from '@/models/refund-request'
import { useAppStore } from '@/store/app'

/* eslint-disable no-unused-vars */
enum RefundLineTypes {
  BASE_FEES = 'BASE_FEES',
  FUTURE_EFFECTIVE_FEES = 'FUTURE_EFFECTIVE_FEES',
  PRIORITY_FEES = 'PRIORITY_FEES',
  SERVICE_FEES = 'SERVICE_FEES'
}
/* eslint-enable no-unused-vars */

export default defineComponent({
  name: 'TransactionView',
  components: { InvoiceRefundHistory, PaymentDetails, TransactionDetails, RefundRequestForm, RefundReviewForm, RefundDecisionForm },
  props: {
    invoiceId: {
      type: String,
      required: true
    },
    refundId: {
      type: String,
      required: false
    },
    mode: {
      type: String,
      required: false
    }
  },
  setup (props, { root }) {
    const appStore = useAppStore()
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
        routingSlip: null
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
        requestedTime: null
      } as RefundFormData,
      refundLineItems: [] as RefundLineItem[],
      refundFormStage: RefundRequestStage.REQUEST_FORM as RefundRequestStage,
      refundMethods: [
        { value: 'refund-as-account-credits', text: 'Refund as Account Credits' }
      ],
      previousRefundedAmount: 0,
      isProcessing: false,
      orgStore: useOrgStore(),
      invoicePaymentMethod: null as string | null,
      invoiceProduct: null as string | null
    })

    const paymentMethodCodesAllowedPartialRefunds = ['DIRECT_PAY', 'EFT', 'EJV', 'ONLINE_BANKING', 'PAD']
    const isPartialRefundAllowed = computed(() =>
      state.transactionData.invoiceStatusCode === InvoiceStatus.COMPLETED &&
      state.paymentData.paymentMethod &&
      paymentMethodCodesAllowedPartialRefunds.includes(state.paymentData.paymentMethod)
    )

    const showRefundHistory = computed(() =>
      state.refundHistoryData.length > 0 && props.mode === 'view'
    )

    const showRefundRequestForm = computed(() => {
      const excludedStatuses = [RefundStatus.APPROVED, RefundStatus.APPROVAL_NOT_REQUIRED, RefundStatus.PENDING_APPROVAL]
      return props.mode === 'initiateRefund' && !excludedStatuses.includes(state.transactionData.latestRefundStatus)
    })

    const showRefundDecisionForm = computed(() =>
      props.mode === 'refund-request' && props.refundId
    )

    onMounted(async () => {
      await fetchInvoice(props.invoiceId)
      await fetchRefundHistory(props.invoiceId)
      if (props.refundId) {
        await fetchRefundRequest(props.refundId)
      }
    })

    watch(
      () => props.refundId,
      async (newRefundId, oldRefundId) => {
        if (newRefundId && newRefundId !== oldRefundId) {
          await fetchRefundRequest(newRefundId)
        }
      },
      { immediate: false }
    )

    function setPaymentData (invoice: Invoice) {
      state.paymentData = {
        accountName: invoice.paymentAccount?.accountName,
        folioNumber: invoice.folioNumber,
        initiatedBy: invoice.createdBy,
        paymentMethod: invoice.paymentMethod,
        paymentStatus: invoice.statusCode,
        totalTransactionAmount: invoice.total || 0
      }
    }

    function setTransactionData (invoice: Invoice) {
      state.transactionData = {
        invoiceId: invoice.id,
        transactionDate: invoice.createdOn, // ??is it utc, convert it to pacific, talk to ethan
        invoiceReferenceId: invoice.references?.find(f => f.statusCode === 'COMPLETED')?.invoiceNumber,
        transactionAmount: invoice.total || 0,
        applicationName: getProductDisplayName(invoice.corpTypeCode),
        applicationType: invoice.lineItems?.[0]?.description,
        businessIdentifier: invoice.businessIdentifier,
        applicationDetails: invoice.details,
        invoiceStatusCode: invoice.statusCode,
        invoiceCreatedOn: invoice.createdOn,
        routingSlip: invoice.routingSlip,
        latestRefundId: invoice.latestRefundId,
        latestRefundStatus: invoice.latestRefundStatus
      }
    }

    function getRefundPayload () {
      const refundRevenues: RefundRevenueType[] = []
      if (state.refundFormData.refundType === RefundType.PARTIAL_REFUND) {
        const refundLineItems = state.refundFormData.refundLineItems
        refundLineItems?.forEach(refundLineItem => {
          const feeTypes = [
            { key: 'filingFeesRequested', type: RefundLineTypes.BASE_FEES },
            { key: 'priorityFeesRequested', type: RefundLineTypes.PRIORITY_FEES },
            { key: 'futureEffectiveFeesRequested', type: RefundLineTypes.FUTURE_EFFECTIVE_FEES },
            { key: 'serviceFeesRequested', type: RefundLineTypes.SERVICE_FEES }
          ]

          feeTypes.forEach(fee => {
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

      const refundPayload: RefundRequest = {
        reason: state.refundFormData.reasonsForRefund,
        staffComment: state.refundFormData.staffComment,
        notificationEmail: state.refundFormData.notificationEmail,
        refundMethod: state.refundFormData.refundMethod,
        refundRevenue: refundRevenues
      }
      return refundPayload
    }

    function setRefundLineItems (lineItems: LineItem[]) {
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

    async function fetchInvoice (invoiceId) {
      try {
        state.dataLoading += 1
        const invoice: Invoice = await state.orgStore.getInvoiceComposite(invoiceId)
        setPaymentData(invoice)
        setTransactionData(invoice)
        setRefundLineItems(invoice.lineItems)
        state.previousRefundedAmount = invoice.refund || 0
        state.invoicePaymentMethod = invoice.paymentMethod
        state.invoiceProduct = invoice.product
      } catch (error: any) {
        console.error('Failed to fetch invoice:', error)
      } finally {
        state.dataLoading -= 1
      }
    }

    async function fetchRefundHistory (invoiceId) {
      try {
        state.dataLoading += 1
        const refundData: RefundRequestListResponse = await state.orgStore.getInvoiceRefundHistory(invoiceId)
        state.refundHistoryData = refundData.items || []
      } catch (error: any) {
        console.error('Failed to fetch refund history', error)
      } finally {
        state.dataLoading -= 1
      }
    }

    async function fetchRefundRequest (refundId) {
      try {
        state.dataLoading += 1
        const refundData: RefundRequestResult = await state.orgStore.getRefundRequest(refundId)
        state.refundRequestData = refundData
      } catch (error: any) {
        console.error('Failed to fetch refund request', error)
      } finally {
        state.dataLoading -= 1
      }
    }

    function onProceedToReview (formData: RefundFormData) {
      state.refundFormData = formData
      state.refundFormStage = RefundRequestStage.DATA_VALIDATED
    }

    function onProceedToRequestForm () {
      state.refundFormStage = RefundRequestStage.REQUEST_FORM
    }

    async function onProceedToConfirm () {
      try {
        state.isProcessing = true
        await state.orgStore.refundInvoice(props.invoiceId, getRefundPayload())
        appStore.showSnackbar('Refund request submitted.')
        if (state.refundFormStage === RefundRequestStage.DATA_VALIDATED) {
          goToTransactionList()
        }
      } catch (error) {
        appStore.showSnackbar('Refund failed.')
        console.log(`Refund request failed: ${error}`)
      } finally {
        state.isProcessing = false
      }
    }

    function getTransactionPageTitle () {
      return ['initiateRefund', 'refund-request'].includes(props.mode)
        ? 'Transaction Refund' : 'Transaction Information'
    }

    async function onDeclineRefund (declineReason) {
      try {
        state.isProcessing = true
        const refundPayload = {
          status: RefundStatus.DECLINED,
          declineReason: declineReason
        }
        await state.orgStore.patchRefundRequest(props.invoiceId, props.refundId, refundPayload)
        appStore.showSnackbar('Refund request declined.')
        goToViewTransaction()
        await fetchInvoice(props.invoiceId)
        await fetchRefundHistory(props.invoiceId)
      } catch (error) {
        appStore.showSnackbar('Failed to decline refund request.')
        console.log(`Refund request decline failed: ${error}`)
      } finally {
        state.isProcessing = false
      }
    }

    async function onApproveRefund () {
      try {
        state.isProcessing = true
        const refundPayload = {
          status: RefundStatus.APPROVED
        }
        await state.orgStore.patchRefundRequest(props.invoiceId, props.refundId, refundPayload)
        appStore.showSnackbar('Refund request approved.')
        await fetchInvoice(props.invoiceId)
        await fetchRefundHistory(props.invoiceId)
        goToViewTransaction()
      } catch (error) {
        appStore.showSnackbar('Failed to approve refund request.')
        console.log(`Refund request approve failed: ${error}`)
      } finally {
        state.isProcessing = false
      }
    }

    function goToViewTransaction () {
      root.$router?.push({
        name: RouteNames.TRANSACTION_VIEW,
        params: {
          invoiceId: props.invoiceId,
          mode: 'view'
        }
      })
    }

    function goToTransactionList () {
      root.$router?.push({
        name: RouteNames.TRANSACTION_LIST
      })
    }

    function onCancel () {
      goToTransactionList()
    }

    return {
      ...toRefs(state),
      RefundRequestStage,
      onProceedToReview,
      onProceedToConfirm,
      onProceedToRequestForm,
      getProductDisplayName,
      onDeclineRefund,
      onApproveRefund,
      isPartialRefundAllowed,
      showRefundRequestForm,
      showRefundDecisionForm,
      showRefundHistory,
      onCancel,
      getTransactionPageTitle
    }
  }
})

</script>
