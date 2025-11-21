<script setup lang="ts">
import type { Invoice } from '@/interfaces/invoice'
import AddManualTransactionDetails from '@/components/RoutingSlip/AddManualTransactionDetails.vue'
import TransactionDataTable from '@/components/RoutingSlip/TransactionDataTable.vue'
import useRoutingSlipTransaction from '@/composables/viewRoutingSlip/useRoutingSlipTransaction'

interface Props {
  invoices?: Invoice[]
}

const props = withDefaults(defineProps<Props>(), {
  invoices: () => []
})

const {
  formRoutingSlipManualTransactions,
  showAddManualTransaction,
  manualTransactionsList,
  isRoutingSlipAChild,
  isRoutingSlipVoid,
  isLoading,
  showManualTransaction,
  addManualTransactionRow,
  addManualTransactions,
  isLastChild,
  removeManualTransactionRow,
  updateManualTransactionDetails,
  hideManualTransaction,
  status
} = useRoutingSlipTransaction()
</script>

<template>
  <div>
    <div class="my-4">
      <div
        v-if="!isRoutingSlipAChild && !isRoutingSlipVoid"
        v-can:fas_transaction.hide
      >
        <UButton
          large
          color="primary"
          @click="showManualTransaction"
        >
          <template #leading>
            <UIcon name="mdi-plus" class="size-5" />
          </template>
          <span>
            Add Transaction Manually
          </span>
        </UButton>
      </div>
    </div>
    <UCard v-if="showAddManualTransaction">
      <div class="grid grid-cols-12 gap-6">
        <div class="col-span-2">
          <span class="font-bold mt-2 pr-10">
            Add Manual Transaction
          </span>
        </div>
        <div class="col-span-10">
          <form
            id="formRoutingSlipManualTransactions"
            ref="formRoutingSlipManualTransactions"
            class="mt-2"
          >
            <div v-for="(transaction, index) in manualTransactionsList" :key="transaction.key">
              <AddManualTransactionDetails
                :index="index"
                :manual-transaction="transaction"
                @update-manual-transaction="updateManualTransactionDetails($event)"
                @remove-manual-transaction-row="removeManualTransactionRow($event)"
              />
              <USeparator v-if="isLastChild(index)" class="my-6" />
            </div>
          </form>
          <div v-if="status" class="my-4">
            <p class="mb-0">
              <span class="pl-1 text-red-600">
                {{ $t(status) }}
              </span>
            </p>
          </div>
          <div class="flex justify-between mt-6">
            <UButton
              variant="ghost"
              color="primary"
              size="lg"
              class="pl-0 pr-2"
              @click="addManualTransactionRow"
            >
              <template #leading>
                <UIcon name="mdi-plus-box" class="size-5" />
              </template>
              Add another transaction
            </UButton>

            <div class="flex gap-3">
              <UButton
                size="lg"
                color="primary"
                :loading="isLoading"
                class="px-10"
                @click="addManualTransactions"
              >
                Add Transaction
              </UButton>
              <UButton
                size="lg"
                variant="outline"
                color="primary"
                @click="hideManualTransaction"
              >
                Cancel
              </UButton>
            </div>
          </div>
        </div>
      </div>
    </UCard>
    <TransactionDataTable :invoices="props.invoices" />
  </div>
</template>
