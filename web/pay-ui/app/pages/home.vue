<script setup lang="ts">
import Search from '~/components/Dashboard/Search.vue'
import DailyReport from '~/components/Dashboard/DailyReport.vue'

const { t } = useI18n()

definePageMeta({
  layout: 'connect-auth',
  middleware: ['pay-auth'],
  allowedRoles: [Role.FAS_VIEW],
  hideBreadcrumbs: true
})

useHead({
  title: t('page.dashboard.title')
})
</script>

<template>
  <div class="flex flex-col dashboard-container">
    <div class="flex-shrink-0 mb-2">
      <h1 class="text-gray-900">
        {{ $t('page.dashboard.h1') }}
      </h1>
      <p class="text-lg dashboard-subtitle">
        {{ $t('page.dashboard.h1Info') }}
      </p>
    </div>
    <div class="flex justify-between items-center mb-4 flex-shrink-0">
      <UButton
        color="primary"
        size="lg"
        leading-icon="i-mdi-plus"
        class="rounded-lg font-semibold text-white add-routing-slip-btn"
        @click="navigateTo('/create-routing-slip')"
      >
        Add New Routing Slip
      </UButton>
      <DailyReport />
    </div>
    <div class="flex-1 min-h-0">
      <Search />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.dashboard-subtitle {
  color: #495057;
}

.dashboard-container {
  height: calc(100vh - 2.5rem);
  padding-top: 2.5rem;
  padding-bottom: 4rem;
  overflow: hidden;
}

</style>
