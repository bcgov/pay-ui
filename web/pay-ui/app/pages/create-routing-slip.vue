<script setup lang="ts">
// TODO: review mode
// TODO: routing slip submission
// TODO: error handling
const { t } = useI18n()
const crsStore = useCreateRoutingSlipStore()
const modal = usePayModals()

definePageMeta({
  layout: 'connect-auth',
  hideBreadcrumbs: true,
  middleware: ['mock-connect-auth', 'connect-auth']
  // allowedRoles: [Role.FAS_CREATE] // TODO: role check
  // name: RouteNames.CREATE_ROUTING_SLIP // TODO: name? maybe not needed
})

useHead({
  title: t('page.createRoutingSlip.title')
})

// ADD LOADING AND ERROR HANDLING
</script>

<template>
  <UContainer>
    <UButton
      :label="$t('label.backToDashboard')"
      leading-icon="i-mdi-arrow-left"
      variant="ghost"
      class="w-min pl-0"
      :disabled="crsStore.loading"
      @click="modal.openLeaveCreateRoutingSlipModal"
    />
    <h1>
      {{ $t('page.createRoutingSlip.h1') }}
    </h1>
    <ConnectPageSection
      ui-body="p-4 sm:p-10 space-y-6"
      :heading="{
        label: crsStore.reviewMode ? $t('label.reviewNewRoutingSlip') : $t('label.addNewRoutingSlip'),
        icon: 'i-mdi-clipboard-text'
      }"
    >
      <CreateRoutingSlip
        v-if="!crsStore.reviewMode"
        @submit="crsStore.reviewMode = true"
        @cancel="modal.openLeaveCreateRoutingSlipModal"
      />
      <ReviewRoutingSlip
        v-else
        @cancel="modal.openLeaveCreateRoutingSlipModal"
        @create="crsStore.createRoutingSlip"
      />
    </ConnectPageSection>
  </UContainer>
</template>
