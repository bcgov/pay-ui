<script setup lang="ts">
import { useSearch } from '~/composables/dashboard/useSearch'
import { SearchRoutingSlipTableHeaders } from '@/utils/constants'
import { useInfiniteScroll } from '@vueuse/core'

const localePath = useLocalePath()

interface SearchFilterState {
  routingSlipNumber: string | null
  receiptNumber: string | null
  accountName: string | null
  createdName: string | null
  dateFilter: { start: string | null, end: string | null }
  status: string | null
  refundStatus: string | null
  businessIdentifier: string | null
  chequeReceiptNumber: string | null
  remainingAmount: string | null
}

const { t } = useI18n()
const searchRoutingSlipTableHeaders = ref(SearchRoutingSlipTableHeaders)

const {
  searchRoutingSlipResult,
  searchNow,
  debouncedSearch,
  getStatusLabel,
  searchParamsExist,
  formatFolioResult,
  showExpandedFolio,
  showExpandedCheque,
  toggleFolio,
  toggleCheque,
  isLoading,
  getNext,
  getRefundStatusText,
  updateSearchFilter
} = await useSearch()

const table = useTemplateRef<HTMLElement>('table')
const appendCurrencySymbol = commonUtil.appendCurrencySymbol

const routingSlips = computed(() => searchRoutingSlipResult.value?.map((item) => {
  return {
    routingSlipNumber: item.number ?? '-',
    receiptNumber: item.paymentAccount
      && item.paymentAccount.paymentMethod === 'CASH'
      ? (item.payments?.[0]?.chequeReceiptNumber ?? '-')
      : '-',
    accountName: item.paymentAccount?.accountName ?? '-',
    createdName: item.createdName ?? '-',
    date: commonUtil.formatDisplayDate(item.routingSlipDate || '', 'MMMM dd, yyyy'),
    status: item.status || '',
    refundStatus: item.refundStatus ? getRefundStatusText(item.refundStatus) : '-',
    businessIdentifier: formatFolioResult(item.invoices || [], filters.businessIdentifier),
    chequeReceiptNumber: item.paymentAccount && item.paymentAccount.paymentMethod === PaymentMethods.CHEQUE
      ? (item.payments?.map(p => p.chequeReceiptNumber) || ['-'])
      : ['-'],
    remainingAmount: item.remainingAmount
      ? appendCurrencySymbol(item.remainingAmount.toFixed(2))
      : '-'
  }
}) || [])

const columnPinning = ref({
  right: ['actions']
})

const filterInitialState: SearchFilterState = {
  routingSlipNumber: null,
  receiptNumber: null,
  accountName: null,
  createdName: null,
  dateFilter: { start: null, end: null },
  status: null,
  refundStatus: null,
  businessIdentifier: null,
  chequeReceiptNumber: null,
  remainingAmount: null
}

const filters = reactive<SearchFilterState>({
  routingSlipNumber: null,
  receiptNumber: null,
  accountName: null,
  createdName: null,
  dateFilter: { start: null, end: null },
  status: null,
  refundStatus: null,
  businessIdentifier: null,
  chequeReceiptNumber: null,
  remainingAmount: null
})

const search = async () => {
  await nextTick()
  searchNow()
}

watch(() => filters.routingSlipNumber, newVal => updateSearchFilter({ routingSlipNumber: newVal }))
watch(() => filters.receiptNumber, newVal => updateSearchFilter({ receiptNumber: newVal }))
watch(() => filters.accountName, newVal => updateSearchFilter({ accountName: newVal }))
watch(() => filters.createdName, newVal => updateSearchFilter({ createdName: newVal }))
watch(
  () => filters.dateFilter,
  (newVal) => {
    updateSearchFilter({ dateFilter: newVal })
  },
  { deep: true }
)
watch(() => filters.status, newVal => updateSearchFilter({ status: newVal }))
watch(() => filters.refundStatus, newVal => updateSearchFilter({ refundStatus: newVal }))
watch(() => filters.businessIdentifier, newVal => updateSearchFilter({ businessIdentifier: newVal }))
watch(() => filters.chequeReceiptNumber, newVal => updateSearchFilter({ chequeReceiptNumber: newVal }))
watch(() => filters.remainingAmount, newVal => updateSearchFilter({ remainingAmount: newVal }))

const columnVisibility = computed<Record<string, boolean>>(() => {
  const visibility: Record<string, boolean> = {}
  searchRoutingSlipTableHeaders.value.forEach((item) => {
    visibility[item.accessorKey] = item.display
  })
  return visibility
})

const resetSearchFilters = async () => {
  Object.assign(filters, filterInitialState)
  search()
}

useInfiniteScroll(
  table,
  async () => {
    await getNext()
  },
  {
    distance: 200
  }
)
</script>

<template>
  <div class="bg-white fas-search">
    <div class="flex flex-wrap justify-between px-4 py-3.5 border-b border-accented">
      <div class="flex">
        <UIcon
          name="i-mdi-view-list"
          class="mr-2 size-6"
          style="margin-top: 5px;"
        />
        <h2>
          Search Routing Slip
        </h2>
      </div>
      <div>
        <UPopover>
          <UButton
            label="Columns to show"
            color="neutral"
            variant="subtle"
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

    <div>
      <UTable
        ref="table"
        v-model:column-visibility="columnVisibility"
        v-model:column-pinning="columnPinning"
        :data="routingSlips"
        :columns="searchRoutingSlipTableHeaders"
        :loading="isLoading"
        class="max-h-[600px]"
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
          <!-- TODO sanitize html -->
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
</template>

<style lang="scss">
@use '~/assets/scss/search.scss' as *;
</style>

<style scoped>
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
</style>
