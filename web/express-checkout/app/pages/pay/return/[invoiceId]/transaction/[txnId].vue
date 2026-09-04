<script setup lang="ts">
/**
 * Post-PayBC return page. PayBC redirects here after CC entry.
 * Mirrors auth-web's PaymentReturnView pattern: PATCH updateTransaction once
 * with the full callback URL; pay-api extracts PayBC query params and
 * reconciles the transaction, returning the final status + clientSystemUrl.
 */
const { t } = useI18n()
const route = useRoute()
const localePath = useLocalePath()
const payLink = usePayLink()
const store = usePaymentLinkStore()

// A guest payer comes back from PayBC with no session, so this can't require a login —
// they'd be bounced to sign-in with the payment already taken. The PATCH below is
// unauthenticated on pay-api for the same reason.
definePageMeta({
  layout: 'connect-auth',
  middleware: ['connect-auth-optional']
})

useHead({
  title: t('page.return.title')
})

const invoiceId = Number(route.params.invoiceId)
const txnId = String(route.params.txnId)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    const payResponseUrl = window.location.href
    const result = await payLink.updateTransaction(invoiceId, txnId, payResponseUrl)

    if (result.statusCode === 'COMPLETED') {
      const fresh = await payLink.getInvoice(invoiceId, store.selectedAccountId)
      store.setInvoice(fresh)

      // Forward to the client system URL captured at transaction creation
      // (falls back to the in-app success page if it's missing for any reason).
      const dest = result.clientSystemUrl
        || (store.token ? localePath(`/pay/${store.token}/success`) : localePath('/'))
      const status = btoa('COMPLETED')
      const separator = dest.includes('?') ? '&' : '?'
      window.location.assign(`${dest}${separator}status=${status}`)
      return
    }

    error.value = t('page.return.notCompleted')
  } catch (err: unknown) {
    const e = err as { data?: { message?: string } }
    error.value = e?.data?.message || t('page.return.confirmFailed')
  }
})
</script>

<template>
  <section class="mx-auto max-w-2xl px-6 py-16 text-center">
    <h1 class="text-xl font-semibold">
      {{ $t('page.return.h1') }}
    </h1>
    <p v-if="!error" class="mt-4 text-gray-600">
      {{ $t('page.return.body') }}
    </p>
    <div v-else class="mt-6 rounded border border-red-300 bg-red-50 p-4 text-red-800">
      {{ error }}
    </div>
  </section>
</template>
