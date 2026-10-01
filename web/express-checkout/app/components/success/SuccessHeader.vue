<script setup lang="ts">
/**
 * Icon + title header shared by the success screens (CC / PAD / EFT).
 */
defineProps<{
  icon: string
  title: string
}>()
</script>

<template>
  <div>
    <UIcon :name="icon" class="mx-auto size-14 text-mark" />
    <h1 class="mt-4 text-3xl font-bold text-slate-900">
      {{ title }}
    </h1>
  </div>
</template>
