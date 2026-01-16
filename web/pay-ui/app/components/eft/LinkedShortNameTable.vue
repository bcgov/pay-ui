<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { useInfiniteScroll, useDebounceFn, useResizeObserver } from '@vueuse/core'
import CommonUtils from '@/utils/common-util'
import ShortNameUtils from '@/utils/short-name-util'
import { ShortNameType } from '@/utils/constants'
import { useShortNameTypeList } from '@/composables/common/useStatusList'

interface Props {
  currentTab?: number
}

const props = withDefaults(defineProps<Props>(), {
  currentTab: 0
})

const emit = defineEmits<{
  'shortname-state-total': [total: number]
}>()

interface LinkedShortNameItem {
  accountBranch: string | null
  accountId: string
  accountName: string
  amountOwing: number
  casSupplierNumber: string | null
  casSupplierSite: string | null
  cfsAccountStatus: string | null
  createdOn: string
  email: string | null
  id: number
  shortName: string
  shortNameType: string
  statementId: number | null
  statusCode: string
}

interface LinkedShortNameResponse {
  items: LinkedShortNameItem[]
  limit: number
  page: number
  stateTotal: number
  total: number
}

interface LinkedShortNameState {
  results: LinkedShortNameItem[]
  totalResults: number
  filters: {
    isActive: boolean
    pageNumber: number
    pageLimit: number
    filterPayload: {
      shortName: string
      shortNameType: string
      accountName: string
      accountNumber: string
      branchName: string
      amountOwing: string
      statementId: string
    }
  }
  loading: boolean
}

const dateDisplayFormat = 'MMMM dd, yyyy'

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

function formatAmount(amount: number) {
  return amount !== undefined ? CommonUtils.formatAmount(amount) : ''
}

async function loadTableData(col?: string, val?: string | number, appendResults = false) {
  if (state.loading) { return }

  state.loading = true

  try {
    if (col && val !== undefined && col !== 'page') {
      state.filters.filterPayload = {
        ...state.filters.filterPayload,
        [col]: val as string
      }
      state.filters.pageNumber = 1
      appendResults = false
    } else if (col === 'page') {
      state.filters.pageNumber = val as number
    }

    state.filters.isActive = Object.values(state.filters.filterPayload).some(
      value => value !== '' && value !== null && value !== undefined
    )

    const payload = {
      page: state.filters.pageNumber,
      limit: state.filters.pageLimit,
      state: 'LINKED',
      ...state.filters.filterPayload,
      shortNameType: state.filters.filterPayload.shortNameType || ''
    }

    const cleanedPayload = CommonUtils.cleanObject(payload as Record<string, unknown>)
    const response = await getLinkedShortNames(cleanedPayload)

    if (response) {
      state.results = appendResults
        ? [...state.results, ...(response.items || [])]
        : (response.items || [])
      state.totalResults = response.total || 0
    }
  } catch (error) {
    console.error('Error loading linked short names:', error)
  } finally {
    state.loading = false
  }
}

async function getLinkedShortNames(payload: Record<string, unknown>) {
  const nuxtApp = useNuxtApp()
  const $payApi = (nuxtApp.$payApiWithErrorHandling || nuxtApp.$payApi) as typeof nuxtApp.$payApi

  const filteredParams = Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== '' && value !== null && value !== undefined)
  ) as Record<string, string>

  const queryString = CommonUtils.createQueryParams(filteredParams)

  return $payApi<LinkedShortNameResponse>(
    `/eft-shortnames${queryString ? `?${queryString}` : ''}`,
    { method: 'GET' }
  )
}

async function infiniteScrollCallback(): Promise<void> {
  if (state.loading) { return }
  if (state.results.length >= state.totalResults) { return }

  state.filters.pageNumber++
  await loadTableData('page', state.filters.pageNumber, true)
}

function updateFilter(col: string, val: string | number) {
  state.filters.pageNumber = 1
  loadTableData(col, val)
}

async function clearFilters() {
  state.filters.filterPayload = defaultFilterPayload()
  state.filters.isActive = false
  await loadTableData()
}

const scrollEl = useTemplateRef<HTMLElement>('scrollEl')
const hasLoadedData = ref(false)

const updateStickyHeaderHeight = () => {
  const el = scrollEl.value
  if (!el) { return }

  const thead = el.querySelector('thead')
  const height = thead?.getBoundingClientRect().height ?? 0
  el.style.setProperty('--search-sticky-header-height', `${Math.ceil(height)}px`)
}

onMounted(async () => {
  await loadTableData()
  hasLoadedData.value = true
  await nextTick()
  updateStickyHeaderHeight()
})

useResizeObserver(scrollEl, () => {
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

useInfiniteScroll(
  scrollEl,
  async () => {
    // Only allow infinite scroll to trigger after initial data load is complete
    if (!hasLoadedData.value) { return }

    const reachedEnd = state.results.length >= state.totalResults
    if (!state.loading && !reachedEnd) {
      await infiniteScrollCallback()
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
          class="sticky-table"
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
                <UInput
                  id="account-name-filter"
                  v-model="state.filters.filterPayload.accountName"
                  name="account-name-filter"
                  placeholder="Account Name"
                  size="md"
                  class="w-full"
                  @update:model-value="debouncedUpdateFilter('accountName', $event)"
                />
              </th>
              <th class="text-left table-filter-input">
                <UInput
                  id="branch-name-filter"
                  v-model="state.filters.filterPayload.branchName"
                  name="branch-name-filter"
                  placeholder="Branch Name"
                  size="md"
                  class="w-full"
                  @update:model-value="debouncedUpdateFilter('branchName', $event)"
                />
              </th>
              <th class="text-left table-filter-input">
                <UInput
                  id="account-number-filter"
                  v-model="state.filters.filterPayload.accountNumber"
                  name="account-number-filter"
                  placeholder="Account Number"
                  size="md"
                  class="w-full"
                  @update:model-value="debouncedUpdateFilter('accountNumber', $event)"
                />
              </th>
              <th class="text-left table-filter-input">
                <UInput
                  id="amount-owing-filter"
                  v-model="state.filters.filterPayload.amountOwing"
                  name="amount-owing-filter"
                  placeholder="Total Amount Owing"
                  size="md"
                  class="w-full"
                  @update:model-value="debouncedUpdateFilter('amountOwing', $event)"
                />
              </th>
              <th class="text-left table-filter-input">
                <UInput
                  id="statement-id-filter"
                  v-model="state.filters.filterPayload.statementId"
                  name="statement-id-filter"
                  placeholder="Latest Statement Number"
                  size="md"
                  class="w-full"
                  @update:model-value="debouncedUpdateFilter('statementId', $event)"
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
            <span>{{ formatAmount(row.original.amountOwing) }}</span>
          </template>

          <template #statementId-cell="{ row }">
            <span>{{ row.original.statementId || '' }}</span>
          </template>

          <template #actions-cell="{ row }">
            <div class="flex items-center justify-center gap-2">
              <UButton
                label="View Detail"
                color="primary"
                class="btn-table font-normal"
                @click="navigateTo(`/eft/shortname-details/${row.original.id}`)"
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
  @use '~/assets/scss/table.scss';
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
