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
import { useInfiniteScroll, useDebounceFn } from '@vueuse/core'

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
  showDatePicker: false,
  dateRangeSelected: false,
  dateRangeText: '',
  accountLinkingErrorDialogTitle: '',
  accountLinkingErrorDialogText: '',
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
    const value = state.filters.filterPayload.shortNameType
    return value ? (value as any) : undefined
  },
  set: (value: string) => {
    onShortNameTypeChange(value)
  }
})

function onShortNameTypeChange(value: string) {
  const stringValue = value || ''
  state.filters.filterPayload.shortNameType = value
  updateFilter('shortNameType', stringValue)
}

function getShortNameTypeDescription(shortNameType: string) {
  return ShortNameUtils.getShortNameTypeDescription(shortNameType)
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

const { shortNameLinkingModal } = usePayModals()

async function openAccountLinkingDialog(item: EFTShortnameResponse) {
  await shortNameLinkingModal.open({
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

onMounted(async () => {
  await loadData()
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
          th: 'min-w-[180px]',
          td: 'min-w-[180px]'
        }
      }
    },
    {
      accessorKey: 'shortNameType',
      header: 'Type',
      meta: {
        class: {
          th: 'min-w-[120px]',
          td: 'min-w-[120px]'
        }
      }
    },
    {
      accessorKey: 'lastPaymentReceivedDate',
      header: 'Last Payment Received Date',
      meta: {
        class: {
          th: 'min-w-[220px]',
          td: 'min-w-[220px]'
        }
      }
    },
    {
      accessorKey: 'creditsRemaining',
      header: 'Unsettled Amount',
      meta: {
        class: {
          th: 'min-w-[160px] text-left',
          td: 'min-w-[160px] text-left'
        }
      }
    },
    {
      accessorKey: 'linkedAccountsCount',
      header: 'Linked Accounts',
      meta: {
        class: {
          th: 'min-w-[140px]',
          td: 'min-w-[140px]'
        }
      }
    },
    {
      accessorKey: 'actions',
      header: 'Actions',
      meta: {
        class: {
          th: 'min-w-[180px]',
          td: 'min-w-[180px]'
        }
      }
    }
  ]
})

const table = useTemplateRef<HTMLElement>('table')
const isInitialLoad = ref(true)

useInfiniteScroll(
  table,
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
        ref="table"
        class="w-full overflow-x-auto overflow-y-auto"
        style="max-height: calc(100vh - 300px);"
      >
        <UTable
          :data="state.results"
          :columns="columns"
          :loading="state.loading"
          :class="[
            'short-name-summaries',
            state.highlightIndex >= 0 ? 'highlight-row' : ''
          ]"
        >
          <template #body-top>
            <tr class="sticky-row header-row-2 bg-white">
              <th class="text-left px-1 py-1">
                <UInput
                  id="short-name-filter"
                  v-model="state.filters.filterPayload.shortName"
                  name="short-name-filter"
                  placeholder="Bank Short Name"
                  size="md"
                  class="pt-0"
                  @update:model-value="debouncedUpdateFilter('shortName', $event)"
                />
              </th>
              <th class="text-left px-1 py-1">
                <USelect
                  id="short-name-type-filter"
                  v-model="shortNameTypeModel"
                  name="short-name-type-filter"
                  :items="ShortNameUtils.ShortNameTypeItems"
                  placeholder="Type"
                  size="md"
                />
              </th>
              <th class="text-left px-1 py-1">
                <DateRangeFilter
                  v-model="dateRangeModel"
                  placeholder="Last Payment Received Date"
                />
              </th>
              <th class="text-left px-1 py-1">
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
              <th class="text-left px-1 py-1">
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
            <span>{{ getShortNameTypeDescription(row.original.shortNameType) }}</span>
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
                size="sm"
                class="font-normal"
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
                  size="sm"
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
.short-name-summaries {
  border: 1px solid #e5e7eb;
}

.short-names-header {
  background-color: #e0e7ed;
}

:deep(.sticky-row) {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: white;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

:deep(.sticky-row th) {
  padding: 8px 4px;
}

:deep(table thead tr th) {
  padding: 12px 4px;
  font-size: 12.25px;
}

:deep(table tbody tr td) {
  padding: 12px 4px;
  color: #495057;
  font-weight: 700;
  font-size: 12.25px;
}

:deep(.header-row-2 input),
:deep(.header-row-2 select) {
  background-color: #f1f3f5;
  border: 1px solid #e5e7eb;
  color: #212529;
}

:deep(.header-row-2 input::placeholder),
:deep(.header-row-2 select::placeholder) {
  color: #919191;
  font-weight: 400;
  font-size: 12.25px;
}

:deep(.header-row-2 .ui-select) {
  background-color: #f1f3f5;
  border: none;
  border-bottom: 1px solid #e5e7eb;
  border-radius: 0.125rem 0.125rem 0 0;
  box-shadow: none;
}

:deep(.header-row-2 .ui-select:focus),
:deep(.header-row-2 .ui-select:focus-within) {
  border-bottom: 1px solid #e5e7eb;
  box-shadow: none;
  outline: none;
}

:deep(.header-row-2 .ui-select button) {
  background-color: #f1f3f5;
  color: #919191;
  font-weight: 400;
}

:deep(.header-row-2 .ui-select button[aria-expanded="true"]) {
  background-color: #f1f3f5;
  font-weight: 400;
}

:deep(.header-row-2 .ui-select [data-placeholder]) {
  font-weight: 400;
  color: #919191;
  font-size: 12.25px;
}

:deep(.header-row-2 .ui-select button span) {
  font-weight: 400;
  font-size: 12.25px;
}

:deep(.header-row-2 .ui-select button:not([data-selected="true"]) span) {
  font-weight: 400;
  color: #919191;
  font-size: 12.25px;
}

:deep(.header-row-2 .ui-select button span) {
  font-weight: 400;
}

:deep(.highlight-row) {
  background-color: #d4edda;
}

:deep(.highlight-row td) {
  background-color: #d4edda;
}
</style>
