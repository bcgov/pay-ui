<script setup lang="ts">
import type { EFTShortnameResponse, ShortNameSummaryState } from '@/interfaces/eft-short-name'
import type { ShortNameType } from '@/utils/constants'
import { ShortNameRefundLabel, ShortNameRefundStatus, UI_CONSTANTS } from '@/utils/constants'
import { useEftStore } from '@/stores/eft-store'
import CommonUtils from '@/utils/common-util'
import ShortNameUtils from '@/utils/short-name-util'
import { useShortNameTable } from '@/composables/eft/useShortNameTable'
import type { TableColumn } from '@nuxt/ui'
import { useDebounceFn, useInfiniteScroll } from '@vueuse/core'
import { useStickyHeader } from '@/composables/common/useStickyHeader'
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
  clearFiltersTrigger: 0,
  selectedShortName: {},
  accountLinkingErrorDialogTitle: '',
  accountLinkingErrorDialogText: '',
  isShortNameLinkingDialogOpen: false,
  highlightIndex: -1
})

const {
  loadTableSummaryData,
  updateFilter,
  getNext,
  resetReachedEnd,
  loadState
} = useShortNameTable(state)

const eftStore = useEftStore()

const { list: shortNameTypeList, mapFn: shortNameTypeMapFn } = useShortNameTypeList()

const linkingDialogOpen = ref(false)
const selectedShortNameForLinking = ref<EFTShortnameResponse | null>(null)

const debouncedUpdateFilter = useDebounceFn((col: string, val: string | number) => {
  updateFilter(col, val)
}, UI_CONSTANTS.DEBOUNCE_DELAY_MS)

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

function openAccountLinkingDialog(item: EFTShortnameResponse) {
  selectedShortNameForLinking.value = item
  linkingDialogOpen.value = true
}

async function onLinkAccount(account: unknown) {
  emit('on-link-account', account)
  await loadTableSummaryData('page', 1)
}

async function onDateRangeChange() {
  eftStore.setSummaryFilter({ ...state.filters.filterPayload })
  await loadTableSummaryData('page', 1)
}

async function clearFilters() {
  state.clearFiltersTrigger++
  state.filters.filterPayload = defaultFilterPayload()
  state.filters.isActive = false
  eftStore.clearSummaryFilter()
  eftStore.setSummaryTableSettings(null)
  resetReachedEnd()
  await loadTableSummaryData()
}

function saveTableSettings() {
  eftStore.setSummaryTableSettings({
    filterPayload: { ...state.filters.filterPayload },
    pageNumber: state.filters.pageNumber
  })
}

function navigateToDetails(id: number) {
  saveTableSettings()
  navigateTo(`/eft/shortname-details/${id}`)
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
  const savedSettings = eftStore.summaryTableSettings
  if (savedSettings) {
    const payload = { ...savedSettings.filterPayload } as typeof state.filters.filterPayload
    if (payload.shortNameType === 'ALL' || payload.shortNameType === '') {
      payload.shortNameType = ''
    }
    state.filters.filterPayload = { ...state.filters.filterPayload, ...payload }
    state.filters.pageNumber = savedSettings.pageNumber
    eftStore.setSummaryTableSettings(null)
  } else {
    const savedFilter = eftStore.summaryFilter
    if (savedFilter) {
      const payload = { ...savedFilter }
      if (payload.shortNameType === 'ALL' || payload.shortNameType === '') {
        payload.shortNameType = ''
      }
      state.filters.filterPayload = { ...state.filters.filterPayload, ...payload }
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
    state.filters.filterPayload.paymentReceivedStartDate = value.startDate || ''
    state.filters.filterPayload.paymentReceivedEndDate = value.endDate || ''
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
          ref="table"
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
            <tr class="sticky-row header-row-2 bg-[var(--color-white)]" role="row">
              <th class="text-left table-filter-input" scope="col">
                <UInput
                  id="short-name-filter"
                  v-model="state.filters.filterPayload.shortName"
                  name="short-name-filter"
                  placeholder="Bank Short Name"
                  aria-label="Filter by bank short name"
                  size="md"
                  class="w-full"
                  @update:model-value="debouncedUpdateFilter('shortName', $event)"
                />
              </th>
              <th class="text-left table-filter-input" scope="col">
                <StatusList
                  v-model="shortNameTypeModel"
                  :list="shortNameTypeList"
                  :map-fn="shortNameTypeMapFn"
                  placeholder="Type"
                  aria-label="Filter by short name type"
                  class="w-full"
                />
              </th>
              <th class="text-left table-filter-input" scope="col">
                <DateRangeFilter
                  v-model="dateRangeModel"
                  placeholder="Last Payment Received Date"
                  aria-label="Filter by payment received date range"
                  class="w-full"
                  @change="onDateRangeChange"
                />
              </th>
              <th class="text-left table-filter-input" scope="col">
                <UInput
                  id="credits-remaining-filter"
                  v-model="state.filters.filterPayload.creditsRemaining"
                  name="credits-remaining-filter"
                  placeholder="Unsettled Amount"
                  aria-label="Filter by unsettled amount"
                  size="md"
                  class="w-full"
                  @update:model-value="debouncedUpdateFilter('creditsRemaining', $event)"
                />
              </th>
              <th class="text-left table-filter-input" scope="col">
                <UInput
                  id="linked-accounts-count-filter"
                  v-model="state.filters.filterPayload.linkedAccountsCount"
                  name="linked-accounts-count-filter"
                  placeholder="Linked Accounts"
                  aria-label="Filter by linked accounts count"
                  size="md"
                  class="w-full"
                  @update:model-value="debouncedUpdateFilter('linkedAccountsCount', $event)"
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
            <span>{{ getShortNameTypeDescription(row.original.shortNameType) }}</span>
          </template>

          <template #lastPaymentReceivedDate-cell="{ row }">
            <span>{{ formatLastPaymentDate(row.original.lastPaymentReceivedDate) }}</span>
          </template>

          <template #creditsRemaining-cell="{ row }">
            <div class="flex items-center justify-start gap-2">
              <span>{{ CommonUtils.formatAmount(row.original.creditsRemaining) }}</span>
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
            <div class="flex items-center justify-end gap-2">
              <UButton
                label="View Details"
                color="primary"
                class="btn-table font-normal"
                @click="navigateToDetails(row.original.id)"
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

    <ShortNameLinkingDialog
      v-model:open="linkingDialogOpen"
      :short-name="selectedShortNameForLinking"
      @link-account="onLinkAccount"
    />
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
