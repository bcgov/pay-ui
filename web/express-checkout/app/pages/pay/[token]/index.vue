<script setup lang="ts">
/**
 * Landing route for a payment link. Serves both audiences.
 *
 * Signed in — unchanged, redirect straight on:
 *   - store already holds a paid invoice for THIS token → success
 *   - holds an unpaid one → checkout (re-visit; redemption is idempotent server-side)
 *   - otherwise → account picker
 *
 * Not signed in — render the choice instead of bouncing to login: pay by card as a
 * guest, or sign in for the other payment methods. The guest path never redeems the
 * link, so the invoice stays on the partner's service account until PayBC settles it.
 */
// Same illustration the layer's own login page uses — shipped by @sbc-connect/nuxt-auth,
// so there's nothing to vendor into this repo.
import loginImage from '#auth/public/img/BCReg_Generic_Login_image.jpg'

const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const store = usePaymentLinkStore()
const { handoffByToken } = useCcHandoff()
const { isAuthenticated, login } = useConnectAuth()

// hideBreadcrumbs: this is where a payer arrives from an emailed link — there's no
// in-app history to go back to
definePageMeta({
  layout: 'connect-auth',
  hideBreadcrumbs: true,
  middleware: ['connect-auth-optional']
})

useHead({
  title: t('page.landing.title')
})

const token = computed(() => route.params.token as string)
const isSubmitting = ref(false)
const submitError = ref<string | null>(null)

onMounted(async () => {
  // Anonymous visitors stay here and pick a path; only signed-in users get routed on.
  if (!token.value || !isAuthenticated.value) { return }

  const hasInvoiceForThisToken = store.token === token.value && !!store.invoice
  const isPaid = (store.invoice?.paid ?? 0) >= (store.invoice?.total ?? -1) && (store.invoice?.total ?? 0) > 0

  if (hasInvoiceForThisToken && isPaid) {
    await navigateTo(localePath(`/pay/${token.value}/success`))
    return
  }
  if (hasInvoiceForThisToken) {
    await navigateTo(localePath(`/pay/${token.value}/checkout`))
    return
  }
  await navigateTo(localePath(`/pay/${token.value}/account`))
})

async function payAsGuest() {
  if (!token.value || isSubmitting.value) { return }
  isSubmitting.value = true
  submitError.value = null
  try {
    if (!await handoffByToken(token.value)) {
      submitError.value = t('page.landing.guest.errors.payFailed')
    }
  } catch (err: unknown) {
    const e = err as { data?: { message?: string } }
    submitError.value = e?.data?.message || t('page.landing.guest.errors.payFailed')
  } finally {
    isSubmitting.value = false
  }
}

/**
 * Straight to the chosen IdP rather than via the layer's own login page — the payer has
 * already made that choice here, so bouncing them through a second identical picker
 * would be a wasted step. `login()` is the same call that page makes.
 *
 * The capture-token middleware has already put the token in the store, so the flow
 * resumes at this route once Keycloak returns.
 */
async function signInWith(idp: ConnectIdpHint) {
  await login(idp)
}
</script>

<template>
  <section class="mx-auto max-w-2xl px-6 py-16 text-center">
    <!-- Signed-in users are redirected by onMounted; this is the anonymous view. -->
    <template v-if="isAuthenticated">
      <h1 class="text-xl font-semibold">
        {{ $t('page.landing.h1') }}
      </h1>
    </template>

    <template v-else>
      <UAlert
        v-if="submitError"
        class="mb-6 text-left"
        color="error"
        variant="subtle"
        :description="submitError"
      />

      <!-- Guest checkout -->
      <h1 class="text-2xl font-bold text-[var(--color-navy)]">
        {{ $t('page.landing.guest.title') }}
      </h1>
      <p class="mt-3 text-slate-700">
        {{ $t('page.landing.guest.body') }}
      </p>
      <!-- Narrower than the divider below it, per the design. -->
      <UButton
        class="mx-auto mt-6 max-w-sm"
        block
        size="lg"
        color="primary"
        icon="i-mdi-credit-card-outline"
        :label="isSubmitting ? $t('page.landing.guest.processing') : $t('page.landing.guest.pay')"
        :disabled="isSubmitting"
        :loading="isSubmitting"
        @click="payAsGuest"
      />

      <!-- OR divider — the one element that spans the full container. -->
      <div class="my-10 flex items-center gap-4">
        <span class="h-px flex-1 bg-slate-300" />
        <span class="text-sm text-slate-500">{{ $t('page.landing.or') }}</span>
        <span class="h-px flex-1 bg-slate-300" />
      </div>

      <!-- Authenticated options, inset from the divider. -->
      <div class="mx-auto max-w-md">
        <h2 class="text-2xl font-bold text-[var(--color-navy)]">
          {{ $t('page.landing.signIn.title') }}
        </h2>
        <div class="mt-3 text-left text-slate-700">
          <p>{{ $t('page.landing.signIn.body') }}</p>
          <ul class="mt-1 list-disc pl-6">
            <li>{{ $t('page.landing.signIn.benefitMethods') }}</li>
            <li>{{ $t('page.landing.signIn.benefitHistory') }}</li>
          </ul>
          <p class="mt-4">
            {{ $t('page.landing.signIn.noAccount') }}
          </p>
        </div>

        <div class="mt-6 rounded-lg border border-slate-200 bg-white p-6">
          <img
            :src="loginImage"
            alt=""
            class="mb-6 w-full rounded"
          >
          <UButton
            block
            size="lg"
            color="primary"
            icon="i-mdi-account-card-details-outline"
            :label="$t('page.landing.signIn.bcsc')"
            :disabled="isSubmitting"
            @click="signInWith(ConnectIdpHint.BCSC)"
          />
          <UButton
            class="mt-3"
            block
            size="lg"
            variant="outline"
            icon="i-mdi-two-factor-authentication"
            :label="$t('page.landing.signIn.bceid')"
            :disabled="isSubmitting"
            @click="signInWith(ConnectIdpHint.BCEID)"
          />
          <p class="mt-2 text-xs text-slate-500">
            {{ $t('page.landing.signIn.bceidHint') }}
          </p>
        </div>
      </div>
    </template>
  </section>
</template>
