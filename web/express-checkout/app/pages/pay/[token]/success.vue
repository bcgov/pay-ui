<script setup lang="ts">
/**
 * Screen 3 — Payment result view. Thin router: picks the right method-
 * specific component based on the invoice's payment method. Each component
 * owns its own layout + copy; see components/success/.
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
    <SuccessCc
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
