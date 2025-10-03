<script setup lang="ts">
defineProps<{
  schemaPrefix: string
}>()

const model = defineModel<RoutingSlipDetailsSchema>({ required: true })
</script>

<template>
  <ConnectFieldset
    label="Routing Slip"
    orientation="horizontal"
  >
    <div class="space-y-2">
      <ConnectFormInput
        v-model="model.id"
        label="Routing Slip - Unique ID"
        :name="`${schemaPrefix}.id`"
        input-id="routing-slip-id"
      />
      <div class="flex flex-col gap-2 sm:gap-4 sm:flex-row">
        <UFormField :name="`${schemaPrefix}.date`" class="flex-1 w-ful">
          <DatePicker v-model="model.date" />
        </UFormField>
        <ConnectFormInput
          v-model="model.entity"
          label="Entity Number"
          :name="`${schemaPrefix}.entity`"
          input-id="entity-number"
          class="flex-1"
          help="Example: BC1234567, CP1234567, FM1234567 or 123456"
        />
      </div>
    </div>
  </ConnectFieldset>
</template>
