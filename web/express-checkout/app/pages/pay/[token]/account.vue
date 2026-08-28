<script setup lang="ts">
/**
 * Screen 1 — Select account for the pay-link.
 * Uses @sbc-connect/nuxt-auth's ConnectAccountExisting{Alert,List} so the look
 * matches sbc-auth's own account picker (title, alert, avatar-badge list).
 * We only supply the picker's business logic: fetch accounts (once), redeem
 * the pay-link against the picked account, and navigate to checkout.
 */
const { t } = useI18n()
const localePath = useLocalePath()
const store = usePaymentLinkStore()
const accountStore = useConnectAccountStore()
const payLink = usePayLink()

definePageMeta({
  layout: 'connect-auth',
  middleware: ['connect-auth']
})

useHead({
  title: t('page.account.title')
})

const isLinking = ref(false)
const linkError = ref<string | null>(null)
const isLoadingAccounts = ref(false)

onMounted(async () => {
  if (!accountStore.userAccounts?.length) {
    isLoadingAccounts.value = true
    try {
      await accountStore.loadUserAccounts(true)
    } finally {
      isLoadingAccounts.value = false
    }
  }
  // Middleware normally sends 0-account users to /auth/account/create first;
  // this guards direct navigation to /pay/[token]/account.
  if ((accountStore.userAccounts?.length ?? 0) === 0) {
    registerNew()
  }
})

async function pick(accountId: number) {
  if (!store.token || isLinking.value) { return }
  isLinking.value = true
  linkError.value = null
  try {
    accountStore.switchCurrentAccount(accountId)
    store.setAccount(accountId)
    const invoice = await payLink.redeem(store.token, accountId)
    store.setInvoice(invoice)
    const paid = invoice?.paid ?? 0
    const total = invoice?.total ?? 0
    if (total > 0 && paid >= total) {
      await navigateTo(localePath(`/pay/${store.token}/success`))
      return
    }
    await navigateTo(localePath(`/pay/${store.token}/checkout`))
  } catch (err: unknown) {
    const e = err as { statusCode?: number, data?: { message?: string } }
    if (e?.statusCode === 404 || e?.statusCode === 400) {
      linkError.value = t('page.error.invalidLink')
    } else if (e?.statusCode === 403) {
      linkError.value = t('page.account.errors.noPermission')
    } else {
      linkError.value = e?.data?.message || t('page.account.errors.linkFailed')
    }
  } finally {
    isLinking.value = false
  }
}

function registerNew() {
  // Use the object form for navigateTo — passing "/auth/account/create?return=…"
  // as a string to localePath is treated as a path, so the '?' becomes literal
  // and the layer's `route.path.includes('create')` guard misfires.
  navigateTo({
    path: localePath('/auth/account/create'),
    query: { return: window.location.href }
  })
}
</script>

<template>
  <UContainer class="max-w-6xl py-8 sm:py-12">
    <div class="space-y-6">
      <h1 class="text-2xl font-bold text-neutral-highlighted sm:text-3xl">
        {{ $t('connect.label.existingAccountFound') }}
      </h1>

      <UAlert
        v-if="linkError"
        color="error"
        variant="subtle"
        :description="linkError"
      />

      <template v-if="accountStore.userAccounts.length > 0">
        <ConnectAccountExistingAlert />
        <ConnectAccountExistingList
          :accounts="accountStore.userAccounts"
          @select="pick"
        />
      </template>

      <div
        v-else-if="isLoadingAccounts"
        class="rounded border border-slate-200 bg-white p-6 text-sm text-slate-500"
      >
        {{ $t('page.account.loading') }}
      </div>

      <div v-if="accountStore.userAccounts.length > 0" class="flex justify-center">
        <UButton
          variant="outline"
          :label="$t('connect.label.createNewAccount')"
          icon="i-mdi-chevron-right"
          trailing
          size="xl"
          class="w-full justify-center sm:w-min sm:justify-normal"
          :disabled="isLinking"
          @click="registerNew"
        />
      </div>
    </div>
  </UContainer>
</template>
