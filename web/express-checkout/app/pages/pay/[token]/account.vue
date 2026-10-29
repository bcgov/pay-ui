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
const { getAccountPaymentInfo } = useAccount()

definePageMeta({
  layout: 'connect-auth',
  middleware: ['connect-auth']
})

useHead({
  title: t('page.account.title')
})

const isLinking = ref(false)
const linkError = ref<{ title: string, description: string } | null>(null)
const isLoadingAccounts = ref(false)

const showPaymentMethodBadge = true
const showStatusBadge = true
const showAddress = true

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
    return
  }
  if (!showPaymentMethodBadge && !showStatusBadge) {
    return
  }
  // showPaymentMethodBadge needs every account's payment method; showStatusBadge only
  // needs it for accounts already flagged NSF-suspended.
  await Promise.allSettled(
    accountStore.userAccounts
      .filter(account => showPaymentMethodBadge || account.accountStatus === AccountStatus.NSF_SUSPENDED)
      .map(async (account) => {
        try {
          const info = await getAccountPaymentInfo(account.id)
          if (showPaymentMethodBadge) {
            account.paymentMethod = info?.paymentMethod
          }
          if (showStatusBadge) {
            account.hasNsfInvoices = info?.hasNsfInvoices
            account.hasOverdueInvoices = info?.hasOverdueInvoices
          }
        } catch (e) {
          console.warn(`Failed to fetch payment info for account ${account.id}.`, e)
        }
      })
  )
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
    // Backend re-checks NSF/overdue at redemption time too.
    const errorType = (err as { data?: { type?: string } })?.data?.type
    if (errorType === 'PAD_CURRENTLY_NSF' || errorType === 'EFT_INVOICES_OVERDUE') {
      await accountStore.redirectToAccountInfo(accountStore.currentAccount)
      return
    }
    linkError.value = describeRedeemError(err)
  } finally {
    isLinking.value = false
  }
}

// 403 means no MAKE_PAYMENT on the picked account; anything else is an invalid/expired link.
function describeRedeemError(err: unknown): { title: string, description: string } {
  const e = err as {
    statusCode?: number
    data?: { code?: string, type?: string, message?: string, detail?: string }
  }
  if (e.statusCode === 403) {
    return { title: t('page.error.linkInactive.title'), description: t('page.account.errors.noPermission') }
  }
  return { title: t('page.error.linkInactive.title'), description: t('page.error.linkInactive.description') }
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
        color="warning"
        variant="subtle"
        :title="linkError.title"
        :description="linkError.description"
      />

      <template v-if="accountStore.userAccounts.length > 0">
        <ConnectAccountExistingAlert />
        <ConnectAccountExistingList
          :accounts="accountStore.userAccounts"
          :show-payment-method-badge="showPaymentMethodBadge"
          :show-status-badge="showStatusBadge"
          :show-address="showAddress"
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
