<script setup lang="ts">
defineProps<{
  schemaPrefix: string
}>()

const model = defineModel<RoutingSlipDetailsSchema>({ required: true })
</script>

<template>
  <ConnectFieldset
    :label="$t('label.routingSlip')"
    orientation="horizontal"
  >
    <div class="space-y-2">
      <ConnectFormInput
        v-model="model.id"
        :label="$t('label.routingSlipUniqueID')"
        :name="`${schemaPrefix}.id`"
        input-id="routing-slip-id"
      />
      <div class="flex flex-col gap-2 sm:gap-4 sm:flex-row">
        <UFormField :name="`${schemaPrefix}.date`" class="flex-1 w-ful">
          <DatePicker v-model="model.date" />
        </UFormField>
        <ConnectFormInput
          v-model="model.entity"
          :label="$t('label.entityNumber')"
          :name="`${schemaPrefix}.entity`"
          input-id="entity-number"
          class="flex-1"
          :help="$t('text.entityNumberHelp')"
        />
      </div>
    </div>
  </ConnectFieldset>
</template>
