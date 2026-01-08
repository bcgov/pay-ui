<script setup lang="ts">
import type { FormErrorEvent, Form } from '@nuxt/ui'
import { z } from 'zod'
import type { RefundRequestDetails } from '~/interfaces/routing-slip'

const { t } = useI18n()

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

const addressSchema = z.object({
  street: z.string().min(1, t('validation.fieldRequired')),
  streetAdditional: z.string().optional(),
  city: z.string().min(1, t('validation.fieldRequired')),
  region: z.string().min(1, t('validation.fieldRequired')),
  postalCode: z.string().min(1, t('validation.fieldRequired')),
  country: z.string().min(1, t('validation.fieldRequired')),
  deliveryInstructions: z.string().optional()
})

const schema = z.object({
  name: z.string().min(1, t('validation.fieldRequired')),
  address: addressSchema,
  chequeAdvice: z.string().optional()
})

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
    deliveryInstructions: ''
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
      deliveryInstructions: newData.mailingAddress?.deliveryInstructions || ''
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
  const refundDetails: RefundRequestDetails = {
    name: formState.name,
    mailingAddress: {
      street: formState.address.street,
      streetAdditional: formState.address.streetAdditional,
      city: formState.address.city,
      region: formState.address.region,
      postalCode: formState.address.postalCode,
      country: formState.address.country,
      deliveryInstructions: formState.address.deliveryInstructions
    },
    chequeAdvice: formState.chequeAdvice
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
          :label="$t('label.clientName')"
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
          :label="$t('label.chequeAdvice')"
          :name="'chequeAdvice'"
          input-id="refund-cheque-advice"
          type="textarea"
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
