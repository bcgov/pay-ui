<script setup lang="ts">
import { useSearch } from '~/composables/dashboard/useSearch'
import { useInfiniteScroll, useResizeObserver } from '@vueuse/core'
import { useRoutingSlipStatusList, useChequeRefundStatusList } from '~/composables/common/useStatusList'

const { t } = useI18n()

const { list: routingSlipStatusList, mapFn: routingSlipMapFn } = await useRoutingSlipStatusList()
const { list: chequeRefundStatusList, mapFn: chequeRefundMapFn } = useChequeRefundStatusList()

const {
  searchRoutingSlipTableHeaders,
  debouncedSearch,
  getStatusLabel,
  searchParamsExist,
  showExpandedFolio,
  showExpandedCheque,
  toggleFolio,
  toggleCheque,
  isLoading,
  getNext,
  filters,
  routingSlips,
  columnPinning,
  isInitialLoad,
  columnVisibility,
  resetSearchFilters,
  hasActiveFilters,
  search,
  updateSearchFilter
} = await useSearch()

const table = useTemplateRef<HTMLElement>('table')
const scrollEl = useTemplateRef<HTMLElement>('scrollEl')

const updateStickyHeaderHeight = () => {
  const el = scrollEl.value
  if (!el) { return }

  const thead = el.querySelector('thead')
  const height = thead?.getBoundingClientRect().height ?? 0
  el.style.setProperty('--search-sticky-header-height', `${Math.ceil(height)}px`)
}

const visibleColumns = computed(() => {
  const headers = searchRoutingSlipTableHeaders.value
  return headers.filter(f => !(f as { hideInSearchColumnFilter?: boolean }).hideInSearchColumnFilter)
})

useInfiniteScroll(
  table,
  async () => {
    await getNext(isInitialLoad.value)
  },
  { distance: 200 }
)

onMounted(async () => {
  await nextTick()
  updateStickyHeaderHeight()

  if (hasActiveFilters.value) {
    updateSearchFilter({
      routingSlipNumber: filters.routingSlipNumber,
      receiptNumber: filters.receiptNumber,
      accountName: filters.accountName,
      initiator: filters.createdName,
      dateFilter: filters.dateFilter,
      status: filters.status,
      refundStatus: filters.refundStatus,
      businessIdentifier: filters.businessIdentifier,
      chequeReceiptNumber: filters.chequeReceiptNumber,
      remainingAmount: filters.remainingAmount
    })
  }
  search()
})

useResizeObserver(scrollEl, () => {
  updateStickyHeaderHeight()
})
</script>

<template>
  <div class="h-full flex flex-col">
    <div class="bg-white fas-search w-full flex flex-col h-full rounded-lg overflow-hidden">
      <div class="relative rounded-t-lg px-2 py-3.5 flex-shrink-0 search-header-bg">
        <div class="flex flex-wrap justify-between">
          <div class="flex">
            <UIcon
              name="i-mdi-view-list"
              class="mr-2 size-6 text-primary"
              style="margin-top: 5px;"
            />
            <h2 class="table-header-text font-bold">
              Search Routing Slip
            </h2>
          </div>
          <div>
            <UPopover>
              <UButton
                label="Columns to Show"
                color="neutral"
                variant="subtle"
                trailing-icon="i-mdi-menu-down"
                :dismissible="false"
                class="columns-to-show-btn"
              />
              <template #content>
                <div class="py-2">
                  <UCheckbox
                    v-for="col in visibleColumns"
                    :key="col.accessorKey"
                    :model-value="!!col.display"
                    :label="col.header"
                    class="px-2 py-2"
                    @update:model-value="col.display = !!$event"
                  />
                </div>
              </template>
            </UPopover>
          </div>
        </div>
      </div>

      <div class="w-full flex-1 min-h-0 bg-white rounded-b-lg">
        <div ref="scrollEl" class="table-scroll">
          <UTable
            ref="table"
            v-model:column-visibility="columnVisibility"
            v-model:column-pinning="columnPinning"
            :data="routingSlips"
            :columns="searchRoutingSlipTableHeaders"
            :loading="isLoading"
            class="h-full w-full search-table sticky-table"
            sticky
          >
            <template #body-top>
              <tr class="sticky-row header-row-2">
                <th
                  v-if="columnVisibility.routingSlipNumber"
                  class="text-left px-2 py-2 table-filter-input header-routing-slip"
                >
                  <UInput
                    v-model="filters.routingSlipNumber"
                    placeholder="Routing Slip Number"
                    size="md"
                    class="pt-0"
                    @input="debouncedSearch()"
                  />
                </th>
                <th
                  v-if="columnVisibility.receiptNumber"
                  class="text-left px-2 py-2 table-filter-input header-receipt-number"
                >
                  <UInput
                    v-model="filters.receiptNumber"
                    placeholder="Receipt Number"
                    size="md"
                    class="pt-0"
                    @input="debouncedSearch()"
                  />
                </th>
                <th
                  v-if="columnVisibility.accountName"
                  class="text-left px-2 py-2 table-filter-input header-account-name"
                >
                  <UInput
                    v-model="filters.accountName"
                    placeholder="Entity Number"
                    size="md"
                    class="pt-0"
                    @input="debouncedSearch()"
                  />
                </th>
                <th
                  v-if="columnVisibility.createdName"
                  class="text-left px-2 py-2 table-filter-input header-created-name"
                >
                  <UInput
                    v-model="filters.createdName"
                    placeholder="Created By"
                    size="md"
                    class="pt-0"
                    @input="debouncedSearch()"
                  />
                </th>
                <th v-if="columnVisibility.date" class="text-left px-2 py-2 date table-filter-input header-date">
                  <DateRangeFilter v-model="filters.dateFilter" @change="search()" />
                </th>
                <th v-if="columnVisibility.status" class="text-left px-2 py-2 table-filter-input header-status">
                  <status-list
                    v-model="filters.status"
                    :list="routingSlipStatusList"
                    :map-fn="routingSlipMapFn"
                    placeholder="Status"
                    class="text-input-style "
                    hide-details="auto"
                  />
                </th>
                <th
                  v-if="columnVisibility.refundStatus"
                  class="text-left px-2 py-2 table-filter-input header-refund-status status-list-wrapper"
                >
                  <status-list
                    v-model="filters.refundStatus"
                    :list="chequeRefundStatusList"
                    :map-fn="chequeRefundMapFn"
                    placeholder="Refund Status"
                    class="text-input-style "
                    hide-details="auto"
                  />
                </th>
                <th
                  v-if="columnVisibility.businessIdentifier"
                  class="text-left px-2 py-2 table-filter-input header-business-identifier"
                >
                  <UInput
                    v-model="filters.businessIdentifier"
                    placeholder="Reference Number"
                    size="md"
                    class="pt-0"
                    @input="debouncedSearch()"
                  />
                </th>
                <th
                  v-if="columnVisibility.chequeReceiptNumber"
                  class="text-left px-2 py-2 table-filter-input header-cheque-receipt-number"
                >
                  <UInput
                    v-model="filters.chequeReceiptNumber"
                    placeholder="Cheque Number"
                    size="md"
                    class="pt-0"
                    @input="debouncedSearch()"
                  />
                </th>
                <th
                  v-if="columnVisibility.remainingAmount"
                  class="text-left px-2 py-2 table-filter-input header-remaining-amount header-total"
                >
                  <UInput
                    v-model="filters.remainingAmount"
                    placeholder="Balance"
                    size="md"
                    class="pt-0"
                    @input="debouncedSearch()"
                  />
                </th>
                <th
                  class="text-right pl-2 pr-4 clear-filters-th"
                >
                  <template v-if="hasActiveFilters">
                    <UButton
                      label="Clear Filters"
                      variant="outline"
                      color="primary"
                      trailing-icon="i-mdi-close"
                      size="sm"
                      class="clear-filters-btn"
                      @click="resetSearchFilters()"
                    />
                  </template>
                </th>
              </tr>
            </template>
            <template #loading>
              Loading...
            </template>
            <template #empty>
              <!-- eslint-disable vue/no-v-html -->
              <div
                class="text-center py-8 text-gray-600"
                v-html="
                  t(
                    searchParamsExist
                      ? 'text.searchStartMessage'
                      : 'text.searchNoResult',
                    {
                      h4Start: '<h4>',
                      h4End: '</h4>',
                      pStart: '<p>',
                      pEnd: '</p>'
                    }
                  )
                "
              />
              <!-- eslint-enable vue/no-v-html -->
            </template>

            <template #status-cell="{ row }">
              <span
                :class="commonUtil.statusListColor(row.original.status)"
              >
                {{ getStatusLabel(row.original.status) ?? '-' }}
              </span>
            </template>

            <template #businessIdentifier-cell="{ row }">
              <span v-if="row.original.businessIdentifier.length === 1">
                {{ row.original.businessIdentifier[0] }}
              </span>
              <template v-else>
                <div
                  v-if="!showExpandedFolio.includes(row.original.routingSlipNumber)"
                  class="cursor-pointer"
                  @click="toggleFolio(row.original.routingSlipNumber)"
                >
                  {{ row.original.businessIdentifier[0] }}
                  <UIcon
                    name="i-mdi-menu-down"
                  />
                </div>
                <div
                  v-else
                  class="cursor-pointer"
                  @click="toggleFolio(row.original.routingSlipNumber)"
                >
                  <div
                    v-for="(folio, index) in row.original.businessIdentifier"
                    :key="index"
                  >
                    <span>
                      {{ folio }}
                      <UIcon
                        v-if="index === 0"
                        name="i-mdi-menu-up"
                      />
                    </span>
                  </div>
                </div>
              </template>
            </template>

            <template #chequeReceiptNumber-cell="{ row }">
              <span v-if="row.original.chequeReceiptNumber.length === 1">
                {{ row.original.chequeReceiptNumber[0] }}
              </span>
              <template v-else>
                <div
                  v-if="!showExpandedCheque.includes(row.original.routingSlipNumber)"
                  class="cursor-pointer"
                  @click="toggleCheque(row.original.routingSlipNumber)"
                >
                  {{ row.original.chequeReceiptNumber[0] }}
                  <UIcon
                    name="i-mdi-menu-down"
                  />
                </div>
                <div
                  v-else
                  class="cursor-pointer"
                  @click="toggleCheque(row.original.routingSlipNumber)"
                >
                  <div
                    v-for="(chequeReceiptNumber, index) in row.original.chequeReceiptNumber"
                    :key="index"
                  >
                    <span>
                      {{ chequeReceiptNumber }}
                      <UIcon
                        v-if="index === 0"
                        name="i-mdi-menu-up"
                      />
                    </span>
                  </div>
                </div>
              </template>
            </template>

            <template #actions-cell="{ row }">
              <div class="text-right">
                <UButton
                  label="Open"
                  class="btn-table font-normal"
                  @click="navigateTo(`/view-routing-slip/${row.original.routingSlipNumber}`)"
                />
              </div>
            </template>
          </UTable>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '~/assets/scss/table.scss';
@use '~/assets/scss/colors.scss' as *;

.search-header-bg {
  background-color: var(--color-bg-light-blue) !important;
  opacity: 1 !important;
}

// Search-specific: reduce vertical padding on filter row
:deep(.sticky-row th) {
  padding-top: 0.75rem !important;
  padding-bottom: 0.75rem !important;
}

// Equal width columns
:deep(table) {
  table-layout: fixed;
  width: 100%;
}

:deep(table thead tr th),
:deep(table tbody tr td),
:deep(.sticky-row th) {
  width: 9.09%; // 100% / 11 columns
}

.fas-search {
  .header-row-2 {
    th > div {
      width: 100%;
    }
    :deep(.date button) {
      padding: 6px 10px !important;
      overflow: hidden;
      white-space: nowrap;
      background-color: var(--color-bg-shade) !important;
    }
    .placeholder {
      font-weight: 400;
      color: var(--color-text-secondary);
    }
    .input-text {
      font-weight: 400 !important;
      color: var(--color-text-secondary);
    }
  }
}
</style>
