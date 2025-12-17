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
        <v-alert v-if="previousRefundedAmount > 0"
          class="mt-4"
          border="left"
          dense
          outlined
          prominent
          shaped
          text
          :type="'error'"
        >
          This invoice has already been refunded for an amount of {{ formatAmount(previousRefundedAmount) }} previously.
        </v-alert>
        <v-form
          ref="refundRequestForm"
          v-model="isFormValid"
        >
          <v-row no-gutters>
            <v-col class="col-12 col-sm-12 ">
              <v-row>
                <v-col class="col-6 col-sm-3 font-weight-bold">
                  Refund Type
                </v-col>
                <v-col class="col-6 col-sm-9">
                  <v-radio-group
                    v-model="refundFormData.refundType"
                    :rules="formRules.refundType"
                    column
                    class="ma-0"
                    :hint="refundTypeHint"
                    persistent-hint
                  >
                    <v-radio
                      label="Full Refund"
                      :value="RefundType.FULL_REFUND"
                      :disabled="formDisabled || !isFullRefundAllowed"
                      @change="() => onRefundTypeChange()"
                    ></v-radio>
                    <v-radio
                      label="Partial Refund"
                      :value="RefundType.PARTIAL_REFUND"
                      :disabled="formDisabled || !isPartialRefundAllowed"
                      @change="() => onRefundTypeChange()"
                    ></v-radio>
                  </v-radio-group>
                </v-col>
              </v-row>
              <v-row v-if="refundFormData.refundType === RefundType.PARTIAL_REFUND">
                <v-col class="col-6 col-sm-3 font-weight-bold">
                  Specify Refund Amount
                </v-col>
                <v-col class="col-6 col-sm-9">
                  <div v-for="(lineItem, index) in refundFormData.refundLineItems" :key="lineItem.id">
                    <div class="mb-2">
                      {{ lineItem.description }} ({{ formatAmount(Number(lineItem.total)) }})
                    </div>
                    <v-checkbox
                      v-model="lineItem.refundEntireItemRequested"
                      @change="(value) => onRefundEntireItemRequestedChange(value, index)"
                      label="Refund entire item"
                    ></v-checkbox>
                    <div v-if="lineItem.filingFees" class="d-flex flex-wrap ga-4">
                      <div class="inline-input-box">
                        <v-text-field
                          v-model.number="lineItem.filingFeesRequested"
                          filled
                          :rules="getRequestedAmountRules(lineItem.filingFees)"
                          :suffix="`/${formatAmount(Number(lineItem.filingFees))}`"
                          :disabled="lineItem.refundEntireItemRequested"
                          label="Filing Fees"
                          type="number"
                          hide-spin-buttons
                          @change="() => calculateTotalRequestedAmount()"
                        />
                      </div>
                      <div v-if="lineItem.serviceFees" class="inline-input-box">
                        <v-text-field
                          v-model.number="lineItem.serviceFeesRequested"
                          filled
                          :rules="getRequestedAmountRules(lineItem.serviceFees)"
                          :suffix="`/${formatAmount(Number(lineItem.serviceFees))}`"
                          :disabled="lineItem.refundEntireItemRequested || true"
                          label="Service Fees"
                          type="number"
                          hide-spin-buttons
                          @change="() => calculateTotalRequestedAmount()"
                        />
                      </div>
                      <div v-if="lineItem.priorityFees" class="inline-input-box">
                        <v-text-field
                          v-model.number="lineItem.priorityFeesRequested"
                          filled
                          :rules="getRequestedAmountRules(lineItem.priorityFees)"
                          :suffix="`/${formatAmount(Number(lineItem.priorityFees))}`"
                          :disabled="lineItem.refundEntireItemRequested"
                          label="Priority Fees"
                          type="number"
                          hide-spin-buttons
                          @change="() => calculateTotalRequestedAmount()"
                        />
                      </div>
                      <div v-if="lineItem.futureEffectiveFees" class="inline-input-box">
                        <v-text-field
                          v-model.number="lineItem.futureEffectiveFeesRequested"
                          filled
                          :rules="getRequestedAmountRules(lineItem.futureEffectiveFees)"
                          :suffix="`/${formatAmount(Number(lineItem.futureEffectiveFees))}`"
                          :disabled="lineItem.refundEntireItemRequested"
                          label="Future Effective Fees"
                          type="number"
                          hide-spin-buttons
                          @change="() => calculateTotalRequestedAmount()"
                        />
                      </div>
                    </div>
                  </div>
                </v-col>
              </v-row>
              <v-row>
                <v-col class="col-6 col-sm-3 font-weight-bold">
                  Total Refund Amount
                </v-col>
                <v-col class="col-6 col-sm-9">
                  {{ formatAmount(Number(refundFormData.totalRefundAmount)) }}
                </v-col>
              </v-row>
              <v-row>
                <v-col class="col-6 col-sm-3 font-weight-bold">
                  Refund Method
                </v-col>
                <v-col class="col-6 col-sm-9">
                  {{ refundFormData.refundMethod }}
                </v-col>
              </v-row>
              <v-row>
                <v-col class="col-6 col-sm-3 font-weight-bold">
                  Notification Email
                </v-col>
                <v-col class="col-6 col-sm-9">
                  <v-text-field
                    filled
                    required
                    v-model="refundFormData.notificationEmail"
                    :rules="formRules.notificationEmail"
                    :disabled="formDisabled"
                    maxlength="100"
                    type="email"
                    hint="Defaults to account email. Enter an email if missing, or to use a different address"
                    persistent-hint
                  />
                </v-col>
              </v-row>
              <v-row>
                <v-col class="col-6 col-sm-3 font-weight-bold">
                  Reasons for Refund
                </v-col>
                <v-col class="col-6 col-sm-9">
                  <v-text-field
                    filled
                    required
                    v-model="refundFormData.reasonsForRefund"
                    :rules="formRules.reasonsForRefund"
                    :disabled="formDisabled"
                    maxlength="250"
                    placeholder="Enter Reasons for Refund"
                    hint="The reason will be displayed in client's notification email when refund is approved"
                    persistent-hint
                  />
                </v-col>
              </v-row>
              <v-row>
                <v-col class="col-6 col-sm-3 font-weight-bold">
                  Staff Comment
                </v-col>
                <v-col class="col-6 col-sm-9">
                  <v-text-field
                    filled
                    required
                    v-model="refundFormData.staffComment"
                    :disabled="formDisabled"
                    maxlength="250"
                    placeholder="Enter Staff Comment (Optional)"
                    hint="Only viewable by staff"
                    persistent-hint
                  />
                </v-col>
              </v-row>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
    </v-card>
    <div class="d-flex justify-space-between flex-wrap">
      <v-btn
        large
        outlined
        @click="onCancel"
        color="primary"
        class="mt-10"
      >
        <span>Cancel</span>
      </v-btn>
      <v-btn
        large
        @click="onReviewBtnClick()"
        :disabled="formDisabled || refundFormData.totalRefundAmount <= 0"
        color="primary"
        class="mt-10"
      >
        <span>Review and Confirm</span>
      </v-btn>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, toRefs, watch, PropType, nextTick, computed } from '@vue/composition-api'
import CommonUtils from '@/util/common-util'
import { RefundFormData, RefundType, RefundLineItem } from '@/models/transaction-refund'
import moment from 'moment'
import { PaymentTypeToRefundMethodMap } from '@/util/constants'

export default defineComponent({
  name: 'RefundRequestForm',
  props: {
    totalTransactionAmount: {
      type: Number,
      required: true
    },
    refundLineItems: {
      type: Array as PropType<RefundLineItem[]>,
      required: true,
      default: () => []
    },
    previousRefundedAmount: {
      type: Number,
      required: true
    },
    isPartialRefundAllowed: {
      type: Boolean,
      required: false
    },
    isFullRefundAllowed: {
      type: Boolean,
      required: false
    },
    invoicePaymentMethod: {
      type: String,
      required: false
    }
  },
  setup (props, { emit }) {
    const state = reactive({
      refundRequestForm: null,
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
      isFormValid: false,
      formRules: {
        refundType: [
          (v: any) => !!v || 'Refund Type is required'
        ],
        notificationEmail: CommonUtils.emailRules(true),
        reasonsForRefund: [
          (v: any) => !!v || 'Reasons for Refund is required'
        ]
      },
      formDisabled: computed(() => {
        return props.previousRefundedAmount > 0 || (!props.isFullRefundAllowed && !props.isPartialRefundAllowed)
      }),
      refundTypeHint: computed(() => {
        return props.isPartialRefundAllowed
          ? ''
          : `Partial Refunds not supported for payment method ${props.invoicePaymentMethod} invoices or is not paid.`
      })
    })

    const getRequestedAmountRules = (max?: number) => [
      (v: any) => v == null || v === '' || !isNaN(v) ? true : 'Enter a valid number',
      (v: any) => v == null || v === '' || Number(v) >= 0 ? true : 'Refund amount cannot be negative',
      (v: any) => v == null || v === '' || max == null || Number(v) <= Number(max)
        ? true
        : `Refund amount exceeds ${CommonUtils.formatAmount(Number(max))}`
    ]

    const currentUser = CommonUtils.getUserInfo()

    watch(() => props.refundLineItems, (newData) => {
      state.refundFormData.refundLineItems = JSON.parse(JSON.stringify(newData))
    }, { immediate: true, deep: true })

    watch(() => props.invoicePaymentMethod, (newData) => {
      if (newData) {
        state.refundFormData.refundMethod = PaymentTypeToRefundMethodMap[props.invoicePaymentMethod]
      }
    }, { immediate: true })

    function onReviewBtnClick () {
      if (!state.refundRequestForm.validate()) {
        return
      }
      calculateTotalRequestedAmount()

      state.refundFormData.requestedBy = currentUser?.fullName
      state.refundFormData.requestedTime = moment().format()
      emit('onProceedToReview', state.refundFormData)
    }

    function onRefundEntireItemRequestedChange (value: boolean, index: number) {
      if (value) {
        const lineItem = state.refundFormData.refundLineItems[index]
        lineItem.filingFeesRequested = CommonUtils.formatToTwoDecimals(Number(lineItem.filingFees))
        lineItem.serviceFeesRequested = null
        lineItem.priorityFeesRequested = CommonUtils.formatToTwoDecimals(Number(lineItem.priorityFees))
        lineItem.futureEffectiveFeesRequested = CommonUtils.formatToTwoDecimals(Number(lineItem.futureEffectiveFees))
      }
      calculateTotalRequestedAmount()
    }

    function getValidNumber (amount: number, maxAmount: number) {
      return amount < 0 || (maxAmount != null && amount > maxAmount) ? 0 : amount
    }

    function calculateTotalRequestedAmount () {
      let total = 0
      if (state.refundFormData.refundType === RefundType.FULL_REFUND) {
        total = props.totalTransactionAmount
      } else {
        state.refundFormData.refundLineItems.forEach(item => {
          total += getValidNumber(Number(item.filingFeesRequested) || 0, item.filingFees)
          total += getValidNumber(Number(item.serviceFeesRequested) || 0, item.serviceFees)
          total += getValidNumber(Number(item.priorityFeesRequested) || 0, item.priorityFees)
          total += getValidNumber(Number(item.futureEffectiveFeesRequested) || 0, item.futureEffectiveFees)
        })
      }
      state.refundFormData.totalRefundAmount = total
    }

    async function onRefundTypeChange () {
      await nextTick()
      calculateTotalRequestedAmount()
    }

    function onCancel () {
      emit('onCancel')
    }

    return {
      ...toRefs(state),
      RefundType,
      getRequestedAmountRules,
      onReviewBtnClick,
      onRefundEntireItemRequestedChange,
      onCancel,
      calculateTotalRequestedAmount,
      onRefundTypeChange,
      formatAmount: CommonUtils.formatAmount
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
.ga-4 {
  gap: 16px;
}

.inline-input-box {
  width: 212px;
}

::v-deep {
  .v-sheet--shaped .v-alert__border--left {
    border-width: 0 !important;
  }
}
</style>
