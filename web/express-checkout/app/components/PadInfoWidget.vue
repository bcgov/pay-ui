<script setup lang="ts">
/**
 * Inline PAD setup widget. Rendered on the checkout page when the user picks PAD
 * but their account isn't PAD-configured yet.
 *
 * Flow:
 *   1. User enters bank institution / transit / account numbers + accepts TOS.
 *   2. Client-side validation.
 *   3. POST pay-api /bank-accounts/verifications — validates against bank.
 *   4. On valid → PUT auth-api /orgs/{orgId} with paymentInfo=PAD + bank details.
 *   5. Emits `saved` so the parent can refetch account info and switch the UI state
 *      from "widget" to "PAD activating" banner.
 *
 * Field rules mirror auth-web's PADInfoForm.vue:
 *   - Institution: exactly 3 digits
 *   - Transit: minimum 4 digits
 *   - Account: 7–12 digits
 */
import { useAccount, type PadBankInfo } from '../composables/useAccount'

const props = defineProps<{
  accountId: number
}>()

const emit = defineEmits<{
  (e: 'saved'): void
}>()

const { t } = useI18n()
const { verifyPadInfo, updateOrgPadInfo } = useAccount()

const institution = ref('')
const transit = ref('')
const account = ref('')
const tosAccepted = ref(false)

const submitting = ref(false)
const errorMessage = ref<string | null>(null)

const numericOnly = (v: string) => v.replace(/\D/g, '')

watch(institution, (v) => { institution.value = numericOnly(v).slice(0, 3) })
watch(transit,     (v) => { transit.value     = numericOnly(v).slice(0, 5) })
watch(account,     (v) => { account.value     = numericOnly(v).slice(0, 12) })

const institutionError = computed(() => {
  if (!institution.value) return null
  return institution.value.length === 3 ? null : t('padWidget.errors.institution')
})
const transitError = computed(() => {
  if (!transit.value) return null
  return transit.value.length >= 4 ? null : t('padWidget.errors.transit')
})
const accountError = computed(() => {
  if (!account.value) return null
  return (account.value.length >= 7 && account.value.length <= 12) ? null : t('padWidget.errors.account')
})

const canSubmit = computed(() =>
  institution.value.length === 3 &&
  transit.value.length >= 4 &&
  account.value.length >= 7 && account.value.length <= 12 &&
  tosAccepted.value &&
  !submitting.value
)

async function submit() {
  if (!canSubmit.value) return
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
      {{ $t('padWidget.title') }}
    </h3>
    <p class="mt-2 text-sm text-slate-600">
      {{ $t('padWidget.confirmationPeriodBody') }}
    </p>

    <form class="mt-5 space-y-4" novalidate @submit.prevent="submit">
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
        <span class="mt-1 block text-xs text-slate-500">{{ $t('padWidget.accountHint') }}</span>
        <span v-if="accountError" class="mt-1 block text-xs text-red-600">{{ accountError }}</span>
      </label>

      <label class="flex items-start gap-2">
        <input
          v-model="tosAccepted"
          type="checkbox"
          class="mt-1 h-4 w-4 rounded border-slate-400"
        >
        <span class="text-sm text-slate-700">{{ $t('padWidget.tos') }}</span>
      </label>

      <div v-if="errorMessage" class="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
        {{ errorMessage }}
      </div>

      <button
        type="submit"
        class="rounded-md bg-[#212B47] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2d3a5f] disabled:opacity-60"
        :disabled="!canSubmit"
      >
        {{ submitting ? $t('padWidget.submitting') : $t('padWidget.submit') }}
      </button>
    </form>
  </div>
</template>
