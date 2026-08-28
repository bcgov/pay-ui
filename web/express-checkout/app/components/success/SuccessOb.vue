<script setup lang="ts">
/**
 * "Payment Pending" screen for Online Banking — awaiting bill payment.
 *
 * Owns its own "Pay by credit card" escape hatch — hands off through the
 * shared useCcHandoff composable so the CC flow matches checkout's submit.
 */
const props = defineProps<{
  invoiceId?: number
  amountFormatted: string
  balanceDueFormatted: string
  payeeReference?: string
}>()

const { t } = useI18n()
const localePath = useLocalePath()
const store = usePaymentLinkStore()
const { handoff } = useCcHandoff()

const payeeName = 'BC Registries'

const downloadUrl = computed(() =>
  props.invoiceId ? `/api/v1/payment-requests/${props.invoiceId}/reports` : ''
)

const switching = ref(false)
const switchError = ref<string | null>(null)

async function payByCreditCard() {
  if (!props.invoiceId || switching.value) { return }
  switching.value = true
  switchError.value = null
  try {
    const handedOff = await handoff(props.invoiceId)
    if (!handedOff) {
      await navigateTo(localePath(`/pay/${store.token}/success`))
    }
  } catch (err: unknown) {
    const e = err as { data?: { message?: string } }
    switchError.value = e?.data?.message || t('page.checkout.errors.submitFailed')
  } finally {
    switching.value = false
  }
}
</script>

<template>
  <div>
    <div class="mb-8 text-center">
      <UIcon name="i-mdi-clock-outline" class="mx-auto size-14 text-[#1A5A96]" />
      <h1 class="mt-4 text-3xl font-bold text-slate-900">
        {{ $t('page.success.ob.title') }}
      </h1>
    </div>

    <section class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div class="bg-[#1A5A96] px-8 py-6 !text-white">
        <p class="text-xl font-bold">
          {{ $t('page.success.ob.transactionAmount') }}: {{ amountFormatted }}
        </p>
        <p class="mt-1 text-xl font-bold">
          {{ $t('page.success.ob.balanceDue') }}: {{ balanceDueFormatted }}
        </p>
        <i18n-t
          keypath="page.success.ob.description"
          tag="p"
          class="mt-4 text-sm leading-relaxed"
        >
          <template #days>
            <strong>{{ $t('page.success.ob.daysRange') }}</strong>
          </template>
        </i18n-t>
        <p class="mt-4 text-sm">
          <strong>{{ $t('page.success.ob.payeeNameLabel') }}:</strong>
          <span class="ml-1">{{ payeeName }}</span>
          <span class="mx-3 opacity-60">|</span>
          <strong>{{ $t('page.success.ob.identifierLabel') }}:</strong>
          <span v-if="payeeReference" class="ml-1">{{ payeeReference }}</span>
          <span v-else class="ml-1 italic opacity-90">{{ $t('page.success.ob.identifierPending') }}</span>
        </p>
      </div>

      <div class="px-8 py-8">
        <h2 class="text-base font-semibold text-slate-900">
          {{ $t('page.success.ob.howToPayTitle') }}
        </h2>
        <ol class="mt-4 list-decimal space-y-2 pl-6 text-sm text-slate-700">
          <li>{{ $t('page.success.ob.steps.step1') }}</li>
          <li>{{ $t('page.success.ob.steps.step2') }}</li>
          <i18n-t keypath="page.success.ob.steps.step3" tag="li">
            <template #payee>
              <strong>"{{ payeeName }}"</strong>
            </template>
          </i18n-t>
          <i18n-t keypath="page.success.ob.steps.step4" tag="li">
            <template #identifier>
              <strong v-if="payeeReference">{{ payeeReference }}</strong>
              <strong v-else class="italic">{{ $t('page.success.ob.identifierPending') }}</strong>
            </template>
          </i18n-t>
          <li>{{ $t('page.success.ob.steps.step5') }}</li>
        </ol>

        <div class="mt-6">
          <a
            v-if="downloadUrl"
            :href="downloadUrl"
            class="inline-flex items-center gap-2 rounded-md border border-[#1A5A96] px-4 py-2 text-sm font-medium text-[#1A5A96] hover:bg-blue-50"
          >
            <UIcon name="i-mdi-download" class="size-4" />
            {{ $t('page.success.ob.downloadInvoice') }}
          </a>
        </div>

        <hr class="my-8 border-slate-200">

        <h3 class="text-base font-semibold text-slate-900">
          {{ $t('page.success.ob.completeNow') }}
        </h3>
        <div class="mt-4">
          <button
            type="button"
            :disabled="switching"
            class="inline-flex items-center gap-2 rounded-md border border-[#1A5A96] px-4 py-2 text-sm font-medium text-[#1A5A96] transition hover:bg-blue-50 disabled:opacity-60"
            @click="payByCreditCard"
          >
            <UIcon name="i-mdi-credit-card-outline" class="size-4" />
            {{ switching ? $t('page.success.ob.switching') : $t('page.success.ob.payByCC') }}
          </button>
          <p v-if="switchError" class="mt-2 text-sm text-red-700">
            {{ switchError }}
          </p>
        </div>
      </div>
    </section>
  </div>
</template>
