<script setup lang="ts">
import { usePaymentInformation } from '~/composables/usePaymentInformation'
import type { Payment } from '~/interfaces/routing-slip'
import CommonUtils from '~/utils/common-util'

interface Props {
  chequePayment: Payment[]
  isAmountPaidInUsd?: boolean
  isEditable?: boolean
  isALinkedChild?: boolean
}

withDefaults(defineProps<Props>(), {
  isAmountPaidInUsd: false,
  isEditable: false,
  isALinkedChild: false
})

const { adjustRoutingSlipChequeNumber, adjustRoutingSlipAmount } = usePaymentInformation()
const { displayAmount, setDraft } = useAmountDraft()

const formatDate = (dateString?: string): string => {
  if (!dateString) {
    return 'N/A'
  }
  const datePart = dateString.split('T')[0]
  return CommonUtils.formatDisplayDate(datePart as string, 'DDD')
}
</script>

<template>
  <div class="space-y-4">
    <div
      v-for="(payment, i) in chequePayment"
      :key="i"
      class="grid grid-cols-1 sm:grid-cols-4 gap-4"
    >
      <ConnectInput
        :id="`cheque-number-${i}`"
        :model-value="payment.chequeReceiptNumber || ''"
        :label="$t('label.chequeNumber')"
        :disabled="!isEditable || isALinkedChild"
        :data-test="CommonUtils.getIndexedTag('txt-cheque-receipt-number', i)"
        @update:model-value="(e) => adjustRoutingSlipChequeNumber(e, i)"
      />

      <ConnectInput
        :id="`cheque-date-${i}`"
        :model-value="payment.paymentDate ? formatDate(payment.paymentDate) : '-'"
        :label="$t('label.chequeDate')"
        disabled
        :data-test="CommonUtils.getIndexedTag('txt-cheque-date', i)"
      />

      <ConnectInput
        :id="`cheque-amount-cad-${i}`"
        :model-value="displayAmount(`cad-${i}`, payment.paidAmount)"
        :label="$t('label.amountCAD')"
        type="text"
        inputmode="decimal"
        :disabled="!isEditable || isALinkedChild"
        :data-test="CommonUtils.getIndexedTag('txt-paid-amount', i)"
        @update:model-value="(e) => adjustRoutingSlipAmount(setDraft(`cad-${i}`, e), false, i)"
      />

      <ConnectInput
        v-if="isAmountPaidInUsd"
        :id="`cheque-amount-usd-${i}`"
        :model-value="displayAmount(`usd-${i}`, payment.paidUsdAmount)"
        :label="$t('label.amountUSD')"
        type="text"
        inputmode="decimal"
        :disabled="!isEditable || isALinkedChild"
        :data-test="CommonUtils.getIndexedTag('txt-paid-usd-amount', i)"
        @update:model-value="(e) => adjustRoutingSlipAmount(setDraft(`usd-${i}`, e), true, i)"
      />
    </div>
  </div>
</template>
