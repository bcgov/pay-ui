<script setup lang="ts">
import type { FormSubmitEvent, FormErrorEvent, Form } from '@nuxt/ui'

const toast = useToast()
const schema = getRoutingSlipSchema()
const crsStore = useCreateRoutingSlipStore()
const formRef = useTemplateRef<Form<RoutingSlipSchema>>('form-ref')

async function onSubmit(event: FormSubmitEvent<RoutingSlipSchema>) {
  toast.add({ title: 'Success', description: 'The form has been submitted.', color: 'success' })
  console.log(event.data)
}

function onError(event: FormErrorEvent) {
  let element: HTMLElement | null = null
  const firstEl = event.errors[0]?.id

  if (firstEl) {
    element = document.getElementById(firstEl)
  }

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
      :form-ref="formRef"
    />
    <CreateRoutingSlipAddress
      v-model="crsStore.state.address"
      schema-prefix="address"
      :form-ref="formRef"
    />
    <div class="flex gap-4 justify-end">
      <UButton
        label="Review and Create"
        type="submit"
      />
      <UButton
        label="Cancel"
        variant="outline"
      />
    </div>
  </UForm>
</template>
