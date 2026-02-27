<script setup lang="ts">
import StaffComments from '~/components/RoutingSlip/StaffComments.vue'
import LinkRoutingSlip from '~/components/RoutingSlip/LinkRoutingSlip.vue'
import useViewRoutingSlip from '~/composables/viewRoutingSlip/useViewRoutingSlip'
import PaymentInformation from '~/components/RoutingSlip/PaymentInformation.vue'
import RoutingSlipTransaction from '~/components/RoutingSlip/RoutingSlipTransaction.vue'
import RoutingSlipInformation from '~/components/RoutingSlip/RoutingSlipInformation.vue'
import { useRoutingSlip } from '~/composables/useRoutingSlip'
import { useLoader } from '~/composables/common/useLoader'

const route = useRoute()
const { t } = useI18n()
const { getFeatureFlag } = useConnectLaunchDarkly()

definePageMeta({
  layout: 'connect-auth',
  hideBreadcrumbs: false,
  middleware: ['pay-auth'],
  allowedRoles: [Role.FAS_VIEW]
})

useHead({
  title: t('page.viewRoutingSlip.title')
})

const slipId = route.params.slipId as string

setBreadcrumbs([
  {
    label: t('label.fasDashboard'),
    to: '/home'
  },
  {
    label: t('page.viewRoutingSlip.h1', { id: slipId })
  }
])
useViewRoutingSlip({ slipId })

const { getRoutingSlip, getRoutingSlipV2, getLinkedRoutingSlips } = useRoutingSlip()
const { store } = useRoutingSlipStore()
const { isLoading, toggleLoading } = useLoader()

const staffCommentsRef = useTemplateRef<InstanceType<typeof StaffComments> & {
  fetchStaffComments: () => Promise<void> }>('staffComments')

function handlePaymentAdjusted() {
  staffCommentsRef.value?.fetchStaffComments()
}

onMounted(async () => {
  toggleLoading(true)
  try {
    const enableRefundRequestFlow = await getFeatureFlag(LDFlags.EnableFasRefundRequestFlow, false, 'await')
    if (enableRefundRequestFlow) {
      await getRoutingSlipV2({ routingSlipNumber: slipId })
    } else {
      await getRoutingSlip({ routingSlipNumber: slipId })
    }
    await getLinkedRoutingSlips(slipId)
  } finally {
    toggleLoading(false)
  }
})
</script>

<template>
  <UContainer>
    <div v-if="isLoading" class="flex justify-center items-center min-h-[400px]">
      <UIcon name="i-mdi-loading" class="animate-spin text-4xl text-primary" />
    </div>
    <div v-else>
      <div class="mb-2">
        <h1 class="text-3xl font-bold text-gray-900">
          {{ $t('page.viewRoutingSlip.h1', { id: slipId }) }}
        </h1>
        <p class="description-text mb-4">
          {{ $t('page.viewRoutingSlip.subtitle') }}
        </p>
        <div class="inline-block">
          <StaffComments
            ref="staffComments"
            :identifier="slipId"
            :nudge-top="33"
            :nudge-left="20"
            :max-length="4096"
          />
        </div>
      </div>

      <div>
        <h2 class="text-xl font-bold text-gray-900 mb-2">
          {{ $t('page.viewRoutingSlip.routingSlipInformation.title') }}
        </h2>
        <RoutingSlipInformation @comments-updated="handlePaymentAdjusted" />
      </div>

      <div class="mt-8">
        <h2 class="text-xl font-bold text-gray-900">
          {{ $t('page.viewRoutingSlip.paymentInformation.title') }}
        </h2>
        <p class="description-text mb-4">
          {{ $t('page.viewRoutingSlip.paymentInformation.description') }}
        </p>
        <PaymentInformation @payment-adjusted="handlePaymentAdjusted" />
      </div>

      <div class="mt-8">
        <h2 class="text-xl font-bold text-gray-900">
          {{ $t('page.viewRoutingSlip.linkingRoutingSlip.title') }}
        </h2>
        <p class="description-text mb-4">
          {{ $t('page.viewRoutingSlip.linkingRoutingSlip.description') }}
        </p>
        <link-routing-slip :slip-id="slipId" />
      </div>

      <div class="mt-8">
        <h2 class="text-xl font-bold text-gray-900">
          {{ $t('page.viewRoutingSlip.routingSlipTransaction.title') }}
        </h2>
        <p class="description-text mb-4">
          {{ $t('page.viewRoutingSlip.routingSlipTransaction.description') }}
        </p>
        <RoutingSlipTransaction :invoices="store.routingSlip?.invoices" />
      </div>
    </div>
  </UContainer>
</template>

<style lang="scss" scoped>
.description-text {
  color: var(--color-text-secondary);
}
</style>
