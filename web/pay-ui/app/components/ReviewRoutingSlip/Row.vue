<script setup lang="ts">
defineProps<{
  label: string
  value?: string
}>()
</script>

<template>
  <div class="flex flex-col gap-2 sm:flex-row sm:gap-4">
    <span class="w-full sm:w-1/4 font-bold text-neutral-highlighted">{{ label }}</span>
    <div class="flex-1">
      <span v-if="value">{{ value }}</span>
      <slot v-else />
    </div>
  </div>
</template>
