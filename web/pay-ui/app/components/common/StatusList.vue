<script setup lang="ts">
import type { SelectItem } from '@nuxt/ui'

// TODO: move into common store/composable once established
const payApi = usePayApi()
const { t } = useI18n()

const props = defineProps<{
  column: 'status' | 'refundStatus'
}>()

const model = defineModel<string | null>({ required: true })

const isStatusColumn = props.column === 'status'
const routingSlipStatusList = shallowRef<Code[]>([])

const items = computed<SelectItem[]>(() => {
  const options = isStatusColumn ? routingSlipStatusList.value : ChequeRefundStatus

  return options.map(o => ({
    // @ts-expect-error - TODO: fix type mismatch between Code and ChequeRefundStatus
    label: o.text || o.description,
    value: o.code
  }))
})

const placeholder = isStatusColumn
  ? t('label.status')
  : t('label.refundStatus')

onMounted(async () => {
  if (isStatusColumn && routingSlipStatusList.value.length === 0) {
    try {
      // TODO: move into common store/composable once established
      routingSlipStatusList.value = await payApi.getCodes<Code>('routing_slip_statuses')
    } catch {
      routingSlipStatusList.value = []
    }
  }
})
</script>

<template>
  <USelect
    v-model="model"
    :items="items"
    :placeholder
    size="md"
    class="input-text w-full"
    :ui="{ 
      placeholder: 'placeholder',
      content: 'wide-dropdown'
    }"
  />
</template>
