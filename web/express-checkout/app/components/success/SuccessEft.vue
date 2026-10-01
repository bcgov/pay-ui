<script setup lang="ts">
/**
 * "Payment Pending" screen for EFT — the invoice is settled against the
 * account's next statement, not immediately, so there's no receipt yet.
 */
const { dateFormatted, amountFormatted } = defineProps<{
  dateFormatted: string
  amountFormatted: string
}>()

const { t } = useI18n()

const summaryRows = computed(() => [
  { label: t('page.success.eft.dateLabel'), value: dateFormatted },
  { label: t('page.success.eft.methodLabel'), value: t('page.checkout.method.eft') },
  { label: t('page.success.eft.amountLabel'), value: amountFormatted }
])
</script>

<template>
  <div class="py-8 text-center">
    <SuccessHeader icon="i-mdi-clock-outline" :title="$t('page.success.eft.title')" />
    <SuccessSummaryList :rows="summaryRows" />
    <p class="mx-auto mt-6 flex max-w-xl items-start justify-center gap-2 text-left text-base text-slate-700">
      <UIcon name="i-mdi-check" class="mt-1 size-5 shrink-0 text-green-600" />
      <span>{{ $t('page.success.eft.body') }}</span>
    </p>
  </div>
</template>
