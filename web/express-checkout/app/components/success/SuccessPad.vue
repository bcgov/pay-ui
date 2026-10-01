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
  { label: t('page.success.pad.amountLabel'), value: amountFormatted }
])
</script>

<template>
  <div class="py-8 text-center">
    <SuccessHeader icon="i-mdi-clock-outline" :title="$t('page.success.pad.title')" />
    <SuccessSummaryList :rows="summaryRows" />
    <p class="mx-auto mt-6 max-w-xl text-base text-slate-700">
      {{ $t('page.success.pad.body1', { amount: amountFormatted }) }}
    </p>
    <p class="mx-auto mt-1 max-w-xl text-base text-slate-700">
      {{ $t('page.success.pad.body2') }}
    </p>
  </div>
</template>
