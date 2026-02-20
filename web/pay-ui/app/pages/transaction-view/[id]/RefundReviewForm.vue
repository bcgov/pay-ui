<script setup lang="ts">
import CommonUtils from '@/utils/common-util'
import { RefundType } from '@/interfaces/transaction-view'
import type { RefundFormData } from '@/interfaces/transaction-view'

interface Props {
  refundFormData: RefundFormData
  isProcessing: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  onProceedToConfirm: []
  onProceedToRequestForm: []
}>()
</script>

<template>
  <div>
    <div class="bg-white rounded shadow-sm border border-gray-200">
      <div class="flex items-center h-[75px] px-6 bg-blue-50">
        <UIcon name="i-mdi-file-document" class="text-primary text-3xl mr-3" />
        <span class="font-bold text-lg">Refund Request</span>
      </div>

      <div class="p-6 space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-4 gap-2">
          <span class="font-bold text-gray-900">Request Date</span>
          <span class="sm:col-span-3">
            {{ CommonUtils.formatDisplayDate(refundFormData.requestedTime, 'MMMM dd, yyyy h:mm a') }}
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-4 gap-2">
          <span class="font-bold text-gray-900">Refund Type</span>
          <span class="sm:col-span-3">{{ refundFormData.refundType }}</span>
        </div>

        <div
          v-if="refundFormData.refundType === RefundType.PARTIAL_REFUND"
          class="grid grid-cols-1 sm:grid-cols-4 gap-2"
        >
          <span class="font-bold text-gray-900">Refund Details</span>
          <div class="sm:col-span-3">
            <ol class="list-decimal pl-5">
              <li
                v-for="(lineItem, index) in refundFormData.refundLineItems"
                :key="index"
                class="pb-4"
              >
                <div>
                  {{ lineItem.description }} ({{ CommonUtils.formatAmount(Number(lineItem.total)) }})
                </div>
                <div v-if="lineItem.refundEntireItemRequested" class="pt-3">
                  Entire Item: {{ CommonUtils.formatAmount(Number(lineItem.total)) }}
                </div>
                <div v-else>
                  <div
                    v-for="fee in [
                      { label: 'Filing Fees', value: Number(lineItem.filingFeesRequested) || 0 },
                      { label: 'Service Fees', value: Number(lineItem.serviceFeesRequested) || 0 },
                      { label: 'Priority Fees', value: Number(lineItem.priorityFeesRequested) || 0 },
                      { label: 'Future Effective Fees', value: Number(lineItem.futureEffectiveFeesRequested) || 0 }
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
            {{ CommonUtils.formatAmount(Number(refundFormData.totalRefundAmount)) }}
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-4 gap-2">
          <span class="font-bold text-gray-900">Refund Method</span>
          <span class="sm:col-span-3">{{ refundFormData.refundMethod }}</span>
        </div>

        <hr class="my-6 border-gray-200">

        <div class="grid grid-cols-1 sm:grid-cols-4 gap-2">
          <span class="font-bold text-gray-900">Notification Email</span>
          <span class="sm:col-span-3">{{ refundFormData.notificationEmail }}</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-4 gap-2">
          <span class="font-bold text-gray-900">Reason for Refund</span>
          <span class="sm:col-span-3">{{ refundFormData.reasonsForRefund }}</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-4 gap-2">
          <span class="font-bold text-gray-900">Staff Comment</span>
          <span class="sm:col-span-3">{{ refundFormData.staffComment }}</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-4 gap-2">
          <span class="font-bold text-gray-900">Requested By</span>
          <span class="sm:col-span-3">
            {{ refundFormData.requestedBy }},
            {{ CommonUtils.formatDisplayDate(refundFormData.requestedTime, 'MMMM dd, yyyy h:mm a') }}
          </span>
        </div>
      </div>
    </div>

    <div class="flex justify-between flex-wrap gap-2 mt-10">
      <UButton
        label="Back"
        variant="outline"
        color="primary"
        size="lg"
        @click="emit('onProceedToRequestForm')"
      />
      <UButton
        color="primary"
        size="lg"
        :disabled="isProcessing"
        @click="emit('onProceedToConfirm')"
      >
        <span v-if="!isProcessing">Submit Refund Request</span>
        <UIcon
          v-else
          name="i-mdi-loading"
          class="animate-spin"
        />
      </UButton>
    </div>
  </div>
</template>

<style scoped>
.text-primary {
  color: var(--color-primary);
}
</style>
