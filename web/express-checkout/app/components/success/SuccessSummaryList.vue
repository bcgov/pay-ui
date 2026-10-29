<script setup lang="ts">
/**
 * Centered "label: value" summary list shared by the success screens
 * (CC / PAD / EFT) — payment method, amount, and other method-specific rows.
 */
defineProps<{
  rows: Array<{ label: string, value: string, bold?: boolean }>
}>()
</script>

<template>
  <dl class="mt-8 space-y-4 text-base text-slate-700">
    <div
      v-for="row in rows"
      :key="row.label"
      class="flex justify-between gap-4"
    >
      <dt class="font-semibold">
        {{ row.label }}:
      </dt>
      <dd :class="{ 'font-bold': row.bold }">
        {{ row.value }}
      </dd>
    </div>
  </dl>
</template>
