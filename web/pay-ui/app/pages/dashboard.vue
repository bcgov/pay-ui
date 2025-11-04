<script setup lang="ts">
import Search from '~/components/Dashboard/Search.vue'
import DailyReport from '~/components/Dashboard/DailyReport.vue'

const { t } = useI18n()

definePageMeta({
  layout: 'connect-auth',
  middleware: ['mock-connect-auth', 'connect-auth']
})

useHead({
  title: t('page.dashboard.title')
})
</script>

<template>
  <div class="py-10 space-y-10">
    <h1 class="mb-2 text-gray-900">
      {{ $t('page.dashboard.h1') }}
    </h1>
    <p class="text-lg text-gray-600">
      {{ $t('page.dashboard.h1Info') }}
    </p>
    <DailyReport />
    <Search />
  </div>
</template>
