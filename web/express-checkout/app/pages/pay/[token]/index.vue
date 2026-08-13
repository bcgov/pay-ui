<script setup lang="ts">
/**
 * Landing route for a payment link.
 * Auth middleware ensures the user is signed in. Then:
 *   - if the store already holds an invoice for THIS token AND it's paid → success
 *   - if it holds an invoice for THIS token that's unpaid → skip account picker,
 *     go straight to checkout (re-visit case; server-side /link is idempotent)
 *   - otherwise → account picker
 */
const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const store = usePaymentLinkStore()

definePageMeta({
  layout: 'connect-auth',
  middleware: ['connect-auth']
})

useHead({
  title: t('page.landing.title')
})

onMounted(async () => {
  const token = route.params.token as string
  if (!token) return

  const hasInvoiceForThisToken = store.token === token && !!store.invoice
  const isPaid = (store.invoice?.paid ?? 0) >= (store.invoice?.total ?? -1) && (store.invoice?.total ?? 0) > 0

  if (hasInvoiceForThisToken && isPaid) {
    await navigateTo(localePath(`/pay/${token}/success`))
    return
  }
  if (hasInvoiceForThisToken) {
    await navigateTo(localePath(`/pay/${token}/checkout`))
    return
  }
  await navigateTo(localePath(`/pay/${token}/account`))
})
</script>

<template>
  <section class="mx-auto max-w-2xl px-6 py-16 text-center">
    <h1 class="text-xl font-semibold">
      {{ $t('page.landing.h1') }}
    </h1>
  </section>
</template>
