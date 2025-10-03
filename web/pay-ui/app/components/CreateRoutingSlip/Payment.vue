<script setup lang="ts">
import type { Form, RadioGroupItem } from '@nuxt/ui'

const props = defineProps<{
  schemaPrefix: string
  formRef: Form<RoutingSlipSchema> | null
}>()

const paymentTypeOptions: RadioGroupItem[] = [
  { label: 'Cheque', value: PaymentTypes.CHEQUE },
  { label: 'Cash', value: PaymentTypes.CASH }
]

const isCheque = computed<boolean>(() => model.value.paymentType === PaymentTypes.CHEQUE)

const totalCAD = computed<string>(() => {
  let total = 0
  for (const uuid in model.value.paymentItems) {
    const cad = model.value.paymentItems[uuid]?.amountCAD
    if (cad) {
      total += Number(cad)
    }
  }
  return total.toFixed(2)
})

function addCheque() {
  const newItem = createEmptyPaymentItem()
  model.value.paymentItems[newItem.uuid] = newItem
}

function removeCheque(uuid: string) {
  /* eslint-disable-next-line @typescript-eslint/no-dynamic-delete */
  delete model.value.paymentItems[uuid]
}

function resetOnPaymentTypeChange() {
  const newItem = createEmptyPaymentItem()
  model.value.isUSD = false
  model.value.paymentItems = { [newItem.uuid]: newItem }
  props.formRef?.clear()
}

async function validateDate(path: string) {
  /* eslint-disable @typescript-eslint/no-explicit-any */ // cant infer path name from uuid
  await props.formRef?.validate({ name: path as any, silent: true })
}

function resetOnUSDChange() {
  for (const uuid in model.value.paymentItems) {
    props.formRef?.clear(new RegExp(`^${`${props.schemaPrefix}.paymentItems.${uuid}.amountUSD`}$`))
    const item = model.value.paymentItems[uuid]
    if (item) {
      item.amountUSD = ''
    }
  }
}

const model = defineModel<RoutingSlipPaymentSchema>({ required: true })
</script>

<template>
  <ConnectFieldset
    label="Payment Information"
    orientation="horizontal"
  >
    <div class="space-y-6">
      <URadioGroup
        v-model="model.paymentType"
        :items="paymentTypeOptions"
        orientation="horizontal"
        size="xl"
        :ui="{ fieldset: 'space-x-4' }"
        @update:model-value="resetOnPaymentTypeChange"
      />
      <div
        v-for="item in model.paymentItems"
        :key="item.uuid"
        class="flex flex-col gap-2 sm:gap-4 sm:flex-row"
      >
        <ConnectFormInput
          v-model="item.identifier"
          label="Cheque Number"
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
              @blur="validateDate(`paymentItems.${item.uuid}.date`)"
            />
          </template>
        </UFormField>
        <ConnectFormInput
          v-model="item.amountCAD"
          label="Amount (CAD$)"
          :name="`${schemaPrefix}.paymentItems.${item.uuid}.amountCAD`"
          :input-id="`amount-cad-${item.uuid}`"
          class="flex-1"
        />
        <ConnectFormInput
          v-if="model.isUSD"
          v-model="item.amountUSD"
          label="Amount (USD$)"
          :name="`${schemaPrefix}.paymentItems.${item.uuid}.amountUSD`"
          :input-id="`amount-usd-${item.uuid}`"
          class="flex-1"
        />
        <UButton
          v-if="Object.keys(model.paymentItems).length > 1"
          icon="i-mdi-close"
          variant="ghost"
          @click="removeCheque(item.uuid)"
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
          label="Additional Cheque"
          variant="ghost"
          icon="i-mdi-plus-box"
          @click="addCheque"
        />
        <UCheckbox
          v-model="model.isUSD"
          label="Funds received in USD"
          :ui="{ label: 'text-base' }"
          @change="resetOnUSDChange"
        />
      </div>
      <ConnectInput
        id="total-amount-received"
        v-model="totalCAD"
        label="Total Amount Received ($)"
        readonly
      />
    </div>
  </ConnectFieldset>
</template>
