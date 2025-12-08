<script setup lang="ts">
defineProps<{
  schemaPrefix: string
}>()

const model = defineModel<RoutingSlipAddressSchema>({ required: true })
</script>

<template>
  <ConnectFieldset
    :label="$t('label.nameOfPersonOrOrgAndAddress')"
    orientation="horizontal"
  >
    <div class="space-y-2">
      <ConnectFormInput
        v-model="model.name"
        :label="$t('label.nameOfPersonOrOrgOpt')"
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
</template>
