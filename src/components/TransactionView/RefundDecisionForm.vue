<template>
  <div>
    <v-card flat>
      <v-card-title class="card-title">
        <v-icon
          class="pr-3"
          color="link"
        >
          mdi-file-document
        </v-icon>
        Refund Request
      </v-card-title>
      <v-card-text
        class="mt-5"
      >
        <v-row no-gutters>
          <v-col class="col-12 col-sm-12 ">
            <v-row>
              <v-col class="col-6 col-sm-3 font-weight-bold">
                Request Date
              </v-col>
              <v-col class="col-6 col-sm-9">
                {{ formatUtcToPacificDate(refundRequestData.requestedDate, 'MMMM DD, YYYY hh:mm A') }}
              </v-col>
            </v-row>
            <v-row>
              <v-col class="col-6 col-sm-3 font-weight-bold">
                Refund Type
              </v-col>
              <v-col class="col-6 col-sm-9">
                {{ refundRequestData.partialRefundLines.length > 0 ? 'Partial Refund' : 'Full Refund' }}
              </v-col>
            </v-row>
            <v-row v-if="refundRequestData.partialRefundLines.length > 0">
              <v-col class="col-6 col-sm-3 font-weight-bold">
                Refund Details
              </v-col>
              <v-col class="col-6 col-sm-9">
                  <ol>
                    <li v-for="(lineItem, index) in refundRequestData.partialRefundLines" :key="index" class="pb-4">
                      <div>
                        {{ getLineItemDisplayText(lineItem) }}
                      </div>
                      <div>
                        <div
                          v-for="fee in [
                            { label: 'Filing Fees', value: Number(lineItem.statutoryFeeAmount) || 0 },
                            { label: 'Service Fees', value: Number(lineItem.serviceFeeAmount) || 0 },
                            { label: 'Priority Fees', value: Number(lineItem.priorityFeeAmount) || 0 },
                            { label: 'Future Effective Fees', value: Number(lineItem.futureEffectiveFeeAmount) || 0 }
                          ].filter(f => f.value > 0)"
                          :key="fee.label"
                          class="pt-3"
                        >
                          {{ fee.label }}: {{ formatAmount(fee.value) }}
                        </div>
                      </div>
                    </li>
                  </ol>
              </v-col>
            </v-row>
            <v-row>
              <v-col class="col-6 col-sm-3 font-weight-bold">
                Total Refund Amount
              </v-col>
              <v-col class="col-6 col-sm-9">
                {{ formatAmount(Number(refundRequestData.refundAmount)) }}
              </v-col>
            </v-row>
            <v-row>
              <v-col class="col-6 col-sm-3 font-weight-bold">
                Refund Method
              </v-col>
              <v-col class="col-6 col-sm-9">
                {{ refundRequestData.refundMethod }}
              </v-col>
            </v-row>
            <v-divider class="my-6"></v-divider>
            <v-row>
              <v-col class="col-6 col-sm-3 font-weight-bold">
                Notification Email
              </v-col>
              <v-col class="col-6 col-sm-9">
                {{ refundRequestData.notificationEmail }}
              </v-col>
            </v-row>
            <v-row>
              <v-col class="col-6 col-sm-3 font-weight-bold">
                Reason for Refund
              </v-col>
              <v-col class="col-6 col-sm-9">
                {{ refundRequestData.refundReason }}
              </v-col>
            </v-row>
            <v-row>
              <v-col class="col-6 col-sm-3 font-weight-bold">
                Staff Comment
              </v-col>
              <v-col class="col-6 col-sm-9">
                {{ refundRequestData.staffComment }}
              </v-col>
            </v-row>
            <v-row>
              <v-col class="col-6 col-sm-3 font-weight-bold">
                Requested By
              </v-col>
              <v-col class="col-6 col-sm-9">
                {{ refundRequestData.requestedBy }}, {{ formatUtcToPacificDate(refundRequestData.requestedDate, 'MMMM DD, YYYY h:mm A') }} Pacific Time
              </v-col>
            </v-row>
            <v-row v-if="refundRequestData.refundStatus == RefundStatus.APPROVED || refundRequestData.refundStatus == RefundStatus.DECLINED">
              <v-col class="col-6 col-sm-3 font-weight-bold">
                {{ refundRequestData.refundStatus == RefundStatus.APPROVED ? 'Approved By' : 'Declined By' }}
              </v-col>
              <v-col class="col-6 col-sm-9">
                {{ refundRequestData.decisionBy }}, {{ formatUtcToPacificDate(refundRequestData.decisionDate, 'MMMM DD, YYYY h:mm A') }} Pacific Time
              </v-col>
            </v-row>
            <v-row v-if="refundRequestData.refundStatus == RefundStatus.DECLINED">
              <v-col class="col-6 col-sm-3 font-weight-bold">
                Reasons for Declining
              </v-col>
              <v-col class="col-6 col-sm-9">
                {{ refundRequestData.declineReason }}
              </v-col>
            </v-row>
            <v-row>
              <v-col class="col-6 col-sm-3 font-weight-bold">
                Refund Status
              </v-col>
              <v-col class="col-6 col-sm-9">
                <v-chip
                  small
                  label
                  text-color="white"
                  class="primary pl-2 pr-2 font-weight-bold"
                >
                  {{ getRefundStatusText() }}
                </v-chip>
              </v-col>
            </v-row>
          </v-col>
        </v-row>
        <template v-if="canApproveOrDeclineRefund() && showDecisionActions()">
          <v-divider class="my-6"></v-divider>
          <div class="d-flex justify-space-between flex-wrap">
            <v-btn
              large
              outlined
              @click="onCancel()"
              color="primary"
              class="mt-2"
            >
              <span>Cancel</span>
            </v-btn>
            <div
              id="decision-actions"
              class="d-flex">
              <v-btn
                large
                outlined
                :disabled="isProcessing"
                @click="declineRefund()"
                color="primary"
                class="mt-2 mr-2"
              >
                <v-icon
                  class="mr-2"
                >
                  mdi-close
                </v-icon>
                <span v-if="!isProcessing">Decline</span>
                <v-progress-circular
                  v-else
                  indeterminate
                  color="white"
                  size="24"
                />
              </v-btn>
              <v-btn
                large
                :disabled="isProcessing"
                @click="approveRefund()"
                color="primary"
                class="mt-2"
              >
                <v-icon
                  class="mr-2"
                >
                  mdi-check
                </v-icon>
                <span v-if="!isProcessing">Approve</span>
                <v-progress-circular
                  v-else
                  indeterminate
                  color="white"
                  size="24"
                />
              </v-btn>
            </div>
          </div>
        </template>
      </v-card-text>
    </v-card>
    <ModalDialog
      ref="declineDialog"
      max-width="720"
      :show-icon="false"
      :showCloseIcon="true"
      dialog-class="decline-dialog"
      title="Decline Refund Request?"
    >
      <template #text>
        <p class="pt-4">
          By declining the request, an email will be sent to the requestor including the reason entered below:
        </p>
        <v-text-field
          v-model="declineReason"
          filled
          label="Reasons for declining"
          persistent-hint
          required
          :rules="declineReasonRules"
        />
      </template>
      <template #actions>
        <div class="d-flex align-center justify-center w-100 h-100 ga-3">
          <v-btn
            outlined
            large
            depressed
            class="mr-3"
            color="primary"
            data-test="btn-cancel-decline-dialog"
            @click="declineCancel"
          >
            Cancel
          </v-btn>
          <v-btn
            large
            depressed
            class="font-weight-bold btn-dialog"
            data-test="btn-confirm-decline-dialog"
            color="primary"
            :disabled="!isDeclineReasonValid"
            @click="declineConfirm"
          >
            Decline
          </v-btn>
        </div>
      </template>
    </ModalDialog>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, reactive, ref, Ref, toRefs } from '@vue/composition-api'
import CommonUtils from '@/util/common-util'
import { RefundType } from '@/models/transaction-refund'
import { RefundRequestResult } from '@/models/refund-request'
import ModalDialog from '@/components/common/ModalDialog.vue'
import { RefundStatus, RolePattern } from '@/util/constants'

export default defineComponent({
  name: 'RefundDecisionForm',
  computed: {
    RefundStatus () {
      return RefundStatus
    }
  },
  components: { ModalDialog },
  props: {
    refundRequestData: {
      type: Object as PropType<RefundRequestResult>,
      required: true
    },
    invoiceProduct: {
      type: String as PropType<String>,
      required: false,
      default: null
    },
    isProcessing: {
      type: Boolean as PropType<boolean>,
      required: true
    }
  },
  setup (props, { emit }) {
    const currentUser = CommonUtils.getUserInfo()
    const declineDialog: Ref<InstanceType<typeof ModalDialog>> = ref(null)
    const declineReasonRules = [
      (v: string) => !!v || 'Reason for declining is required'
    ]
    const isDeclineReasonValid = computed(() => {
      return state.declineReason && state.declineReason.trim().length > 0
    })
    const state = reactive({
      declineReason: '',
      loading: false
    })
    function onConfirmBtnClick () {
      emit('onProceedToConfirm')
    }

    function onCancel () {
      emit('onCancel')
    }

    function declineRefund (item) {
      declineDialog.value.open()
    }

    function declineCancel () {
      declineDialog.value.close()
    }

    function declineConfirm () {
      emit('onDeclineRefund', state.declineReason)
      declineDialog.value.close()
    }

    function approveRefund (item) {
      emit('onApproveRefund')
    }

    function showDecisionActions () {
      const sameUser = props.refundRequestData.requestedBy.toUpperCase() === currentUser.userName?.toUpperCase()
      return props.refundRequestData.refundStatus === RefundStatus.PENDING_APPROVAL && !sameUser
    }

    function getLineItemDisplayText (lineItem: any) {
      const totalAmount = lineItem.statutoryFeeAmount + lineItem.serviceFeeAmount +
        lineItem.priorityFeeAmount + lineItem.futureEffectiveFeeAmount
      return `${lineItem.description} (${CommonUtils.formatAmount(totalAmount)})`
    }

    function getRefundStatusText (): string {
      switch (props.refundRequestData.refundStatus) {
        case RefundStatus.APPROVED:
          if (props.refundRequestData.partialRefundLines.length > 0) {
            return 'PARTIALLY REFUNDED'
          } else {
            return 'FULL REFUND'
          }
        case RefundStatus.DECLINED:
          return 'REQUEST DECLINED'
        case RefundStatus.PENDING_APPROVAL:
          return 'PENDING APPROVAL'
        case RefundStatus.APPROVAL_NOT_REQUIRED:
          return 'APPROVAL NOT REQUIRED'
      }
    }

    function canApproveOrDeclineRefund (): boolean {
      if (props.invoiceProduct) {
        return CommonUtils.canApproveDeclineProductRefund(props.invoiceProduct.toLowerCase() +
          RolePattern.ProductRefundApprover)
      }
      return false
    }

    return {
      ...toRefs(state),
      formatAmount: CommonUtils.formatAmount,
      formatUtcToPacificDate: CommonUtils.formatUtcToPacificDate,
      onConfirmBtnClick,
      onCancel,
      RefundType,
      declineRefund,
      declineCancel,
      declineConfirm,
      declineDialog,
      approveRefund,
      getRefundStatusText,
      showDecisionActions,
      isDeclineReasonValid,
      declineReasonRules,
      canApproveOrDeclineRefund,
      getLineItemDisplayText
    }
  }
})
</script>

<style lang="scss" scoped>
@import '$assets/scss/theme.scss';
@import '$assets/scss/actions.scss';

.card-title {
  background-color: $app-lt-blue;
  justify-content: left;
  height: 75px;
  font-weight: bold;
  font-size: 1.125rem;
}
ol {
  padding-left: 18px !important;
}

::v-deep {
  .v-sheet--shaped .v-alert__border--left {
    border-width: 0 !important;
  }
}

</style>
