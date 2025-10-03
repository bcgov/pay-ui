<script setup lang="ts">
defineProps<{
  schemaPrefix: string
  isCheque: boolean
  totalCad: string
}>()

defineEmits<{
  'change:usd': []
  'change:payment-type': []
  'add-cheque': []
  'remove-cheque': [id: string]
  'validate-date': [id: string]
}>()

const model = defineModel<RoutingSlipPaymentSchema>({ required: true })
</script>

<template>
  <ConnectFieldset
    :label="$t('label.paymentInformation')"
    orientation="horizontal"
  >
    <div class="space-y-6">
      <URadioGroup
        v-model="model.paymentType"
        :items="[
          { label: $t(`enum.PaymentTypes.${PaymentTypes.CHEQUE}`), value: PaymentTypes.CHEQUE },
          { label: $t(`enum.PaymentTypes.${PaymentTypes.CASH}`), value: PaymentTypes.CASH }
        ]"
        orientation="horizontal"
        size="xl"
        :ui="{ fieldset: 'space-x-4' }"
        @update:model-value="$emit('change:payment-type')"
      />
      <div
        v-for="item in model.paymentItems"
        :key="item.uuid"
        class="flex flex-col gap-2 sm:gap-4 sm:flex-row"
      >
        <ConnectFormInput
          v-model="item.identifier"
          :label="isCheque ? $t('label.chequeNumber') : $t('label.receiptNumber')"
          :name="`${schemaPrefix}.paymentItems.${item.uuid}.identifier`"
          :input-id="`cheque-receipt-number-${item.uuid}`"
          class="flex-1"
        />
        <UFormField
          v-if="isCheque"
          :name="`${schemaPrefix}.paymentItems.${item.uuid}.date`"
          class="flex-1"
        >
          <template #default="{ error }">
            <DatePicker
              :id="`paymentItems.${item.uuid}.date`"
              v-model="item.date"
              :has-error="!!error"
              @blur="$emit('validate-date', `${schemaPrefix}.paymentItems.${item.uuid}.date`)"
            />
          </template>
        </UFormField>
        <ConnectFormInput
          v-model="item.amountCAD"
          :label="$t('label.amountCAD')"
          :name="`${schemaPrefix}.paymentItems.${item.uuid}.amountCAD`"
          :input-id="`amount-cad-${item.uuid}`"
          class="flex-1"
        />
        <ConnectFormInput
          v-if="model.isUSD"
          v-model="item.amountUSD"
          :label="$t('label.amountUSD')"
          :name="`${schemaPrefix}.paymentItems.${item.uuid}.amountUSD`"
          :input-id="`amount-usd-${item.uuid}`"
          class="flex-1"
        />
        <UButton
          v-if="Object.keys(model.paymentItems).length > 1"
          icon="i-mdi-close"
          variant="ghost"
          @click="$emit('remove-cheque', item.uuid)"
        />
      </div>
      <div
        class="flex"
        :class="isCheque
          ? 'justify-between'
          : 'justify-end'
        "
      >
        <UButton
          v-if="isCheque"
          :label="$t('label.additionalCheque')"
          variant="ghost"
          icon="i-mdi-plus-box"
          @click="$emit('add-cheque')"
        />
        <UCheckbox
          v-model="model.isUSD"
          :label="$t('label.fundsReceivedInUSD')"
          :ui="{ label: 'text-base' }"
          @change="$emit('change:usd')"
        />
      </div>
      <ConnectInput
        v-if="isCheque"
        id="total-amount-received"
        :model-value="totalCad"
        :label="$t('label.totalAmountReceived')"
        readonly
      />
    </div>
  </ConnectFieldset>
</template>
