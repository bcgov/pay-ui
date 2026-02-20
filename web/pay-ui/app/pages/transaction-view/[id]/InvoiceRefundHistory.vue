<script setup lang="ts">
import CommonUtils from '@/utils/common-util'
import { RefundApprovalStatus } from '@/utils/constants'

// Define the interface for refund history items
interface RefundHistoryItem {
  codeRefundId: number
  invoiceId: number
  refundId: number
  requestedDate: string
  refundMethod: string
  refundStatus: string
  refundAmount: number
  partialRefundLines: unknown[]
}

interface Props {
  refundHistoryData: RefundHistoryItem[]
}

const props = defineProps<Props>()
const router = useRouter()

const headers = [
  { accessorKey: 'requestedDate', header: 'Date' },
  { accessorKey: 'refundMethod', header: 'Refund Method' },
  { accessorKey: 'refundAmount', header: 'Refund Amount' },
  { accessorKey: 'actions', header: 'Actions' }
]

function viewDetails(index: number) {
  const item = props.refundHistoryData[index]
  if (item?.invoiceId && item?.refundId) {
    router.push({
      path: `/transaction-view/${item.invoiceId}/refund-request/${item.refundId}`
    })
  }
}

function getStatusConfig(item: RefundHistoryItem) {
  if (item.refundStatus === RefundApprovalStatus.PENDING_APPROVAL) {
    return { label: 'REFUND REQUESTED', color: 'neutral' as const,
      classes: '!bg-gray-200 !text-gray-700' }
  }
  if (item.refundStatus === RefundApprovalStatus.APPROVED && item.partialRefundLines?.length > 0) {
    return { label: 'PARTIALLY REFUNDED', color: 'primary' as const }
  }
  if (item.refundStatus === RefundApprovalStatus.APPROVED) {
    return { label: 'FULL REFUND APPROVED', color: 'primary' as const }
  }
  if (item.refundStatus === RefundApprovalStatus.DECLINED) {
    return { label: 'REFUND DECLINED', color: 'red' as const }
  }
  return null
}
</script>

<template>
  <div class="bg-white rounded shadow-sm border border-gray-200">
    <div class="flex items-center h-[75px] px-6 bg-blue-50">
      <UIcon name="i-mdi-format-list-bulleted" class="text-primary text-3xl mr-3" />
      <span class="font-bold text-lg">Refund History</span>
    </div>

    <div class="mt-2">
      <UTable
        :data="refundHistoryData"
        :columns="headers"
      >
        <template #requestedDate-cell="{ row }">
          {{ CommonUtils.formatDisplayDate(row.original.requestedDate, 'MMMM dd, yyyy h:mm a') }}
        </template>

        <template #refundMethod-cell="{ row }">
          <div class="space-y-2">
            <div>{{ row.original.refundMethod }}</div>
            <UBadge
              v-if="getStatusConfig(row.original)"
              :color="getStatusConfig(row.original)?.color"
              :class="getStatusConfig(row.original)?.classes"
              variant="solid"
              size="md"
            >
              {{ getStatusConfig(row.original)?.label }}
            </UBadge>
          </div>
        </template>

        <!-- Refund Amount Column -->
        <template #refundAmount-cell="{ row }">
          {{ CommonUtils.formatAmount(row.original.refundAmount) }}
        </template>

        <!-- Actions Column -->
        <template #actions-cell="{ row }">
          <UButton
            label="View Details"
            color="primary"
            size="sm"
            class="min-w-[150px]"
            @click="viewDetails(refundHistoryData.indexOf(row.original))"
          />
        </template>
      </UTable>
    </div>
  </div>
</template>

<style scoped>
@use '~/assets/scss/basic-table.scss';

.text-primary {
  color: var(--color-primary);
}

:deep(td) {
  color: var(--color-text-secondary);
}
</style>
