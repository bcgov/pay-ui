<script setup lang="ts">
defineProps<{
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
      />
    </div>
  </ConnectFieldset>
  <!-- sm:w-1/4 not being scanned by tailwind from dependency -->
</template>
