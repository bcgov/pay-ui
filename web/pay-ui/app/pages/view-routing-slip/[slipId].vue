<script setup lang="ts">
import StaffComments from '~/components/RoutingSlip/StaffComments.vue'
import PaymentInformation from '~/components/RoutingSlip/PaymentInformation.vue'
import { onMounted } from 'vue'
import { useRoutingSlip, definePageMeta, useI18n } from '#imports'
import { useHead } from '#app'
import { useRoute } from 'vue-router'
// TODO: all view components
// TODO: breadcrumbs

const route = useRoute()
const { t } = useI18n()

definePageMeta({
  layout: 'connect-auth'
  // allowedRoles: [Role.FAS_VIEW] // TODO: role check
})

useHead({
  title: t('page.viewRoutingSlip.title')
})

const slipId = route.params.slipId as string

const { getRoutingSlip, getLinkedRoutingSlips } = useRoutingSlip()

onMounted(async () => {
  await getRoutingSlip({ routingSlipNumber: slipId })
  await getLinkedRoutingSlips(slipId)
})
</script>

<template>
  <UContainer>
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">
        {{ $t('page.viewRoutingSlip.h1', { id: slipId }) }}
      </h1>
      <p class="description-text mb-4">
        {{ $t('page.viewRoutingSlip.subtitle') }}
      </p>
      <div class="inline-block">
        <StaffComments
          :identifier="slipId"
          :nudge-top="33"
          :nudge-left="20"
          :max-length="4096"
        />
      </div>
    </div>

    <div class="mt-8">
      <h2 class="text-xl font-bold text-gray-900 mb-2">
        {{ $t('page.viewRoutingSlip.routingSlipInformation.title') }}
      </h2>
      <p class="description-text mb-4">
        {{ $t('page.viewRoutingSlip.routingSlipInformation.description') }}
      </p>
      <!-- TODO: Add routing slip details here -->
    </div>

    <div class="mt-8">
      <h2 class="text-xl font-bold text-gray-900 mb-2">
        {{ $t('page.viewRoutingSlip.paymentInformation.title') }}
      </h2>
      <p class="description-text mb-4">
        {{ $t('page.viewRoutingSlip.paymentInformation.description') }}
      </p>
      <PaymentInformation />
    </div>

    <div class="mt-8">
      <h2 class="text-xl font-bold text-gray-900 mb-2">
        {{ $t('page.viewRoutingSlip.linkingRoutingSlip.title') }}
      </h2>
      <p class="description-text mb-4">
        {{ $t('page.viewRoutingSlip.linkingRoutingSlip.description') }}
      </p>
      <!-- TODO: Add linking routing slip functionality here -->
    </div>

    <div class="mt-8">
      <h2 class="text-xl font-bold text-gray-900 mb-2">
        {{ $t('page.viewRoutingSlip.routingSlipTransaction.title') }}
      </h2>
      <p class="description-text mb-4">
        {{ $t('page.viewRoutingSlip.routingSlipTransaction.description') }}
      </p>
      <!-- TODO: Add routing slip transactions table/list here -->
    </div>
  </UContainer>
</template>

<style lang="scss" scoped>
.description-text {
  color: #495057;
}
</style>
