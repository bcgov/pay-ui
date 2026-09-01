<script setup lang="ts">
/**
 * "Payment Successful" screen for credit card payments — funds captured.
 * Renders the checkmark, amount summary, and the Download Receipt button.
 *
 * Download goes through pay-api's /payment-requests/{id}/receipts POST
 * (returns a Blob) — same call auth-web's makepayment page uses.
 */
const props = defineProps<{
  invoiceId?: number
  invoiceCreatedOn?: string
  amountFormatted: string
}>()

const { t } = useI18n()
const payLink = usePayLink()

const downloading = ref(false)
const downloadError = ref<string | null>(null)

async function download() {
  if (!props.invoiceId || downloading.value) { return }
  downloading.value = true
  downloadError.value = null
  try {
    const filingDateTime = formatFilingDateTime(props.invoiceCreatedOn) || formatFilingDateTime(new Date())
    const blob = await payLink.downloadReceipt(props.invoiceId, filingDateTime)
    fileDownload(blob, `bcregistry-receipt-${props.invoiceId}.pdf`)
  } catch (err: unknown) {
    const e = err as { data?: { message?: string } }
    downloadError.value = e?.data?.message || t('page.success.downloadFailed')
  } finally {
    downloading.value = false
  }
}
</script>

<template>
  <div class="py-8 text-center">
    <UIcon name="i-mdi-check" class="mx-auto size-14 text-mark" />
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
    <div class="mt-8 flex flex-col items-center gap-2">
      <button
        type="button"
        :disabled="downloading || !invoiceId"
        class="inline-flex items-center gap-2 rounded-md bg-mark px-6 py-3 text-sm font-semibold text-white transition hover:bg-[--color-mark-dark] disabled:opacity-60"
        @click="download"
      >
        <UIcon name="i-mdi-download" class="size-5" />
        {{ downloading ? $t('page.success.downloading') : $t('page.success.cc.downloadReceipt') }}
      </button>
      <p v-if="downloadError" class="text-sm text-red-700">
        {{ downloadError }}
      </p>
    </div>
  </div>
</template>
