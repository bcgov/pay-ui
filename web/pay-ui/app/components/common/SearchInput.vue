<script setup lang="ts">
defineOptions({ inheritAttrs: false })

const model = defineModel<string | null>()
const emit = defineEmits<{ clear: [] }>()

function clear() {
  model.value = ''
  emit('clear')
}
</script>

<template>
  <UInput v-model="model" v-bind="$attrs" :ui="{ base: model ? '!pr-8' : '' }">
    <template v-if="model" #trailing>
      <button
        type="button"
        class="filter-clear-btn flex items-center focus:outline-none"
        @mousedown.prevent
        @click.stop="clear"
      >
        <UIcon name="i-mdi-close" class="size-6" style="color: var(--color-primary) !important" />
      </button>
    </template>
  </UInput>
</template>
