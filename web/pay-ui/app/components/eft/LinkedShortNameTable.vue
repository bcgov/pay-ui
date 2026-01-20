<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { LinkedShortNameItem, LinkedShortNameState } from '@/interfaces/eft-short-name'
import { useDebounceFn, useInfiniteScroll } from '@vueuse/core'
import { useLinkedShortNameTable } from '@/composables/eft/useLinkedShortNameTable'
import { useStickyHeader } from '@/composables/common/useStickyHeader'
import CommonUtils from '@/utils/common-util'
import ShortNameUtils from '@/utils/short-name-util'
import { UI_CONSTANTS } from '@/utils/constants'
import type { ShortNameType } from '@/utils/constants'
import { useShortNameTypeList } from '@/composables/common/useStatusList'
import { useEftStore } from '@/stores/eft-store'

interface Props {
  currentTab?: number
}

const props = withDefaults(defineProps<Props>(), {
  currentTab: 0
})

const emit = defineEmits<{
  'shortname-state-total': [total: number]
}>()

const _dateDisplayFormat = 'MMMM dd, yyyy'

const state = reactive<LinkedShortNameState>({
  results: [],
  totalResults: 0,
  filters: {
    isActive: false,
    pageNumber: 1,
    pageLimit: 20,
    filterPayload: {
      shortName: '',
      shortNameType: '',
      accountName: '',
      accountNumber: '',
      branchName: '',
      amountOwing: '',
      statementId: ''
    }
  },
  loading: false
})

const { list: shortNameTypeList, mapFn: shortNameTypeMapFn } = useShortNameTypeList()

const eftStore = useEftStore()

const {
  loadTableData,
  updateFilter,
  getNext,
  resetReachedEnd,
  loadState
} = useLinkedShortNameTable(state)

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

function getShortNameTypeDescription(shortNameType: string | undefined) {
  return ShortNameUtils.getShortNameTypeDescription(shortNameType as string)
}

function defaultFilterPayload() {
  return {
    shortName: '',
    shortNameType: '',
    accountName: '',
    accountNumber: '',
    branchName: '',
    amountOwing: '',
    statementId: ''
  }
}

async function clearFilters() {
  resetReachedEnd()
  state.filters.filterPayload = defaultFilterPayload()
  state.filters.isActive = false
  eftStore.setLinkedTableSettings(null)
  await loadTableData()
}

function saveTableSettings() {
  eftStore.setLinkedTableSettings({
    filterPayload: { ...state.filters.filterPayload },
    pageNumber: state.filters.pageNumber
  })
}

function navigateToDetails(shortNameId: number) {
  saveTableSettings()
  navigateTo(`/eft/shortname-details/${shortNameId}`)
}

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
  // Restore saved settings if navigating back
  const savedSettings = eftStore.linkedTableSettings
  if (savedSettings) {
    const payload = savedSettings.filterPayload as typeof state.filters.filterPayload
    state.filters.filterPayload = { ...state.filters.filterPayload, ...payload }
    state.filters.pageNumber = savedSettings.pageNumber
    state.filters.isActive = Object.values(payload).some(
      value => value !== '' && value !== null && value !== undefined
    )
    // Clear the saved settings after restoring
    eftStore.setLinkedTableSettings(null)
  }
  await loadTableData()
  await nextTick()
  updateStickyHeaderHeight()
})

watch(() => props.currentTab, () => {
  if (props.currentTab === 1) {
    loadTableData()
  }
})

watch(() => state.totalResults, (total) => {
  emit('shortname-state-total', total)
})

const columns = computed<TableColumn<LinkedShortNameItem>[]>(() => {
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
      accessorKey: 'accountName',
      header: 'Account Name',
      meta: {
        class: {
          th: 'header-account-name',
          td: 'header-account-name'
        }
      }
    },
    {
      accessorKey: 'accountBranch',
      header: 'Branch Name',
      meta: {
        class: {
          th: 'header-branch-name',
          td: 'header-branch-name'
        }
      }
    },
    {
      accessorKey: 'accountId',
      header: 'Account Number',
      meta: {
        class: {
          th: 'header-account-number',
          td: 'header-account-number'
        }
      }
    },
    {
      accessorKey: 'amountOwing',
      header: 'Total Amount Owing',
      meta: {
        class: {
          th: 'header-amount-owing',
          td: 'header-amount-owing'
        }
      }
    },
    {
      accessorKey: 'statementId',
      header: 'Latest Statement Number',
      meta: {
        class: {
          th: 'header-statement',
          td: 'header-statement'
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
          class="sticky-table"
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
                <UInput
                  id="account-name-filter"
                  v-model="state.filters.filterPayload.accountName"
                  name="account-name-filter"
                  placeholder="Account Name"
                  aria-label="Filter by account name"
                  size="md"
                  class="w-full"
                  @update:model-value="debouncedUpdateFilter('accountName', $event)"
                />
              </th>
              <th class="text-left table-filter-input" scope="col">
                <UInput
                  id="branch-name-filter"
                  v-model="state.filters.filterPayload.branchName"
                  name="branch-name-filter"
                  placeholder="Branch Name"
                  aria-label="Filter by branch name"
                  size="md"
                  class="w-full"
                  @update:model-value="debouncedUpdateFilter('branchName', $event)"
                />
              </th>
              <th class="text-left table-filter-input" scope="col">
                <UInput
                  id="account-number-filter"
                  v-model="state.filters.filterPayload.accountNumber"
                  name="account-number-filter"
                  placeholder="Account Number"
                  aria-label="Filter by account number"
                  size="md"
                  class="w-full"
                  @update:model-value="debouncedUpdateFilter('accountNumber', $event)"
                />
              </th>
              <th class="text-left table-filter-input" scope="col">
                <UInput
                  id="amount-owing-filter"
                  v-model="state.filters.filterPayload.amountOwing"
                  name="amount-owing-filter"
                  placeholder="Total Amount Owing"
                  aria-label="Filter by total amount owing"
                  size="md"
                  class="w-full"
                  @update:model-value="debouncedUpdateFilter('amountOwing', $event)"
                />
              </th>
              <th class="text-left table-filter-input" scope="col">
                <UInput
                  id="statement-id-filter"
                  v-model="state.filters.filterPayload.statementId"
                  name="statement-id-filter"
                  placeholder="Latest Statement Number"
                  aria-label="Filter by statement number"
                  size="md"
                  class="w-full"
                  @update:model-value="debouncedUpdateFilter('statementId', $event)"
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

          <template #shortName-cell="{ row }">
            <span>{{ row.original.shortName }}</span>
          </template>

          <template #shortNameType-cell="{ row }">
            <span>{{ getShortNameTypeDescription(row.original.shortNameType) }}</span>
          </template>

          <template #accountName-cell="{ row }">
            <span>{{ row.original.accountName }}</span>
          </template>

          <template #accountBranch-cell="{ row }">
            <span>{{ row.original.accountBranch || '' }}</span>
          </template>

          <template #accountId-cell="{ row }">
            <span>{{ row.original.accountId }}</span>
          </template>

          <template #amountOwing-cell="{ row }">
            <span>{{ CommonUtils.formatAmount(row.original.amountOwing) }}</span>
          </template>

          <template #statementId-cell="{ row }">
            <span>{{ row.original.statementId || '' }}</span>
          </template>

          <template #actions-cell="{ row }">
            <div class="flex items-center justify-end gap-2">
              <UButton
                label="View Details"
                color="primary"
                class="btn-table font-normal"
                @click="navigateToDetails(row.original.id)"
              />
            </div>
          </template>

          <template #loading>
            <div class="text-center py-8">
              Loading linked accounts...
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

  // Equal width columns for this 8-column table
  :deep(table) {
    table-layout: fixed;
    width: 100%;
  }

  :deep(table th),
  :deep(table td) {
    width: 12.5% !important;
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
</style>
