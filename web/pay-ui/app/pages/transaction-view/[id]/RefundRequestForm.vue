<script setup lang="ts">
import CommonUtils from '@/utils/common-util'
import { RefundType } from '@/interfaces/transaction-view'
import type { RefundFormData, RefundLineItem } from '@/interfaces/transaction-view'
import { DateTime } from 'luxon'
import { PaymentTypeToRefundMethodMap } from '~/utils'

interface Props {
  totalTransactionAmount: number
  refundLineItems: RefundLineItem[]
  previousRefundedAmount: number
  isPartialRefundAllowed?: boolean
  isFullRefundAllowed?: boolean
  invoicePaymentMethod?: string | null
  refundMethod?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  isPartialRefundAllowed: false,
  isFullRefundAllowed: false,
  invoicePaymentMethod: null,
  refundMethod: null
})

const emit = defineEmits<{
  onCancel: []
  onProceedToReview: [data: RefundFormData]
}>()

const refundFormData = reactive<RefundFormData>({
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
})

const isFormValid = ref(false)
const refundTypeError = ref('')
const notificationEmailError = ref('')
const reasonsForRefundError = ref('')

const formDisabled = computed(() => {
  return props.previousRefundedAmount > 0 || (!props.isFullRefundAllowed && !props.isPartialRefundAllowed)
})

const refundTypeHint = computed(() => {
  return props.isPartialRefundAllowed
    ? ''
    : `Partial Refunds not supported for payment method ${props.invoicePaymentMethod} invoices or is not paid.`
})

function getRequestedAmountRules(max?: number | null) {
  return [
    (v: number | string | null | undefined) => {
      return v == null || v === '' || !isNaN(Number(v)) ? true : 'Enter a valid number'
    },
    (v: number | string | null | undefined) => {
      return v == null || v === '' || Number(v) >= 0 ? true : 'Refund amount cannot be negative'
    },
    (v: number | string | null | undefined) => v == null || v === '' || max == null || Number(v) <= Number(max)
      ? true
      : `Refund amount exceeds ${CommonUtils.formatAmount(Number(max))}`
  ]
}

function getValidNumber(amount: number, maxAmount: number | null | undefined): number {
  return amount < 0 || (maxAmount != null && amount > maxAmount) ? 0 : amount
}

function calculateTotalRequestedAmount() {
  let total = 0
  if (refundFormData.refundType === RefundType.FULL_REFUND) {
    total = props.totalTransactionAmount
  } else {
    refundFormData.refundLineItems?.forEach((item) => {
      total += getValidNumber(Number(item.filingFeesRequested) || 0, item.filingFees ?? null)
      total += getValidNumber(Number(item.serviceFeesRequested) || 0, item.serviceFees ?? null)
      total += getValidNumber(Number(item.priorityFeesRequested) || 0, item.priorityFees ?? null)
      total += getValidNumber(Number(item.futureEffectiveFeesRequested) || 0, item.futureEffectiveFees ?? null)
    })
  }
  refundFormData.totalRefundAmount = total
}

watch(() => props.refundLineItems, (newData) => {
  refundFormData.refundLineItems = JSON.parse(JSON.stringify(newData))
}, { immediate: true, deep: true })

watch(() => props.invoicePaymentMethod, (newData) => {
  if (newData) {
    refundFormData.refundMethod = PaymentTypeToRefundMethodMap[newData as keyof typeof PaymentTypeToRefundMethodMap]
  }
}, { immediate: true })

function onRefundEntireItemRequestedChange(value: boolean, index: number) {
  if (value && refundFormData.refundLineItems) {
    const lineItem = refundFormData.refundLineItems[index]
    if (lineItem) {
      lineItem.filingFeesRequested = CommonUtils.formatToTwoDecimals(Number(lineItem.filingFees))
      lineItem.serviceFeesRequested = null
      lineItem.priorityFeesRequested = CommonUtils.formatToTwoDecimals(Number(lineItem.priorityFees))
      lineItem.futureEffectiveFeesRequested = CommonUtils.formatToTwoDecimals(Number(lineItem.futureEffectiveFees))
    }
  }
  calculateTotalRequestedAmount()
}

async function onRefundTypeChange() {
  await nextTick()
  calculateTotalRequestedAmount()
}

function validateForm(): boolean {
  let valid = true

  if (!refundFormData.refundType) {
    refundTypeError.value = 'Refund Type is required'
    valid = false
  } else {
    refundTypeError.value = ''
  }

  const emailRules = CommonUtils.emailRules(true)
  for (const rule of emailRules) {
    const result = rule(refundFormData.notificationEmail)
    if (result !== true) {
      notificationEmailError.value = result as string
      valid = false
      break
    } else {
      notificationEmailError.value = ''
    }
  }

  if (!refundFormData.reasonsForRefund) {
    reasonsForRefundError.value = 'Reasons for Refund is required'
    valid = false
  } else {
    reasonsForRefundError.value = ''
  }

  isFormValid.value = valid
  return valid
}

function getAmountValidationError(value: number | string | null | undefined, max?: number | null): string {
  const rules = getRequestedAmountRules(max)
  for (const rule of rules) {
    const result = rule(value)
    if (result !== true) {
      return result as string
    }
  }
  return ''
}

function onReviewBtnClick() {
  if (!validateForm()) {
    return
  }
  calculateTotalRequestedAmount()

  const currentUser = CommonUtils.getUserInfo()
  refundFormData.requestedBy = currentUser?.fullName ?? null
  refundFormData.requestedTime = DateTime.now().toISO()
  emit('onProceedToReview', { ...refundFormData })
}

// Sync refundLineItems prop
watch(() => props.refundLineItems, (newData) => {
  refundFormData.refundLineItems = JSON.parse(JSON.stringify(newData))
}, { immediate: true, deep: true })

// Sync refund method prop
watch(() => props.refundMethod, (newData) => {
  if (newData) {
    refundFormData.refundMethod = newData
  }
}, { immediate: true })
</script>

<template>
  <div>
    <div class="bg-white rounded shadow-sm border border-gray-200">
      <div class="flex items-center h-[75px] px-6 bg-blue-50">
        <UIcon name="i-mdi-file-document" class="text-primary text-3xl mr-3" />
        <span class="font-bold text-lg">Refund Request</span>
      </div>

      <div class="p-6 space-y-4">
        <!-- Previous refund alert -->
        <UAlert
          v-if="previousRefundedAmount > 0"
          color="error"
          variant="outline"
          icon="i-mdi-alert-circle"
          :description="`This invoice has already been refunded for an amount of ${
            CommonUtils.formatAmount(previousRefundedAmount)
          } previously.`"
        />

        <form @submit.prevent="onReviewBtnClick">
          <!-- Refund Type -->
          <div class="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-4">
            <span class="font-bold text-gray-900">Refund Type</span>
            <div class="sm:col-span-3">
              <div class="flex flex-col gap-2">
                <URadioGroup
                  v-model="refundFormData.refundType"
                  :items="[
                    { label: 'Full Refund',
                      value: RefundType.FULL_REFUND,
                      disabled: formDisabled || !isFullRefundAllowed },
                    { label: 'Partial Refund',
                      value: RefundType.PARTIAL_REFUND,
                      disabled: formDisabled || !isPartialRefundAllowed }
                  ]"
                  @update:model-value="onRefundTypeChange"
                />
                <p v-if="refundTypeHint" class="text-sm text-gray-500">
                  {{ refundTypeHint }}
                </p>
                <p v-if="refundTypeError" class="text-sm text-red-500">
                  {{ refundTypeError }}
                </p>
              </div>
            </div>
          </div>

          <!-- Partial Refund Line Items -->
          <div
            v-if="refundFormData.refundType === RefundType.PARTIAL_REFUND"
            class="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-4"
          >
            <span class="font-bold text-gray-900">Specify Refund Amount</span>
            <div class="sm:col-span-3">
              <div
                v-for="(lineItem, index) in refundFormData.refundLineItems"
                :key="lineItem.id"
                class="mb-6"
              >
                <div class="mb-2 font-medium">
                  {{ lineItem.description }} ({{ CommonUtils.formatAmount(Number(lineItem.total)) }})
                </div>
                <UCheckbox
                  v-model="lineItem.refundEntireItemRequested"
                  label="Refund entire item"
                  class="mb-3"
                  @update:model-value="(value: boolean) => onRefundEntireItemRequestedChange(value, index)"
                />
                <div v-if="lineItem.filingFees" class="flex flex-wrap gap-4">
                  <div class="w-[212px]">
                    <UInput
                      v-model.number="lineItem.filingFeesRequested"
                      type="number"
                      placeholder="Filing Fees"
                      :disabled="lineItem.refundEntireItemRequested ?? false"
                      size="lg"
                      @update:model-value="calculateTotalRequestedAmount"
                    />
                    <p class="text-xs text-gray-500 mt-1">
                      Filing Fees / {{ CommonUtils.formatAmount(Number(lineItem.filingFees)) }}
                    </p>
                    <p
                      v-if="getAmountValidationError(lineItem.filingFeesRequested, lineItem.filingFees)"
                      class="text-xs text-red-500 mt-1"
                    >
                      {{ getAmountValidationError(lineItem.filingFeesRequested, lineItem.filingFees) }}
                    </p>
                  </div>
                  <div v-if="lineItem.serviceFees" class="w-[212px]">
                    <UInput
                      v-model.number="lineItem.serviceFeesRequested"
                      type="number"
                      placeholder="Service Fees"
                      disabled
                      size="lg"
                      @update:model-value="calculateTotalRequestedAmount"
                    />
                    <p class="text-xs text-gray-500 mt-1">
                      Service Fees / {{ CommonUtils.formatAmount(Number(lineItem.serviceFees)) }}
                    </p>
                    <p
                      v-if="getAmountValidationError(lineItem.serviceFeesRequested, lineItem.serviceFees)"
                      class="text-xs text-red-500 mt-1"
                    >
                      {{ getAmountValidationError(lineItem.serviceFeesRequested, lineItem.serviceFees) }}
                    </p>
                  </div>
                  <div v-if="lineItem.priorityFees" class="w-[212px]">
                    <UInput
                      v-model.number="lineItem.priorityFeesRequested"
                      type="number"
                      placeholder="Priority Fees"
                      :disabled="lineItem.refundEntireItemRequested ?? false"
                      size="lg"
                      @update:model-value="calculateTotalRequestedAmount"
                    />
                    <p class="text-xs text-gray-500 mt-1">
                      Priority Fees / {{ CommonUtils.formatAmount(Number(lineItem.priorityFees)) }}
                    </p>
                    <p
                      v-if="getAmountValidationError(lineItem.priorityFeesRequested, lineItem.priorityFees)"
                      class="text-xs text-red-500 mt-1"
                    >
                      {{ getAmountValidationError(lineItem.priorityFeesRequested, lineItem.priorityFees) }}
                    </p>
                  </div>
                  <div v-if="lineItem.futureEffectiveFees" class="w-[212px]">
                    <UInput
                      v-model.number="lineItem.futureEffectiveFeesRequested"
                      type="number"
                      placeholder="Future Effective Fees"
                      :disabled="lineItem.refundEntireItemRequested ?? false"
                      size="lg"
                      @update:model-value="calculateTotalRequestedAmount"
                    />
                    <p class="text-xs text-gray-500 mt-1">
                      Future Effective Fees / {{ CommonUtils.formatAmount(Number(lineItem.futureEffectiveFees)) }}
                    </p>
                    <p
                      v-if="getAmountValidationError(
                        lineItem.futureEffectiveFeesRequested,
                        lineItem.futureEffectiveFees
                      )"
                      class="text-xs text-red-500 mt-1"
                    >
                      {{ getAmountValidationError(lineItem.futureEffectiveFeesRequested,
                                                  lineItem.futureEffectiveFees) }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Total Refund Amount -->
          <div class="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-4">
            <span class="font-bold text-gray-900">Total Refund Amount</span>
            <span class="sm:col-span-3">
              {{ CommonUtils.formatAmount(Number(refundFormData.totalRefundAmount)) }}
            </span>
          </div>

          <!-- Refund Method -->
          <div class="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-4">
            <span class="font-bold text-gray-900">Refund Method</span>
            <span class="sm:col-span-3">{{ refundFormData.refundMethod }}</span>
          </div>

          <!-- Notification Email -->
          <div class="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-4">
            <span class="font-bold text-gray-900">Notification Email</span>
            <div class="sm:col-span-3">
              <UInput
                v-model="refundFormData.notificationEmail"
                type="email"
                :disabled="formDisabled"
                :maxlength="100"
                placeholder="Enter email address"
                size="lg"
                class="w-full"
              />
              <p class="text-xs text-gray-500 mt-1">
                Defaults to account email. Enter an email if missing, or to use a different address
              </p>
              <p v-if="notificationEmailError" class="text-xs text-red-500 mt-1">
                {{ notificationEmailError }}
              </p>
            </div>
          </div>

          <!-- Reasons for Refund -->
          <div class="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-4">
            <span class="font-bold text-gray-900">Reasons for Refund</span>
            <div class="sm:col-span-3">
              <UInput
                v-model="refundFormData.reasonsForRefund"
                :disabled="formDisabled"
                :maxlength="250"
                placeholder="Enter Reasons for Refund"
                size="lg"
                class="w-full"
              />
              <p class="text-xs text-gray-500 mt-1">
                The reason will be displayed in client's notification email when refund is approved
              </p>
              <p v-if="reasonsForRefundError" class="text-xs text-red-500 mt-1">
                {{ reasonsForRefundError }}
              </p>
            </div>
          </div>

          <!-- Staff Comment -->
          <div class="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-4">
            <span class="font-bold text-gray-900">Staff Comment</span>
            <div class="sm:col-span-3">
              <UInput
                v-model="refundFormData.staffComment"
                :disabled="formDisabled"
                :maxlength="250"
                placeholder="Enter Staff Comment (Optional)"
                size="lg"
                class="w-full"
              />
              <p class="text-xs text-gray-500 mt-1">
                Only viewable by staff
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex justify-between flex-wrap gap-2 mt-10">
      <UButton
        label="Cancel"
        variant="outline"
        color="primary"
        size="lg"
        @click="emit('onCancel')"
      />
      <UButton
        label="Review and Confirm"
        color="primary"
        size="lg"
        :disabled="formDisabled || (refundFormData.totalRefundAmount ?? 0) <= 0"
        @click="onReviewBtnClick"
      />
    </div>
  </div>
</template>

<style scoped>
.text-primary {
  color: var(--color-primary);
}
</style>
