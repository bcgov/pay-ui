<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()

useHead({
  title: t('page.home.title')
})

// Runs on the server during page render; the session cookie is forwarded automatically
const { data: reports } = await useFetch('/api/v1/reports')
const { data: check, status } = await useFetch('/api/v1/warehouse/check')
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

    <UCard data-testid="warehouse-check">
      <h3 class="font-semibold">
        {{ $t('page.home.warehouse.title') }}
      </h3>
      <p
        v-if="status === 'success' && check?.serverTime"
        class="text-sm"
      >
        {{ $t('page.home.warehouse.connected') }} —
        {{ $t('page.home.warehouse.serverTime', { time: check.serverTime }) }}
      </p>
      <p
        v-else
        class="text-sm text-red-600"
      >
        {{ $t('page.home.warehouse.failed') }}
      </p>
    </UCard>
  </section>
</template>
