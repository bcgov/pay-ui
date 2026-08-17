<script setup lang="ts">
/**
 * Inline PAD banking-info widget. Two modes, controlled by the presence of
 * `initial`:
 *   - CREATE (no `initial`):  empty fields, first-time PAD setup.
 *   - EDIT   (`initial` set): prefills with existing bank info. Account number
 *     comes back masked from pay-api (e.g. "XXXXXX1234"); we mirror auth-web's
 *     PADInfoForm behaviour — the field tolerates X characters, but once the
 *     user edits any field the account value must be all digits to save
 *     (blocks "keep the masked prefix, edit the last 4" partial updates).
 *
 * Flow (both modes):
 *   1. Client-side validation.
 *   2. POST pay-api /bank-accounts/verifications — validates against bank.
 *   3. On valid → PUT auth-api /orgs/{orgId} with paymentInfo=PAD + bank details.
 *   4. Emits `saved` so the parent can refetch account info.
 *   5. In EDIT mode, also emits `cancel` when user backs out.
 */
import { useAccount } from '../composables/useAccount'
import type { PadBankInfo } from '../composables/useAccount'

const props = defineProps<{
  accountId: number
  initial?: {
    bankInstitutionNumber?: string
    bankTransitNumber?: string
    bankAccountNumber?: string
  }
}>()

const emit = defineEmits<{
  (e: 'saved' | 'cancel'): void
}>()

const { t } = useI18n()
const { verifyPadInfo, updateOrgPadInfo, getPadTermsOfUse } = useAccount()

const isEdit = computed(() => !!props.initial)

const institution = ref(props.initial?.bankInstitutionNumber ?? '')
const transit = ref(props.initial?.bankTransitNumber ?? '')
const account = ref(props.initial?.bankAccountNumber ?? '')
const tosAccepted = ref(false)

const submitting = ref(false)
const errorMessage = ref<string | null>(null)

// --- PAD terms & conditions dialog state ---
// Mirrors auth-web's TermsOfUseDialog: the checkbox can't be ticked until the
// user opens the terms dialog and clicks "Agree to terms" (which requires
// scrolling to the bottom). Once agreed, the checkbox is togglable freely.
const termsDialogOpen = ref(false)
const termsContent = ref<string | null>(null)
const termsLoading = ref(false)
const termsError = ref<string | null>(null)
const termsAgreed = ref(false)
const scrolledToBottom = ref(false)

async function openTermsDialog() {
  termsDialogOpen.value = true
  scrolledToBottom.value = false
  if (termsContent.value !== null) { return } // already fetched
  termsLoading.value = true
  termsError.value = null
  try {
    const doc = await getPadTermsOfUse()
    termsContent.value = doc?.content ?? ''
  } catch {
    termsError.value = t('padWidget.terms.loadFailed')
  } finally {
    termsLoading.value = false
  }
}

function onTermsScroll(e: Event) {
  const el = e.target as HTMLElement
  // 25px slack matches auth-web's TermsOfUseDialog.vue:156.
  scrolledToBottom.value = el.scrollHeight - el.scrollTop <= el.offsetHeight + 25
}

function agreeToTerms() {
  termsAgreed.value = true
  tosAccepted.value = true
  termsDialogOpen.value = false
}

function onTosToggle(nextChecked: boolean) {
  // Block direct check attempts until the terms dialog has been agreed to.
  // If a check is attempted, force uncheck and open the dialog instead.
  if (nextChecked && !termsAgreed.value) {
    tosAccepted.value = false
    void openTermsDialog()
    return
  }
  tosAccepted.value = nextChecked
}

// Track whether the user has touched any field. Once touched, editing the
// masked account number is only valid if all 'X's have been removed — mirrors
// auth-web's PADInfoForm.vue:240-243.
const touched = ref(false)
const markTouched = () => { touched.value = true }

const numericOnly = (v: string) => v.replace(/\D/g, '')
// The account input tolerates 'X' for the initial masked value.
const numericOrXOnly = (v: string) => v.replace(/[^0-9Xx]/g, '').toUpperCase()

watch(institution, (v, prev) => {
  const clean = numericOnly(v).slice(0, 3)
  if (clean !== prev) { markTouched() }
  institution.value = clean
})
watch(transit, (v, prev) => {
  const clean = numericOnly(v).slice(0, 5)
  if (clean !== prev) { markTouched() }
  transit.value = clean
})
watch(account, (v, prev) => {
  const clean = numericOrXOnly(v).slice(0, 12)
  if (clean !== prev) { markTouched() }
  account.value = clean
})

const institutionError = computed(() => {
  if (!institution.value) { return null }
  return institution.value.length === 3 ? null : t('padWidget.errors.institution')
})
const transitError = computed(() => {
  if (!transit.value) { return null }
  return transit.value.length >= 4 ? null : t('padWidget.errors.transit')
})
const accountError = computed(() => {
  if (!account.value) { return null }
  if (account.value.length < 7 || account.value.length > 12) { return t('padWidget.errors.account') }
  // Once the user has touched the form, any lingering X's from the mask are
  // no longer acceptable — force a full retype rather than a partial edit.
  if (touched.value && account.value.includes('X')) { return t('padWidget.errors.maskedDigits') }
  return null
})

const canSubmit = computed(() =>
  institution.value.length === 3
  && transit.value.length >= 4
  && account.value.length >= 7 && account.value.length <= 12
  && !account.value.includes('X')
  && tosAccepted.value
  && !submitting.value
)

async function submit() {
  if (!canSubmit.value) { return }
  submitting.value = true
  errorMessage.value = null
  const padInfo: PadBankInfo = {
    bankInstitutionNumber: institution.value,
    bankTransitNumber: transit.value,
    bankAccountNumber: account.value
  }
  try {
    const verified = await verifyPadInfo(padInfo)
    if (!verified.isValid) {
      const msg = Array.isArray(verified.message) ? verified.message.join(' ') : verified.message
      errorMessage.value = msg || t('padWidget.errors.verifyFailed')
      return
    }
    await updateOrgPadInfo(props.accountId, padInfo)
    emit('saved')
  } catch (err: unknown) {
    const e = err as { statusCode?: number, data?: { message?: string } }
    errorMessage.value = e?.data?.message || t('padWidget.errors.saveFailed')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="rounded-lg border border-slate-300 bg-white p-6">
    <h3 class="text-lg font-semibold text-slate-900">
      {{ isEdit ? $t('padWidget.editTitle') : $t('padWidget.title') }}
    </h3>
    <p class="mt-2 text-sm text-slate-600">
      {{ isEdit ? $t('padWidget.editSubtitle') : $t('padWidget.confirmationPeriodBody') }}
    </p>

    <form
      class="mt-5 space-y-4"
      novalidate
      @submit.prevent="submit"
    >
      <div class="grid gap-4 sm:grid-cols-2">
        <label class="block">
          <span class="mb-1 block text-sm font-medium text-slate-700">
            {{ $t('padWidget.transit') }}
          </span>
          <input
            v-model="transit"
            type="text"
            inputmode="numeric"
            maxlength="5"
            class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            :class="transitError ? 'border-red-400' : ''"
          >
          <span class="mt-1 block text-xs text-slate-500">{{ $t('padWidget.transitHint') }}</span>
          <span v-if="transitError" class="mt-1 block text-xs text-red-600">{{ transitError }}</span>
        </label>

        <label class="block">
          <span class="mb-1 block text-sm font-medium text-slate-700">
            {{ $t('padWidget.institution') }}
          </span>
          <input
            v-model="institution"
            type="text"
            inputmode="numeric"
            maxlength="3"
            class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            :class="institutionError ? 'border-red-400' : ''"
          >
          <span class="mt-1 block text-xs text-slate-500">{{ $t('padWidget.institutionHint') }}</span>
          <span v-if="institutionError" class="mt-1 block text-xs text-red-600">{{ institutionError }}</span>
        </label>
      </div>

      <label class="block">
        <span class="mb-1 block text-sm font-medium text-slate-700">
          {{ $t('padWidget.account') }}
        </span>
        <input
          v-model="account"
          type="text"
          inputmode="numeric"
          maxlength="12"
          class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          :class="accountError ? 'border-red-400' : ''"
        >
        <span class="mt-1 block text-xs text-slate-500">
          {{ isEdit ? $t('padWidget.accountEditHint') : $t('padWidget.accountHint') }}
        </span>
        <span v-if="accountError" class="mt-1 block text-xs text-red-600">{{ accountError }}</span>
      </label>

      <label class="flex items-start gap-2">
        <input
          :checked="tosAccepted"
          type="checkbox"
          class="mt-1 h-4 w-4 rounded border-slate-400"
          @change="onTosToggle(($event.target as HTMLInputElement).checked)"
        >
        <span class="text-sm text-slate-700">
          {{ $t('padWidget.tosPrefix') }}
          <button
            type="button"
            class="font-semibold text-[#212B47] underline hover:text-[#2d3a5f]"
            @click.prevent="openTermsDialog"
          >
            {{ $t('padWidget.tosLinkLabel') }}
          </button>
          {{ $t('padWidget.tosSuffix') }}
        </span>
      </label>

      <UModal
        v-model:open="termsDialogOpen"
        :ui="{ content: 'max-w-3xl' }"
        :dismissible="false"
      >
        <template #header>
          <h2 class="text-lg font-semibold text-slate-900">
            {{ $t('padWidget.terms.heading') }}
          </h2>
        </template>
        <template #body>
          <div v-if="termsLoading" class="p-4 text-sm text-slate-500">
            {{ $t('padWidget.terms.loading') }}
          </div>
          <div v-else-if="termsError" class="p-4 text-sm text-red-700">
            {{ termsError }}
          </div>
          <div
            v-else
            class="max-h-[60vh] overflow-y-auto rounded border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800"
            @scroll="onTermsScroll"
            v-html="termsContent"
          />
          <p v-if="!termsLoading && !termsError && !scrolledToBottom" class="mt-2 text-xs italic text-slate-500">
            {{ $t('padWidget.terms.scrollHint') }}
          </p>
        </template>
        <template #footer>
          <div class="flex w-full items-center justify-end gap-2">
            <button
              type="button"
              class="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              @click="termsDialogOpen = false"
            >
              {{ $t('padWidget.cancel') }}
            </button>
            <button
              type="button"
              class="rounded-md bg-[#212B47] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2d3a5f] disabled:opacity-60"
              :disabled="!scrolledToBottom || termsLoading || !!termsError"
              @click="agreeToTerms"
            >
              {{ $t('padWidget.terms.agreeButton') }}
            </button>
          </div>
        </template>
      </UModal>

      <div v-if="errorMessage" class="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
        {{ errorMessage }}
      </div>

      <div class="flex items-center gap-3">
        <button
          type="submit"
          class="rounded-md bg-[#212B47] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2d3a5f] disabled:opacity-60"
          :disabled="!canSubmit"
        >
          {{ submitting ? $t('padWidget.submitting') : (isEdit ? $t('padWidget.updateSubmit') : $t('padWidget.submit')) }}
        </button>
        <button
          v-if="isEdit"
          type="button"
          class="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          :disabled="submitting"
          @click="emit('cancel')"
        >
          {{ $t('padWidget.cancel') }}
        </button>
      </div>
    </form>
  </div>
</template>
