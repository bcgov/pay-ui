<script setup lang="ts">
import { RefundApprovalStatus, UI_CONSTANTS } from '@/utils/constants'
import CommonUtils from '@/utils/common-util'
import type { TableColumn } from '@nuxt/ui'
import { useDebounceFn, useInfiniteScroll } from '@vueuse/core'
import { useStickyHeader } from '@/composables/common/useStickyHeader'
import { useRefundRequestTable } from '~/composables/refund/useRefundRequestTable'
import { useRefundRequestsStore } from '~/stores/refund-requests-store'
import { PaymentMethodSelectItems } from '~/enums'
import { usePaymentMethodsList } from '~/composables/common/useStatusList'

interface Props {
  tableTitle?: string
  currentTab?: number
}

const props = withDefaults(defineProps<Props>(), {
  tableTitle: undefined,
  currentTab: 0
})

const dateDisplayFormat = 'MMMM dd, yyyy'
const state = reactive<RefundRequestState>({
  results: [],
  stateTotal: 0,
  total: 0,
  filters: {
    pageNumber: 1,
    pageLimit: 5,
    filterPayload: defaultFilterPayload()
  },
  loading: false,
  actionDropdown: [],
  options: {},
  clearFiltersTrigger: 0,
  dateRangeReset: 0,
  showDatePicker: false,
  dateRangeSelected: false,
  dateRangeText: '',
  startDate: '',
  endDate: ''
})

const {
  loadTableData,
  updateFilter,
  getNext,
  resetReachedEnd,
  loadState
} = useRefundRequestTable(state)

const refundRequestsStore = useRefundRequestsStore()

const { list: PaymentMethodSelectItems, mapFn: paymentMethodMapFn } = usePaymentMethodsList()

const debouncedUpdateFilter = useDebounceFn((col: string, val: string | number) => {
  updateFilter(col, val)
}, UI_CONSTANTS.DEBOUNCE_DELAY_MS)

const paymentMethodModel = computed({
  get: () => {
    return state.filters.filterPayload.paymentMethod
  },
  set: (value: string) => {
    onPaymentMethodChange(value)
  }
})

function onPaymentMethodChange(value: string) {
  const stringValue = value || ''
  state.filters.filterPayload.paymentMethod = value as PaymentTypes
  updateFilter('paymentMethod', stringValue)
}

function defaultFilterPayload() {
  return { refundStatus: RefundApprovalStatus.PENDING_APPROVAL, paymentMethod: null }
}

async function onDateRangeChange() {
  refundRequestsStore.setFilter({ ...state.filters.filterPayload })
  await loadTableData('page', 1)
}

async function clearFilters() {
  state.clearFiltersTrigger++
  state.filters.filterPayload = defaultFilterPayload()
  state.filters.isActive = false
  refundRequestsStore.clearFilter()
  refundRequestsStore.setTableSettings(null)
  resetReachedEnd()
  await loadTableData()
}

function saveTableSettings() {
  refundRequestsStore.setTableSettings({
    filterPayload: { ...state.filters.filterPayload },
    pageNumber: state.filters.pageNumber
  })
}

function navigateToDetails(invoiceId: number, refundId: number) {
  saveTableSettings()
  navigateTo(`/transaction-view/${invoiceId}/refund-request/${refundId}`)
}

watch(() => props.currentTab, () => {
  loadData()
})

const scrollEl = useTemplateRef<HTMLElement>('scrollEl')
const table = useTemplateRef<HTMLElement>('table')

const { updateStickyHeaderHeight } = useStickyHeader(scrollEl)

useInfiniteScroll(
  table,
  async () => {
    await getNext(loadState.isInitialLoad)
  },
  { distance: 200 }
)

onMounted(async () => {
  await loadData()
  await nextTick()
  updateStickyHeaderHeight()
})

async function loadData() {
  const savedSettings = refundRequestsStore.tableSettings
  if (savedSettings) {
    const payload = { ...savedSettings.filterPayload } as typeof state.filters.filterPayload
    state.filters.filterPayload = { ...state.filters.filterPayload, ...payload }
    state.filters.pageNumber = savedSettings.pageNumber
    refundRequestsStore.setTableSettings(null)
  } else {
    const savedFilter = refundRequestsStore.refundRequestsFilter
    if (savedFilter) {
      const payload = { ...savedFilter }
      state.filters.filterPayload = { ...state.filters.filterPayload, ...payload }
    }
  }
  await loadTableData()
}

watch(() => state.filters.filterPayload, (filterPayload) => {
  refundRequestsStore.setFilter({ ...filterPayload })
}, { deep: true })

const dateRangeModel = computed({
  get: () => ({
    startDate: state.filters.filterPayload.requestedStartDate || null,
    endDate: state.filters.filterPayload.requestedEndDate || null
  }),
  set: (value: { startDate: string | null, endDate: string | null }) => {
    state.filters.filterPayload.requestedStartDate = value.startDate || ''
    state.filters.filterPayload.requestedEndDate = value.endDate || ''
  }
})

function formatAmount(amount: number) {
  return amount !== undefined ? CommonUtils.formatAmount(amount) : ''
}

function formatDate(date: string | undefined) {
  return date ? CommonUtils.formatDisplayDate(date, dateDisplayFormat) : ''
}

const columns = computed<TableColumn<RefundRequestResult>[]>(() => {
  return [
    {
      accessorKey: 'invoiceId',
      header: 'Transaction ID',
      meta: {
        class: {
          th: 'header-transaction-id',
          td: 'header-transaction-id'
        }
      }
    },
    {
      accessorKey: 'requestedBy',
      header: 'Requested By',
      meta: {
        class: {
          th: 'header-requested-by',
          td: 'header-requested-by'
        }
      }
    },
    {
      accessorKey: 'requestedDate',
      header: 'Requested Date',
      meta: {
        class: {
          th: 'header-requested-date',
          td: 'header-requested-date'
        }
      }
    },
    {
      accessorKey: 'refundReason',
      header: 'Reason for Refund',
      meta: {
        class: {
          th: 'header-refund-reason',
          td: 'header-refund-reason'
        }
      }
    },
    {
      accessorKey: 'transactionAmount',
      header: 'Transaction Amount ',
      meta: {
        class: {
          th: 'header-transaction-amount',
          td: 'header-transaction-amount'
        }
      }
    },
    {
      accessorKey: 'refundAmount',
      header: 'Refund Amount',
      meta: {
        class: {
          th: 'header-refund-amount',
          td: 'header-refund-amount'
        }
      }
    },
    {
      accessorKey: 'paymentMethod',
      header: 'Payment Method',
      meta: {
        class: {
          th: 'header-payment-method',
          td: 'header-payment-method'
        }
      }
    },
    {
      accessorKey: 'actions',
      header: 'Actions',
      meta: {
        class: {
          th: 'header-action',
          td: 'header-action'
        }
      }
    }
  ]
})
</script>

<template>
  <div>
    <div class="bg-white rounded shadow-sm border border-[var(--color-divider)] overflow-hidden">
      <div class="relative rounded-t-lg px-2 py-3.5 flex-shrink-0 search-header-bg">
        <div class="flex">
          <UIcon
            name="i-mdi-format-list-bulleted"
            class="text-primary text-3xl mr-3"
            style="margin-top: 5px;"
          />
          <h2 class="table-header-text font-bold">
            {{ tableTitle }} ({{ state.totalResults }})
          </h2>
        </div>
      </div>
      <div
        ref="scrollEl"
        class="w-full overflow-x-auto overflow-y-auto"
        style="max-height: calc(100vh - 300px);"
      >
        <UTable
          ref="table"
          :data="state.results"
          :columns="columns"
          :loading="state.loading"
          sticky
          class="sticky-table"
        >
          <template #body-top>
            <tr class="sticky-row header-row-2 bg-[var(--color-white)]" role="row">
              <th class="text-left table-filter-input" scope="col">
                <UInput
                  id="transaction-id-filter"
                  v-model="state.filters.filterPayload.invoiceId"
                  name="transaction-id-filter"
                  placeholder="Transaction ID"
                  aria-label="Filter by Transaction ID"
                  size="md"
                  class="w-full"
                  @update:model-value="debouncedUpdateFilter('invoiceId', $event)"
                />
              </th>
              <th class="text-left table-filter-input" scope="col">
                <UInput
                  id="requested-by-filter"
                  v-model="state.filters.filterPayload.requestedBy"
                  name="requested-by-filter"
                  placeholder="Requested By"
                  aria-label="Filter by Requested By"
                  size="md"
                  class="w-full"
                  @update:model-value="debouncedUpdateFilter('requestedBy', $event)"
                />
              </th>
              <th class="text-left table-filter-input" scope="col">
                <DateRangeFilter
                  v-model="dateRangeModel"
                  placeholder="Request Date"
                  aria-label="Filter by request date range"
                  class="w-full"
                  @change="onDateRangeChange"
                />
              </th>
              <th class="text-left table-filter-input" scope="col">
                <UInput
                  id="refund-reason-filter"
                  v-model="state.filters.filterPayload.refundReason"
                  name="refund-reason-filter"
                  placeholder="Reason for Refund"
                  aria-label="Filter by refund reason"
                  size="md"
                  class="w-full"
                  @update:model-value="debouncedUpdateFilter('refundReason', $event)"
                />
              </th>
              <th class="text-left table-filter-input" scope="col">
                <UInput
                  id="transaction-amount-filter"
                  v-model="state.filters.filterPayload.transactionAmount"
                  name="transaction-amount-filter"
                  placeholder="Transaction Amount"
                  aria-label="Filter by transaction amount"
                  size="md"
                  class="w-full"
                  @update:model-value="debouncedUpdateFilter('transactionAmount', $event)"
                />
              </th>
              <th class="text-left table-filter-input" scope="col">
                <UInput
                  id="refund-amount-filter"
                  v-model="state.filters.filterPayload.refundAmount"
                  name="refund-amount-filter"
                  placeholder="Refund Amount"
                  aria-label="Filter by refund amount"
                  size="md"
                  class="w-full"
                  @update:model-value="debouncedUpdateFilter('refundAmount', $event)"
                />
              </th>
              <th class="text-left table-filter-input" scope="col">
                <StatusList
                  v-model="paymentMethodModel"
                  :list="PaymentMethodSelectItems"
                  :map-fn="paymentMethodMapFn"
                  placeholder="Type"
                  aria-label="Filter by short name type"
                  class="w-full"
                />
              </th>
              <th class="clear-filters-th" scope="col">
                <UButton
                  v-if="state.filters.isActive"
                  label="Clear Filters"
                  aria-label="Clear all filters"
                  variant="outline"
                  color="primary"
                  trailing-icon="i-mdi-close"
                  size="md"
                  class="clear-filters-btn"
                  @click="clearFilters"
                />
              </th>
            </tr>
          </template>

          <template #requestedDate-cell="{ row }">
            <span>{{ formatDate(row.original.requestedDate) }}</span>
          </template>

          <template #transactionAmount-cell="{ row }">
            <div class="flex items-center justify-start gap-2">
              <span>{{ formatAmount(row.original.transactionAmount) }}</span>
            </div>
          </template>

          <template #refundAmount-cell="{ row }">
            <div class="flex items-center justify-start gap-2">
              <span>{{ formatAmount(row.original.refundAmount) }}</span>
            </div>
          </template>

          <template #paymentMethod-cell="{ row }">
            <span>{{ getPaymentTypeDisplayName(row.original.paymentMethod) }} </span>
          </template>

          <template #actions-cell="{ row }">
            <div class="flex items-center justify-end gap-2">
              <UButton
                label="View Details"
                color="primary"
                class="btn-table font-normal"
                @click="navigateToDetails(row.original.invoiceId, row.original.refundId)"
              />
            </div>
          </template>

          <template #loading>
            <div class="text-center py-8">
              Loading Short names...
            </div>
          </template>

          <template #empty>
            <div class="text-center py-8 text-gray-600">
              No records to show.
            </div>
          </template>
        </UTable>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  @use '~/assets/scss/search-table.scss';
  @use '~/assets/scss/colors.scss' as *;

  :deep(table) {
    table-layout: fixed;
    width: 100%;
  }

  :deep(table th),
  :deep(table td) {
    width: 16.666% !important;
  }

  :deep(.sticky-row th .w-full),
  :deep(.sticky-row th > div),
  :deep(.sticky-row th input),
  :deep(.sticky-row th .ui-input),
  :deep(.sticky-row th [class*="UInput"]) {
    width: 100% !important;
    max-width: 100% !important;
  }

.search-header-bg {
  background-color: var(--color-bg-light-blue) !important;
  opacity: 1 !important;
}
</style>
