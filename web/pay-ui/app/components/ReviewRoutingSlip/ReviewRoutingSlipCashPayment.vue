<script setup lang="ts">
import { usePaymentInformation } from '~/composables/usePaymentInformation'
import type { Payment } from '~/interfaces/routing-slip'

interface Props {
  cashPayment: Payment
  isAmountPaidInUsd?: boolean
  isEditable?: boolean
  isALinkedChild?: boolean
}

withDefaults(defineProps<Props>(), {
  isAmountPaidInUsd: false,
  isEditable: false,
  isALinkedChild: false
})

const { adjustRoutingSlipAmount } = usePaymentInformation()
</script>

<template>
  <div
    v-if="cashPayment"
    class="grid grid-cols-1 sm:grid-cols-3 gap-4"
  >
    <ConnectInput
      id="cash-receipt-number"
      :model-value="cashPayment.chequeReceiptNumber || ''"
      :label="$t('label.receiptNumber')"
      disabled
      data-test="txt-receipt-number"
    />

    <ConnectInput
      id="cash-amount-cad"
      :model-value="String(cashPayment.paidAmount || '')"
      :label="$t('label.amountCAD')"
      type="number"
      :disabled="!isEditable || isALinkedChild"
      data-test="txt-paid-amount"
      @update:model-value="(e) => adjustRoutingSlipAmount(Number(e), false)"
    />

    <ConnectInput
      v-if="isAmountPaidInUsd"
      id="cash-amount-usd"
      :model-value="String(cashPayment.paidUsdAmount || '')"
      :label="$t('label.amountUSD')"
      type="number"
      :disabled="!isEditable || isALinkedChild"
      data-test="txt-paid-usd-amount"
      @update:model-value="(e) => adjustRoutingSlipAmount(Number(e), true)"
    />
  </div>
</template>
