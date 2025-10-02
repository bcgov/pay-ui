<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent, FormErrorEvent } from '@nuxt/ui'

const toast = useToast()

const state = reactive({
  routingSlip: {
    id: '',
    date: getToday().toISO() as string,
    entity: ''
  },
  nameAddress: {
    name: '',
    address: {
      street: '',
      streetAdditional: '',
      city: '',
      region: '',
      postalCode: '',
      country: 'CA',
      locationDescription: ''
    }
  }
})

// async function onSubmit(event: FormSubmitEvent<Schema>) {
async function onSubmit(event: FormSubmitEvent<any>) {
  toast.add({ title: 'Success', description: 'The form has been submitted.', color: 'success' })
  console.log(event.data)
}

async function onError(event: FormErrorEvent) {
  console.log(event.errors)
  if (event?.errors?.[0]?.id) {
    const element = document.getElementById(event.errors[0].id)
    element?.focus()
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

// const nonReqSchema = getNonRequiredAddressSchema()
// const addressSchema = z.object({
//   name: z.string().max(10),
//   address: nonReqSchema
// })
</script>

<template>
  <UForm
    :state
    @submit="onSubmit"
    @error="onError"
  >
    <CreateRoutingSlipDetails
      v-model="state.routingSlip"
    />
    <CreateRoutingSlipPayment />
    <CreateRoutingSlipAddress
      v-model="state.nameAddress"
    />
    <!-- :schema="addressSchema" -->
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
