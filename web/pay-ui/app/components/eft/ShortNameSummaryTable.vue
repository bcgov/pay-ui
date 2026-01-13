<script setup lang="ts">
import type { EFTShortnameResponse, ShortNameSummaryState } from '@/interfaces/eft-short-name'
import { ShortNameRefundLabel, ShortNameRefundStatus } from '@/utils/constants'
import { useEftStore } from '@/stores/eft-store'
import CommonUtils from '@/utils/common-util'
import ShortNameUtils from '@/utils/short-name-util'
import { useShortNameTable } from '@/composables/eft/useShortNameTable'
import { usePayModals } from '@/composables/pay-modals'
import { DateTime } from 'luxon'
import type { TableColumn } from '@nuxt/ui'
import { useInfiniteScroll, useDebounceFn, useResizeObserver } from '@vueuse/core'
import { ShortNameType } from '@/utils/constants'

interface Props {
  linkedAccount?: EFTShortnameResponse
  currentTab?: number
}

const props = withDefaults(defineProps<Props>(), {
  linkedAccount: undefined,
  currentTab: 0
})

const emit = defineEmits<{
  'on-link-account': [account: unknown]
  'shortname-state-total': [total: number]
}>()

const dateDisplayFormat = 'MMMM dd, yyyy'
const dateRangeFormat = 'YYYY-MM-DD'

const state = reactive<ShortNameSummaryState>({
  results: [],
  totalResults: 0,
  filters: {
    isActive: false,
    pageNumber: 1,
    pageLimit: 20,
    filterPayload: {
      shortName: '',
      shortNameType: '',
      creditsRemaining: '',
      linkedAccountsCount: '',
      paymentReceivedStartDate: '',
      paymentReceivedEndDate: ''
    }
  },
  loading: false,
  actionDropdown: [],
  options: {},
  shortNameLookupKey: 0,
  dateRangeReset: 0,
  clearFiltersTrigger: 0,
  selectedShortName: {},
  showDatePicker: false,
  dateRangeSelected: false,
  dateRangeText: '',
  accountLinkingErrorDialogTitle: '',
  accountLinkingErrorDialogText: '',
  isShortNameLinkingDialogOpen: false,
  startDate: '',
  endDate: '',
  highlightIndex: -1
})

const {
  infiniteScrollCallback,
  loadTableSummaryData,
  updateFilter
} = useShortNameTable(state)

const eftStore = useEftStore()

const debouncedUpdateFilter = useDebounceFn((col: string, val: string | number) => {
  updateFilter(col, val)
}, 300)

const shortNameTypeModel = computed({
  get: () => {
    return state.filters.filterPayload.shortNameType
  },
  set: (value: string) => {
    onShortNameTypeChange(value)
  }
})

function onShortNameTypeChange(value: string) {
  const stringValue = value || ''
  state.filters.filterPayload.shortNameType = value as ShortNameType
  updateFilter('shortNameType', stringValue)
}

function getShortNameTypeDescription(shortNameType: ShortNameType | string | undefined) {
  return ShortNameUtils.getShortNameTypeDescription(shortNameType as string)
}

function formatLastPaymentDate(date: string | undefined) {
  return date ? CommonUtils.formatDisplayDate(date, dateDisplayFormat) : ''
}

function defaultFilterPayload() {
  return {
    shortName: '',
    shortNameType: '',
    creditsRemaining: '',
    linkedAccountsCount: '',
    paymentReceivedStartDate: '',
    paymentReceivedEndDate: ''
  }
}

function formatAmount(amount: number) {
  return amount !== undefined ? CommonUtils.formatAmount(amount) : ''
}

const payModals = usePayModals()

async function openAccountLinkingDialog(item: EFTShortnameResponse) {
  // @ts-ignore
  await payModals.shortNameLinkingModal.open({
    selectedShortName: item,
    onLinkAccount: async (account: unknown) => {
      await onLinkAccount(account)
    }
  })
}

function setDateRangeText(startDate: string, endDate: string) {
  if (!startDate || !endDate) {
    return ''
  }
  state.startDate = DateTime.fromISO(startDate).toFormat(dateRangeFormat)
  state.endDate = DateTime.fromISO(endDate).toFormat(dateRangeFormat)
  return `${state.startDate} - ${state.endDate}`
}

async function onLinkAccount(account: unknown) {
  emit('on-link-account', account)
  await loadTableSummaryData('page', 1)
}

async function updateDateRange({ endDate, startDate }: { endDate?: string, startDate?: string }) {
  state.showDatePicker = false
  state.dateRangeSelected = !!(endDate && startDate)
  if (!state.dateRangeSelected) {
    endDate = ''
    startDate = ''
  }
  const startDateString = CommonUtils.formatDisplayDate(startDate || '', 'start')
  const endDateString = CommonUtils.formatDisplayDate(endDate || '', 'end')
  state.dateRangeText = state.dateRangeSelected ? setDateRangeText(startDateString, endDateString) : ''
  state.filters.filterPayload.paymentReceivedStartDate = startDateString
  state.filters.filterPayload.paymentReceivedEndDate = endDateString
  eftStore.setSummaryFilter({ ...state.filters.filterPayload })
  await loadTableSummaryData('page', 1)
}

async function clearFilters() {
  state.clearFiltersTrigger++
  state.dateRangeReset++
  state.filters.filterPayload = defaultFilterPayload()
  state.filters.isActive = false
  state.dateRangeText = ''
  state.dateRangeSelected = false
  eftStore.clearSummaryFilter()
  await loadTableSummaryData()
}

function onLinkedAccount(account: EFTShortnameResponse) {
  if (!account) { return }

  const { results } = state
  const shortName = results.find(result => result.id === account.shortNameId)

  if (!shortName) { return }

  const toast = useToast()
  toast.add({
    description: `Bank short name ${shortName.shortName} was successfully linked.`,
    icon: 'i-mdi-check-circle',
    color: 'success'
  })

  state.highlightIndex = results.indexOf(shortName)

  setTimeout(() => {
    state.highlightIndex = -1
  }, 4000)
}

watch(() => props.linkedAccount, (account: EFTShortnameResponse | undefined) => {
  if (account) {
    onLinkedAccount(account)
  }
})

watch(() => props.currentTab, () => {
  loadData()
})

watch(() => state.totalResults, (total) => {
  emit('shortname-state-total', total)
})

const scrollEl = useTemplateRef<HTMLElement>('scrollEl')
const isInitialLoad = ref(true)

const updateStickyHeaderHeight = () => {
  const el = scrollEl.value
  if (!el) { return }

  const thead = el.querySelector('thead')
  const height = thead?.getBoundingClientRect().height ?? 0
  el.style.setProperty('--search-sticky-header-height', `${Math.ceil(height)}px`)
}

onMounted(async () => {
  await loadData()
  await nextTick()
  updateStickyHeaderHeight()
})

useResizeObserver(scrollEl, () => {
  updateStickyHeaderHeight()
})

async function loadData() {
  const savedFilter = eftStore.summaryFilter
  if (savedFilter) {
    const payload = { ...savedFilter }
    // Convert 'ALL' or empty string to null for shortNameType
    if (payload.shortNameType === 'ALL' || payload.shortNameType === '') {
      payload.shortNameType = ''
    }
    state.filters.filterPayload = { ...state.filters.filterPayload, ...payload }
    if (payload.paymentReceivedStartDate) {
      state.dateRangeText = setDateRangeText(payload.paymentReceivedStartDate, payload.paymentReceivedEndDate)
      state.dateRangeSelected = true
    }
  }
  await loadTableSummaryData()
}

watch(() => state.filters.filterPayload, (filterPayload) => {
  eftStore.setSummaryFilter({ ...filterPayload })
}, { deep: true })

const dateRangeModel = computed({
  get: () => ({
    startDate: state.filters.filterPayload.paymentReceivedStartDate || null,
    endDate: state.filters.filterPayload.paymentReceivedEndDate || null
  }),
  set: (value: { startDate: string | null, endDate: string | null }) => {
    if (value.startDate && value.endDate) {
      updateDateRange({
        startDate: value.startDate,
        endDate: value.endDate
      })
    } else if (!value.startDate && !value.endDate) {
      updateDateRange({
        startDate: '',
        endDate: ''
      })
    }
  }
})

const columns = computed<TableColumn<EFTShortnameResponse>[]>(() => {
  // TODO Session state stuff

  return [
    {
      accessorKey: 'shortName',
      header: 'Short Name',
      meta: {
        class: {
          th: 'header-short-name',
          td: 'header-short-name'
        }
      }
    },
    {
      accessorKey: 'shortNameType',
      header: 'Type',
      meta: {
        class: {
          th: 'header-type',
          td: 'header-type'
        }
      }
    },
    {
      accessorKey: 'lastPaymentReceivedDate',
      header: 'Last Payment Received Date',
      meta: {
        class: {
          th: 'header-date',
          td: 'header-date'
        }
      }
    },
    {
      accessorKey: 'creditsRemaining',
      header: 'Unsettled Amount',
      meta: {
        class: {
          th: 'header-unsettled-amount',
          td: 'header-unsettled-amount'
        }
      }
    },
    {
      accessorKey: 'linkedAccountsCount',
      header: 'Linked Accounts',
      meta: {
        class: {
          th: 'header-linked-accounts',
          td: 'header-linked-accounts'
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

useInfiniteScroll(
  scrollEl,
  async () => {
    if (!state.loading) {
      await infiniteScrollCallback(isInitialLoad.value)
      isInitialLoad.value = false
    }
  },
  {
    distance: 200
  }
)
</script>

<template>
  <div>
    <div class="bg-white rounded shadow-sm">
      <div class="short-names-header px-4 py-3 border-b border-gray-200">
        <h2 class="text-xl font-bold text-gray-900">
          All Short Names
          <span class="font-normal">
            ({{ state.totalResults }})
          </span>
        </h2>
      </div>

      <div
        ref="scrollEl"
        class="w-full overflow-x-auto overflow-y-auto"
        style="max-height: calc(100vh - 300px);"
      >
        <UTable
          :data="state.results"
          :columns="columns"
          :loading="state.loading"
          sticky
          :class="[
            'short-name-summaries',
            'sticky-table',
            state.highlightIndex >= 0 ? 'highlight-row' : ''
          ]"
        >
          <template #body-top>
            <tr class="sticky-row header-row-2 bg-white">
              <th class="text-left px-1 py-1 table-filter-input header-short-name">
                <UInput
                  id="short-name-filter"
                  v-model="state.filters.filterPayload.shortName"
                  name="short-name-filter"
                  placeholder="Bank Short Name"
                  size="md"
                  class="w-full pt-0"
                  @update:model-value="debouncedUpdateFilter('shortName', $event)"
                />
              </th>
              <th class="text-left px-1 py-1 table-filter-input header-type">
                <USelect
                  id="short-name-type-filter"
                  v-model="shortNameTypeModel"
                  name="short-name-type-filter"
                  :items="ShortNameUtils.ShortNameTypeItems"
                  placeholder="Type"
                  size="md"
                  class="w-full"
                />
              </th>
              <th class="text-left px-1 py-1 table-filter-input">
                <DateRangeFilter
                  v-model="dateRangeModel"
                  placeholder="Last Payment Received Date"
                />
              </th>
              <th class="text-left px-1 py-1 table-filter-input">
                <UInput
                  id="credits-remaining-filter"
                  v-model="state.filters.filterPayload.creditsRemaining"
                  name="credits-remaining-filter"
                  placeholder="Unsettled Amount"
                  size="md"
                  class="pt-0"
                  @update:model-value="debouncedUpdateFilter('creditsRemaining', $event)"
                />
              </th>
              <th class="text-left px-1 py-1 table-filter-input">
                <UInput
                  id="linked-accounts-count-filter"
                  v-model="state.filters.filterPayload.linkedAccountsCount"
                  name="linked-accounts-count-filter"
                  placeholder="Linked Accounts"
                  size="md"
                  class="pt-0"
                  @update:model-value="debouncedUpdateFilter('linkedAccountsCount', $event)"
                />
              </th>
              <th class="text-right px-1 py-1">
                <UButton
                  v-if="state.filters.isActive"
                  label="Clear Filters"
                  variant="outline"
                  trailing-icon="i-mdi-close"
                  size="md"
                  @click="clearFilters"
                />
              </th>
            </tr>
          </template>

          <template #creditsRemaining-header>
            <div class="flex items-center justify-start gap-1">
              <span>Unsettled Amount</span>
              <UIcon name="i-mdi-menu-down" class="text-gray-500" />
            </div>
          </template>

          <template #shortName-cell="{ row }">
            <span>{{ row.original.shortName }}</span>
          </template>

          <template #shortNameType-cell="{ row }">
            <span>{{ getShortNameTypeDescription(row.original.shortNameType as any) }}</span>
          </template>

          <template #lastPaymentReceivedDate-cell="{ row }">
            <span>{{ formatLastPaymentDate(row.original.lastPaymentReceivedDate) }}</span>
          </template>

          <template #creditsRemaining-cell="{ row }">
            <div class="flex items-center justify-start gap-2">
              <span>{{ formatAmount(row.original.creditsRemaining) }}</span>
              <UBadge
                v-if="row.original.refundStatus === ShortNameRefundStatus.PENDING_APPROVAL"
                color="primary"
                variant="solid"
                size="sm"
              >
                {{ ShortNameRefundLabel.PENDING_APPROVAL }}
              </UBadge>
            </div>
          </template>

          <template #linkedAccountsCount-cell="{ row }">
            <span>{{ row.original.linkedAccountsCount }}</span>
          </template>

          <template #actions-cell="{ row }">
            <div class="flex items-center justify-center gap-2">
              <UButton
                label="View Details"
                color="primary"
                class="btn-table font-normal"
                @click="navigateTo(`/eft/shortname-details/${row.original.id}`)"
              />
              <UDropdownMenu
                :items="[
                  [
                    {
                      label: row.original.linkedAccountsCount > 0 ? 'Add Linkage' : 'Link to Account',
                      icon: 'i-mdi-plus',
                      onSelect: () => openAccountLinkingDialog(row.original)
                    }
                  ]
                ]"
              >
                <UButton
                  color="primary"
                  class="btn-table"
                  trailing-icon="i-mdi-menu-down"
                />
              </UDropdownMenu>
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
  @use '~/assets/scss/colors.scss' as *;
.search-header-bg {
  background-color: #e0e7ed !important;
  opacity: 1 !important;
}

:deep(table td) {
  color: var(--color-text-secondary);
}

:deep(.sticky-row) {
  position: sticky;
  top: var(--search-sticky-header-height, 48px);
  z-index: 19;
  background-color: #ffffff !important;
  background: #ffffff !important;
  margin: 0 !important;
  transform: none !important;
}

:deep(.sticky-row th) {
  background-color: #ffffff !important;
  background: #ffffff !important;
  border-top: none !important;
  border-left: none !important;
  border-right: none !important;
  border-bottom: 1px solid var(--color-divider) !important;
  padding-left: 0.25rem !important;
  padding-right: 0.25rem !important;
  padding-top: 1rem !important;
  padding-bottom: 1rem !important;
  vertical-align: middle;
}

:deep(.sticky-row th:first-child) {
  border-left: none !important;
}

:deep(.sticky-row th:last-child) {
  border-right: none !important;
}

:deep(.sticky-row td) {
  background-color: white !important;
  background: white !important;
  opacity: 1 !important;
}

:deep(.sticky-row th *),
:deep(.table-filter-input) {
  &,
  & *,
  & input::placeholder,
  & .placeholder::placeholder,
  & [placeholder]::placeholder {
    font-weight: 400 !important;
    color: var(--color-text-secondary) !important;
  }
}

:deep(.ui-select button) {
  padding-left: 0.75rem !important;
}

// Set 14px font size for DateRangeFilter and StatusList - override global button font size
:deep(.table-filter-input:is(.date, .status-list-wrapper, status-list)),
:deep(.table-filter-input:is(.date, .status-list-wrapper, status-list) *),
:deep(.table-filter-input :is(.date, .status-list-wrapper, status-list, .date-range-filter-button,
  .date-range-placeholder)),
:deep(.table-filter-input :is(.date, .status-list-wrapper, status-list, .date-range-filter-button,
  .date-range-placeholder) *) {
  font-size: 14px !important;
}

:deep(.overflow-x-auto) {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: white !important;
  margin: 0 !important;
  transform: none !important;
  position: relative;
}

:deep(.overflow-x-auto > *) {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.columns-to-show-btn {
  background-color: #FFFFFF !important;
}

.columns-to-show-btn:hover,
.columns-to-show-btn:focus,
.columns-to-show-btn:active {
  background-color: #FFFFFF !important;
}

:deep(.columns-to-show-btn) {
  background-color: #FFFFFF !important;
}

:deep(.columns-to-show-btn:hover),
:deep(.columns-to-show-btn:focus),
:deep(.columns-to-show-btn:active) {
  background-color: #FFFFFF !important;
}

.table-scroll {
  max-height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  height: 100%;
}

.table-scroll,
.table-scroll * {
  transform: none !important;
  will-change: auto !important;
}

:deep(.sticky-table thead th) {
  position: sticky;
  top: 0;
  z-index: 20;
  background: var(--ui-bg, #ffffff);
}

:deep(.sticky-table .relative) {
  overflow: visible !important;
}

:deep(.sticky-table table) {
  border-collapse: separate;
  border-spacing: 0;
}

:deep(table) {
  border-spacing: 0;
  margin: 0 !important;
  padding: 0 !important;
  transform: none !important;
  position: relative;
}

:deep(table),
:deep(table thead),
:deep(table thead tr),
:deep(table thead tr th) {
  background-color: #ffffff !important;
  background: #ffffff !important;
}

:deep(table thead) {
  background-color: #ffffff !important;
  background: #ffffff !important;
  margin: 0 !important;
  transform: none !important;
}

:deep(table tbody) {
  margin: 0 !important;
  padding: 0 !important;
  transform: none !important;
}

:deep(table tbody tr) {
  background-color: transparent;
  margin: 0 !important;
  transform: none !important;
}

:deep(table thead tr th) {
  color: var(--color-text-primary);
  padding-left: 0.25rem !important;
  padding-right: 0.25rem !important;
  font-weight: 700 !important;
  background-color: #ffffff !important;
  background: #ffffff !important;
  border-top: 1px solid var(--color-divider) !important;
  border-bottom: 1px solid var(--color-divider) !important;
  border-left: none !important;
  border-right: none !important;
}

:deep(table thead tr th::before),
:deep(table thead tr th::after) {
  display: none !important;
}

:deep(table thead tr th:first-child) {
  padding-left: 1rem !important;
}

:deep(table thead tr th:last-child) {
  padding-right: 1rem !important;
  text-align: right !important;
  border-right: none !important;
  border-left: none !important;
}

:deep(table tbody tr td:first-child) {
  padding-left: 1rem !important;
}

:deep(table tbody tr td:last-child) {
  padding-right: 1rem !important;
  border-right: none !important;
  border-left: none !important;
}

:deep(table thead tr th.header-action),
:deep(table tbody tr td:has(.btn-table)) {
  border-right: none !important;
  border-left: none !important;
}

:deep(table thead tr th:last-child) {
  border-top: 1px solid var(--color-divider) !important;
  border-bottom: 1px solid var(--color-divider) !important;
  border-left: none !important;
  border-right: none !important;
}

:deep(.sticky-row th:first-child) {
  padding-left: 1rem !important;
}

:deep(.sticky-row th:last-child) {
  padding-right: 1rem !important;
  border-right: none !important;
  border-bottom: 1px solid var(--color-divider) !important;
}

:deep(table tbody tr td) {
  word-wrap: break-word !important;
  overflow-wrap: break-word !important;
  white-space: normal !important;
  border-bottom: 1px solid var(--color-divider) !important;
  border-left: none !important;
  border-right: none !important;
}

:deep(.sticky-row) {
  :is(.ui-select, status-list, .input-text) {
    &, * {
      font-weight: 400 !important;
    }

    .ui-select button {
      padding-left: 0.75rem !important;
    }
  }

  :is(.ui-input, input:is([type="text"], [type="number"])) {
    &, & input {
      padding-left: 0.75rem !important;
    }
  }
}

// Make table divider thicker
:deep(tr.absolute.z-\[1\].left-0.w-full.h-px),
:deep(tr[class*="absolute"][class*="z-[1]"][class*="h-px"]) {
  height: 2px !important;
}

// Clear Filters button styling
:deep(.clear-filters-th .clear-filters-btn),
:deep(.clear-filters-th .ui-button) {
  padding-left: 0.5rem !important;
  padding-right: 0.5rem !important;
  font-size: 0.875rem !important;
  height: 38px !important;
  color: var(--color-primary, #2563eb) !important;

  * {
    color: var(--color-primary, #2563eb) !important;
  }

  span,
  label {
    color: var(--color-primary, #2563eb) !important;
  }
}

:deep(.header-short-name) {
  min-width: 350px !important;
}
:deep(.header-type) {
  min-width: 180px !important;
}
:deep(.header-date) {
  min-width: 200px !important;
}
:deep(.header-unsettled-amount) {
  min-width: 121px !important;
}
:deep(.header-linked-accounts) {
  min-width: 160px !important;
}
:deep(.header-action) {
  min-width: 130px !important;
  text-align: right;
}

.header {
  .sticky {
    background-color: white;
  }

  .header-row-2 {
    th > div {
      width: 100%;
    }
    .date button {
      padding: 6px 10px !important;
      overflow: hidden;
      white-space: nowrap;
      width: 200px !important;
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

.wide-dropdown {
  width: 200px !important;
}

// Override global label font size for search page
:deep(label),
:deep(.ui-form-label) {
  font-size: inherit;
}

:deep(.date-range-placeholder, .date-range-result) {
    font-size: 14px !important;
  }

// Exclude DateRangeFilter and StatusList from 16px font size
:deep(:is(.date, .date-range-filter-button, .status-list-wrapper, .table-filter-input,
  .table-filter-input *)) {
  :is(label, .ui-form-label) {
    font-size: inherit !important;
  }
  :is(span) {
    font-size: 14px !important;
  }
}

:deep(.date-range-filter-button) {
  ::is(span) {
    font-size: 14px !important;
  }
}

.short-name-summaries {
  border: 1px solid #e5e7eb;
}

.short-names-header {
  background-color: #e0e7ed;
}
</style>
// Override global label font size for search page
