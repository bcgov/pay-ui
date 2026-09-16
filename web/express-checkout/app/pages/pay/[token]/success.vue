<script setup lang="ts">
/**
 * Screen 3 — Payment result view. Thin router: picks the right method-
 * specific component based on the invoice's payment method. Each component
 * owns its own layout + copy; see components/success/.
 */
const { t } = useI18n()
const store = usePaymentLinkStore()
const payLink = usePayLink()

// Reachable by a guest payer who never signed in — see the landing page.
definePageMeta({
  layout: 'connect-auth',
  hideBreadcrumbs: true,
  middleware: ['connect-auth-optional']
})

useHead({
  title: t('page.success.title')
})

// The store is normally filled by the PayBC return page, but a guest who reopens their
// payment link later — new tab, another device — arrives here with nothing in it, and
// would see "$0.00" and a dead Download Receipt button. The token is in the store by then
// (01.capture-token.global.ts) and the by-token lookup is open to guests, so re-read it.
onMounted(async () => {
  if (store.invoice || !store.token) { return }
  try {
    store.setInvoice(await payLink.getInvoiceByToken(store.token))
  } catch (err: unknown) {
    console.error('Could not load the invoice behind the payment link', err)
  }
})

const methodKey = computed(() => {
  const m = store.invoice?.paymentMethod || store.paymentMethod
  if (m === 'PAD') { return 'pad' }
  if (m === 'ONLINE_BANKING') { return 'ob' }
  return 'cc'
})

const totalFormatted = computed(() => `$${Number(store.invoice?.total ?? 0).toFixed(2)}`)
const balanceDueFormatted = computed(() => {
  const total = Number(store.invoice?.total ?? 0)
  const paid = Number(store.invoice?.paid ?? 0)
  return `$${Math.max(0, total - paid).toFixed(2)}`
})
</script>

<template>
  <div class="pay-success mx-auto max-w-3xl px-6 py-12">
    <SuccessCC
      v-if="methodKey === 'cc'"
      :invoice-id="store.invoice?.id"
      :invoice-created-on="store.invoice?.createdOn"
      :amount-formatted="totalFormatted"
    />
    <SuccessPad
      v-else-if="methodKey === 'pad'"
      :amount-formatted="totalFormatted"
    />
    <SuccessOb
      v-else
      :invoice-id="store.invoice?.id"
      :amount-formatted="totalFormatted"
      :balance-due-formatted="balanceDueFormatted"
      :payee-reference="store.accountInfo?.cfsAccount?.cfsAccountNumber ?? ''"
    />
  </div>
</template>
