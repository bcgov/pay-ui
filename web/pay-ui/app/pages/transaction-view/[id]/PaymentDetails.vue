<script setup lang="ts">
import CommonUtils from '@/utils/common-util'
import type { PaymentData } from '@/interfaces/transaction-view'
import { getPaymentTypeDisplayName } from '@/enums/payment-types'

interface Props {
  paymentData: PaymentData
}

const props = defineProps<Props>()
</script>

<template>
  <div class="bg-white rounded shadow-sm border border-gray-200">
    <div class="card-title flex items-center px-6 py-5 bg-bcgov-lightblue">
      <UIcon name="i-mdi-file-document" class="text-primary text-3xl mr-4" />
      <h2 class="text-lg font-bold text-gray-900">
        Payment Details
      </h2>
    </div>

    <div class="p-6 space-y-4 text-[var(--color-text-secondary)]">
      <div class="grid grid-cols-1 sm:grid-cols-4 gap-2">
        <span class="font-bold text-gray-900">Account Name</span>
        <span class="sm:col-span-3">{{ props.paymentData.accountName }}</span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-4 gap-2">
        <span class="font-bold text-gray-900">Folio Number</span>
        <span class="sm:col-span-3">{{ props.paymentData.folioNumber }}</span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-4 gap-2">
        <span class="font-bold text-gray-900">Initiated By</span>
        <span class="sm:col-span-3">{{ props.paymentData.initiatedBy }}</span>
      </div>

      <hr class="my-6 border-gray-200">

      <div class="grid grid-cols-1 sm:grid-cols-4 gap-2">
        <span class="font-bold text-gray-900">Payment Info</span>
        <div class="sm:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div class="font-bold text-gray-900">
              Payment Method
            </div>
            <div class="mt-2 mb-3">
              {{ getPaymentTypeDisplayName(props.paymentData.paymentMethod ?? '') }}
            </div>
          </div>
          <div>
            <div class="font-bold text-gray-900">
              Status
            </div>
            <div class="mt-2 mb-3">
              {{ getInvoiceStatusDisplayName(props.paymentData.paymentStatus ?? '') }}
            </div>
          </div>
        </div>
      </div>

      <hr class="my-6 border-gray-200">

      <div class="grid grid-cols-1 sm:grid-cols-4 gap-2">
        <span class="font-bold text-gray-900">Total Amount</span>
        <span class="sm:col-span-3">
          {{ CommonUtils.formatAmount(Number(props.paymentData.totalTransactionAmount)) }}
        </span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '~/assets/scss/card.scss';
</style>
