<script setup lang="ts">
/**
 * Screen 2 — Select a Payment Method.
 *
 * The page is thin — it composes:
 *   - CheckoutPaymentMethodCard (CC / OB / PAD radios)
 *   - CheckoutPadBankingInfo    (inline PAD details when READY)
 *   - CheckoutPadStatusBanner   (LOADING / PENDING / FROZEN edge cases)
 *   - CheckoutFeeSummary + CheckoutActions (right sidebar)
 * and delegates state to usePadAccountState + useCcHandoff composables.
 */
type Method = 'DIRECT_PAY' | 'PAD' | 'ONLINE_BANKING'

const { t } = useI18n()
const localePath = useLocalePath()
const store = usePaymentLinkStore()
const payLink = usePayLink()
const pad = usePadAccountState()
const { handoff } = useCcHandoff()

definePageMeta({
  layout: 'connect-auth',
  middleware: ['connect-auth']
})

useHead({
  title: t('page.checkout.title')
})

const method = ref<Method>(
  (store.paymentMethod as Method) || (store.invoice?.paymentMethod as Method) || 'DIRECT_PAY'
)

const isSubmitting = ref(false)
const submitError = ref<string | null>(null)
const editingPad = ref(false)

const padEditInitial = computed(() => {
  const cfs = store.accountInfo?.cfsAccount
  if (!cfs) { return undefined }
  return {
    bankInstitutionNumber: cfs.bankInstitutionNumber ?? '',
    bankTransitNumber: cfs.bankTransitNumber ?? '',
    bankAccountNumber: cfs.bankAccountNumber ?? ''
  }
})

async function switchAndRefreshAccount(target: Method) {
  if (!store.invoice) { return }
  try {
    const updated = await payLink.changePaymentMethod(store.invoice.id, target)
    store.setInvoice(updated)
    await pad.refresh()
  } catch (err: unknown) {
    const e = err as { data?: { message?: string } }
    submitError.value = e?.data?.message || t('page.checkout.errors.methodSwitchFailed')
  }
}

watch(method, (m) => {
  store.setMethod(m)
  // OB needs an OB CFS account. Switch eagerly so pay-api lazy-creates the
  // reference and populates cfsAccountNumber — otherwise the payment
  // identifier is blank on the success page.
  if (m === 'ONLINE_BANKING' && store.invoice?.paymentMethod !== 'ONLINE_BANKING') {
    void switchAndRefreshAccount('ONLINE_BANKING')
  }
})

// Invoice may carry an older PAD selection; fall back to CC when the account
// isn't PAD so the CTA stays actionable.
watch(() => pad.padNotSetUp.value, (notSetUp) => {
  if (notSetUp && method.value === 'PAD') { method.value = 'DIRECT_PAY' }
})

onMounted(async () => {
  if (!store.invoice) {
    if (store.token) { navigateTo(localePath(`/pay/${store.token}/account`)) }
    return
  }
  await pad.load()
})

const canSubmit = computed(() => {
  if (!store.invoice || isSubmitting.value) { return false }
  if (method.value === 'PAD') {
    return pad.padState.value === 'READY' || pad.padState.value === 'PENDING'
  }
  return true
})

async function onPadSaved() {
  editingPad.value = false
  await pad.refresh()
}

async function submit() {
  if (!store.invoice || !canSubmit.value) { return }
  isSubmitting.value = true
  submitError.value = null
  try {
    const invoiceId = store.invoice.id
    if (method.value === 'DIRECT_PAY') {
      if (await handoff(invoiceId)) { return }
      await navigateTo(localePath(`/pay/${store.token}/success`))
      return
    }
    if (method.value !== store.invoice.paymentMethod) {
      const updated = await payLink.changePaymentMethod(invoiceId, method.value)
      store.setInvoice(updated)
    }
    await navigateTo(localePath(`/pay/${store.token}/success`))
  } catch (err: unknown) {
    const e = err as { data?: { message?: string } }
    submitError.value = e?.data?.message || t('page.checkout.errors.submitFailed')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="pay-checkout mx-auto w-full max-w-6xl px-6 py-10">
    <div v-if="submitError" class="mb-6 rounded border border-red-300 bg-red-50 p-4 text-red-800">
      {{ submitError }}
    </div>

    <div class="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <div class="min-w-0 space-y-6">
        <div>
          <h1 class="mb-6 text-2xl font-bold text-slate-900">
            {{ $t('page.checkout.selectMethod') }}
          </h1>
          <div class="space-y-3">
            <CheckoutPaymentMethodCard
              v-model="method"
              value="DIRECT_PAY"
              icon="i-mdi-credit-card-outline"
              :title="$t('page.checkout.method.cc')"
              :subtitle="$t('page.checkout.method.ccSub')"
            />

            <CheckoutPaymentMethodCard
              v-model="method"
              value="ONLINE_BANKING"
              icon="i-mdi-currency-usd"
              :title="$t('page.checkout.method.ob')"
              :subtitle="$t('page.checkout.method.obSub')"
            >
              <template #extra>
                <CheckoutObInfo v-if="method === 'ONLINE_BANKING'" />
              </template>
            </CheckoutPaymentMethodCard>

            <CheckoutPaymentMethodCard
              v-model="method"
              value="PAD"
              icon="i-mdi-bank-outline"
              :title="$t('page.checkout.method.pad')"
              :subtitle="pad.padNotSetUp.value ? undefined : $t('page.checkout.method.padSub')"
              :disabled="pad.padNotSetUp.value"
              :badge="pad.padNotSetUp.value ? $t('page.checkout.pad.setupRequiredBadge') : undefined"
            >
              <template v-if="pad.padNotSetUp.value" #body>
                <p class="font-semibold text-slate-900">
                  {{ $t('page.checkout.method.pad') }}
                </p>
                <p class="mt-1 text-sm text-slate-700">
                  {{ $t('page.checkout.pad.notSetUpBody') }}
                  <a
                    v-if="pad.accountSettingsUrl.value"
                    :href="pad.accountSettingsUrl.value"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="font-medium text-mark underline hover:text-[var(--color-mark-dark)]"
                  >{{ $t('page.checkout.pad.notSetUpLink') }}</a>
                  <span v-else class="font-medium">{{ $t('page.checkout.pad.notSetUpLink') }}</span>.
                </p>
              </template>

              <template #extra>
                <PadInfoWidget
                  v-if="method === 'PAD' && editingPad && store.selectedAccountId"
                  :account-id="store.selectedAccountId"
                  :initial="padEditInitial"
                  @saved="onPadSaved"
                  @cancel="editingPad = false"
                />
                <CheckoutPadBankingInfo
                  v-else-if="method === 'PAD' && pad.padState.value === 'READY'"
                  :cfs-account="store.accountInfo?.cfsAccount"
                  :can-edit="pad.canEditPadInfo.value"
                  @edit="editingPad = true"
                />
              </template>
            </CheckoutPaymentMethodCard>
          </div>
        </div>

        <CheckoutPadStatusBanner
          v-if="method === 'PAD' && !editingPad
            && (pad.padState.value === 'LOADING' || pad.padState.value === 'PENDING' || pad.padState.value === 'FROZEN')"
          :state="pad.padState.value"
        />
      </div>

      <aside class="min-w-0 space-y-4">
        <CheckoutFeeSummary :invoice="store.invoice" />
        <CheckoutActions
          :can-submit="canSubmit"
          :is-submitting="isSubmitting"
          @submit="submit"
        />
      </aside>
    </div>
  </div>
</template>
