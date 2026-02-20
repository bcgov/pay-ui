<script setup lang="ts">
import CommonUtils from '@/utils/common-util'
import {
  InvoiceStatus, RefundApprovalStatus, UI_CONSTANTS
} from '@/utils/constants'
import {
  invoiceStatusDisplay,
  getInvoiceStatusDisplayName
} from '@/utils/invoice-status-util'
import { getProductDisplayName } from '@/utils/product-util'
import { PaymentTypes, paymentTypeDisplay } from '@/enums/payment-types'
import { RolePattern } from '@/enums/fas-roles'
import { useTransactionsTable } from '@/composables/transactions/useTransactionsTable'
import { useTransactionsStore } from '@/stores/transactions-store'
import { useStickyHeader } from '@/composables/common/useStickyHeader'
import { usePaymentMethodsList } from '@/composables/common/useStatusList'
import { useDebounceFn, useInfiniteScroll } from '@vueuse/core'
import type {
  Transaction,
  AppliedCredit,
  PartialRefund
} from '@/interfaces/transactions'

interface Props {
  extended?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  extended: false
})

const emit = defineEmits<{
  isDownloadingReceipt: [value: boolean]
}>()

const {
  searchTransactionsTableHeaders,
  columnPinning,
  columnVisibility,
  setViewAll,
  loadTransactionList,
  clearAllFilters,
  getNext,
  transactions
} = await useTransactionsTable()

const transactionsStore = useTransactionsStore()
const {
  list: paymentMethodList,
  mapFn: paymentMethodMapFn
} = usePaymentMethodsList()

setViewAll(props.extended)

const expandedRows = ref(new Set<number>())

type TableRow = Transaction | DropdownItem

const tableData = computed<TableRow[]>(() => {
  const rows: TableRow[] = []
  for (const item of transactions.results) {
    rows.push(item)
    if (expandedRows.value.has(item.id)) {
      rows.push(...getDropdownItems(item))
    }
  }
  return rows
})

function isDropdownRow(row: { original: Record<string, unknown> }): boolean {
  return !!(row.original as Record<string, unknown>)._isDropdown
}

function asDropdownItem(row: { original: Record<string, unknown> }): DropdownItem {
  return row.original as unknown as DropdownItem
}

const debouncedLoadList = useDebounceFn(
  (field: string, value: string | number) => {
    loadTransactionList(field, value)
  },
  UI_CONSTANTS.DEBOUNCE_DELAY_MS
)

const fp = computed(() => transactions.filters.filterPayload)

const dateRangeModel = computed({
  get: () => ({
    startDate: fp.value.dateFilter?.startDate || null,
    endDate: fp.value.dateFilter?.endDate || null
  }),
  set: (val: { startDate: string | null, endDate: string | null }) => {
    if (!fp.value.dateFilter) {
      fp.value.dateFilter = {
        startDate: '', endDate: '', isDefault: false
      }
    }
    fp.value.dateFilter.startDate = val.startDate || ''
    fp.value.dateFilter.endDate = val.endDate || ''
  }
})

const paymentMethodModel = computed({
  get: () => fp.value.paymentMethod || '',
  set: (value: string) => {
    fp.value.paymentMethod = value || null
    loadTransactionList('paymentMethod', value || '')
  }
})

const visibleColumns = computed(() => {
  return searchTransactionsTableHeaders.value.filter(
    (f: { hideInSearchColumnFilter?: boolean }) => {
      return !f.hideInSearchColumnFilter
    }
  )
})

function asTransaction(
  row: { original: Record<string, unknown> }
): Transaction {
  return row.original as unknown as Transaction
}

function getInvoiceStatus(item: Transaction): string {
  if (
    item.paymentMethod === PaymentTypes.ONLINE_BANKING
    && item.statusCode === InvoiceStatus.SETTLEMENT_SCHEDULED
  ) {
    return invoiceStatusDisplay[InvoiceStatus.PENDING]
  }
  if (item.partialRefunds && item.partialRefunds.length > 0) {
    if (
      [PaymentTypes.ONLINE_BANKING, PaymentTypes.PAD]
        .includes(item.paymentMethod)
    ) {
      return invoiceStatusDisplay[InvoiceStatus.PARTIALLY_CREDITED]
    }
    return invoiceStatusDisplay[InvoiceStatus.PARTIALLY_REFUNDED]
  }
  return getInvoiceStatusDisplayName(item.statusCode)
}

function hasDropdownContent(item: Transaction): boolean {
  const hasPartialRefunds = (item.partialRefunds?.length ?? 0) > 0
  let hasAppliedCreditsWithRemaining = false
  if (item.appliedCredits && item.appliedCredits.length > 0) {
    const totalAppliedCredits = item.appliedCredits.reduce(
      (sum: number, c: AppliedCredit) => sum + c.amountApplied, 0
    )
    hasAppliedCreditsWithRemaining = item.total - totalAppliedCredits > 0
  }
  const hasRefundStatus = item.statusCode === InvoiceStatus.CREDITED
    || item.statusCode === InvoiceStatus.REFUNDED
  return hasPartialRefunds
    || hasAppliedCreditsWithRemaining
    || hasRefundStatus
}

function isExpanded(item: Transaction): boolean {
  return expandedRows.value.has(item.id)
}

function toggleExpanded(item: Transaction) {
  if (expandedRows.value.has(item.id)) {
    expandedRows.value.delete(item.id)
  } else {
    expandedRows.value.add(item.id)
  }
}

function isRefundAsCredits(item: Transaction): boolean {
  if (item.partialRefunds && item.partialRefunds.length > 0) {
    return item.partialRefunds.some(
      (r: PartialRefund) => r.isCredit
    )
  }
  return item.statusCode === InvoiceStatus.CREDITED
}

function isRefundable(item: Transaction): boolean {
  if (
    !item.latestRefundStatus
    || RefundApprovalStatus.DECLINED === item.latestRefundStatus
  ) {
    const productRole = (item.product?.toLowerCase() ?? '')
      + RolePattern.ProductRefundRequester
    return (!!item.partialRefundable || !!item.fullRefundable)
      && item.total > 0
      && CommonUtils.canInitiateProductRefund(productRole)
  }
  return false
}

function getDropdownPaymentMethodDisplay(
  paymentMethod: PaymentTypes,
  item?: Transaction
): string {
  if (item?.appliedCredits && item.appliedCredits.length > 0) {
    const totalCredits = item.appliedCredits.reduce(
      (s: number, c: AppliedCredit) => s + c.amountApplied, 0
    )
    const remaining = item.total - totalCredits
    if (remaining > 0) {
      if (item.paymentMethod === PaymentTypes.PAD) {
        const credit = paymentTypeDisplay[PaymentTypes.CREDIT]
        const pad = paymentTypeDisplay[PaymentTypes.PAD]
        return `${credit} and ${pad}`
      } else if (
        item.paymentMethod === PaymentTypes.ONLINE_BANKING
      ) {
        const credit = paymentTypeDisplay[PaymentTypes.CREDIT]
        const ob = paymentTypeDisplay[PaymentTypes.ONLINE_BANKING]
        return `${credit} and ${ob}`
      }
    } else {
      return paymentTypeDisplay[PaymentTypes.CREDIT]
    }
  }
  const displayMap = paymentTypeDisplay as Record<string, string>
  return displayMap[paymentMethod] || paymentMethod
}

interface DropdownItem {
  id: string
  type: string
  folioNumber: string
  createdName: string
  invoiceNumber: string
  date: string | Date
  time: boolean
  amount: string
  paymentMethod: string
  isRefund: boolean
  status: string
  transactionId: string | number
  _isDropdown: true
}

function createDropdownItem(
  item: Transaction,
  overrides: Partial<DropdownItem> = {}
): DropdownItem {
  return {
    _isDropdown: true as const,
    id: '',
    type: '',
    folioNumber: item.folioNumber,
    createdName: item.createdName,
    invoiceNumber: item.invoiceNumber,
    date: '',
    time: false,
    amount: '',
    paymentMethod: '',
    isRefund: false,
    status: '',
    transactionId: '',
    ...overrides
  }
}

function getAppliedCreditsItems(item: Transaction): DropdownItem[] {
  const credits = item.appliedCredits
  if (!credits?.length) { return [] }

  const items: DropdownItem[] = []
  const totalApplied = credits.reduce(
    (s: number, c: AppliedCredit) => s + c.amountApplied, 0
  )
  const remaining = item.total - totalApplied

  credits.forEach((credit: AppliedCredit) => {
    items.push(createDropdownItem(item, {
      id: `credit-${credit.id}`,
      type: '',
      date: credit.createdOn,
      time: true,
      amount: `$${credit.amountApplied.toFixed(2)}`,
      paymentMethod: paymentTypeDisplay[PaymentTypes.CREDIT],
      isRefund: false,
      status: invoiceStatusDisplay[InvoiceStatus.COMPLETED],
      transactionId: credit.id
    }))
  })

  if (remaining > 0) {
    items.push(createDropdownItem(item, {
      id: `remaining-${item.id}`,
      type: '',
      date: credits[0]!.createdOn,
      time: true,
      amount: `$${remaining.toFixed(2)}`,
      paymentMethod: item.paymentMethod,
      isRefund: false,
      status: invoiceStatusDisplay[InvoiceStatus.COMPLETED],
      transactionId: item.id
    }))
  }

  return items
}

function getPartialRefundsItems(
  item: Transaction
): DropdownItem[] {
  const refunds = item.partialRefunds
  if (!refunds?.length) { return [] }

  const totalRefundAmount = refunds.reduce(
    (s: number, r: PartialRefund) => s + r.refundAmount, 0
  )
  const refundAsCredits = isRefundAsCredits(item)
  const refundIds = refunds.map(
    (r: PartialRefund) => r.paymentLineItemId
  ).join(', ')

  return [createDropdownItem(item, {
    id: `refund-${item.id}`,
    type: refundAsCredits ? 'Refund as credits' : 'Refund',
    date: refunds[0]!.createdOn,
    time: false,
    amount: `-$${totalRefundAmount.toFixed(2)}`,
    paymentMethod: refundAsCredits
      ? paymentTypeDisplay[PaymentTypes.CREDIT]
      : item.paymentMethod,
    isRefund: true,
    status: refundAsCredits
      ? invoiceStatusDisplay[InvoiceStatus.PARTIALLY_CREDITED]
      : invoiceStatusDisplay[InvoiceStatus.PARTIALLY_REFUNDED],
    createdName: refunds[0]!.createdName,
    transactionId: refundIds
  })]
}

function getFullRefundItems(item: Transaction): DropdownItem[] {
  const validStatuses = [
    InvoiceStatus.REFUNDED, InvoiceStatus.CREDITED
  ]
  if (!validStatuses.includes(item.statusCode)) {
    return []
  }

  const refundAsCredits = isRefundAsCredits(item)
  const isCredited = item.statusCode === InvoiceStatus.CREDITED

  return [createDropdownItem(item, {
    id: `full-${item.id}`,
    type: isCredited ? 'Refund as credits' : 'Refund',
    date: item.refundDate || item.createdOn,
    time: true,
    amount: `-$${item.total.toFixed(2)}`,
    paymentMethod: refundAsCredits
      ? paymentTypeDisplay[PaymentTypes.CREDIT]
      : item.paymentMethod,
    isRefund: true,
    status: refundAsCredits
      ? invoiceStatusDisplay[InvoiceStatus.CREDITED]
      : invoiceStatusDisplay[InvoiceStatus.REFUNDED],
    transactionId: item.id
  })]
}

function getDropdownItems(item: Transaction): DropdownItem[] {
  return [
    ...getAppliedCreditsItems(item),
    ...getPartialRefundsItems(item),
    ...getFullRefundItems(item)
  ]
}

function displayDate(val: string | Date): string {
  return CommonUtils.formatDisplayDate(val, 'MMMM dd, yyyy')
}

function isCompletedOrPaid(statusCode: InvoiceStatus): boolean {
  return [
    InvoiceStatus.COMPLETED,
    InvoiceStatus.PAID,
    InvoiceStatus.REFUNDED,
    InvoiceStatus.CREDITED
  ].includes(statusCode)
}

function getHelpText(item: Transaction): string {
  switch (item?.statusCode) {
    case InvoiceStatus.REFUND_REQUESTED:
      return 'We are processing your refund request. '
        + 'It may take up to 7 business days to refund your total amount.'
    case InvoiceStatus.OVERDUE:
      return 'Your monthly statement is overdue. '
        + 'Please make your payment as soon as possible.'
    default:
      return ''
  }
}

function saveTableSettings() {
  transactionsStore.setTableSettings({
    filterPayload: { ...transactions.filters.filterPayload },
    pageNumber: transactions.filters.pageNumber ?? 1
  })
}

function viewDetails(item: Transaction) {
  saveTableSettings()
  navigateTo(`/transaction-view/${item.id}`)
}

function initiateRefund(item: Transaction) {
  saveTableSettings()
  navigateTo(
    `/transaction-view/${item.id}/initiateRefund`
  )
}

async function downloadReceipt(item: Transaction) {
  emit('isDownloadingReceipt', true)
  try {
    const nuxtApp = useNuxtApp()
    const $payApi = nuxtApp.$payApi as typeof nuxtApp.$payApi
    const response = await $payApi<Blob>(
      `/payment-requests/${item.id}/receipts`,
      {
        method: 'POST',
        body: {
          filingDateTime: CommonUtils.formatDisplayDate(
            item.createdOn
          )
        },
        responseType: 'blob'
      }
    )
    const filename = `bcregistry-receipts-${item.id}.pdf`
    CommonUtils.fileDownload(
      response, filename, 'application/pdf'
    )
  } catch (error) {
    console.error('Failed to download receipt', error)
  } finally {
    emit('isDownloadingReceipt', false)
  }
}

async function clearFilters() {
  clearAllFilters()
  transactionsStore.clearFilter()
  transactionsStore.clearTableSettings()
  await loadTransactionList()
}

async function onDateRangeChange() {
  transactionsStore.setFilter({
    ...transactions.filters.filterPayload
  })
  await loadTransactionList()
}

const scrollEl = useTemplateRef<HTMLElement>('scrollEl')
const table = useTemplateRef<HTMLElement>('table')

const { updateStickyHeaderHeight } = useStickyHeader(scrollEl)

useInfiniteScroll(
  table,
  async () => {
    await getNext()
  },
  { distance: UI_CONSTANTS.INFINITE_SCROLL_DISTANCE }
)

onMounted(async () => {
  const savedSettings = transactionsStore.tableSettings
  if (savedSettings) {
    Object.assign(
      transactions.filters.filterPayload,
      savedSettings.filterPayload
    )
    transactions.filters.pageNumber = savedSettings.pageNumber
    transactionsStore.clearTableSettings()
  } else {
    const savedFilter = transactionsStore.transactionFilter
    if (savedFilter) {
      Object.assign(
        transactions.filters.filterPayload, savedFilter
      )
    }
  }

  await loadTransactionList()
  await nextTick()
  updateStickyHeaderHeight()
})

watch(() => transactions.filters.filterPayload, (payload) => {
  transactionsStore.setFilter({ ...payload })
}, { deep: true })

watch(columnVisibility, () => {
  nextTick(() => { updateStickyHeaderHeight() })
})

watch(() => transactions.results, () => {
  nextTick(() => { updateStickyHeaderHeight() })
}, { immediate: true })
</script>

<template>
  <div>
    <div
      class="bg-white rounded shadow-sm border border-[var(--color-divider)] overflow-hidden"
    >
      <div
        class="relative rounded-t-lg px-2 py-3.5 flex-shrink-0 search-header-bg"
      >
        <div class="flex flex-wrap justify-between">
          <div class="flex">
            <UIcon
              name="i-mdi-view-list"
              class="mr-2 size-6 text-primary"
              style="margin-top: 5px;"
            />
            <h2 class="table-header-text font-bold">
              Transactions
            </h2>
          </div>
          <div>
            <UPopover>
              <UButton
                label="Columns to Show"
                color="neutral"
                variant="subtle"
                trailing-icon="i-mdi-menu-down"
                class="columns-to-show-btn"
              />
              <template #content>
                <div class="py-2">
                  <UCheckbox
                    v-for="col in visibleColumns"
                    :key="(col as any).accessorKey"
                    :model-value="!!(col as any).display"
                    :label="String((col as any).header || '')"
                    class="px-2 py-2"
                    @update:model-value="(col as any).display = !!$event"
                  />
                </div>
              </template>
            </UPopover>
          </div>
        </div>
      </div>

      <div
        ref="scrollEl"
        class="w-full overflow-x-auto overflow-y-auto table-scroll"
        style="max-height: calc(100vh - 300px);"
      >
        <UTable
          ref="table"
          v-model:column-visibility="columnVisibility"
          v-model:column-pinning="columnPinning"
          :data="(tableData as any)"
          :columns="searchTransactionsTableHeaders"
          :loading="transactions.loading"
          sticky
          class="sticky-table search-table"
        >
          <template #body-top>
            <tr
              class="sticky-row header-row-2 bg-[var(--color-white)]"
              role="row"
            >
              <th
                v-if="columnVisibility.accountName"
                class="text-left table-filter-input"
                scope="col"
              >
                <UInput
                  v-model="fp.accountName"
                  placeholder="Account Name"
                  size="md"
                  class="w-full"
                  @update:model-value="debouncedLoadList('accountName', $event ?? '')"
                />
              </th>
              <th
                v-if="columnVisibility.product"
                class="text-left table-filter-input"
                scope="col"
              >
                <UInput
                  v-model="fp.product"
                  placeholder="Application Type"
                  size="md"
                  class="w-full"
                  @update:model-value="debouncedLoadList('product', $event ?? '')"
                />
              </th>
              <th
                v-if="columnVisibility.lineItems"
                class="text-left table-filter-input"
                scope="col"
              >
                <UInput
                  v-model="fp.lineItems"
                  placeholder="Transaction Type"
                  size="md"
                  class="w-full"
                  @update:model-value="debouncedLoadList('lineItems', $event ?? '')"
                />
              </th>
              <th
                v-if="columnVisibility.details"
                class="text-left table-filter-input"
                scope="col"
              >
                <UInput
                  v-model="fp.details"
                  placeholder="Details"
                  size="md"
                  class="w-full"
                  @update:model-value="debouncedLoadList('details', $event ?? '')"
                />
              </th>
              <th
                v-if="columnVisibility.businessIdentifier"
                class="text-left table-filter-input"
                scope="col"
              >
                <UInput
                  v-model="fp.businessIdentifier"
                  placeholder="Number"
                  size="md"
                  class="w-full"
                  @update:model-value="debouncedLoadList('businessIdentifier', $event ?? '')"
                />
              </th>
              <th
                v-if="columnVisibility.folioNumber"
                class="text-left table-filter-input"
                scope="col"
              >
                <UInput
                  v-model="fp.folioNumber"
                  placeholder="Folio #"
                  size="md"
                  class="w-full"
                  @update:model-value="debouncedLoadList('folioNumber', $event ?? '')"
                />
              </th>
              <th
                v-if="columnVisibility.createdName"
                class="text-left table-filter-input"
                scope="col"
              >
                <UInput
                  v-model="fp.createdName"
                  placeholder="Initiated By"
                  size="md"
                  class="w-full"
                  @update:model-value="debouncedLoadList('createdName', $event ?? '')"
                />
              </th>
              <th
                v-if="columnVisibility.createdOn"
                class="text-left table-filter-input"
                scope="col"
              >
                <DateRangeFilter
                  v-model="dateRangeModel"
                  placeholder="Date"
                  class="w-full"
                  @change="onDateRangeChange"
                />
              </th>
              <th
                v-if="columnVisibility.total"
                class="text-left table-filter-input"
                scope="col"
              />
              <th
                v-if="columnVisibility.id"
                class="text-left table-filter-input"
                scope="col"
              >
                <UInput
                  v-model="fp.id"
                  placeholder="Transaction ID"
                  size="md"
                  class="w-full"
                  @update:model-value="debouncedLoadList('id', $event ?? '')"
                />
              </th>
              <th
                v-if="columnVisibility.invoiceNumber"
                class="text-left table-filter-input"
                scope="col"
              >
                <UInput
                  v-model="fp.invoiceNumber"
                  placeholder="Invoice #"
                  size="md"
                  class="w-full"
                  @update:model-value="debouncedLoadList('invoiceNumber', $event ?? '')"
                />
              </th>
              <th
                v-if="columnVisibility.paymentMethod"
                class="text-left table-filter-input"
                scope="col"
              >
                <StatusList
                  v-model="paymentMethodModel"
                  :list="paymentMethodList"
                  :map-fn="(paymentMethodMapFn as any)"
                  placeholder="Payment Method"
                  class="w-full"
                />
              </th>
              <th
                v-if="columnVisibility.statusCode"
                class="text-left table-filter-input"
                scope="col"
              >
                <UInput
                  v-model="fp.statusCode"
                  placeholder="Status"
                  size="md"
                  class="w-full"
                  @update:model-value="debouncedLoadList('statusCode', $event ?? '')"
                />
              </th>
              <th
                v-if="columnVisibility['downloads']"
                class="table-filter-input"
                scope="col"
              />
              <th class="clear-filters-th" scope="col">
                <UButton
                  v-if="transactions.filters.isActive"
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

          <template #accountName-cell="{ row }">
            <template v-if="isDropdownRow(row)" />
            <span v-else>
              {{ asTransaction(row).paymentAccount?.accountName || '-' }}
            </span>
          </template>

          <template #product-cell="{ row }">
            <template v-if="isDropdownRow(row)" />
            <span v-else>
              {{ getProductDisplayName(String(asTransaction(row).product)) }}
            </span>
          </template>

          <template #lineItems-cell="{ row }">
            <span v-if="isDropdownRow(row)" class="dropdown-child-cell font-medium">
              {{ asDropdownItem(row).type }}
            </span>
            <div v-else class="flex items-start">
              <div
                v-if="hasDropdownContent(asTransaction(row))"
                class="expand-icon-container mr-2 cursor-pointer"
                @click.stop="toggleExpanded(asTransaction(row))"
              >
                <UIcon
                  :name="isExpanded(asTransaction(row))
                    ? 'i-mdi-chevron-up'
                    : 'i-mdi-chevron-down'"
                  class="expansion-icon"
                />
              </div>
              <div>
                <b
                  v-for="(lineItem, i) in asTransaction(row).lineItems"
                  :key="String(lineItem.description) + i"
                  class="block"
                >
                  {{ lineItem.description }}
                </b>
                <span
                  v-for="(detail, i) in (asTransaction(row).details || [])"
                  :key="(detail.label || '') + i"
                  class="block text-sm"
                >
                  {{ detail.label }} {{ detail.value }}
                </span>
                <div
                  v-if="hasDropdownContent(asTransaction(row))"
                  class="mt-1"
                >
                  <a
                    class="detail-link cursor-pointer"
                    @click.stop="toggleExpanded(asTransaction(row))"
                  >
                    {{
                      isExpanded(asTransaction(row))
                        ? 'Hide Detail'
                        : 'View Detail'
                    }}
                  </a>
                </div>
              </div>
            </div>
          </template>

          <template #businessIdentifier-cell="{ row }">
            <template v-if="isDropdownRow(row)" />
            <span v-else>{{ asTransaction(row).businessIdentifier }}</span>
          </template>

          <template #folioNumber-cell="{ row }">
            <span v-if="isDropdownRow(row)">{{ asDropdownItem(row).folioNumber }}</span>
            <span v-else>{{ asTransaction(row).folioNumber }}</span>
          </template>

          <template #createdName-cell="{ row }">
            <span v-if="isDropdownRow(row)">{{ asDropdownItem(row).createdName }}</span>
            <span v-else>{{ asTransaction(row).createdName }}</span>
          </template>

          <template #id-cell="{ row }">
            <span v-if="isDropdownRow(row)">{{ asDropdownItem(row).transactionId }}</span>
            <span v-else>{{ asTransaction(row).id }}</span>
          </template>

          <template #invoiceNumber-cell="{ row }">
            <span v-if="isDropdownRow(row)">{{ asDropdownItem(row).invoiceNumber }}</span>
            <span v-else>{{ asTransaction(row).invoiceNumber }}</span>
          </template>

          <template #details-cell="{ row }">
            <template v-if="isDropdownRow(row)" />
            <template v-else>
              <span
                v-for="(detail, i) in (asTransaction(row).details || [])"
                :key="(detail.label || '') + i"
                class="block text-sm"
              >
                {{ detail.label }} {{ detail.value }}
              </span>
            </template>
          </template>

          <template #createdOn-cell="{ row }">
            <span v-if="isDropdownRow(row)" class="dropdown-child-cell">
              {{ asDropdownItem(row).date ? displayDate(String(asDropdownItem(row).date)) : '' }}
            </span>
            <span v-else>
              {{ displayDate(asTransaction(row).createdOn) }}
            </span>
          </template>

          <template #total-cell="{ row }">
            <span
              v-if="isDropdownRow(row)"
              :class="[
                'dropdown-child-cell',
                { 'refund-amount': asDropdownItem(row).isRefund }
              ]"
            >
              {{ asDropdownItem(row).amount }}
            </span>
            <span
              v-else-if="asTransaction(row).statusCode === InvoiceStatus.CANCELLED"
              class="total-amount-cell"
            >
              $0.00
            </span>
            <span v-else class="total-amount-cell">
              {{ CommonUtils.formatAmount(asTransaction(row).total) }}
            </span>
          </template>

          <template #paymentMethod-cell="{ row }">
            <span v-if="isDropdownRow(row)" class="dropdown-child-cell">
              {{ asDropdownItem(row).paymentMethod }}
            </span>
            <span v-else>
              {{
                getDropdownPaymentMethodDisplay(
                  asTransaction(row).paymentMethod,
                  asTransaction(row)
                )
              }}
            </span>
          </template>

          <template #statusCode-cell="{ row }">
            <span v-if="isDropdownRow(row)" class="dropdown-child-cell">
              {{ asDropdownItem(row).status }}
            </span>
            <div v-else class="flex items-start gap-1">
              <div>
                <div class="flex items-center gap-1">
                  <UIcon
                    v-if="isCompletedOrPaid(asTransaction(row).statusCode)"
                    name="i-mdi-check"
                    class="text-green-600"
                  />
                  <UIcon
                    v-if="asTransaction(row).statusCode === InvoiceStatus.OVERDUE"
                    name="i-mdi-alert"
                    class="text-red-600"
                  />
                  <b>{{ getInvoiceStatus(asTransaction(row)) }}</b>
                </div>
                <span
                  v-if="asTransaction(row).updatedOn"
                  class="text-sm"
                >
                  {{ displayDate(asTransaction(row).updatedOn) }}
                </span>
                <UBadge
                  v-if="asTransaction(row).latestRefundStatus === RefundApprovalStatus.PENDING_APPROVAL"
                  color="primary"
                  size="sm"
                  class="mt-1"
                >
                  REFUND REQUEST
                </UBadge>
                <UBadge
                  v-if="asTransaction(row).latestRefundStatus === RefundApprovalStatus.DECLINED"
                  color="primary"
                  size="sm"
                  class="mt-1"
                >
                  REFUND DECLINED
                </UBadge>
              </div>
              <IconTooltip
                v-if="([
                  InvoiceStatus.OVERDUE,
                  InvoiceStatus.REFUND_REQUESTED
                ] as InvoiceStatus[]).includes(asTransaction(row).statusCode)"
                :text="getHelpText(asTransaction(row))"
              />
            </div>
          </template>

          <template #downloads-cell="{ row }">
            <template v-if="isDropdownRow(row)" />
            <span
              v-else
              class="receipt-link"
              @click="downloadReceipt(asTransaction(row))"
            >
              <UIcon name="i-mdi-file-download-outline" />
              Receipt
            </span>
          </template>

          <template #actions-cell="{ row }">
            <template v-if="isDropdownRow(row)" />
            <div v-else class="flex items-center justify-end gap-2">
              <UButton
                label="View Details"
                color="primary"
                class="btn-table font-normal"
                @click="viewDetails(asTransaction(row))"
              />
              <UDropdownMenu
                v-if="isRefundable(asTransaction(row))"
                :items="[
                  [
                    {
                      label: 'Initiate Refund',
                      icon: 'i-mdi-cash-refund',
                      onSelect: () => initiateRefund(asTransaction(row))
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
              Loading Transaction Records...
            </div>
          </template>

          <template #empty>
            <div class="text-center py-8 text-gray-600">
              No Transaction Records
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

.search-header-bg {
  background-color: var(--color-bg-light-blue) !important;
  opacity: 1 !important;
}

:deep(table) {
  table-layout: auto;
  width: 100%;
}

:deep(table thead),
:deep(table tbody) {
  width: 100%;
}

:deep(.sticky-row),
:deep(table thead tr) {
  width: 100%;
}

:deep(table thead tr:first-child th),
:deep(.sticky-row th) {
  min-width: 120px;
  padding-top: 0.75rem !important;
  padding-bottom: 0.75rem !important;
}

:deep(.sticky-row th.clear-filters-th) {
  text-align: right !important;
}

:deep(.clear-filters-btn) {
  max-width: 150px !important;
}

:deep(.sticky-row th .w-full),
:deep(.sticky-row th > div),
:deep(.sticky-row th input),
:deep(.sticky-row th .ui-input),
:deep(.sticky-row th [class*="UInput"]) {
  width: 100% !important;
  max-width: 100% !important;
}

.total-amount-cell {
  text-align: right;
  display: block;
}

:deep(.header-total) {
  text-align: right !important;
}

.expand-icon-container {
  display: flex;
  align-items: flex-start;
}

.expansion-icon {
  background-color: var(--color-primary);
  border-radius: 50%;
  color: white;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.detail-link {
  color: var(--color-primary);
  text-decoration: underline;
  font-size: 0.875rem;

  &:hover {
    text-decoration: none;
  }
}

.dropdown-child-cell {
  font-weight: normal;
  padding-left: 28px;
}

.refund-amount {
  color: var(--color-error, #d32f2f);
}

.receipt-link {
  cursor: pointer;
  color: var(--color-primary);
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>
