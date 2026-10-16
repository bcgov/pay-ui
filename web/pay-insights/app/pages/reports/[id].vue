<script setup lang="ts">
/**
 * Generic report page: filters, totals, table and CSV export are built from the
 * report definition returned by the API (server/reports/*.ts).
 */
interface ReportColumn {
  key: string
  label: string
  format?: 'text' | 'number' | 'currency'
  total?: boolean
}

const ALL = '__all__'
const PAGE_SIZE = 50

const route = useRoute()
const router = useRouter()
const localePath = useLocalePath()

const reportId = String(route.params.id)

// Filters live in the URL, so a report can be bookmarked or shared
const query = computed(() => route.query)
// lazy: navigate straight away and show a loading state while the warehouse query runs
const { data, status, error } = useFetch(`/api/v1/reports/${reportId}`, { query, lazy: true })
const isFirstLoad = computed(() => status.value === 'pending' && !data.value)

useHead({
  title: () => data.value?.report.title ?? 'PAY Insights'
})

const currency = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' })
const number = new Intl.NumberFormat('en-CA')

function formatValue(value: unknown, format?: ReportColumn['format']): string {
  if (value === null || value === undefined) {
    return ''
  }
  if (format === 'currency') {
    return currency.format(Number(value))
  }
  if (format === 'number') {
    return number.format(Number(value))
  }
  return String(value)
}

function setFilter(key: string, value: unknown) {
  const next = { ...route.query, [key]: value === ALL ? undefined : String(value) }
  router.replace({ query: next })
}

const filters = computed(() => (data.value?.filters ?? []).map(filter => ({
  ...filter,
  items: filter.allLabel ? [{ label: filter.allLabel, value: ALL }, ...filter.options] : filter.options,
  model: filter.value ?? ALL
})))

const columns = computed(() => (data.value?.report.columns ?? []).map((column: ReportColumn) => {
  const numeric = column.format === 'number' || column.format === 'currency'
  return {
    accessorKey: column.key,
    header: column.label,
    cell: ({ row }: { row: { getValue: (key: string) => unknown } }) =>
      formatValue(row.getValue(column.key), column.format),
    meta: numeric ? { class: { th: 'text-right', td: 'text-right' } } : undefined
  }
}))

const totalColumns = computed(() => (data.value?.report.columns ?? []).filter((column: ReportColumn) => column.total))

const page = ref(1)
watch(query, () => {
  page.value = 1
})
const pageRows = computed(() => (data.value?.rows ?? []).slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE))

const exportUrl = computed(() => {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(route.query)) {
    if (typeof value === 'string' && value) {
      params.set(key, value)
    }
  }
  const search = params.toString()
  return `/api/v1/reports/${reportId}/export.csv${search ? `?${search}` : ''}`
})
</script>

<template>
  <section class="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10">
    <div>
      <NuxtLink
        :to="localePath('/')"
        class="text-sm text-primary underline"
      >
        {{ $t('page.report.back') }}
      </NuxtLink>
      <h1 class="mt-2 text-2xl font-semibold">
        {{ data?.report.title }}
      </h1>
      <p class="mt-2 text-gray-600">
        {{ data?.report.description }}
      </p>
    </div>

    <div class="flex flex-wrap items-end gap-4">
      <UFormField
        v-for="filter in filters"
        :key="filter.key"
        :label="filter.label"
      >
        <USelect
          :model-value="filter.model"
          :items="filter.items"
          class="w-64"
          :data-testid="`filter-${filter.key}`"
          @update:model-value="value => setFilter(filter.key, value)"
        />
      </UFormField>
      <UButton
        :href="exportUrl"
        external
        download
        icon="i-mdi-download"
        variant="outline"
        :label="$t('page.report.export')"
        class="ml-auto"
        data-testid="export-csv"
      />
    </div>

    <div
      v-if="isFirstLoad"
      class="flex flex-col gap-4"
      data-testid="report-loading"
    >
      <p class="text-sm text-gray-600">
        {{ $t('page.report.loading') }}
      </p>
      <div class="grid gap-4 sm:grid-cols-3">
        <USkeleton class="h-24" />
        <USkeleton class="h-24" />
      </div>
      <USkeleton class="h-64" />
    </div>

    <p
      v-else-if="error"
      class="text-red-600"
    >
      {{ [400, 404].includes(error.statusCode ?? 0) ? error.statusMessage : $t('page.report.error') }}
    </p>

    <template v-else-if="data">
      <div
        v-if="totalColumns.length"
        class="grid gap-4 transition-opacity sm:grid-cols-3"
        :class="{ 'opacity-50': status === 'pending' }"
      >
        <UCard
          v-for="column in totalColumns"
          :key="column.key"
          :data-testid="`total-${column.key}`"
        >
          <p class="text-sm text-gray-600">
            {{ $t('page.report.total', { label: column.label }) }}
          </p>
          <p class="text-2xl font-semibold">
            {{ formatValue(data.totals[column.key], column.format) }}
          </p>
        </UCard>
      </div>

      <UCard>
        <UTable
          :data="pageRows"
          :columns="columns"
          :loading="status === 'pending'"
          :empty="$t('page.report.empty')"
          data-testid="report-table"
        />
        <div
          v-if="data.rows.length > PAGE_SIZE"
          class="mt-4 flex justify-end"
        >
          <UPagination
            v-model:page="page"
            :total="data.rows.length"
            :items-per-page="PAGE_SIZE"
          />
        </div>
      </UCard>

      <p
        v-if="data.truncated"
        class="text-sm text-amber-700"
      >
        {{ $t('page.report.truncated', { count: data.rows.length }) }}
      </p>
      <p
        v-if="data.report.note"
        class="text-sm text-gray-600"
      >
        {{ data.report.note }}
      </p>
    </template>
  </section>
</template>
