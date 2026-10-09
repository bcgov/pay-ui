<script setup lang="ts">
/**
 * Icon + title header shared by the success screens (CC / PAD / EFT).
 */
const { iconClass = 'text-mark' } = defineProps<{
  icon: string
  title: string
  iconClass?: string
}>()
</script>

<template>
  <div class="text-center">
    <UIcon
      :name="icon"
      class="mx-auto size-12"
      :class="iconClass"
    />
    <h1 class="mt-4 text-3xl font-bold text-slate-900">
      {{ title }}
    </h1>
    <hr class="mt-8 border-slate-200">
  </div>
</template>
