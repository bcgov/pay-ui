<script setup lang="ts">
import { useStatusListSelect } from '~/composables/common/useStatusList'

const props = defineProps<{
  column: 'status' | 'refundStatus'
}>()

const model = defineModel<string | null>({ required: true })

const { items, placeholder } = useStatusListSelect(props)

function clearSelection() {
  model.value = null
}
</script>

<template>
  <div class="relative w-full status-list-wrapper">
    <USelect
      v-model="model"
      :items="items"
      :placeholder
      size="md"
      class="input-text w-full"
      :class="{ '!pr-14': model }"
      :ui="{
        placeholder: 'placeholder',
        content: 'wide-dropdown',
        trailing: model ? '!pr-8' : ''
      }"
    />
    <button
      v-if="model"
      type="button"
      class="absolute top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-700
      focus:outline-none focus:ring-2 focus:ring-gray-500 rounded z-10"
      style="right: 0.5rem;"
      @click.stop="clearSelection"
    >
      <UIcon name="i-mdi-close" class="size-5" />
    </button>
  </div>
</template>

<style lang="scss" scoped>
.status-list-wrapper :deep(.ui-select),
.status-list-wrapper :deep(.ui-select *) {
  font-weight: 400 !important;
}

.status-list-wrapper :deep(.ui-select button) {
  padding-left: 0.75rem !important;
}
</style>
