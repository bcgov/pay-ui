<script lang="ts">
import type { InputMenuItem } from '@nuxt/ui'
</script>

<script setup lang="ts" generic="T extends InputMenuItem = InputMenuItem">
const props = defineProps<{
  id: string
  label: string
  queryFn: (searchTerm: string) => Promise<T[]>
}>()

defineEmits<{
  blur: []
  focus: []
}>()

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const selected = defineModel<any>({ required: true, default: undefined })

const searchTerm = ref('')
const searchTermDebounced = refDebounced(searchTerm, 300)

const { data: items, status } = await useAsyncData<T[]>(
  props.id,
  async () => props.queryFn(searchTerm.value),
  {
    immediate: false,
    watch: [searchTermDebounced],
    default: () => []
  }
)
</script>

<template>
  <div class="relative group">
    <span
      :id="`${id}-label`"
      :class="[
        selected || searchTerm
          ? 'top-3 text-xs'
          : '',
        'line-clamp-1',
        'absolute z-10 px-2.5 -translate-y-1/2 group-focus-within:text-primary',
        'top-1/2 pointer-events-none text-neutral transition-all',
        'motion-reduce:transition-none duration-200 delay-50',
        'group-focus-within:top-3 group-focus-within:text-xs',
        'group-focus-within:text-primary group-has-[div>input[aria-invalid=true]]:text-error'
      ]"
    >
      {{ label }}
    </span>
    <UInputMenu
      v-model:search-term="searchTerm"
      v-model="selected"
      v-bind="$attrs"
      :items="items"
      :aria-labelledby="`${id}-label`"
      ignore-filter
      class="w-full"
      :ui="{
        content: 'min-w-fit',
        trailingIcon: 'hidden'
      }"
      :data-testid="`${id}-input`"
      @blur="$emit('blur')"
      @focus="$emit('focus')"
    >
      <template #trailing>
        <UIcon
          v-if="status === 'pending'"
          name="i-mdi-loading"
          class="animate-spin shrink-0 size-6 text-primary"
        />
      </template>

      <template #item="{ item }">
        <slot name="item" :item="item" />
      </template>
    </UInputMenu>
  </div>
</template>
