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
import { useShortNameTypeList } from '@/composables/common/useStatusList'

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

const { list: shortNameTypeList, mapFn: shortNameTypeMapFn } = useShortNameTypeList()

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
const hasLoadedData = ref(false)

const updateStickyHeaderHeight = () => {
  const el = scrollEl.value
  if (!el) { return }

  const thead = el.querySelector('thead')
  const height = thead?.getBoundingClientRect().height ?? 0
  el.style.setProperty('--search-sticky-header-height', `${Math.ceil(height)}px`)
}

onMounted(async () => {
  await loadData()
  hasLoadedData.value = true
  isInitialLoad.value = false
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
    // Only allow infinite scroll to trigger after initial data load is complete
    if (!hasLoadedData.value) { return }

    const reachedEnd = state.results.length >= state.totalResults
    if (!state.loading && !reachedEnd) {
      await infiniteScrollCallback(false)
    }
  },
  {
    distance: 20
  }
)
</script>

<template>
  <div>
    <div class="bg-white rounded shadow-sm border border-[var(--color-divider)] overflow-hidden">
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
            'sticky-table',
            state.highlightIndex >= 0 ? 'highlight-row' : ''
          ]"
        >
          <template #body-top>
            <tr class="sticky-row header-row-2 bg-[var(--color-white)]">
              <th class="text-left table-filter-input">
                <UInput
                  id="short-name-filter"
                  v-model="state.filters.filterPayload.shortName"
                  name="short-name-filter"
                  placeholder="Bank Short Name"
                  size="md"
                  class="w-full"
                  @update:model-value="debouncedUpdateFilter('shortName', $event)"
                />
              </th>
              <th class="text-left table-filter-input">
                <StatusList
                  v-model="shortNameTypeModel"
                  :list="shortNameTypeList"
                  :map-fn="shortNameTypeMapFn"
                  placeholder="Type"
                  class="w-full"
                />
              </th>
              <th class="text-left table-filter-input">
                <DateRangeFilter
                  v-model="dateRangeModel"
                  placeholder="Last Payment Received Date"
                  class="w-full"
                />
              </th>
              <th class="text-left table-filter-input">
                <UInput
                  id="credits-remaining-filter"
                  v-model="state.filters.filterPayload.creditsRemaining"
                  name="credits-remaining-filter"
                  placeholder="Unsettled Amount"
                  size="md"
                  class="w-full"
                  @update:model-value="debouncedUpdateFilter('creditsRemaining', $event)"
                />
              </th>
              <th class="text-left table-filter-input">
                <UInput
                  id="linked-accounts-count-filter"
                  v-model="state.filters.filterPayload.linkedAccountsCount"
                  name="linked-accounts-count-filter"
                  placeholder="Linked Accounts"
                  size="md"
                  class="w-full"
                  @update:model-value="debouncedUpdateFilter('linkedAccountsCount', $event)"
                />
              </th>
              <th class="text-right clear-filters-th">
                <UButton
                  v-if="state.filters.isActive"
                  label="Clear Filters"
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

          <template #creditsRemaining-header>
            <div class="flex items-center justify-start gap-1">
              <span>Unsettled Amount</span>
              <UIcon name="i-mdi-arrow-down" class="text-gray-500" />
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
                  trailing-icon="i-mdi-arrow-down"
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
  @use '~/assets/scss/table.scss';
  @use '~/assets/scss/colors.scss' as *;

  // Equal width columns for this 6-column table
  :deep(table) {
    table-layout: fixed;
    width: 100%;
  }

  :deep(table th),
  :deep(table td) {
    width: 16.666% !important;
  }

  // Force inputs to fill cell width
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
