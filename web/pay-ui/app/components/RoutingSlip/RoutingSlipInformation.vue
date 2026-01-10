<script setup lang="ts">
import StatusMenu from '~/components/common/StatusMenu.vue'
import RefundStatusMenu from '~/components/common/RefundStatusMenu.vue'
import RefundRequestForm from '~/components/RoutingSlip/RefundRequestForm.vue'
import { useRoutingSlipInfo } from '~/composables/viewRoutingSlip/useRoutingSlipInfo'
import { chequeRefundCodes } from '~/utils/constants'

const emit = defineEmits<{
  commentsUpdated: []
}>()

const {
  routingSlip,
  formattedDate,
  statusColor,
  statusLabel,
  entityNumber,
  contactName,
  mailingAddress,
  deliveryInstructions,
  allowedStatuses,
  handleStatusSelect,
  handleRefundStatusSelect,
  showRefundForm,
  handleRefundFormSubmit,
  handleRefundFormCancel,
  refundAmount,
  isRefundRequested,
  shouldShowRefundAmount,
  refundFormInitialData,
  refundStatus,
  chequeAdvice,
  isRefundStatusUndeliverable,
  canUpdateRefundStatus,
  shouldShowRefundStatusSection,
  shouldShowNameAndAddress
} = useRoutingSlipInfo()

const isRefundStatusProcessing = computed(() => {
  return routingSlip.value?.refundStatus === chequeRefundCodes.PROCESSING
})

const handleRefundStatusSelectWithComments = async (status: string) => {
  await handleRefundStatusSelect(status, () => {
    emit('commentsUpdated')
  })
}
</script>

<template>
  <UCard>
    <div class="relative">
      <div v-if="allowedStatuses && allowedStatuses.length > 0" class="absolute top-0 right-0">
        <StatusMenu
          :allowed-status-list="allowedStatuses"
          @select="handleStatusSelect"
        />
      </div>
      <div>
        <div class="flex flex-col sm:flex-row sm:items-start gap-2">
          <div class="w-full sm:w-1/4 font-semibold p-4">
            {{ $t('label.routingSlipUniqueID') }}
          </div>
          <div class="w-full sm:w-3/4 p-4">
            {{ routingSlip?.number || '-' }}
          </div>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-start gap-2">
          <div class="w-full sm:w-1/4 font-semibold p-4">
            {{ $t('label.date') }}
          </div>
          <div class="w-full sm:w-3/4 p-4">
            {{ formattedDate }}
          </div>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-start gap-2">
          <div class="w-full sm:w-1/4 font-semibold p-4">
            {{ $t('label.status') }}
          </div>
          <div class="w-full sm:w-3/4 p-4">
            <span :class="statusColor">
              {{ statusLabel }}
            </span>
          </div>
        </div>

        <div
          v-if="shouldShowRefundAmount"
          class="flex flex-col sm:flex-row sm:items-start gap-2"
        >
          <div class="w-full sm:w-1/4 font-semibold p-4">
            {{ $t('label.refundAmount') }}
          </div>
          <div class="w-full sm:w-3/4 p-4">
            ${{ (routingSlip.refundAmount || routingSlip.remainingAmount || 0).toFixed(2) }}
          </div>
        </div>

        <div
          v-if="isRefundRequested && !showRefundForm"
          class="flex flex-col sm:flex-row sm:items-start gap-2"
        >
          <div class="w-full sm:w-1/4 font-semibold p-4">
            {{ $t('label.clientName') }}
          </div>
          <div class="w-full sm:w-3/4 p-4">
            {{ contactName || '-' }}
          </div>
        </div>

        <div v-if="showRefundForm" class="border-t border-line-muted pt-4">
          <RefundRequestForm
            :refund-amount="refundAmount"
            :entity-number="entityNumber"
            :initial-data="refundFormInitialData"
            @submit="handleRefundFormSubmit"
            @cancel="handleRefundFormCancel"
          />
        </div>

        <div v-if="!showRefundForm" class="flex flex-col sm:flex-row sm:items-start gap-2">
          <div class="w-full sm:w-1/4 font-semibold p-4">
            {{ $t('label.entityNumber') }}
          </div>
          <div class="w-full sm:w-3/4 p-4">
            {{ entityNumber || '-' }}
          </div>
        </div>

        <div v-if="shouldShowNameAndAddress" class="flex flex-col sm:flex-row sm:items-start gap-2">
          <div class="w-full sm:w-1/4 font-semibold p-4">
            {{ $t('label.nameOfPersonOrOrgAndAddress') }}
          </div>
          <div class="w-full sm:w-3/4 p-4">
            <div class="flex flex-col gap-1">
              <span v-if="contactName && !isRefundRequested">{{ contactName }} </span>
              <ConnectAddressDisplay
                v-if="mailingAddress"
                :address="mailingAddress"
                text-decor
              />
              <span v-if="deliveryInstructions" class="italic text-gray-600">
                {{ deliveryInstructions }}
              </span>
            </div>
          </div>
        </div>

        <div
          v-if="shouldShowRefundStatusSection"
          class="border-t border-line-muted pt-4 mt-4"
        >
          <div class="flex flex-col sm:flex-row sm:items-center gap-2 relative">
            <div class="w-full sm:w-1/4 font-semibold p-4">
              {{ $t('label.refundStatus') }}
            </div>
            <div class="w-full sm:w-3/4 p-4">
              <div class="flex items-center gap-2">
                <UBadge
                  v-if="refundStatus"
                  :label="refundStatus"
                  :color="isRefundStatusUndeliverable ? 'error' : 'neutral'"
                  :class="isRefundStatusUndeliverable 
                    ? '!bg-red-600 !text-white' 
                    : isRefundStatusProcessing 
                      ? '!bg-gray-200 !text-gray-700' 
                      : '!bg-[var(--color-refund-status-bg)] !text-[var(--color-text-primary)]'"
                />
                <span v-else>-</span>
                <div v-if="canUpdateRefundStatus">
                  <RefundStatusMenu
                    :current-refund-status="routingSlip?.refundStatus"
                    @select="handleRefundStatusSelectWithComments"
                  />
                </div>
              </div>
            </div>
          </div>

          <div v-if="chequeAdvice" class="flex flex-col sm:flex-row sm:items-start gap-2">
            <div class="w-full sm:w-1/4 font-semibold p-4">
              {{ $t('label.chequeAdvice') }}
            </div>
            <div class="w-full sm:w-3/4 p-4">
              {{ chequeAdvice }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </UCard>
</template>
