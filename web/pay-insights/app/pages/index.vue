<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()

useHead({
  title: t('page.home.title')
})

// Runs on the server during page render; the session cookie is forwarded automatically
const { data: reports } = await useFetch('/api/v1/reports')

// Small status line: checked in the browser after the page loads, so it doesn't slow the page down
const { status: warehouseStatus, data: warehouse } = useFetch('/api/v1/warehouse/check', { server: false, lazy: true })
const warehouseState = computed(() => {
  if (warehouseStatus.value === 'success' && warehouse.value?.serverTime) {
    return { dot: 'bg-green-600', text: t('page.home.warehouse.connected') }
  }
  if (warehouseStatus.value === 'error') {
    return { dot: 'bg-red-600', text: t('page.home.warehouse.unavailable') }
  }
  return { dot: 'bg-gray-400', text: t('page.home.warehouse.checking') }
})
</script>

<template>
  <section class="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10">
    <div>
      <h1 class="text-2xl font-semibold">
        {{ $t('page.home.h1') }}
      </h1>
      <p class="mt-2 text-gray-600">
        {{ $t('page.home.description') }}
      </p>
      <p
        class="mt-2 flex items-center gap-2 text-sm text-gray-600"
        role="status"
        data-testid="warehouse-status"
      >
        <span
          class="inline-block size-2 rounded-full"
          :class="warehouseState.dot"
          aria-hidden="true"
        />
        {{ warehouseState.text }}
      </p>
    </div>

    <h2 class="text-lg font-semibold">
      {{ $t('page.home.reports') }}
    </h2>
    <UCard
      v-for="report in reports"
      :key="report.id"
      :data-testid="`report-${report.id}`"
    >
      <div class="flex items-start justify-between gap-4">
        <div>
          <h3 class="font-semibold">
            {{ report.title }}
          </h3>
          <p class="text-sm text-gray-600">
            {{ report.description }}
          </p>
        </div>
        <UButton
          :to="localePath(`/reports/${report.id}`)"
          :label="$t('page.home.view')"
          :data-testid="`report-${report.id}-link`"
        />
      </div>
    </UCard>
  </section>
</template>
