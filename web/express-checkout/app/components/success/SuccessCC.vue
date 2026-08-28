<script setup lang="ts">
/**
 * "Payment Successful" screen for credit card payments — funds captured.
 * Renders the checkmark, amount summary, and the Download Receipt button.
 */
const props = defineProps<{
  invoiceId?: number
  amountFormatted: string
}>()

const downloadUrl = computed(() =>
  props.invoiceId ? `/api/v1/payment-requests/${props.invoiceId}/reports` : ''
)
</script>

<template>
  <div class="py-8 text-center">
    <UIcon name="i-mdi-check" class="mx-auto size-14 text-[#1A5A96]" />
    <h1 class="mt-4 text-3xl font-bold text-slate-900">
      {{ $t('page.success.cc.title') }}
    </h1>
    <p class="mx-auto mt-4 max-w-xl text-base text-slate-700">
      {{ $t('page.success.cc.body') }}
    </p>
    <dl class="mx-auto mt-8 max-w-md space-y-2 text-base text-slate-700">
      <div class="flex justify-center gap-2">
        <dt class="font-semibold text-slate-900">
          {{ $t('page.success.cc.methodLabel') }}:
        </dt>
        <dd>{{ $t('page.checkout.method.cc') }}</dd>
      </div>
      <div class="flex justify-center gap-2">
        <dt class="font-semibold text-slate-900">
          {{ $t('page.success.cc.amountLabel') }}:
        </dt>
        <dd>{{ amountFormatted }}</dd>
      </div>
    </dl>
    <div class="mt-8 flex justify-center">
      <a
        v-if="downloadUrl"
        :href="downloadUrl"
        class="inline-flex items-center gap-2 rounded-md bg-[#1A5A96] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#124372]"
      >
        <UIcon name="i-mdi-download" class="size-5" />
        {{ $t('page.success.cc.downloadReceipt') }}
      </a>
    </div>
  </div>
</template>
