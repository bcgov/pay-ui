<script setup lang="ts">
/**
 * Screen 3 — Payment Successful / Scheduled / Awaiting.
 * All displayed data comes off the invoice DTO returned by pay-api.
 * TODOs mark spots where the design shows a value we don't yet have a
 * verified source for (see comments inline).
 */
const { t } = useI18n()
const store = usePaymentLinkStore()

definePageMeta({
  layout: 'connect-auth',
  middleware: ['connect-auth']
})

useHead({
  title: t('page.success.title')
})

const methodKey = computed(() => {
  const m = store.invoice?.payment_method || store.paymentMethod
  if (m === 'PAD') return 'pad'
  if (m === 'ONLINE_BANKING') return 'ob'
  return 'cc'
})

// Reference number: prefer the receipt's number (only set once payment is
// actually received), then the CFS/PayBC invoice reference, then fall back
// to the internal invoice id as a last resort.
const referenceNumber = computed(() => {
  const receipt = store.invoice?.receipts?.[0]
  const ref = store.invoice?.references?.[0]
  return (
    receipt?.receipt_number
    || ref?.invoice_number
    || (store.invoice?.id ? `#${store.invoice.id}` : '')
  )
})

// Same BCR-<accountId> payee reference the checkout page shows for OB.
// TODO: replace with a pay-api-provided cfs_party_number once exposed on the invoice DTO.
const obPayeeReference = computed<string>(() => {
  const paymentAccount = store.invoice?.payment_account as { auth_account_id?: string | number } | undefined
  const accountId = paymentAccount?.auth_account_id ?? store.selectedAccountId
  return accountId ? `BCR-${accountId}` : ''
})

// Transaction date: only shown when we actually have one from pay-api.
// For unpaid invoices (PAD scheduled, OB awaiting), no date is displayed.
const transactionDate = computed<string | null>(() => {
  const rawIso = store.invoice?.receipts?.[0]?.receipt_date
    || store.invoice?.payment_date
    || null
  if (!rawIso) return null
  const d = new Date(rawIso)
  if (Number.isNaN(d.valueOf())) return null
  return d.toLocaleString('en-CA', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Vancouver'
  })
})
</script>

<template>
  <div class="pay-success mx-auto max-w-3xl px-6 py-12">
    <div class="mb-8 text-center">
      <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-[#212B47] text-white">
        <span class="text-2xl" aria-hidden="true">✓</span>
      </div>
      <h1 class="text-2xl font-semibold text-slate-900">
        {{ $t(`page.success.h1.${methodKey}`) }}
      </h1>
      <p class="mx-auto mt-3 max-w-lg text-sm text-slate-600">
        {{ $t(`page.success.body.${methodKey}`) }}
      </p>
      <p v-if="methodKey === 'ob' && obPayeeReference" class="mx-auto mt-4 max-w-lg rounded border border-blue-200 bg-blue-50 p-3 text-sm text-slate-800">
        Payee account number: <strong>{{ obPayeeReference }}</strong>
      </p>
    </div>

    <section class="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <div class="mb-6 flex items-start justify-between">
        <div>
          <p class="text-xs uppercase text-slate-500">Official Receipt</p>
          <h2 class="mt-1 text-xl font-semibold text-slate-900">
            Province of British Columbia
          </h2>
          <p v-if="transactionDate" class="mt-2 text-sm text-slate-500">
            Transaction Date: {{ transactionDate }}
          </p>
        </div>
        <!-- TODO: QR code — no pay-api endpoint yet for generating one. Placeholder box for now. -->
        <div
          class="flex h-14 w-14 items-center justify-center rounded border border-slate-300 bg-slate-50 text-xs text-slate-400"
          title="QR code placeholder"
        >
          QR
        </div>
      </div>

      <dl class="divide-y divide-slate-200 border-y border-slate-200 py-2 text-sm">
        <div v-if="referenceNumber" class="flex justify-between py-3">
          <dt class="text-slate-500">Reference Number</dt>
          <dd class="font-semibold text-slate-900">{{ referenceNumber }}</dd>
        </div>
        <div class="flex justify-between py-3">
          <dt class="text-slate-500">Payment Method</dt>
          <dd class="font-medium text-slate-900">
            {{ $t(`page.checkout.method.${methodKey}`) }}
          </dd>
        </div>
        <div v-if="store.invoice?.corp_type_code" class="flex justify-between py-3">
          <dt class="text-slate-500">Corp Type</dt>
          <dd class="font-medium text-slate-900">
            {{ store.invoice.corp_type_code }}
          </dd>
        </div>
        <div v-if="store.invoice?.business_identifier" class="flex justify-between py-3">
          <dt class="text-slate-500">Business</dt>
          <dd class="font-medium text-slate-900">
            {{ store.invoice.business_identifier }}
          </dd>
        </div>
      </dl>

      <div class="mt-6 rounded-lg bg-slate-50 p-4">
        <dl class="space-y-2 text-sm">
          <template v-for="(line, i) in store.invoice?.line_items || []" :key="i">
            <div class="flex justify-between">
              <dt>{{ line.description }}</dt>
              <dd>${{ Number(line.total ?? 0).toFixed(2) }}</dd>
            </div>
          </template>
        </dl>
        <hr class="my-3 border-slate-200">
        <div class="flex justify-between text-lg font-semibold text-slate-900">
          <span>Total {{ (store.invoice?.paid ?? 0) >= (store.invoice?.total ?? 0) ? 'Paid' : 'Due' }}</span>
          <span>${{ Number(store.invoice?.total ?? 0).toFixed(2) }} CAD</span>
        </div>
      </div>

      <p v-if="referenceNumber" class="mt-6 text-center text-xs text-slate-500">
        Thank you for using BC Government Services. This receipt serves as official proof of payment.
        For inquiries, please reference: {{ referenceNumber }}.
      </p>

      <div class="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-md bg-[#212B47] px-4 py-2 text-sm font-medium text-white hover:bg-[#2d3a5f]"
          @click="() => window.print()"
        >
          <span aria-hidden="true">🖨️</span> Print Receipt
        </button>
        <!-- POST /payment-requests/{id}/reports returns the PDF; simple GET link works for open-in-tab / download. -->
        <a
          v-if="store.invoice?.id"
          :href="`/api/v1/payment-requests/${store.invoice.id}/reports`"
          class="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <span aria-hidden="true">⬇️</span> Download PDF
        </a>
      </div>
    </section>

    <!-- TODO: these two follow-up cards need real destinations for external
         partners (e.g. partner-provided returnUrl for dashboard, and a real
         notification-signup endpoint). For POC they link back to root. -->
    <div class="mt-8 grid gap-4 sm:grid-cols-2">
      <a
        href="/"
        class="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-[#212B47] hover:shadow-md"
      >
        <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
          <span aria-hidden="true">▦</span>
        </div>
        <div class="grow">
          <p class="font-semibold text-slate-900">Return to Dashboard</p>
          <p class="text-sm text-slate-500">Manage your other services</p>
        </div>
        <span aria-hidden="true" class="text-slate-400">›</span>
      </a>

      <a
        href="/"
        class="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-[#212B47] hover:shadow-md"
      >
        <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
          <span aria-hidden="true">✉️</span>
        </div>
        <div class="grow">
          <p class="font-semibold text-slate-900">Add Notification</p>
          <p class="text-sm text-slate-500">Get renewal alerts next year</p>
        </div>
        <span aria-hidden="true" class="text-slate-400">›</span>
      </a>
    </div>
  </div>
</template>
