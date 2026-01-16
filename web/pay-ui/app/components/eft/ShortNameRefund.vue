<script setup lang="ts">
import CommonUtils from '@/utils/common-util'
import { EFTRefundMethodDescription } from '@/utils/constants'
import { useEftRefund } from '@/composables/eft/useEftRefund'
import type { EftRefund } from '@/composables/eft/useEftRefund'
import type { ShortNameDetails, EftShortName } from '@/composables/eft/useShortNameDetails'

interface Props {
  shortNameDetails: ShortNameDetails | null
  shortName: EftShortName | null
  unsettledAmount: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'on-short-name-refund': [id: number]
}>()

const router = useRouter()
const { getPendingRefunds, approveRefund: apiApproveRefund, declineRefund: apiDeclineRefund } = useEftRefund()

const isEftRefundApprover = CommonUtils.isEftRefundApprover()
const currentUser = CommonUtils.getUserInfo()

const state = reactive({
  results: [] as EftRefund[],
  totalResults: 0,
  loading: false,
  currentEftRefund: null as EftRefund | null,
  declineReason: '',
  showDeclineDialog: false
})

const headers = [
  { id: 'createdName', accessorKey: 'createdName', header: 'Initiated By' },
  { id: 'comment', accessorKey: 'comment', header: 'Reason for Refund' },
  { id: 'refundMethod', accessorKey: 'refundMethod', header: 'Refund Method' },
  { id: 'refundAmount', accessorKey: 'refundAmount', header: 'Refund Amount' },
  { id: 'actions', accessorKey: 'actions', header: 'Actions', meta: { class: { th: 'text-right', td: 'text-right' } } }
]

const filteredResults = computed(() => state.results)

async function loadTransactions(shortnameId: number): Promise<void> {
  try {
    state.loading = true
    state.results = await getPendingRefunds(shortnameId)
    state.totalResults = state.results.length
  } catch (error) {
    console.error('Failed to get EFT refunds list.', error)
  } finally {
    state.loading = false
  }
}

async function approveRefund(item: EftRefund) {
  try {
    state.loading = true
    await apiApproveRefund(item.id)
    if (props.shortNameDetails?.id) {
      await loadTransactions(props.shortNameDetails.id)
    }
    emit('on-short-name-refund', item.id)
  } catch (error) {
    console.error('Failed to approve refund.', error)
  } finally {
    state.loading = false
  }
}

function declineRefund(item: EftRefund) {
  state.currentEftRefund = item
  state.declineReason = ''
  state.showDeclineDialog = true
}

async function dialogDecline() {
  if (!state.currentEftRefund) { return }

  try {
    state.loading = true
    await apiDeclineRefund(state.currentEftRefund.id, state.declineReason)
    if (props.shortNameDetails?.id) {
      await loadTransactions(props.shortNameDetails.id)
    }
    emit('on-short-name-refund', state.currentEftRefund.id)
  } catch (error) {
    console.error('Failed to decline refund.', error)
  } finally {
    state.loading = false
    state.showDeclineDialog = false
    state.currentEftRefund = null
  }
}

function dialogCancel() {
  state.showDeclineDialog = false
  state.currentEftRefund = null
  state.declineReason = ''
}

function viewRefundDetails(id: number) {
  if (!id || !props.shortNameDetails?.id) { return }
  router.push({
    path: `/eft/shortname-details/${props.shortNameDetails.id}/refund`,
    query: { eftRefundId: String(id) }
  })
}

function initiateRefund() {
  if (!props.shortNameDetails?.id) { return }
  router.push(`/eft/shortname-details/${props.shortNameDetails.id}/refund-selection`)
}

function disableApproveRefund(item: EftRefund): boolean {
  return item?.createdBy?.toUpperCase() === currentUser?.userName?.toUpperCase()
}

function formatCurrency(amount: number): string {
  return CommonUtils.formatAmount(amount)
}

watch(
  () => props.shortNameDetails?.id,
  (newId) => {
    if (newId) {
      loadTransactions(newId)
    }
  },
  { immediate: true }
)
</script>

<template>
  <div class="bg-gray-50 border-y border-gray-200">
    <!-- Header -->
    <div class="card-title flex items-center px-6 py-5 bg-bcgov-lightblue">
      <UIcon name="i-mdi-file-document" class="text-primary text-3xl mr-4" />
      <h2 class="text-lg font-bold text-gray-900">
        Short Name Refund
      </h2>
    </div>

    <!-- No Refund State -->
    <div
      v-if="!filteredResults.length"
      class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-4 py-6"
    >
      <span class="text-gray-700">
        No refund initiated. SBC Finance can initiate refund if a CAS supplier number is created for the short name.
      </span>
      <UButton
        label="Initiate Refund"
        color="primary"
        variant="outline"
        class="btn-table initiate-refund-btn"
        @click="initiateRefund"
      />
    </div>

    <!-- Refund Table -->
    <div v-if="filteredResults.length" class="px-0">
      <UTable
        :data="filteredResults"
        :columns="headers"
        :loading="state.loading"
        class="w-full"
      >
        <template #refundMethod-cell="{ row }">
          <span>
            {{ EFTRefundMethodDescription[row.original.refundMethod as keyof typeof EFTRefundMethodDescription] }}
          </span>
        </template>

        <template #refundAmount-cell="{ row }">
          <div>
            <span>{{ formatCurrency(Number(row.original.refundAmount)) }}</span>
            <button
              class="block text-primary underline font-normal cursor-pointer mt-1"
              @click="viewRefundDetails(row.original.id)"
            >
              View Refund Detail
            </button>
          </div>
        </template>

        <template #actions-cell="{ row }">
          <div v-if="isEftRefundApprover" class="flex justify-end gap-3">
            <UButton
              label="Decline"
              color="primary"
              variant="outline"
              size="sm"
              icon="i-mdi-close"
              :loading="state.loading"
              @click="declineRefund(row.original)"
            />
            <UButton
              label="Approve"
              :color="disableApproveRefund(row.original) ? 'neutral' : 'primary'"
              :variant="disableApproveRefund(row.original) ? 'outline' : 'solid'"
              size="sm"
              icon="i-mdi-check"
              :loading="state.loading"
              :disabled="disableApproveRefund(row.original)"
              @click="approveRefund(row.original)"
            />
          </div>
        </template>
      </UTable>
    </div>

    <!-- Decline Dialog -->
    <UModal v-model:open="state.showDeclineDialog" :ui="{ content: 'sm:max-w-[720px]' }">
      <template #header>
        <div class="flex items-center justify-between w-full pr-2">
          <h2 class="text-xl font-bold text-gray-900">
            Decline Refund Request?
          </h2>
          <UButton
            icon="i-mdi-close"
            color="primary"
            variant="ghost"
            size="lg"
            @click.stop="dialogCancel"
          />
        </div>
      </template>

      <template #body>
        <div class="py-4">
          <p class="text-gray-700 mb-4">
            By declining the request, the amount will remain unsettled in the short name.
          </p>
          <UInput
            v-model="state.declineReason"
            placeholder="Reasons for declining (Optional)"
            size="lg"
            class="w-full"
          />
        </div>
      </template>

      <template #footer>
        <div class="flex items-center justify-center gap-3 w-full py-2">
          <UButton
            label="Cancel"
            color="primary"
            variant="outline"
            size="lg"
            class="min-w-[100px]"
            @click.stop="dialogCancel"
          />
          <UButton
            label="Decline"
            color="primary"
            size="lg"
            class="min-w-[100px]"
            :loading="state.loading"
            @click="dialogDecline"
          />
        </div>
      </template>
    </UModal>
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

.initiate-refund-btn {
  border-color: #003366 !important;
  color: #003366 !important;
  background-color: transparent !important;

  &:hover {
    background-color: rgba(0, 51, 102, 0.05) !important;
  }
}
</style>
