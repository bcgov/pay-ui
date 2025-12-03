<script setup lang="ts">
import { useSearch } from '~/composables/dashboard/useSearch'
import { useInfiniteScroll } from '@vueuse/core'

const localePath = useLocalePath()
const { t } = useI18n()

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
  search
} = await useSearch()

const table = useTemplateRef<HTMLElement>('table')

useInfiniteScroll(
  table,
  async () => {
    await getNext(isInitialLoad.value)
    isInitialLoad.value = false
  },
  {
    distance: 200
  }
)
</script>

<template>
  <div class="h-full flex flex-col">
    <div class="bg-white fas-search w-full flex flex-col h-full">
      <div class="relative rounded-t-lg px-4 py-3.5 flex-shrink-0 search-header-bg">
        <div class="flex flex-wrap justify-between">
          <div class="flex">
            <UIcon
              name="i-mdi-view-list"
              class="mr-2 size-6 text-primary"
              style="margin-top: 5px;"
            />
            <h2 class="text-gray-700 font-bold">
              Search Routing Slip
            </h2>
          </div>
          <div>
            <UPopover>
              <UButton
                label="Columns to show"
                color="neutral"
                variant="subtle"
                trailing-icon="i-mdi-menu-down"
                :dismissible="false"
              />
              <template #content>
                <div class="py-2">
                  <UCheckbox
                    v-for="(col, index) in searchRoutingSlipTableHeaders.filter(f => !f.hideInSearchColumnFilter)"
                    :key="index"
                    v-model="col.display"
                    :value="col.accessorKey"
                    :label="col.header"
                    class="px-4 py-2"
                  />
                </div>
              </template>
            </UPopover>
          </div>
        </div>
      </div>

      <div class="w-full overflow-x-auto overflow-y-auto flex-1 min-h-0">
        <UTable
          ref="table"
          v-model:column-visibility="columnVisibility"
          v-model:column-pinning="columnPinning"
          :data="routingSlips"
          :columns="searchRoutingSlipTableHeaders"
          :loading="isLoading"
          class="h-full w-full"
          sticky
        >
          <template #body-top>
            <tr class="sticky-row header-row-2">
              <th v-if="columnVisibility.routingSlipNumber" class="text-left px-2 py-2">
                <UInput
                  v-model="filters.routingSlipNumber"
                  placeholder="Routing Slip Number"
                  size="md"
                  class="pt-0"
                  @input="debouncedSearch()"
                />
              </th>
              <th v-if="columnVisibility.receiptNumber" class="text-left px-2 py-2">
                <UInput
                  v-model="filters.receiptNumber"
                  placeholder="Receipt Number"
                  size="md"
                  class="pt-0"
                  @input="debouncedSearch()"
                />
              </th>
              <th v-if="columnVisibility.accountName" class="text-left px-2 py-2">
                <UInput
                  v-model="filters.accountName"
                  placeholder="Entity Number"
                  size="md"
                  class="pt-0"
                  @input="debouncedSearch()"
                />
              </th>
              <th v-if="columnVisibility.createdName" class="text-left px-2 py-2">
                <UInput
                  v-model="filters.createdName"
                  placeholder="Created By"
                  size="md"
                  class="pt-0"
                  @input="debouncedSearch()"
                />
              </th>
              <th v-if="columnVisibility.date" class="text-left px-2 py-2 date">
                <DateRangeFilter v-model="filters.dateFilter" @change="search()" />
              </th>
              <th v-if="columnVisibility.status" class="text-left px-2 py-2">
                <status-list
                  v-model="filters.status"
                  column="status"
                  class="text-input-style "
                  hide-details="auto"
                  :placeholder="!filters.status ? 'Status' : ''"
                  @change="search()"
                />
              </th>
              <th v-if="columnVisibility.refundStatus" class="text-left px-2 py-2">
                <status-list
                  v-model="filters.refundStatus"
                  column="refundStatus"
                  class="text-input-style "
                  hide-details="auto"
                  :placeholder="!filters.refundStatus ? 'Refund Status' : ''"
                  @change="search()"
                />
              </th>
              <th v-if="columnVisibility.businessIdentifier" class="text-left px-2 py-2">
                <UInput
                  v-model="filters.businessIdentifier"
                  placeholder="Reference Number"
                  size="md"
                  class="pt-0"
                  @input="debouncedSearch()"
                />
              </th>
              <th v-if="columnVisibility.chequeReceiptNumber" class="text-left px-2 py-2">
                <UInput
                  v-model="filters.chequeReceiptNumber"
                  placeholder="Cheque  Number"
                  size="md"
                  class="pt-0"
                  @input="debouncedSearch()"
                />
              </th>
              <th v-if="columnVisibility.remainingAmount" class="text-left px-2 py-2">
                <UInput
                  v-model="filters.remainingAmount"
                  placeholder="Balance"
                  size="md"
                  class="pt-0"
                  @input="debouncedSearch()"
                />
              </th>
              <th
                class="text-right pl-2 pr-4 sticky data-[pinned=left]:left-0 data-[pinned=right]:right-0"
                data-pinned="right"
              >
                <UButton
                  label="Clear Filters"
                  variant="outline"
                  trailing-icon="i-mdi-close"
                  size="md"
                  @click="resetSearchFilters()"
                />
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
                @click="navigateTo(localePath(`/view-routing-slip/${row.original.routingSlipNumber}`))"
              />
            </div>
          </template>
        </UTable>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
@use '~/assets/scss/search.scss' as *;
</style>

<style scoped>
.search-header-bg {
  background-color: #e0e7ed;
}

:deep(table td) {
  color: #495057;
}

:deep(.sticky-row) {
  position: sticky;
  top: 48px;
  z-index: 10;
  background-color: white;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

:deep(.sticky-row th) {
  background-color: white;
  border-bottom: 1px solid #e5e7eb;
}

:deep(input) {
  font-weight: 400;
  color: #212529;
}

:deep(input::placeholder) {
  font-weight: 400;
  color: #919191;
}

:deep(.overflow-x-auto) {
  display: flex;
  flex-direction: column;
  height: 100%;
}

:deep(.overflow-x-auto > *) {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
</style>
