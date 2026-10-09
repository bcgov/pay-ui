<script setup lang="ts">
/**
 * "Payment Successful" screen for credit card payments — funds captured.
 * Renders the checkmark, amount summary, and the Download Receipt button.
 *
 * Download goes through pay-api's /payment-requests/{id}/receipts POST
 * (returns a Blob) — same call auth-web's makepayment page uses. A guest payer
 * has no session for that route, so they go through the payment-link token
 * instead; same split as the return page's invoice refresh.
 */
const {
  invoiceId,
  invoiceCreatedOn,
  amountFormatted
} = defineProps<{
  invoiceId?: number
  invoiceCreatedOn?: string
  amountFormatted: string
}>()

const { t } = useI18n()
const payLink = usePayLink()
const store = usePaymentLinkStore()

const downloading = ref(false)
const downloadError = ref<string | null>(null)

const summaryRows = computed(() => [
  { label: t('page.success.cc.methodLabel'), value: t('page.checkout.method.cc') },
  { label: t('page.success.cc.amountLabel'), value: amountFormatted, bold: true }
])

async function download() {
  if (!invoiceId || downloading.value) { return }
  downloading.value = true
  downloadError.value = null
  try {
    const filingDateTime = formatFilingDateTime(invoiceCreatedOn) || formatFilingDateTime(new Date())
    let blob: Blob
    if (store.selectedAccountId) {
      blob = await payLink.downloadReceipt(invoiceId, filingDateTime)
    } else if (store.token) {
      blob = await payLink.downloadReceiptByToken(store.token, filingDateTime)
    } else {
      throw new Error('No account or payment-link token found.')
    }
    fileDownload(blob, `bcregistry-receipt-${invoiceId}.pdf`)
  } catch (err: unknown) {
    const e = err as { data?: { message?: string } }
    downloadError.value = e?.data?.message || t('page.success.downloadFailed')
  } finally {
    downloading.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-2xl rounded bg-white px-14 py-10 shadow-sm">
    <SuccessHeader
      icon="i-mdi-check-circle"
      icon-class="text-green-700"
      :title="$t('page.success.cc.title')"
    />
    <SuccessSummaryList :rows="summaryRows" />
    <div class="mx-auto mt-10 max-w-sm space-y-3">
      <UButton
        color="primary"
        size="lg"
        block
        icon="i-mdi-download"
        :label="downloading ? $t('page.success.downloading') : $t('page.success.cc.downloadReceipt')"
        :disabled="!invoiceId"
        :loading="downloading"
        @click="download"
      />
      <SuccessReturnButton />
      <p v-if="downloadError" class="text-sm text-red-700">
        {{ downloadError }}
      </p>
    </div>
  </div>
</template>
