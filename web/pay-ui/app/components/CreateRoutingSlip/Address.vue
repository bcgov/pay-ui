<script setup lang="ts">
import type { Form } from '@nuxt/ui'

defineProps<{
  formRef: Form<RoutingSlipSchema> | null
  schemaPrefix: string
}>()

const model = defineModel<RoutingSlipAddressSchema>({ required: true })
</script>

<template>
  <ConnectFieldset
    label="Name of Person or Organization & Address"
    orientation="horizontal"
  >
    <div class="space-y-2">
      <ConnectFormInput
        v-model="model.name"
        label="Name of Person or Organization (Optional)"
        :name="`${schemaPrefix}.name`"
        input-id="person-or-org-address"
      />
      <ConnectFormAddress
        id="person-or-org-address"
        v-model="model.address"
        :schema-prefix="`${schemaPrefix}.address`"
        :form-ref="formRef"
      />
    </div>
  </ConnectFieldset>
  <!-- sm:w-1/4 -->
</template>
