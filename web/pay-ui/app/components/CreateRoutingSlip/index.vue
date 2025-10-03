<script setup lang="ts">
import type { FormSubmitEvent, FormErrorEvent, Form } from '@nuxt/ui'

const schema = getRoutingSlipSchema()
const crsStore = useCreateRoutingSlipStore()
const formRef = useTemplateRef<Form<RoutingSlipSchema>>('form-ref')

function onPaymentTypeChange() {
  crsStore.resetPaymentState()
  formRef.value?.clear(/^payment.*/)
}

function onUSDChange() {
  crsStore.resetUSDAmounts()
  for (const uuid in crsStore.state.payment.paymentItems) {
    formRef.value?.clear(new RegExp(`^${`payment.paymentItems.${uuid}.amountUSD`}$`))
  }
}

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */ // cant infer validation name/key
function onValidateDate(name: any) {
  formRef.value?.validate({ name, silent: true })
}

async function onSubmit(event: FormSubmitEvent<RoutingSlipSchema>) {
  // TODO: go to 'review' mode
  console.info(event.data)
}

function onError(event: FormErrorEvent) {
  const id = event.errors[0]?.id
  const element = id ? document.getElementById(id) : null

  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setTimeout(() => {
      element.focus({ preventScroll: true })
    }, 0)
  }
}
</script>

<template>
  <UForm
    ref="form-ref"
    :state="crsStore.state"
    :schema
    class="space-y-16"
    @submit="onSubmit"
    @error="onError"
  >
    <CreateRoutingSlipDetails v-model="crsStore.state.details" schema-prefix="details" />
    <CreateRoutingSlipPayment
      v-model="crsStore.state.payment"
      schema-prefix="payment"
      :is-cheque="crsStore.isCheque"
      :total-cad="crsStore.totalCAD"
      @add-cheque="crsStore.addCheque"
      @remove-cheque="crsStore.removeCheque"
      @change:payment-type="onPaymentTypeChange"
      @change:usd="onUSDChange"
      @validate-date="onValidateDate"
    />
    <CreateRoutingSlipAddress
      v-model="crsStore.state.address"
      schema-prefix="address"
    />
    <div class="flex gap-4 justify-end">
      <UButton
        :label="$t('label.reviewAndCreate')"
        type="submit"
      />
      <UButton
        :label="$t('label.cancel')"
        variant="outline"
      />
    </div>
  </UForm>
  <!-- sm:w-1/4 not being scanned by tailwind from dependency -->
</template>
