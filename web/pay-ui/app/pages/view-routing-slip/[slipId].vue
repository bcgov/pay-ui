<script setup lang="ts">
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
</script>

<template>
  <UContainer>
    <h1>{{ $t('page.viewRoutingSlip.h1', { id: slipId }) }}</h1>
  </UContainer>
</template>
