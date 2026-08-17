<script setup lang="ts">
/**
 * Screen 2 — Complete Your Payment (matches design mockup).
 *
 * Left column: payment method radios (CC / PAD / OB) + PAD setup widget when needed.
 * Right sidebar: navy-headed invoice summary, ORDER ID, line items,
 * totals, and a single CTA whose label changes per method.
 * PAD / OB show instruction blocks under the summary.
 */
import PadInfoWidget from '../../../components/PadInfoWidget.vue'
import { useAccount } from '../../../composables/useAccount'
import type { AccountPaymentInfo, CfsAccountStatus } from '../../../stores/paymentLink'

type Method = 'DIRECT_PAY' | 'PAD' | 'ONLINE_BANKING'
type PadState = 'READY' | 'PENDING' | 'FROZEN' | 'NOT_SETUP' | 'LOADING'

const { t } = useI18n()
const localePath = useLocalePath()
const store = usePaymentLinkStore()
const payLink = usePayLink()
const { getAccountPaymentInfo, getOrgAuthorizations } = useAccount()
const config = useRuntimeConfig().public

definePageMeta({
  layout: 'connect-auth',
  middleware: ['connect-auth']
})

useHead({
  title: t('page.checkout.title')
})

const method = ref<Method>(
  (store.paymentMethod as Method) || (store.invoice?.payment_method as Method) || 'DIRECT_PAY'
)
watch(method, (m) => {
  store.setMethod(m)
  // OB requires an OB CFS account. Switch method eagerly so pay-api lazy-creates the OB
  // reference and populates cfsAccountNumber — otherwise the payment identifier is blank.
  if (m === 'ONLINE_BANKING' && store.invoice?.payment_method !== 'ONLINE_BANKING') {
    void switchAndRefreshAccount('ONLINE_BANKING')
  }
})

const isSubmitting = ref(false)
const submitError = ref<string | null>(null)
const accountLoading = ref(false)

// When the user opens "Update banking information" from the READY banner,
// swap the banner out for PadInfoWidget in edit mode.
const editingPad = ref(false)

// Prefill for the widget's edit mode. Sourced from pay-api's account payload —
// bankAccountNumber comes back masked (e.g. XXXXXX1234).
const padEditInitial = computed(() => {
  const cfs = store.accountInfo?.cfsAccount
  if (!cfs) { return undefined }
  return {
    bankInstitutionNumber: cfs.bankInstitutionNumber ?? '',
    bankTransitNumber: cfs.bankTransitNumber ?? '',
    bankAccountNumber: cfs.bankAccountNumber ?? ''
  }
})

const hasPadBankDetails = computed(() => {
  const cfs = store.accountInfo?.cfsAccount
  return !!(cfs?.bankAccountNumber || cfs?.bankTransitNumber || cfs?.bankInstitutionNumber)
})

// Caller's permission actions on the selected account. auth-api's
// /orgs/{id}/authorizations returns permission actions (e.g. 'change_pad_info',
// 'invite_members') under `roles` — NOT membership types. Actions come back
// lowercase from this endpoint (the /permissions/{status}/{role}?case=upper
// endpoint sbc-auth uses is a different call), so compare case-insensitively.
// Presence of `change_pad_info` is the same gate sbc-auth's v-can:CHANGE_PAD_INFO
// directive enforces — admin/coordinator get it, plain users don't.
const userPermissions = ref<string[]>([])
const canEditPadInfo = computed(() =>
  userPermissions.value.some(p => p.toLowerCase() === 'change_pad_info')
)

async function loadAccount() {
  if (!store.selectedAccountId) { return }
  accountLoading.value = true
  try {
    const info = await getAccountPaymentInfo(store.selectedAccountId)
    store.setAccountInfo(info as AccountPaymentInfo)
  } catch {
    // Non-fatal — the UI falls back to placeholder state. Errors surface at submit-time.
  } finally {
    accountLoading.value = false
  }
}

async function loadUserPermissions() {
  if (!store.selectedAccountId) { return }
  try {
    const auth = await getOrgAuthorizations(store.selectedAccountId)
    userPermissions.value = auth?.roles ?? []
  } catch {
    // On failure, treat as no elevated permissions — widget will fall back to
    // the "contact your admin" banner rather than granting unauthorized access.
    userPermissions.value = []
  }
}

async function switchAndRefreshAccount(target: Method) {
  if (!store.invoice) { return }
  try {
    const updated = await payLink.changePaymentMethod(store.invoice.id, target)
    store.setInvoice(updated)
    await loadAccount()
  } catch (err: unknown) {
    const e = err as { data?: { message?: string } }
    submitError.value = e?.data?.message || t('page.checkout.errors.methodSwitchFailed')
  }
}

onMounted(async () => {
  if (!store.invoice) {
    if (store.token) { navigateTo(localePath(`/pay/${store.token}/account`)) }
    return
  }
  await Promise.all([loadAccount(), loadUserPermissions()])
})

/** Derives which PAD sub-UI to render from account state. */
const padState = computed<PadState>(() => {
  if (accountLoading.value) { return 'LOADING' }
  const info = store.accountInfo
  if (!info) { return 'NOT_SETUP' }
  const isPad = info.paymentMethod === 'PAD' || info.cfsAccount?.paymentMethod === 'PAD'
  if (!isPad) { return 'NOT_SETUP' }
  const status: CfsAccountStatus | undefined = info.cfsAccount?.status
  if (status === 'FREEZE') { return 'FROZEN' }
  if (status === 'PENDING' || status === 'PENDING_PAD_ACTIVATION') { return 'PENDING' }
  return 'READY'
})

const canSubmit = computed(() => {
  if (!store.invoice || isSubmitting.value) { return false }
  if (method.value === 'PAD') {
    // Block submit when PAD isn't set up AND the caller can't set it up themselves —
    // otherwise they'd see an error at submit time with no path forward.
    if (padState.value === 'NOT_SETUP' && !canEditPadInfo.value) { return false }
    return padState.value === 'READY' || padState.value === 'PENDING'
  }
  return true
})

const ctaLabel = computed(() => {
  switch (method.value) {
    case 'DIRECT_PAY': return t('page.checkout.submit.cc')
    case 'PAD': return t('page.checkout.submit.pad')
    case 'ONLINE_BANKING': return t('page.checkout.submit.ob')
    default: return t('page.checkout.submit.cc')
  }
})

const subtotal = computed(() => {
  const items = store.invoice?.line_items || []
  if (items.length > 0) {
    return items.reduce((sum, l) => sum
      + (Number(l.filing_fees) || 0)
      + (Number(l.priority_fees) || 0)
      + (Number(l.future_effective_fees) || 0)
      + (Number(l.service_fees) || 0)
      - (Number(l.waived_fees) || 0), 0)
  }
  const total = Number(store.invoice?.total ?? 0)
  const gst = Number(store.invoice?.gst ?? 0)
  const pst = (store.invoice?.line_items || []).reduce((s, l) => s + (Number(l.pst) || 0), 0)
  return total - gst - pst
})

const pstTotal = computed(() => {
  const items = store.invoice?.line_items || []
  return items.reduce((s, l) => s + (Number(l.pst) || 0), 0)
})

/** OB payee identifier — the CFS account number (matches auth-web's Pay with Online Banking). */
const obPayeeReference = computed(() => store.accountInfo?.cfsAccount?.cfsAccountNumber ?? '')
const obPayeeName = 'BC Registries'

async function onPadSaved() {
  // Widget saved bank info; re-derive PAD state from the fresh account payload.
  editingPad.value = false
  await loadAccount()
}

async function submit() {
  if (!store.invoice || !canSubmit.value) { return }
  isSubmitting.value = true
  submitError.value = null
  try {
    const invoiceId = store.invoice.id
    if (method.value !== store.invoice.payment_method) {
      const updated = await payLink.changePaymentMethod(invoiceId, method.value)
      store.setInvoice(updated)
    }

    if (method.value === 'DIRECT_PAY') {
      const baseUrl = String(config.baseUrl).replace(/\/$/, '')
      const payReturnUrl = `${baseUrl}/pay/return`
      const clientSystemUrl = `${baseUrl}/pay/${store.token}/success`
      const txn = await payLink.createTransaction(invoiceId, { clientSystemUrl, payReturnUrl })
      if (txn?.paySystemUrl) {
        window.location.assign(txn.paySystemUrl)
        return
      }
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
    <!-- Breadcrumb -->
    <nav class="mb-4 text-sm text-slate-500">
      <span class="text-slate-400">Dashboard</span>
      <span class="mx-2">›</span>
      <span class="text-slate-400">Payment</span>
      <span class="mx-2">›</span>
      <span class="font-medium text-slate-900">Payment Checkout</span>
    </nav>

    <h1 class="mb-8 text-3xl font-semibold text-slate-900">
      {{ $t('page.checkout.h1') }}
    </h1>

    <div v-if="submitError" class="mb-6 rounded border border-red-300 bg-red-50 p-4 text-red-800">
      {{ submitError }}
    </div>

    <div class="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <!-- Payment method selector -->
      <div class="min-w-0 space-y-6">
        <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 class="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
            <span aria-hidden="true">💳</span> Select Payment Method
          </h2>
          <div class="space-y-3">
            <label
              class="flex cursor-pointer items-center justify-between rounded-lg border-2 px-4 py-4 transition"
              :class="method === 'DIRECT_PAY' ? 'border-[#212B47] bg-blue-50' : 'border-slate-200 hover:border-slate-300'"
            >
              <div class="flex items-center gap-3">
                <input
                  v-model="method"
                  type="radio"
                  name="pm"
                  value="DIRECT_PAY"
                  class="h-4 w-4 text-[#212B47]"
                >
                <div>
                  <p class="font-semibold text-slate-900">{{ $t('page.checkout.method.cc') }}</p>
                  <p class="text-sm text-slate-500">{{ $t('page.checkout.method.ccSub') }}</p>
                </div>
              </div>
              <span aria-hidden="true" class="text-2xl text-slate-400">💳</span>
            </label>

            <label
              class="flex cursor-pointer items-center justify-between rounded-lg border-2 px-4 py-4 transition"
              :class="method === 'PAD' ? 'border-[#212B47] bg-blue-50' : 'border-slate-200 hover:border-slate-300'"
            >
              <div class="flex items-center gap-3">
                <input
                  v-model="method"
                  type="radio"
                  name="pm"
                  value="PAD"
                  class="h-4 w-4 text-[#212B47]"
                >
                <div>
                  <p class="font-semibold text-slate-900">{{ $t('page.checkout.method.pad') }}</p>
                  <p class="text-sm text-slate-500">{{ $t('page.checkout.method.padSub') }}</p>
                </div>
              </div>
              <span aria-hidden="true" class="text-2xl text-slate-400">🏦</span>
            </label>

            <label
              class="flex cursor-pointer items-center justify-between rounded-lg border-2 px-4 py-4 transition"
              :class="method === 'ONLINE_BANKING' ? 'border-[#212B47] bg-blue-50' : 'border-slate-200 hover:border-slate-300'"
            >
              <div class="flex items-center gap-3">
                <input
                  v-model="method"
                  type="radio"
                  name="pm"
                  value="ONLINE_BANKING"
                  class="h-4 w-4 text-[#212B47]"
                >
                <div>
                  <p class="font-semibold text-slate-900">{{ $t('page.checkout.method.ob') }}</p>
                  <p class="text-sm text-slate-500">{{ $t('page.checkout.method.obSub') }}</p>
                </div>
              </div>
              <span aria-hidden="true" class="text-2xl text-slate-400">💵</span>
            </label>
          </div>
        </div>

        <!-- PAD sub-state: activation / frozen banner OR inline setup widget -->
        <template v-if="method === 'PAD'">
          <!-- Widget in edit mode takes over the entire slot regardless of banner state. -->
          <PadInfoWidget
            v-if="editingPad && store.selectedAccountId"
            :account-id="store.selectedAccountId"
            :initial="padEditInitial"
            @saved="onPadSaved"
            @cancel="editingPad = false"
          />
          <div
            v-else-if="padState === 'LOADING'"
            class="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500"
          >
            {{ $t('page.checkout.pad.loading') }}
          </div>
          <div
            v-else-if="padState === 'PENDING'"
            class="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"
          >
            <p class="font-semibold">
              {{ $t('page.checkout.pad.pendingTitle') }}
            </p>
            <p class="mt-1">
              {{ $t('page.checkout.pad.pendingBody') }}
            </p>
            <!-- Bank details are read-only during PENDING: pay-api rejects
                 PUT /orgs/{id} paymentInfo with CFS_ACCOUNT_SETUP_IN_PROGRESS
                 until the CFS side finishes provisioning. -->
            <dl v-if="hasPadBankDetails" class="mt-3 grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-xs">
              <dt class="font-medium">
                {{ $t('padWidget.transit') }}
              </dt>
              <dd>{{ store.accountInfo?.cfsAccount?.bankTransitNumber }}</dd>
              <dt class="font-medium">
                {{ $t('padWidget.institution') }}
              </dt>
              <dd>{{ store.accountInfo?.cfsAccount?.bankInstitutionNumber }}</dd>
              <dt class="font-medium">
                {{ $t('padWidget.account') }}
              </dt>
              <dd>{{ store.accountInfo?.cfsAccount?.bankAccountNumber }}</dd>
            </dl>
            <p class="mt-2 text-xs italic">
              {{ $t('page.checkout.pad.pendingEditLocked') }}
            </p>
          </div>
          <div
            v-else-if="padState === 'READY'"
            class="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700"
          >
            <p class="font-semibold text-slate-900">
              {{ $t('page.checkout.pad.readyTitle') }}
            </p>
            <dl v-if="hasPadBankDetails" class="mt-3 grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-xs">
              <dt class="font-medium">
                {{ $t('padWidget.transit') }}
              </dt>
              <dd>{{ store.accountInfo?.cfsAccount?.bankTransitNumber }}</dd>
              <dt class="font-medium">
                {{ $t('padWidget.institution') }}
              </dt>
              <dd>{{ store.accountInfo?.cfsAccount?.bankInstitutionNumber }}</dd>
              <dt class="font-medium">
                {{ $t('padWidget.account') }}
              </dt>
              <dd>{{ store.accountInfo?.cfsAccount?.bankAccountNumber }}</dd>
            </dl>
            <button
              v-if="canEditPadInfo"
              type="button"
              class="mt-3 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              @click="editingPad = true"
            >
              {{ $t('page.checkout.pad.editButton') }}
            </button>
          </div>
          <div
            v-else-if="padState === 'FROZEN'"
            class="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800"
          >
            <p class="font-semibold">
              {{ $t('page.checkout.pad.frozenTitle') }}
            </p>
            <p class="mt-1">
              {{ $t('page.checkout.pad.frozenBody') }}
            </p>
          </div>
          <template v-else-if="padState === 'NOT_SETUP' && store.selectedAccountId">
            <PadInfoWidget
              v-if="canEditPadInfo"
              :account-id="store.selectedAccountId"
              @saved="onPadSaved"
            />
            <div
              v-else
              class="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"
            >
              <p class="font-semibold">
                {{ $t('page.checkout.pad.notAuthorizedTitle') }}
              </p>
              <p class="mt-1">
                {{ $t('page.checkout.pad.notAuthorizedBody') }}
              </p>
            </div>
          </template>
        </template>
      </div>

      <!-- Invoice summary sidebar -->
      <aside class="min-w-0">
        <div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <header class="bg-[#212B47] px-6 py-5">
            <h2 class="text-lg font-semibold !text-white">
              {{ $t('page.checkout.summary') }}
            </h2>
            <p class="mt-1 text-xs uppercase text-slate-300">
              Order ID: #{{ store.invoice?.id }}
            </p>
          </header>

          <div class="space-y-3 p-6">
            <template v-for="(line, i) in store.invoice?.line_items || []" :key="i">
              <div>
                <div class="flex justify-between text-sm">
                  <span class="font-medium text-slate-900">{{ line.description }}</span>
                  <span class="font-semibold text-slate-900">
                    ${{ Number(
                      line.total
                        ?? ((line.filing_fees ?? 0) + (line.service_fees ?? 0))
                    ).toFixed(2) }}
                  </span>
                </div>
              </div>
            </template>

            <hr class="border-slate-200">

            <div class="flex justify-between text-sm text-slate-600">
              <span>{{ $t('page.checkout.subtotal') }}</span>
              <span>${{ subtotal.toFixed(2) }}</span>
            </div>
            <div v-if="store.invoice?.gst" class="flex justify-between text-sm text-slate-600">
              <span>GST</span>
              <span>${{ Number(store.invoice.gst).toFixed(2) }}</span>
            </div>
            <div v-if="pstTotal > 0" class="flex justify-between text-sm text-slate-600">
              <span>PST</span>
              <span>${{ pstTotal.toFixed(2) }}</span>
            </div>

            <hr class="border-slate-200">

            <div class="flex items-baseline justify-between gap-6 pt-2 text-lg font-semibold text-slate-900">
              <span>{{ $t('page.checkout.total') }}</span>
              <span class="whitespace-nowrap">${{ Number(store.invoice?.total ?? 0).toFixed(2) }}</span>
            </div>

            <!-- Method-specific instructions -->
            <div
              v-if="method !== 'DIRECT_PAY'"
              class="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-slate-800"
            >
              <template v-if="method === 'PAD'">
                <p class="font-semibold">
                  {{ $t('page.checkout.instructions.pad.title') }}
                </p>
                <p class="mt-2 text-slate-600">
                  {{ $t('page.checkout.instructions.pad.body') }}
                </p>
              </template>
              <template v-else-if="method === 'ONLINE_BANKING'">
                <p class="font-semibold">
                  {{ $t('page.checkout.instructions.ob.title') }}
                </p>
                <div class="mt-2 space-y-1 text-slate-700">
                  <p>
                    <strong>{{ $t('page.checkout.instructions.ob.payeeNameLabel') }}:</strong>
                    <span class="ml-1">{{ obPayeeName }}</span>
                  </p>
                  <p>
                    <strong>{{ $t('page.checkout.instructions.ob.identifierLabel') }}:</strong>
                    <span v-if="obPayeeReference" class="ml-1">{{ obPayeeReference }}</span>
                    <span v-else class="ml-1 italic text-slate-500">{{ $t('page.checkout.instructions.ob.identifierPending') }}</span>
                  </p>
                </div>
                <ol class="mt-3 list-decimal space-y-1 pl-5 text-slate-600">
                  <li>{{ $t('page.checkout.instructions.ob.step1') }}</li>
                  <li>
                    {{ $t('page.checkout.instructions.ob.step2') }}
                    <strong class="ml-1">{{ obPayeeName }}</strong>
                  </li>
                  <li>
                    {{ $t('page.checkout.instructions.ob.step3') }}
                    <strong v-if="obPayeeReference" class="ml-1">{{ obPayeeReference }}</strong>
                  </li>
                  <li>{{ $t('page.checkout.instructions.ob.step4') }}</li>
                </ol>
              </template>
            </div>

            <button
              type="button"
              class="mt-6 flex w-full items-center justify-center gap-2 rounded-md bg-[#212B47] py-3 font-semibold text-white transition hover:bg-[#2d3a5f] disabled:opacity-60"
              :disabled="!canSubmit"
              @click="submit"
            >
              <span aria-hidden="true">🛡️</span>
              {{ isSubmitting ? 'Processing...' : ctaLabel }}
            </button>

            <!-- TODO: replace with an actual security-badge / cert-info source when available. -->
            <p class="mt-2 flex items-center justify-center gap-1 text-xs text-slate-400">
              <span aria-hidden="true">🔒</span> Secure payment
            </p>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<style>
/**
 * Reserve scrollbar space at the viewport level so switching payment methods
 * (which grows/shrinks the sidebar depending on the instructions block)
 * doesn't flip the vertical scrollbar on/off and jump the viewport width by
 * ~15px on every radio change. Applied on both html and body because the
 * base layer may set overflow on either.
 */
html,
body {
  scrollbar-gutter: stable;
  overflow-y: scroll;
}
</style>
