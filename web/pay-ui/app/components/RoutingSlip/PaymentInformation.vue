<script setup lang="ts">
import { usePaymentInformation } from '~/composables/usePaymentInformation'
import { PaymentTypes } from '~/enums/payment-types'

const emit = defineEmits<{
  paymentAdjusted: []
}>()

const {
  routingSlip,
  isExpanded,
  isEditable,
  isPaymentCheque,
  linkedRoutingSlips,
  isRoutingSlipAChild,
  isRoutingSlipLinked,
  totalAmount,
  remainingAmount,
  isRoutingSlipPaidInUsd,
  isRoutingSlipChildPaidInUsd,
  displayEditRoutingSlip,
  enableEditRoutingSlip,
  adjustRoutingSlipHandler,
  editPayment,
  cancelEditPayment,
  viewPaymentInformation,
  navigateTo,
  hasPaymentChanges
} = usePaymentInformation(emit)

function getIndexedTag(tag: string, index: number) {
  return `${tag}-${index}`
}
</script>

<template>
  <UCard>
    <div class="space-y-4">
      <div class="flex flex-col sm:flex-row gap-2">
        <div class="w-full sm:w-1/4 font-semibold">
          {{ $t('page.viewRoutingSlip.paymentInformation.totalAmountReceived') }}
        </div>
        <div class="w-full sm:w-3/4" data-test="total">
          {{ totalAmount }}
          <span
            v-if="isRoutingSlipPaidInUsd || isRoutingSlipChildPaidInUsd"
            class="text-sm text-gray-600"
          >
            {{ $t('page.viewRoutingSlip.paymentInformation.fundsConvertedUsdToCad') }}
          </span>
        </div>
      </div>

      <div class="flex flex-col sm:flex-row items-start justify-between gap-2">
        <div>
          <UButton
            variant="link"
            color="primary"
            data-test="btn-view-payment-information"
            class="px-0"
            @click="viewPaymentInformation"
          >
            <span class="font-semibold">
              {{ $t('page.viewRoutingSlip.paymentInformation.viewPaymentInformation') }}
            </span>
            <UIcon
              :name="isExpanded ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
              class="ml-1"
            />
          </UButton>
        </div>

        <div v-can:fas_correction.hide>
          <UButton
            v-if="displayEditRoutingSlip"
            variant="link"
            color="primary"
            :disabled="!enableEditRoutingSlip"
            @click="editPayment"
          >
            <UIcon name="i-heroicons-pencil" class="mr-1" />
            <span>{{ $t('page.viewRoutingSlip.paymentInformation.editRoutingSlip') }}</span>
          </UButton>
        </div>
      </div>

      <template v-if="isExpanded && routingSlip?.payments">
        <ReviewRoutingSlipChequePayment
          v-if="isPaymentCheque"
          data-test="review-routing-slip-cheque-payment"
          :cheque-payment="routingSlip.payments"
          :is-amount-paid-in-usd="!!isRoutingSlipPaidInUsd"
          :is-editable="isEditable"
        />
        <ReviewRoutingSlipCashPayment
          v-else-if="routingSlip.payments && routingSlip.payments[0]"
          data-test="review-routing-slip-cash-payment"
          :cash-payment="routingSlip.payments[0]"
          :is-amount-paid-in-usd="!!isRoutingSlipPaidInUsd"
          :is-editable="isEditable"
        />

        <template v-if="isRoutingSlipLinked && !isRoutingSlipAChild && linkedRoutingSlips?.children">
          <div
            v-for="(child, i) in linkedRoutingSlips.children"
            :key="i"
            class="flex flex-col mt-6"
          >
            <div class="flex gap-1 mb-3">
              <span>{{ $t('page.viewRoutingSlip.paymentInformation.linkedWith') }}</span>
              <NuxtLink
                :to="navigateTo(routingSlip?.number || '', child.number || '')"
                class="font-semibold text-primary"
                :data-test="getIndexedTag('text-review-routing-slip', i)"
              >
                {{ child.number }}
              </NuxtLink>
            </div>
            <ReviewRoutingSlipChequePayment
              v-if="child.payments && child.payments[0]?.paymentMethod === PaymentTypes.CHEQUE"
              :data-test="getIndexedTag('cheque-child-payment', i)"
              :cheque-payment="child.payments"
              :is-amount-paid-in-usd="!!(child.payments[0]?.paidUsdAmount && child.payments[0].paidUsdAmount > 0)"
              :is-editable="isEditable"
              :is-a-linked-child="true"
            />
            <ReviewRoutingSlipCashPayment
              v-else-if="child.payments && child.payments[0]"
              :data-test="getIndexedTag('cash-child-payment', i)"
              :cash-payment="child.payments[0]"
              :is-amount-paid-in-usd="!!(child.payments[0]?.paidUsdAmount && child.payments[0].paidUsdAmount > 0)"
              :is-editable="isEditable"
              :is-a-linked-child="true"
            />
          </div>
        </template>

        <div v-if="isEditable" class="flex justify-end gap-3 mt-6">
          <UButton
            size="lg"
            color="primary"
            :disabled="!hasPaymentChanges"
            data-test="btn-save-edit-transaction"
            @click="adjustRoutingSlipHandler"
          >
            {{ $t('page.viewRoutingSlip.paymentInformation.save') }}
          </UButton>
          <UButton
            size="lg"
            variant="outline"
            color="primary"
            data-test="btn-cancel"
            @click="cancelEditPayment"
          >
            {{ $t('page.viewRoutingSlip.paymentInformation.cancel') }}
          </UButton>
        </div>
      </template>

      <div class="flex flex-col sm:flex-row gap-2">
        <div class="w-full sm:w-1/4 font-semibold">
          {{ $t('page.viewRoutingSlip.paymentInformation.currentBalance') }}
        </div>
        <div class="w-full sm:w-3/4 font-semibold" data-test="remaining-amount">
          {{ remainingAmount }}
        </div>
      </div>
    </div>
  </UCard>
</template>
