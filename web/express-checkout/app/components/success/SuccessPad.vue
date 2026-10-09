<script setup lang="ts">
/**
 * "Payment in Progress" screen for PAD — debit scheduled, no receipt yet.
 */
const { amountFormatted } = defineProps<{
  amountFormatted: string
}>()

const { t } = useI18n()

const summaryRows = computed(() => [
  { label: t('page.success.pad.methodLabel'), value: t('page.checkout.method.pad') },
  { label: t('page.success.pad.amountLabel'), value: amountFormatted, bold: true }
])
</script>

<template>
  <div class="mx-auto max-w-2xl rounded bg-white px-14 py-10 shadow-sm">
    <SuccessHeader icon="i-mdi-clock-outline" :title="$t('page.success.pad.title')" />
    <SuccessSummaryList :rows="summaryRows" />
    <p class="mt-4 text-base text-slate-700">
      {{ $t('page.success.pad.body1', { amount: amountFormatted }) }}
      {{ $t('page.success.pad.body2') }}
    </p>
    <div class="mx-auto mt-8 max-w-sm empty:hidden">
      <SuccessReturnButton />
    </div>
  </div>
</template>
