<script setup lang="ts">
import type { SelectItem } from '@nuxt/ui'

const props = withDefaults(defineProps<{
  list: unknown[]
  mapFn?: (item: unknown) => SelectItem
  label?: string
  placeholder?: string
}>(), {
  mapFn: undefined,
  label: undefined,
  placeholder: undefined
})

const model = defineModel<string | null>({ required: true })

const items = computed<SelectItem[]>(() => {
  if (!props.list || props.list.length === 0) {
    return []
  }

  return props.list.map(props.mapFn)
})

const computedPlaceholder = computed(() => {
  return props.placeholder || props.label || 'Select'
})

function clearSelection() {
  model.value = null
}
</script>

<template>
  <div class="relative w-full status-list-wrapper">
    <USelect
      v-model="model"
      :items="items"
      :placeholder="computedPlaceholder"
      size="md"
      class="input-text w-full"
      :ui="{
        placeholder: 'placeholder',
        content: 'wide-dropdown min-w-max',
        base: model ? '!pr-16' : ''
      }"
    />
    <button
      v-if="model"
      type="button"
      class="filter-clear-btn absolute top-1/2 -translate-y-1/2 right-9 flex items-center focus:outline-none"
      @click.stop="clearSelection"
    >
      <UIcon
        name="i-mdi-close"
        class="size-6"
        style="color: var(--color-primary) !important"
      />
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
