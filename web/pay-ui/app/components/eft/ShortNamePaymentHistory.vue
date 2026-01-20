<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { ShortNameHistoryItem, ShortNameHistoryState } from '@/interfaces/eft-short-name'
import { useDebounceFn, useInfiniteScroll } from '@vueuse/core'
import { useStickyHeader } from '@/composables/common/useStickyHeader'
import CommonUtils from '@/utils/common-util'
import {
  ChequeRefundCode,
  ChequeRefundStatus,
  EFTRefundMethod,
  RefundStatusText,
  ShortNameHistoryType,
  ShortNameHistoryTypeDescription
} from '@/utils/constants'
import { useShortNameHistory } from '@/composables/eft/useShortNameHistory'

interface Props {
  shortNameId: number
}

const props = defineProps<Props>()

const dateDisplayFormat = 'MMMM d, yyyy'

const state = reactive<ShortNameHistoryState>({
  results: [],
  totalResults: 0,
  loading: false
})

const {
  loadState,
  getNext,
  resetState,
  reversePayment,
  canReversePayment,
  getReversalTooltip
} = useShortNameHistory(props.shortNameId, state)

const confirmDialog = reactive({
  show: false,
  title: '',
  message: '',
  statementId: 0,
  accountId: ''
})

function formatDate(date: string | undefined) {
  return date ? CommonUtils.formatDisplayDate(date, dateDisplayFormat) : ''
}

function getRefundSubtitle(item: ShortNameHistoryItem): string {
  if (item.isProcessing) {
    return RefundStatusText.PROCESSING
  }
  const type = item.transactionType as ShortNameHistoryType
  switch (type) {
    case ShortNameHistoryType.SN_REFUND_PENDING_APPROVAL:
      return RefundStatusText.REFUND_REQUESTED
    case ShortNameHistoryType.SN_REFUND_APPROVED:
      if (item.eftRefundChequeStatus) {
        return ChequeRefundStatus.find(
          status => status.code === item.eftRefundChequeStatus
        )?.text || RefundStatusText.REQUEST_APPROVED
      }
      return RefundStatusText.REQUEST_APPROVED
    case ShortNameHistoryType.SN_REFUND_DECLINED:
      return RefundStatusText.REFUND_DECLINED
    default:
      return ''
  }
}

function getDescription(item: ShortNameHistoryItem): { title: string, subtitle: string } {
  const type = item.transactionType as ShortNameHistoryType

  switch (type) {
    case ShortNameHistoryType.SN_REFUND_PENDING_APPROVAL:
    case ShortNameHistoryType.SN_REFUND_APPROVED:
    case ShortNameHistoryType.SN_REFUND_DECLINED: {
      const method = item.eftRefundMethod || item.refundMethod
      const title = method === EFTRefundMethod.CHEQUE ? 'Refund by Cheque' : 'Refund by Direct Deposit'
      return {
        title,
        subtitle: getRefundSubtitle(item)
      }
    }

    case ShortNameHistoryType.INVOICE_REFUND:
    case ShortNameHistoryType.INVOICE_PARTIAL_REFUND: {
      const desc = ShortNameHistoryTypeDescription[type] || 'Invoice Refund'
      const invoiceInfo = item.invoiceId ? `Invoice ID: ${item.invoiceId}` : ''
      return {
        title: desc + (item.isProcessing ? ` (${RefundStatusText.PROCESSING})` : ''),
        subtitle: invoiceInfo
      }
    }

    case ShortNameHistoryType.STATEMENT_PAID:
      return {
        title: ShortNameHistoryTypeDescription.STATEMENT_PAID,
        subtitle: item.statementNumber ? `Statement Number: ${item.statementNumber}` : ''
      }

    case ShortNameHistoryType.STATEMENT_REVERSE:
      return {
        title: ShortNameHistoryTypeDescription.STATEMENT_REVERSE,
        subtitle: item.relatedStatementNumber ? `Statement Number: ${item.relatedStatementNumber}` : ''
      }

    case ShortNameHistoryType.FUNDS_RECEIVED: {
      const depositDate = item.transactionDate
      return {
        title: ShortNameHistoryTypeDescription.FUNDS_RECEIVED,
        subtitle: depositDate ? `Deposit Date: ${formatDate(depositDate)}` : ''
      }
    }

    case ShortNameHistoryType.SN_TRANSFER_SENT:
    case ShortNameHistoryType.SN_TRANSFER_RECEIVED:
      return {
        title: ShortNameHistoryTypeDescription[type],
        subtitle: item.comment || ''
      }

    default:
      return {
        title: ShortNameHistoryTypeDescription[type] || type,
        subtitle: (item.accountId && item.accountName)
          ? CommonUtils.formatAccountDisplayName({ accountId: item.accountId, accountName: item.accountName })
          : ''
      }
  }
}

function isRefundType(item: ShortNameHistoryItem): boolean {
  const type = item.transactionType as ShortNameHistoryType
  return type === ShortNameHistoryType.SN_REFUND_PENDING_APPROVAL
    || type === ShortNameHistoryType.SN_REFUND_APPROVED
    || type === ShortNameHistoryType.SN_REFUND_DECLINED
}

function isFundsReceived(item: ShortNameHistoryItem): boolean {
  return item.transactionType === ShortNameHistoryType.FUNDS_RECEIVED
}

function getDisplayDate(item: ShortNameHistoryItem): string {
  if (isFundsReceived(item) && item.createdOn) {
    return item.createdOn
  }
  return item.transactionDate
}

function getFundsReceivedTooltip(item: ShortNameHistoryItem): string {
  const depositDate = item.transactionDate
  const availableDate = item.createdOn
  if (depositDate && availableDate) {
    return `Funds transfer deposited on ${formatDate(depositDate)} and became available on ${formatDate(availableDate)}`
  }
  return ''
}

function isDeclinedRefund(item: ShortNameHistoryItem): boolean {
  return item.transactionType === ShortNameHistoryType.SN_REFUND_DECLINED
}

function isChequeUndeliverable(item: ShortNameHistoryItem): boolean {
  return item.eftRefundChequeStatus === ChequeRefundCode.CHEQUE_UNDELIVERABLE
}

function isNegativeAmountType(item: ShortNameHistoryItem): boolean {
  const type = item.transactionType as ShortNameHistoryType
  return type === ShortNameHistoryType.STATEMENT_PAID
    || type === ShortNameHistoryType.SN_TRANSFER_SENT
    || isRefundType(item)
}

function getDisplayAmount(item: ShortNameHistoryItem): number | null {
  if (isDeclinedRefund(item)) {
    return null
  }
  if (item.amount == null) {
    return null
  }
  if (isRefundType(item) && item.refundAmount != null) {
    return -item.refundAmount
  }
  if (isNegativeAmountType(item)) {
    return -Math.abs(item.amount)
  }
  return item.amount
}

function canShowRefundDetail(item: ShortNameHistoryItem): boolean {
  return isRefundType(item) && !!(item.eftRefundId || item.shortNameRefundId)
}

function navigateToRefundDetail(item: ShortNameHistoryItem) {
  const refundId = item.eftRefundId || item.shortNameRefundId
  if (!refundId) {
    return
  }
  navigateTo({
    path: `/eft/shortname-details/${props.shortNameId}/refund`,
    query: { eftRefundId: String(refundId) }
  })
}

function canShowReverseButton(item: ShortNameHistoryItem): boolean {
  return item.transactionType === ShortNameHistoryType.STATEMENT_PAID
    && !!item.statementNumber
    && canReversePayment(item.transactionDate, item.paymentDate)
}

function showConfirmReverseModal(item: ShortNameHistoryItem) {
  confirmDialog.title = 'Reverse Payment'
  confirmDialog.message = [
    `Are you sure you want to reverse the payment for Statement ${item.statementNumber}?`,
    'This action cannot be undone.'
  ].join(' ')
  confirmDialog.statementId = item.statementNumber || 0
  confirmDialog.accountId = item.accountId || ''
  confirmDialog.show = true
}

async function handleReversePayment() {
  const success = await reversePayment(confirmDialog.statementId, confirmDialog.accountId)
  confirmDialog.show = false

  if (success) {
    resetConfirmDialog()
  }
}

function resetConfirmDialog() {
  confirmDialog.show = false
  confirmDialog.title = ''
  confirmDialog.message = ''
  confirmDialog.statementId = 0
  confirmDialog.accountId = ''
}

const scrollEl = useTemplateRef<HTMLElement>('scrollEl')

const { updateStickyHeaderHeight } = useStickyHeader(scrollEl)

const debouncedGetNext = useDebounceFn(async () => {
  await getNext(loadState.isInitialLoad)
}, 100)

useInfiniteScroll(
  scrollEl,
  async () => {
    await debouncedGetNext()
  },
  { distance: 200 }
)

watch(() => props.shortNameId, async (newId) => {
  if (newId) {
    resetState()
    await getNext(true)
  }
}, { immediate: true })

onMounted(async () => {
  await nextTick()
  updateStickyHeaderHeight()
})

const columns = computed<TableColumn<ShortNameHistoryItem>[]>(() => [
  {
    accessorKey: 'transactionDate',
    header: 'Date'
  },
  {
    accessorKey: 'description',
    header: 'Description'
  },
  {
    accessorKey: 'relatedStatementNumber',
    header: 'Related Statement Number'
  },
  {
    accessorKey: 'amount',
    header: 'Amount'
  },
  {
    accessorKey: 'actions',
    header: 'Actions',
    meta: { class: { th: 'text-right', td: 'text-right' } }
  }
])
</script>

<template>
  <div class="bg-gray-50 border-y border-gray-200 mb-4">
    <UModal v-model:open="confirmDialog.show" :ui="{ content: 'sm:max-w-[720px]' }">
      <template #header>
        <div class="flex items-center justify-between w-full pr-2">
          <h2 class="text-xl font-bold text-gray-900">
            {{ confirmDialog.title }}
          </h2>
          <UButton
            icon="i-mdi-close"
            color="primary"
            variant="ghost"
            size="lg"
            @click.stop="resetConfirmDialog"
          />
        </div>
      </template>

      <template #body>
        <p class="py-4 text-gray-700">
          {{ confirmDialog.message }}
        </p>
      </template>

      <template #footer>
        <div class="flex items-center justify-center gap-3 w-full py-2">
          <UButton
            label="Cancel"
            color="primary"
            variant="outline"
            size="lg"
            class="min-w-[100px]"
            @click.stop="resetConfirmDialog"
          />
          <UButton
            label="Confirm"
            color="primary"
            size="lg"
            class="min-w-[100px]"
            :loading="state.loading"
            @click="handleReversePayment"
          />
        </div>
      </template>
    </UModal>

    <div class="card-title flex items-center px-6 py-5 bg-bcgov-lightblue">
      <UIcon name="i-mdi-format-list-bulleted" class="text-primary text-3xl mr-4" />
      <h2 class="text-lg font-bold text-gray-900">
        Short Name Payment History
      </h2>
    </div>

    <div
      ref="scrollEl"
      class="w-full overflow-y-auto table-scroll"
      style="max-height: 400px;"
    >
      <UTable
        :data="state.results"
        :columns="columns"
        :loading="state.loading"
        sticky
        class="history-table"
      >
        <template #transactionDate-cell="{ row }">
          <span>{{ formatDate(getDisplayDate(row.original)) }}</span>
        </template>

        <template #description-cell="{ row }">
          <div>
            <div class="font-medium flex items-center gap-1">
              {{ getDescription(row.original).title }}
              <IconTooltip
                v-if="isFundsReceived(row.original) && getFundsReceivedTooltip(row.original)"
                :text="getFundsReceivedTooltip(row.original)"
                icon-class="text-primary size-5 cursor-pointer"
              />
            </div>
            <div
              v-if="getDescription(row.original).subtitle"
              class="text-sm"
              :class="isChequeUndeliverable(row.original) ? 'text-red-600' : 'text-gray-500'"
            >
              {{ getDescription(row.original).subtitle }}
            </div>
          </div>
        </template>

        <template #relatedStatementNumber-cell="{ row }">
          <span>{{ row.original.relatedStatementNumber || row.original.statementNumber || '' }}</span>
        </template>

        <template #amount-cell="{ row }">
          <div>
            <template v-if="getDisplayAmount(row.original) != null">
              <div :class="{ 'text-red-600': getDisplayAmount(row.original)! < 0 }">
                {{ CommonUtils.formatAmount(getDisplayAmount(row.original)!) }}
              </div>
            </template>
            <template v-else>
              <div>-</div>
            </template>
            <div class="text-gray-500 text-sm">
              Balance: {{ CommonUtils.formatAmount(row.original.shortNameBalance ?? row.original.creditsRemaining) }}
            </div>
          </div>
        </template>

        <template #actions-cell="{ row }">
          <div class="flex items-center justify-end gap-2">
            <UButton
              v-if="canShowRefundDetail(row.original)"
              label="Refund Detail"
              color="primary"
              class="btn-table font-normal"
              @click="navigateToRefundDetail(row.original)"
            />

            <UTooltip
              v-if="row.original.transactionType === ShortNameHistoryType.STATEMENT_PAID
                && row.original.statementNumber"
              :text="getReversalTooltip(row.original.transactionDate, row.original.paymentDate)"
            >
              <UButton
                label="Reverse"
                color="primary"
                class="btn-table font-normal"
                :disabled="!canShowReverseButton(row.original)"
                @click="showConfirmReverseModal(row.original)"
              />
            </UTooltip>
          </div>
        </template>

        <template #loading>
          <div class="text-center py-8">
            Loading payment history...
          </div>
        </template>

        <template #empty>
          <div class="text-center py-8 text-gray-600">
            No payment history records.
          </div>
        </template>
      </UTable>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '~/assets/scss/basic-table.scss';

.card-title {
  background-color: var(--color-bg-light-blue);
}

.text-primary {
  color: var(--color-primary);
}

.btn-table {
  white-space: nowrap;
}

.table-scroll {
  position: relative;
  overflow-x: hidden;
}

.table-scroll,
.table-scroll * {
  transform: none !important;
  will-change: auto !important;
}

.history-table {
  overflow: visible !important;
}

.history-table :deep(table) {
  overflow: visible !important;
}

.history-table :deep(thead) {
  position: sticky;
  top: 0;
  z-index: 20;
  background: white !important;
}

.history-table :deep(thead th) {
  background: white !important;
}
</style>
