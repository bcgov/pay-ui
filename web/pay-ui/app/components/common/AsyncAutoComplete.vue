<script lang="ts">
import type { InputMenuItem } from '@nuxt/ui'
</script>

<script setup lang="ts" generic="T extends InputMenuItem = InputMenuItem">
const props = defineProps<{
  id: string
  name?: string
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
const open = ref(false)

const searchLength = computed(() => searchTerm.value?.trim().length ?? 0)
const hasMinSearchLength = computed(() => searchLength.value >= 3)

function handleOpenUpdate(isOpen: boolean) {
  open.value = isOpen && hasMinSearchLength.value
}

watch(searchLength, () => {
  if (!hasMinSearchLength.value) {
    open.value = false
  } else if (!open.value) {
    open.value = true
  }
})

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
      v-bind="$attrs"
      :id="id"
      v-model:search-term="searchTerm"
      v-model="selected"
      :open="open"
      :name="name || id"
      :items="items"
      :aria-labelledby="`${id}-label`"
      ignore-filter
      class="w-full"
      :ui="{
        content: 'min-w-fit'
      }"
      :data-testid="`${id}-input`"
      @update:open="handleOpenUpdate"
      @blur="$emit('blur')"
      @focus="$emit('focus')"
    >
      <template #trailing>
        <div class="flex items-center gap-3 shrink-0">
          <UIcon
            v-if="status === 'pending'"
            name="i-mdi-loading"
            class="animate-spin shrink-0 size-6 text-primary"
          />
          <UIcon
            v-else
            name="i-mdi-menu-down"
            class="shrink-0 size-6 text-gray-600"
          />
          <button
            v-if="selected && status !== 'pending'"
            type="button"
            class="text-gray-600 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded"
            @click.stop="() => { selected = null; searchTerm = '' }"
          >
            <UIcon name="i-mdi-close" class="size-6" />
          </button>
        </div>
      </template>

      <template #item="{ item }">
        <slot name="item" :item="item" />
      </template>
    </UInputMenu>
  </div>
</template>
