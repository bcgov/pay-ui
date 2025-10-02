<script setup lang="ts">
import { z } from 'zod'
import type { Form } from '@nuxt/ui'

const nonReqSchema = getNonRequiredAddressSchema()

const schema = z.object({
  name: z.string().max(10),
  address: nonReqSchema
})

type Schema = z.output<typeof schema>

const model = defineModel<Schema>({ required: true })

const formRef = useTemplateRef<Form<Schema>>('form-ref')
</script>

<template>
  <UForm
    ref="form-ref"
    :schema
    :state="model"
    attach
  >
    <ConnectFieldset
      label="Name of Person or Organization & Address"
      orientation="horizontal"
    >
      <div class="space-y-2">
        <ConnectFormInput
          v-model="model.name"
          label="Name of Person or Organization (Optional)"
          name="name"
          input-id="person-or-org-address"
        />
        <ConnectFormAddress
          id="person-or-org-address"
          v-model="model.address"
          schema-prefix="address"
          :form-ref="formRef"
        />
      </div>
    </ConnectFieldset>
    <!-- sm:w-1/4 -->
  </UForm>
</template>
