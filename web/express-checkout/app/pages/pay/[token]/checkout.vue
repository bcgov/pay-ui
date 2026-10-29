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
type Method = 'DIRECT_PAY' | 'PAD' | 'ONLINE_BANKING' | 'EFT'

const { t } = useI18n()
const localePath = useLocalePath()
const store = usePaymentLinkStore()
const payLink = usePayLink()
const pad = usePadAccountState()
const { handoff } = useCcHandoff()
const { updateOrgToOnlineBanking, getAccountPaymentInfo } = useAccount()

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

// Accounts set up for EFT can't pay any other way, so the page shows the single
// EFT option instead of the switchable CC/OB/PAD list. Based on the account's
// actual configured payment method (store.accountInfo, populated by pad.load()
// below) — not the invoice's, which can be stale or a default picked at
// invoice-creation time. Same detection shape as padState/padNotSetUp further down.
const isEftOnly = computed(() => {
  const info = store.accountInfo
  return info?.paymentMethod === 'EFT' || info?.cfsAccount?.paymentMethod === 'EFT'
})

const downloadingEftInstructions = ref(false)
const eftInstructionsError = ref<string | null>(null)

async function downloadEftInstructions() {
  if (downloadingEftInstructions.value) { return }
  downloadingEftInstructions.value = true
  eftInstructionsError.value = null
  try {
    const blob = await payLink.downloadEftInstructions()
    fileDownload(blob, 'bcrs_eft_instructions.pdf')
  } catch (err: unknown) {
    const e = err as { data?: { message?: string } }
    eftInstructionsError.value = e?.data?.message || t('page.success.downloadFailed')
  } finally {
    downloadingEftInstructions.value = false
  }
}

const padEditInitial = computed(() => {
  const cfs = store.accountInfo?.cfsAccount
  if (!cfs) { return undefined }
  return {
    bankInstitutionNumber: cfs.bankInstitutionNumber ?? '',
    bankTransitNumber: cfs.bankTransitNumber ?? '',
    bankAccountNumber: cfs.bankAccountNumber ?? ''
  }
})

/** If the account's current payment method isn't ONLINE_BANKING, flip it
* via auth-api first, then re-read the account from pay-api scoped to ONLINE_BANKING so we get
* the newly-provisioned CFS account (cfsAccountNumber, party/site numbers,
* status) that the success page needs.
*/
async function ensureAccountIsOnlineBanking() {
  const accountId = store.selectedAccountId
  if (!accountId) { return }
  if (store.accountInfo?.paymentMethod === 'ONLINE_BANKING') { return }
  await updateOrgToOnlineBanking(accountId)
  const info = await getAccountPaymentInfo(accountId, 'ONLINE_BANKING')
  store.setAccountInfo(info)
}

watch(method, (m) => {
  store.setMethod(m)
})

// Invoice may carry an older PAD selection; fall back to CC when the account
// isn't PAD so the CTA stays actionable.
watch(() => pad.padNotSetUp.value, (notSetUp) => {
  if (notSetUp && method.value === 'PAD') { method.value = 'DIRECT_PAY' }
})

// Once account info loads and confirms the account is EFT-only, pin the
// selection to EFT regardless of what the invoice/store had initially.
watch(isEftOnly, (eft) => {
  if (eft) { method.value = 'EFT' }
}, { immediate: true })

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

// PAD status banner shows only during transient/blocking account states, and
// never while the inline edit form is open (the widget owns its own UX then).
const showPadStatusBanner = computed(() => {
  if (method.value !== 'PAD' || editingPad.value) { return false }
  const s = pad.padState.value
  return s === 'LOADING' || s === 'PENDING' || s === 'FROZEN'
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
    if (method.value === 'ONLINE_BANKING') { await ensureAccountIsOnlineBanking() }
    // Invoices are created with a default method (e.g. DIRECT_PAY) regardless of the
    // account's actual payment method, so EFT-bound accounts still need this PATCH to
    // switch the invoice onto EFT — pay-api allows it as long as the account itself is
    // EFT (see _ACCOUNT_BOUND_METHODS in sbc-pay's payment_service.py).
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
          <div v-if="isEftOnly" class="space-y-3">
            <CheckoutPaymentMethodCard
              v-model="method"
              value="EFT"
              icon="i-mdi-arrow-right-circle-outline"
              :title="$t('page.checkout.method.eft')"
              :subtitle="$t('page.checkout.method.eftSub')"
            >
              <template #extra>
                <div class="border-t border-slate-200 px-5 py-4 text-sm text-slate-700">
                  <i18n-t keypath="page.checkout.eft.instructionsPrefix" tag="span">
                    <template #link>
                      <a
                        href="#"
                        class="font-medium text-mark underline hover:text-[var(--color-mark-dark)]"
                        @click.prevent="downloadEftInstructions"
                      >{{ $t('page.checkout.eft.instructionsLink') }}</a>
                    </template>
                  </i18n-t>
                  <p v-if="eftInstructionsError" class="mt-2 text-red-700">
                    {{ eftInstructionsError }}
                  </p>
                </div>
              </template>
            </CheckoutPaymentMethodCard>

            <p class="text-sm text-slate-700">
              <i18n-t keypath="page.checkout.eft.onlyMethodNotice" tag="span">
                <template #link>
                  <a
                    v-if="pad.accountSettingsUrl.value"
                    :href="pad.accountSettingsUrl.value"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="font-medium text-mark underline hover:text-[var(--color-mark-dark)]"
                  >{{ $t('page.checkout.eft.productsAndPaymentLink') }}</a>
                  <span v-else class="font-medium">{{ $t('page.checkout.eft.productsAndPaymentLink') }}</span>
                </template>
              </i18n-t>
            </p>
          </div>

          <div v-else class="space-y-3">
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
          v-if="showPadStatusBanner"
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
