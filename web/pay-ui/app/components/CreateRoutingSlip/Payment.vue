<script setup lang="ts">
import { z } from 'zod'
import type { Form, RadioGroupItem } from '@nuxt/ui'

enum PaymentType {
  CASH = 'CASH',
  CHEQUE = 'CHEQUE'
}

type PaymentItem = { uuid: string, amountCAD: string, amountUSD: string, identifier: string, date: string }

function createEmptyPaymentItem(): PaymentItem {
  return { uuid: crypto.randomUUID(), amountCAD: '', amountUSD: '', identifier: '', date: '' }
}

const firstItem = createEmptyPaymentItem()
const defaultState = {
  paymentType: PaymentType.CHEQUE,
  paymentItems: {
    [firstItem.uuid]: firstItem
  },
  isUSD: false
}

const dateSchema = z.preprocess(
  v => (v === null ? '' : v),
  z.string().min(5, 'Cheque date is required')
)

const amountSchema = z.string()
  .min(1, 'Paid Amount is required')
  .regex(/^\d+(\.\d{1,2})?$/, { message: 'Paid Amount can only be up to 2 decimal places' })

const paymentItemSchema = z.object({
  uuid: z.string(),
  amountCAD: amountSchema,
  amountUSD: z.string(),
  identifier: z.string().min(1, 'A Receipt number is required'),
  date: z.string()
})

const schema = z.object({
  paymentType: z.enum([
    PaymentType.CASH,
    PaymentType.CHEQUE
  ]),
  isUSD: z.boolean().default(false),
  paymentItems: z.record(z.string(), paymentItemSchema)
}).superRefine((data, ctx) => {
  for (const uuid in data.paymentItems) {
    if (data.isUSD) {
      const usdResult = amountSchema.safeParse(data.paymentItems[uuid]?.amountUSD)
      if (!usdResult.success) {
        usdResult.error.issues.forEach((issue) => {
          ctx.addIssue({ ...issue, path: ['paymentItems', uuid, 'amountUSD'] })
        })
      }
    }

    if (data.paymentType === PaymentType.CHEQUE) {
      const dateResult = dateSchema.safeParse(data.paymentItems[uuid]?.date)
      if (!dateResult.success) {
        dateResult.error.issues.forEach((issue) => {
          ctx.addIssue({ ...issue, path: ['paymentItems', uuid, 'date'] })
        })
      }
    }
  }
})

type Schema = z.output<typeof schema>
const state = reactive<Schema>({ ...defaultState })

const formRef = useTemplateRef<Form<Schema>>('form-ref')

const paymentTypeOptions: RadioGroupItem[] = [
  { label: 'Cheque', value: PaymentType.CHEQUE },
  { label: 'Cash', value: PaymentType.CASH }
]

const isCheque = computed<boolean>(() => state.paymentType === PaymentType.CHEQUE)

const totalCAD = computed<string>(() => {
  let total = 0
  for (const uuid in state.paymentItems) {
    const cad = state.paymentItems[uuid]?.amountCAD
    if (cad) {
      total += Number(cad)
    }
  }
  return total.toFixed(2)
})

function addCheque() {
  const newItem = createEmptyPaymentItem()
  state.paymentItems[newItem.uuid] = newItem
}

function removeCheque(uuid: string) {
  /* eslint-disable-next-line @typescript-eslint/no-dynamic-delete */
  delete state.paymentItems[uuid]
}

function resetOnPaymentTypeChange() {
  const newItem = createEmptyPaymentItem()
  state.isUSD = defaultState.isUSD
  state.paymentItems = { [newItem.uuid]: newItem }
  formRef.value?.clear()
}

async function validateDate(path: string) {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */ // cant infer path from created uuid strings
  await formRef.value?.validate({ name: path as any, silent: true })
}

function resetOnUSDChange() {
  for (const uuid in state.paymentItems) {
    formRef.value?.clear(new RegExp(`^${`paymentItems.${uuid}.amountUSD`}$`))
    const item = state.paymentItems[uuid]
    if (item) {
      item.amountUSD = ''
    }
  }
}
</script>

<template>
  <UForm
    ref="form-ref"
    :schema="schema"
    :state="state"
    class="space-y-4"
    attach
  >
    <ConnectFieldset
      label="Payment Information"
      orientation="horizontal"
    >
      <div class="space-y-6">
        <URadioGroup
          v-model="state.paymentType"
          :items="paymentTypeOptions"
          orientation="horizontal"
          size="xl"
          :ui="{ fieldset: 'space-x-4' }"
          @update:model-value="resetOnPaymentTypeChange"
        />
        <div
          v-for="item in state.paymentItems"
          :key="item.uuid"
          class="flex flex-col gap-2 sm:gap-4 sm:flex-row"
        >
          <ConnectFormInput
            v-model="item.identifier"
            label="Cheque Number"
            :name="`paymentItems.${item.uuid}.identifier`"
            :input-id="`cheque-receipt-number-${item.uuid}`"
            class="flex-1"
          />
          <UFormField
            v-if="isCheque"
            :name="`paymentItems.${item.uuid}.date`"
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
            :name="`paymentItems.${item.uuid}.amountCAD`"
            :input-id="`amount-cad-${item.uuid}`"
            class="flex-1"
          />
          <ConnectFormInput
            v-if="state.isUSD"
            v-model="item.amountUSD"
            label="Amount (USD$)"
            :name="`paymentItems.${item.uuid}.amountUSD`"
            :input-id="`amount-usd-${item.uuid}`"
            class="flex-1"
          />
          <UButton
            v-if="Object.keys(state.paymentItems).length > 1"
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
            v-model="state.isUSD"
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
  </UForm>
</template>
