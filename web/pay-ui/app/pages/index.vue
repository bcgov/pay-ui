<script setup lang="ts">

const { t } = useI18n()

definePageMeta({
  layout: 'connect-auth'
})

useHead({
  title: t('page.home.title')
})

setBreadcrumbs([
  { label: 'Pay UI' }
])

const dateRange = shallowRef({ start: null, end: null })
const date = ref<string | null>('2025-09-23')

function resetDateRange() {
  dateRange.value = { start: null, end: null }
}
function resetDate() {
  date.value = null
}
</script>

<template>
  <div class="py-10 space-y-10">
    <h1>{{ $t('page.home.h1') }}</h1>

    

    <div>range: {{ dateRange }}</div>
    <div>date: {{ date }}</div>

    <div class="flex gap-10">
      <Dashboard />
      <DateRangeFilter v-model="dateRange" />
      <DatePicker v-model="date" />
      <IconTooltip text="this is some text">
        <div>some slot content</div>
      </IconTooltip>
    </div>
    <div class="flex gap-10">
      <UButton
        label="reset range"
        @click="resetDateRange"
      />
      <UButton
        label="reset date"
        @click="resetDate"
      />
    </div>

    <div class="p-10 bg-white">
      <!-- useRoute().params.parentId -->
      <RoutingSlipAutoComplete
        parent-routing-slip-number="123456789"
        @cancel="() => console.info('do something on cancel')"
        @success="(childRSNumber) => console.info('do something on success: ', childRSNumber)"
      />
    </div>
  </div>
</template>
