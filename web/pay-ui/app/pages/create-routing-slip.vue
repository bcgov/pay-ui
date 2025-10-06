<script setup lang="ts">
// TODO: review mode
// TODO: routing slip submission
// TODO: error handling
const localePath = useLocalePath()
const { t } = useI18n()

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
</script>

<template>
  <div class="py-10 flex flex-col gap-8">
    <!-- TODO: modal when clicking back -->
    <UButton
      :label="$t('label.backToDashboard')"
      leading-icon="i-mdi-arrow-left"
      variant="ghost"
      class="w-min pl-0"
      :to="localePath('/')"
    />
    <h1 class="-mt-3">
      {{ $t('page.createRoutingSlip.h1') }}
    </h1>
    <ConnectPageSection
      ui-body="p-4 space-y-6"
      :heading="{
        label: $t('label.addNewRoutingSlip'),
        icon: 'i-mdi-clipboard-text'
      }"
    >
      <CreateRoutingSlip />
    </ConnectPageSection>
  </div>
</template>
