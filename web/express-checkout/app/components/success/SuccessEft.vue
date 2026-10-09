<script setup lang="ts">
/**
 * "Payment Pending" screen for EFT — the invoice is settled against the
 * account's next statement, not immediately, so there's no receipt yet.
 */
const { amountFormatted } = defineProps<{
  amountFormatted: string
}>()

const { t } = useI18n()

const summaryRows = computed(() => [
  { label: t('page.success.eft.methodLabel'), value: t('page.checkout.method.eft') },
  { label: t('page.success.eft.amountLabel'), value: amountFormatted, bold: true }
])
</script>

<template>
  <div class="mx-auto max-w-2xl rounded bg-white px-14 py-10 shadow-sm">
    <SuccessHeader icon="i-mdi-clock-outline" :title="$t('page.success.eft.title')" />
    <SuccessSummaryList :rows="summaryRows" />
    <p class="mt-4 flex items-start gap-2 text-base text-slate-700">
      <UIcon name="i-mdi-check" class="mt-1 size-5 shrink-0 text-green-700" />
      <span>{{ $t('page.success.eft.body') }}</span>
    </p>
    <div class="mx-auto mt-8 max-w-sm empty:hidden">
      <SuccessReturnButton />
    </div>
  </div>
</template>
