<script setup lang="ts">
import type { Invoice } from '@/interfaces/invoice'
import useTransactionDataTable from '@/composables/viewRoutingSlip/useTransactionDataTable'
import commonUtil from '@/utils/common-util'
import { RefundApprovalStatus, RefundApprovalStatusDisplay } from '~/utils'
import { RolePattern } from '~/enums'
import CommonUtils from '~/utils/common-util'

const route = useRoute()
const { getFeatureFlag } = useConnectLaunchDarkly()

interface Props {
  invoices?: Invoice[]
}

const props = withDefaults(defineProps<Props>(), {
  invoices: () => []
})

const {
  invoiceDisplay,
  headerTransactions,
  invoiceCount,
  cancel,
  disableCancelButton,
  isAlreadyCancelled
} = useTransactionDataTable(toRef(props, 'invoices'))

const enableRefundRequestFlow = await getFeatureFlag(LDFlags.EnableFasRefundRequestFlow, false, 'await')

const formatDisplayDate = commonUtil.formatDisplayDate
const appendCurrencySymbol = commonUtil.appendCurrencySymbol

async function cancelTransaction(id: number) {
  if (enableRefundRequestFlow) {
    navigateTo({
      path: `/transaction-view/${id}/initiateRefund`,
      query: {
        returnTo: route.path,
        returnType: 'viewRoutingSlip',
        returnToId: route.params.slipId
      }
    })
  } else {
    cancel(id)
  }
}

async function viewRefundDetail(invoiceId: number, refundId: number) {
  navigateTo({
    path: `/transaction-view/${invoiceId}/refund-request/${refundId}`,
    query: {
      returnTo: route.path,
      returnType: 'viewRoutingSlip',
      returnToId: route.params.slipId
    }
  })
}

function showInitiateRefundButton(invoiceRow: Invoice) {
  if (
    !invoiceRow.latestRefundStatus
    || RefundApprovalStatus.DECLINED === invoiceRow.latestRefundStatus
  ) {
    const productRole = (invoiceRow.product?.toLowerCase() ?? '')
      + RolePattern.ProductRefundRequester
    return (!!invoiceRow.partialRefundable || !!invoiceRow.fullRefundable)
      && invoiceRow.total > 0
      && CommonUtils.canInitiateProductRefund(productRole)
  }
  return false
}

function showRefundRequestBadge(invoiceRow: Invoice) {
  return !!(invoiceRow.latestRefundStatus
    && [RefundApprovalStatus.DECLINED, RefundApprovalStatus.PENDING_APPROVAL]
      .includes(invoiceRow.latestRefundStatus as RefundApprovalStatus))
}
</script>

<template>
  <div class="bg-white rounded shadow-sm">
    <div class="header-bg-color flex items-center py-5 mb-0 mt-3">
      <UIcon name="i-mdi-view-list" class="ml-8 text-primary size-6" />
      <p class="ml-2 mb-0 font-bold header-text" data-test="title">
        Transactions
      </p>
      <p v-if="invoiceCount" class="mb-0 pl-1 font-bold header-text">
        ({{ invoiceCount }})
      </p>
    </div>
    <UTable
      :data="invoiceDisplay"
      :columns="headerTransactions"
      class="fas-transactions"
    >
      <template #createdOn-header>
        <div class="pl-4">
          Date
        </div>
      </template>
      <template #createdOn-cell="{ row }">
        <div class="pl-4 font-bold table-cell-text">
          {{ formatDisplayDate(row.original.createdOn || '', 'MMMM dd, yyyy') }}
        </div>
      </template>
      <template #invoiceNumber-cell="{ row }">
        <div class="font-bold table-cell-text">
          {{ row.original.invoiceNumber || '-' }}
        </div>
      </template>
      <template #total-cell="{ row }">
        <div class="font-bold table-cell-text text-right">
          {{ appendCurrencySymbol(row.original.total?.toFixed(2) || '0.00') }}
          <br>
          <span v-if="row.original.refund > 0" class="font-normal">
            Refunded ({{ appendCurrencySymbol(row.original.refund?.toFixed(2) || '0.00') }})
          </span>
          <UBadge
            v-else-if="showRefundRequestBadge(row.original)"
            color="neutral"
            class="!bg-gray-200 !text-gray-700 font-bold"
            variant="solid"
            size="md"
          >
            {{ RefundApprovalStatusDisplay[row.original.latestRefundStatus as RefundApprovalStatus]?.toUpperCase() }}
          </UBadge>
        </div>
      </template>
      <template #description-cell="{ row }">
        <div v-for="(description, idx) in row.original.description" :key="idx">
          <p class="mb-0 font-bold table-cell-text">
            {{ description }}
          </p>
        </div>
      </template>
      <template #createdName-cell="{ row }">
        <div class="table-cell-text">
          {{ row.original.createdName || '-' }}
        </div>
      </template>
      <template #actions-cell="{ row }">
        <template v-if="isAlreadyCancelled(row.original.statusCode) && !enableRefundRequestFlow">
          <span
            :data-test="commonUtil.getIndexedTag('text-cancel', row.index)"
            class="text-error font-bold"
          >
            Cancelled
          </span>
        </template>
        <template v-else-if="enableRefundRequestFlow">
          <UButton
            :data-test="commonUtil.getIndexedTag('btn-invoice-cancel', row.index)"
            label="View Refund Detail"
            variant="outline"
            color="primary"
            class="btn-table"
            @click="viewRefundDetail(row.original.id, row.original.latestRefundId)"
          />
        </template>
        <template v-else>
          <div v-can:fas_refund.hide>
            <UButton
              v-if="enableRefundRequestFlow && showInitiateRefundButton(row.original)"
              :data-test="commonUtil.getIndexedTag('btn-invoice-cancel', row.index)"
              label="Request Refund"
              variant="outline"
              color="primary"
              class="btn-table"
              @click="cancelTransaction(row.original.id!)"
            />
            <UButton
              v-else-if="!enableRefundRequestFlow"
              :data-test="commonUtil.getIndexedTag('btn-invoice-cancel', row.index)"
              label="Cancel"
              variant="outline"
              color="primary"
              class="btn-table"
              :disabled="disableCancelButton"
              @click="cancelTransaction(row.original.id!)"
            />
          </div>
        </template>
      </template>
      <template #empty>
        <div class="flex items-center justify-center py-6 text-gray-500">
          No data available
        </div>
      </template>
    </UTable>
  </div>
</template>

<style lang="scss" scoped>
.header-bg-color {
  background-color: var(--color-bg-light-blue);
}

.header-text {
  color: var(--color-text-dark-gray);
}

.table-cell-text {
  color: var(--color-text-secondary);
}

:deep(.fas-transactions) {
  background-color: var(--color-white);
}

:deep(.fas-transactions table) {
  background-color: var(--color-white);
}

:deep(.fas-transactions table tbody tr td) {
  padding: 20px 15px !important;
  background-color: var(--color-white);
  color: var(--color-text-secondary);
}

:deep(.fas-transactions table thead tr th) {
  background-color: var(--color-white);
  font-weight: bold;
  color: var(--color-text-dark-gray);
}
</style>
