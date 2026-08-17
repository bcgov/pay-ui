<script setup lang="ts">
/**
 * Screen 1 — Select Account Profile (matches design mockup).
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
  // Zero-account users have nothing to pick — skip the empty-state card and
  // send them straight into the simplified create-account flow.
  if ((accountStore.userAccounts?.length ?? 0) === 0) {
    registerNew()
  }
})

const hasNoAccounts = computed(
  () => !isLoadingAccounts.value && (accountStore.userAccounts?.length ?? 0) === 0
)

interface Account {
  id: number
  label?: string
  name?: string
  branchName?: string
  businessIdentifier?: string
  accountType?: string
  [k: string]: unknown
}

const accounts = computed<Account[]>(() => (accountStore.userAccounts as Account[] || []))

const primaryAccount = computed<Account | null>(() => {
  // Guard: if the user genuinely has no accounts, don't fall back to a stale
  // currentAccount from sessionStorage — the empty-state branch should render.
  if (accounts.value.length === 0) { return null }
  const current = accountStore.currentAccount as Account | undefined
  if (current?.id) { return current }
  return accounts.value[0] || null
})

const otherAccounts = computed<Account[]>(() =>
  accounts.value.filter(a => a.id !== primaryAccount.value?.id)
)

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
      linkError.value = 'You do not have permission to make payments on this account.'
    } else {
      linkError.value = e?.data?.message || 'Unable to link this invoice. Please try again.'
    }
  } finally {
    isLinking.value = false
  }
}

function continueToPrimary() {
  if (primaryAccount.value?.id) { pick(primaryAccount.value.id) }
}

function registerNew() {
  // Route both BCSC and BCeID through the simplified in-app flow shipped by
  // @sbc-connect/nuxt-auth (single form → POST /orgs as DIRECT_PAY/BUSINESS →
  // returns to `?return=` URL). Revisit for BCeID if the shortened flow proves
  // insufficient (auth-web's stepper covers affidavit / premium upgrades).
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
  <div class="pay-account">
    <!-- Compact page header -->
    <header class="border-b border-slate-200 bg-white">
      <div class="mx-auto max-w-6xl px-6 py-5">
        <h1 class="text-xl font-semibold text-slate-900 sm:text-2xl">
          {{ $t('page.account.h1') }}
        </h1>
        <p class="mt-1 text-sm text-slate-500">
          {{ $t('page.account.subtitle') }}
        </p>
      </div>
    </header>

    <section class="mx-auto max-w-6xl px-6 py-8">
      <div v-if="linkError" class="mb-6 rounded border border-red-300 bg-red-50 p-4 text-red-800">
        {{ linkError }}
      </div>

      <div class="grid gap-6 sm:grid-cols-2">
        <!-- Primary account (highlighted) -->
        <button
          v-if="primaryAccount"
          type="button"
          class="col-span-full rounded-xl border-2 border-[#212B47] bg-blue-50 p-6 text-left shadow-sm transition hover:shadow-md disabled:opacity-60"
          :disabled="isLinking"
          @click="pick(primaryAccount.id)"
        >
          <div class="flex items-start gap-4">
            <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#212B47] text-white">
              <span aria-hidden="true">🏢</span>
            </div>
            <div class="grow">
              <!-- "Primary Account" is a UI label meaning "the account currently
                   selected in useConnectAccountStore" — not a data-derived flag. -->
              <p class="text-xs font-semibold uppercase text-slate-500">
                Primary Account
              </p>
              <p class="text-xl font-semibold text-slate-900">
                {{ primaryAccount.label || primaryAccount.name }}
              </p>
              <p v-if="primaryAccount.businessIdentifier" class="text-sm text-slate-600">
                Business Number: {{ primaryAccount.businessIdentifier }}
              </p>
            </div>
            <span aria-hidden="true" class="text-[#212B47]">✓</span>
          </div>
        </button>

        <div v-else-if="isLoadingAccounts" class="col-span-full rounded-xl border border-slate-200 bg-white p-6 text-slate-500">
          Loading your accounts...
        </div>

        <div v-else-if="hasNoAccounts" class="col-span-full rounded-xl border border-slate-200 bg-white p-8 text-center">
          <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
            <span aria-hidden="true">🆕</span>
          </div>
          <p class="text-lg font-semibold text-slate-900">
            You don't have a BC Registries account yet
          </p>
          <p class="mx-auto mt-2 max-w-md text-sm text-slate-500">
            Create one to link this invoice and complete your payment. You'll be
            brought back here once your account is set up.
          </p>
          <button
            type="button"
            class="mt-6 rounded-md bg-[#FCBA19] px-5 py-2 text-sm font-semibold text-[#212B47] hover:bg-yellow-400"
            @click="registerNew"
          >
            {{ $t('page.account.registerNew') }}
          </button>
        </div>

        <!-- Other accounts -->
        <template v-for="acct in otherAccounts" :key="acct.id">
          <button
            type="button"
            class="rounded-xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:border-[#212B47] hover:shadow-md disabled:opacity-60"
            :disabled="isLinking"
            @click="pick(acct.id)"
          >
            <div class="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <span aria-hidden="true">🏛️</span>
            </div>
            <p class="text-lg font-semibold text-slate-900">
              {{ acct.label || acct.name }}
            </p>
            <p v-if="acct.branchName" class="text-sm text-slate-500">
              {{ acct.branchName }}
            </p>
            <hr class="my-4 border-slate-100">
            <p class="text-xs text-slate-500">
              Account ID: {{ acct.id }}
            </p>
          </button>
        </template>
      </div>

      <!-- Bottom CTA bar -->
      <div class="mt-10 flex flex-col items-center justify-between gap-4 rounded-xl bg-[#212B47] p-6 sm:flex-row">
        <div>
          <p class="text-lg font-semibold !text-white">
            Don't see your group?
          </p>
          <p class="text-sm text-slate-300">
            Register a new business or request access to an existing organization profile.
          </p>
        </div>
        <div class="flex gap-3">
          <button
            type="button"
            class="rounded-md border border-white/40 px-4 py-2 text-sm font-medium hover:bg-white/10"
            @click="registerNew"
          >
            {{ $t('page.account.registerNew') }}
          </button>
          <button
            type="button"
            class="rounded-md bg-[#FCBA19] px-4 py-2 text-sm font-semibold text-[#212B47] hover:bg-yellow-400 disabled:opacity-60"
            :disabled="!primaryAccount || isLinking"
            @click="continueToPrimary"
          >
            {{ $t('page.account.continue') }} ›
          </button>
        </div>
      </div>
    </section>
  </div>
</template>
