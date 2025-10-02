<script setup lang="ts">
import { z } from 'zod'

const payApi = usePayApi()

const debounceCheckRoutingNumber = useDebounceFn(async (id: string) => {
  return payApi.checkRoutingNumber(id)
}, 10)

const schema = z.object({
  id: z.string()
    .min(1, { message: 'A Routing Slip Number is required' })
    .length(9, { message: 'A Routing Slip Number must be 9 characters long' })
    .regex(/^\d+$/, { message: 'Valid Routing Slip Number is required' }),
  date: z.string().min(1, 'A Routing Slip Date is required'),
  entity: z.string().min(1, 'An Entity Number is required')
}).superRefine(async (data, ctx) => {
  if (data.id.length === 9) {
    // issue with duplicate requests when using async in superRefine
    const { valid, message } = await debounceCheckRoutingNumber(data.id)

    if (!valid) {
      ctx.addIssue({
        code: 'custom',
        message: message,
        path: ['id']
      })
    }
  }
})

type Schema = z.output<typeof schema>

const model = defineModel<Schema>({ required: true })
</script>

<template>
  <UForm
    :schema
    :state="model"
    attach
  >
    <ConnectFieldset
      label="Routing Slip"
      orientation="horizontal"
    >
      <div class="space-y-2">
        <ConnectFormInput
          v-model="model.id"
          label="Routing Slip - Unique ID"
          name="id"
          input-id="routing-slip-id"
        />
        <div class="flex flex-col gap-2 sm:gap-4 sm:flex-row">
          <UFormField name="date" class="flex-1 w-ful">
            <DatePicker v-model="model.date" />
          </UFormField>
          <ConnectFormInput
            v-model="model.entity"
            label="Entity Number"
            name="entity"
            input-id="entity-number"
            class="flex-1"
            help="Example: BC1234567, CP1234567, FM1234567 or 123456"
          />
        </div>
      </div>
    </ConnectFieldset>
  </UForm>
</template>
