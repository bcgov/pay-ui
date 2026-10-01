<script setup lang="ts">
/**
 * Centered "label: value" summary list shared by the success screens
 * (CC / PAD / EFT) — payment method, amount, and other method-specific rows.
 */
defineProps<{
  rows: Array<{ label: string, value: string }>
}>()
</script>

<template>
  <dl class="mx-auto mt-8 max-w-md space-y-2 text-base text-slate-700">
    <div
      v-for="row in rows"
      :key="row.label"
      class="flex justify-center gap-2"
    >
      <dt class="font-semibold text-slate-900">
        {{ row.label }}:
      </dt>
      <dd>{{ row.value }}</dd>
    </div>
  </dl>
</template>
