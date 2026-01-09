<script setup lang="ts">
import type { FormErrorEvent, Form } from '@nuxt/ui'
import type { z } from 'zod'
import type { RefundRequestDetails } from '~/interfaces/routing-slip'
import { getRefundRequestFormSchema } from '~/utils/validation'

const props = defineProps<{
  refundAmount?: number
  entityNumber?: string
  initialData?: RefundRequestDetails
}>()

const emit = defineEmits<{
  submit: [details: RefundRequestDetails]
  cancel: []
}>()

useTemplateRef<Form<RefundRequestFormSchema>>('form-ref')

const schema = getRefundRequestFormSchema()

type RefundRequestFormSchema = z.infer<typeof schema>

const formState = reactive<RefundRequestFormSchema>({
  name: '',
  address: {
    street: '',
    streetAdditional: '',
    city: '',
    region: '',
    postalCode: '',
    country: '',
    locationDescription: ''
  },
  chequeAdvice: ''
})

watch(() => props.initialData, (newData) => {
  if (newData) {
    formState.name = newData.name || ''
    formState.address = {
      street: newData.mailingAddress?.street || '',
      streetAdditional: newData.mailingAddress?.streetAdditional || '',
      city: newData.mailingAddress?.city || '',
      region: newData.mailingAddress?.region || '',
      postalCode: newData.mailingAddress?.postalCode || '',
      country: newData.mailingAddress?.country || '',
      locationDescription: newData.mailingAddress?.deliveryInstructions || ''
    }
    formState.chequeAdvice = newData.chequeAdvice || ''
  }
}, { immediate: true, deep: true })

const chequeAdviceModel = computed({
  get: () => formState.chequeAdvice || '',
  set: (value: string) => {
    formState.chequeAdvice = value || undefined
  }
})

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

function onSubmit() {
  const mailingAddress: Address = {
    street: formState.address.street,
    city: formState.address.city,
    region: formState.address.region,
    postalCode: formState.address.postalCode,
    country: formState.address.country
  }

  if (formState.address.streetAdditional?.trim()) {
    mailingAddress.streetAdditional = formState.address.streetAdditional
  }

  if (formState.address.locationDescription?.trim()) {
    mailingAddress.deliveryInstructions = formState.address.locationDescription
  }

  const refundDetails: RefundRequestDetails = {
    name: formState.name,
    mailingAddress,
    chequeAdvice: formState.chequeAdvice?.trim() || undefined
  }

  emit('submit', refundDetails)
}

function onCancel() {
  emit('cancel')
}

const formattedRefundAmount = computed(() => {
  if (!props.refundAmount) {
    return '$0.00'
  }
  return `$${props.refundAmount.toFixed(2)}`
})
</script>

<template>
  <UForm
    ref="form-ref"
    :state="formState"
    :schema
    @error="onError"
    @submit="onSubmit"
  >
    <div class="flex flex-col sm:flex-row sm:items-start gap-2">
      <div class="w-full sm:w-1/4 font-semibold p-4">
        {{ $t('label.refundAmount') }}
      </div>
      <div class="w-full sm:w-3/4 p-4">
        {{ formattedRefundAmount }}
      </div>
    </div>

    <div class="flex flex-col sm:flex-row sm:items-start gap-2">
      <div class="w-full sm:w-1/4 font-semibold p-4">
        {{ $t('label.clientName') }}
      </div>
      <div class="w-full sm:w-3/4 p-4">
        <ConnectFormInput
          v-model="formState.name"
          :label="$t('label.clientNamePlaceholder')"
          :name="'name'"
          input-id="refund-name"
        />
      </div>
    </div>

    <div class="flex flex-col sm:flex-row sm:items-start gap-2">
      <div class="w-full sm:w-1/4 font-semibold p-4">
        {{ $t('label.nameOfPersonOrOrgAndAddress') }}
      </div>
      <div class="w-full sm:w-3/4 p-4">
        <ConnectFormAddress
          id="refund-address"
          v-model="formState.address"
          schema-prefix="address"
        />
      </div>
    </div>

    <div class="flex flex-col sm:flex-row sm:items-start gap-2">
      <div class="w-full sm:w-1/4 font-semibold p-4">
        {{ $t('label.chequeAdvice') }}
      </div>
      <div class="w-full sm:w-3/4 p-4">
        <ConnectFormInput
          v-model="chequeAdviceModel"
          :label="$t('label.chequeAdvicePlaceholder')"
          :name="'chequeAdvice'"
          input-id="refund-cheque-advice"
          type="textarea"
          :help="$t('text.chequeAdviceHelp')"
        />
      </div>
    </div>

    <div class="flex flex-col sm:flex-row sm:items-start gap-2">
      <div class="w-full sm:w-1/4 font-semibold p-4">
        {{ $t('label.entityNumber') }}
      </div>
      <div class="w-full sm:w-3/4 p-4">
        {{ entityNumber || '-' }}
      </div>
    </div>

    <div class="flex gap-4 justify-end border-t border-line-muted pt-4 mt-4">
      <UButton
        :label="$t('label.done')"
        type="submit"
        size="xl"
      />
      <UButton
        :label="$t('label.cancel')"
        variant="outline"
        size="xl"
        @click="onCancel"
      />
    </div>
  </UForm>
</template>
