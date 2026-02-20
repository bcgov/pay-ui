<script setup lang="ts">
import CommonUtils from '@/utils/common-util'
import { RefundApprovalStatus } from '@/utils/constants'
import { RolePattern } from '@/enums/fas-roles'

interface Props {
  refundRequestData: RefundRequestResult
  invoiceProduct?: string | null
  isProcessing: boolean
}

const props = withDefaults(defineProps<Props>(), {
  invoiceProduct: null
})

const emit = defineEmits<{
  onCancel: []
  onApproveRefund: []
  onDeclineRefund: [reason: string]
}>()

const declineReason = ref('')
const showDeclineDialog = ref(false)

const isDeclineReasonValid = computed(() => {
  return declineReason.value.trim().length > 0
})

function canApproveOrDeclineRefund(): boolean {
  if (props.invoiceProduct) {
    return CommonUtils.canApproveDeclineProductRefund(props.invoiceProduct.toLowerCase()
      + RolePattern.ProductRefundApprover)
  }
  return false
}

function showDecisionActions(): boolean {
  const currentUser = CommonUtils.getUserInfo()
  const sameUser = props.refundRequestData.requestedBy?.toUpperCase() === currentUser?.userName?.toUpperCase()
  return props.refundRequestData.refundStatus === RefundApprovalStatus.PENDING_APPROVAL && !sameUser
}

function getRefundStatusText(): string {
  switch (props.refundRequestData.refundStatus) {
    case RefundApprovalStatus.APPROVED:
      return props.refundRequestData.partialRefundLines?.length > 0
        ? 'PARTIALLY REFUNDED'
        : 'FULL REFUND'
    case RefundApprovalStatus.DECLINED:
      return 'REQUEST DECLINED'
    case RefundApprovalStatus.PENDING_APPROVAL:
      return 'PENDING APPROVAL'
    case RefundApprovalStatus.APPROVAL_NOT_REQUIRED:
      return 'APPROVAL NOT REQUIRED'
    default:
      return ''
  }
}

function getLineItemDisplayText(lineItem: PartialRefundLine): string {
  const totalAmount = lineItem.statutoryFeeAmount + lineItem.serviceFeeAmount
    + lineItem.priorityFeeAmount + lineItem.futureEffectiveFeeAmount
  return `${lineItem.description ?? ''} (${CommonUtils.formatAmount(totalAmount)})`
}

function openDeclineDialog() {
  declineReason.value = ''
  showDeclineDialog.value = true
}

function declineConfirm() {
  emit('onDeclineRefund', declineReason.value)
  showDeclineDialog.value = false
}
</script>

<template>
  <div class="bg-white rounded shadow-sm border border-gray-200">
    <div class="flex items-center h-[75px] px-6 bg-blue-50">
      <UIcon name="i-mdi-file-document" class="text-primary text-3xl mr-3" />
      <span class="font-bold text-lg">Refund Request</span>
    </div>

    <div class="p-6 space-y-4">
      <div class="grid grid-cols-1 sm:grid-cols-4 gap-2">
        <span class="font-bold text-gray-900">Request Date</span>
        <span class="sm:col-span-3">
          {{ CommonUtils.formatDisplayDate(refundRequestData.requestedDate, 'MMMM dd, yyyy h:mm a') }}
        </span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-4 gap-2">
        <span class="font-bold text-gray-900">Refund Type</span>
        <span class="sm:col-span-3">
          {{ refundRequestData.partialRefundLines?.length > 0 ? 'Partial Refund' : 'Full Refund' }}
        </span>
      </div>

      <div
        v-if="refundRequestData.partialRefundLines?.length > 0"
        class="grid grid-cols-1 sm:grid-cols-4 gap-2"
      >
        <span class="font-bold text-gray-900">Refund Details</span>
        <div class="sm:col-span-3">
          <ol class="list-decimal pl-5">
            <li
              v-for="(lineItem, index) in refundRequestData.partialRefundLines"
              :key="index"
              class="pb-4"
            >
              <div>{{ getLineItemDisplayText(lineItem) }}</div>
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
                  {{ fee.label }}: {{ CommonUtils.formatAmount(fee.value) }}
                </div>
              </div>
            </li>
          </ol>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-4 gap-2">
        <span class="font-bold text-gray-900">Total Refund Amount</span>
        <span class="sm:col-span-3">
          {{ CommonUtils.formatAmount(Number(refundRequestData.refundAmount)) }}
        </span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-4 gap-2">
        <span class="font-bold text-gray-900">Refund Method</span>
        <span class="sm:col-span-3">{{ refundRequestData.refundMethod }}</span>
      </div>

      <hr class="my-6 border-gray-200">

      <div class="grid grid-cols-1 sm:grid-cols-4 gap-2">
        <span class="font-bold text-gray-900">Notification Email</span>
        <span class="sm:col-span-3">{{ refundRequestData.notificationEmail }}</span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-4 gap-2">
        <span class="font-bold text-gray-900">Reason for Refund</span>
        <span class="sm:col-span-3">{{ refundRequestData.refundReason }}</span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-4 gap-2">
        <span class="font-bold text-gray-900">Staff Comment</span>
        <span class="sm:col-span-3">{{ refundRequestData.staffComment }}</span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-4 gap-2">
        <span class="font-bold text-gray-900">Requested By</span>
        <span class="sm:col-span-3">
          {{ refundRequestData.requestedBy }},
          {{ CommonUtils.formatDisplayDate(
            refundRequestData.requestedDate, 'MMMM dd, yyyy h:mm a'
          ) }} Pacific Time
        </span>
      </div>

      <div
        v-if="refundRequestData.refundStatus === RefundApprovalStatus.APPROVED
          || refundRequestData.refundStatus === RefundApprovalStatus.DECLINED"
        class="grid grid-cols-1 sm:grid-cols-4 gap-2"
      >
        <span class="font-bold text-gray-900">
          {{
            refundRequestData.refundStatus === RefundApprovalStatus.APPROVED
              ? 'Approved By' : 'Declined By'
          }}
        </span>
        <span class="sm:col-span-3">
          {{ refundRequestData.decisionBy }},
          {{ CommonUtils.formatDisplayDate(
            refundRequestData.decisionDate, 'MMMM dd, yyyy h:mm a'
          ) }} Pacific Time
        </span>
      </div>

      <div
        v-if="refundRequestData.refundStatus === RefundApprovalStatus.DECLINED"
        class="grid grid-cols-1 sm:grid-cols-4 gap-2"
      >
        <span class="font-bold text-gray-900">Reasons for Declining</span>
        <span class="sm:col-span-3">{{ refundRequestData.declineReason }}</span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-4 gap-2">
        <span class="font-bold text-gray-900">Refund Status</span>
        <div class="sm:col-span-3">
          <UBadge
            color="primary"
            variant="solid"
            size="md"
          >
            {{ getRefundStatusText() }}
          </UBadge>
        </div>
      </div>

      <template v-if="canApproveOrDeclineRefund() && showDecisionActions()">
        <hr class="my-6 border-gray-200">
        <div class="flex justify-between flex-wrap gap-2">
          <UButton
            label="Cancel"
            variant="outline"
            color="primary"
            size="lg"
            @click="emit('onCancel')"
          />
          <div class="flex gap-2">
            <UButton
              variant="outline"
              color="primary"
              size="lg"
              :disabled="isProcessing"
              @click="openDeclineDialog()"
            >
              <template #leading>
                <UIcon name="i-mdi-close" />
              </template>
              <span v-if="!isProcessing">Decline</span>
              <UIcon
                v-else
                name="i-mdi-loading"
                class="animate-spin"
              />
            </UButton>
            <UButton
              color="primary"
              size="lg"
              :disabled="isProcessing"
              @click="emit('onApproveRefund')"
            >
              <template #leading>
                <UIcon name="i-mdi-check" />
              </template>
              <span v-if="!isProcessing">Approve</span>
              <UIcon
                v-else
                name="i-mdi-loading"
                class="animate-spin"
              />
            </UButton>
          </div>
        </div>
      </template>
    </div>

    <UModal
      v-model:open="showDeclineDialog"
      :ui="{ content: 'sm:max-w-[720px] sm:w-[720px]' }"
    >
      <template #header>
        <div class="flex items-center justify-between w-full pr-2">
          <h2 class="text-xl font-bold text-gray-900">
            Decline Refund Request?
          </h2>
          <UButton
            icon="i-mdi-close"
            color="neutral"
            variant="ghost"
            size="lg"
            @click.stop="showDeclineDialog = false"
          />
        </div>
      </template>

      <template #body>
        <p class="pt-4 pb-4">
          By declining the request, an email will be sent to the requestor including the reason entered below:
        </p>
        <UInput
          v-model="declineReason"
          placeholder="Reasons for declining"
          size="lg"
          class="w-full"
        />
      </template>

      <template #footer>
        <div class="flex items-center justify-center gap-3 w-full py-2">
          <UButton
            label="Cancel"
            variant="outline"
            color="primary"
            size="lg"
            @click.stop="showDeclineDialog = false"
          />
          <UButton
            label="Decline"
            color="primary"
            size="lg"
            :disabled="!isDeclineReasonValid"
            @click="declineConfirm"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>

<style scoped>
.text-primary {
  color: var(--color-primary);
}
</style>
