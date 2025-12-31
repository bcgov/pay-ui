<script setup lang="ts">
import useAddManualTransactionDetails from '@/composables/viewRoutingSlip/useAddManualTransactionDetails'
import type { ManualTransactionDetails } from '@/interfaces/routing-slip'
import FilingTypeAutoComplete from './FilingTypeAutoComplete.vue'
import CommonUtils from '@/utils/common-util'

interface Props {
  index?: number

  manualTransaction?: ManualTransactionDetails | null
}

const props = withDefaults(defineProps<Props>(), {
  index: undefined,
  manualTransaction: null
})

const emit = defineEmits<{
  removeManualTransactionRow: [index: number]
  updateManualTransaction: [payload: { transaction: ManualTransactionDetails, index: number }]
}>()

const {
  manualTransactionDetails,
  removeManualTransactionRowEventHandler,
  calculateTotal,
  delayedCalculateTotal,
  totalFormatted,
  errors,
  errorMessage,
  validate,
  handleQuantityChange,
  handleReferenceNumberChange
} = useAddManualTransactionDetails(props, emit)

const requiredFieldRule = CommonUtils.requiredFieldRule()

defineExpose({
  validate
})
</script>

<template>
  <div v-if="manualTransactionDetails" class="grid grid-cols-12 gap-6 mr-9">
    <div class="col-span-12">
      <FilingTypeAutoComplete
        :id="`filing-type-autocomplete-${index}`"
        v-model="manualTransactionDetails.filingType"
        required
        :rules="requiredFieldRule"
        @input="errors.filingType = ''; delayedCalculateTotal()"
      />
      <div v-if="errors.filingType" class="relative -mt-px">
        <div class="h-px bg-error" />
        <div class="text-xs text-error mt-1">
          {{ errors.filingType }}
        </div>
      </div>
    </div>

    <div class="col-span-2">
      <ConnectInput
        :id="`manual-transaction-form-quantity-${index}`"
        :model-value="String(manualTransactionDetails.quantity || '')"
        label="Quantity"
        type="number"
        required
        @update:model-value="handleQuantityChange"
      />
      <div v-if="errors.quantity" class="relative -mt-px">
        <div class="h-px bg-error" />
        <div class="text-xs text-error mt-1">
          {{ errors.quantity }}
        </div>
      </div>
    </div>

    <div class="col-span-5">
      <ConnectInput
        :id="`manual-transaction-form-reference-${index}`"
        :model-value="manualTransactionDetails.referenceNumber || ''"
        label="Incorporation/Reference Number (optional)"
        @update:model-value="handleReferenceNumberChange"
      />
      <div v-if="errors.referenceNumber" class="relative -mt-px">
        <div class="h-px bg-error" />
        <div class="text-xs text-error mt-1">
          {{ errors.referenceNumber }}
        </div>
      </div>
    </div>

    <div class="col-span-5 relative">
      <UFormField :error="errorMessage">
        <ConnectInput
          :id="`manual-transaction-form-amount-${index}`"
          :key="manualTransactionDetails.availableAmountForManualTransaction"
          :model-value="totalFormatted || ''"
          label="$ Amount"
          readonly
          :aria-invalid="errorMessage ? 'true' : undefined"
        />
      </UFormField>
      <div v-if="index && index > 0" class="absolute -right-9 top-3">
        <UButton
          icon="mdi-close"
          variant="ghost"
          size="md"
          @click="removeManualTransactionRowEventHandler()"
        />
      </div>
    </div>

    <div class="col-span-2">
      <UCheckbox
        v-model="manualTransactionDetails.priority"
        label="Priority Fee"
        @change="calculateTotal()"
      />
    </div>

    <div class="col-span-10">
      <UCheckbox
        v-model="manualTransactionDetails.futureEffective"
        label="Future Effective Filing Fee"
        @change="calculateTotal()"
      />
    </div>

    <div v-if="manualTransactionDetails.quantity && manualTransactionDetails.quantity > 1" class="col-span-12">
      <div class="flex gap-2">
        <UIcon name="mdi-information-outline" class="size-6 text-gray-600" />
        <span class="text-gray-600">
          {{ $t('text.addManualTransactionQuantityInfoText') }}
        </span>
      </div>
    </div>
  </div>
</template>
