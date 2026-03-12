<script setup lang="ts">
import CommonUtils from '@/utils/common-util'
import { InvoiceStatus } from '@/utils/constants'
import type { TransactionData } from '@/interfaces/transaction-view'
import { useTransactionView } from '~/composables/transactions/useTransactionView'

const props = defineProps<{
  transactionData: TransactionData
}>()
const { downloadReceipt } = useTransactionView()

const canDownloadReceipt = computed(() =>
  props.transactionData.invoiceStatusCode === InvoiceStatus.COMPLETED
  || props.transactionData.invoiceStatusCode === InvoiceStatus.PAID
)

function handleDownloadReceipt() {
  downloadReceipt(props.transactionData)
}
</script>

<template>
  <div class="bg-white rounded shadow-sm border border-gray-200">
    <div class="card-title flex items-center px-6 py-5 bg-bcgov-lightblue">
      <UIcon name="i-mdi-file-document" class="text-primary text-3xl mr-4" />
      <h2 class="text-lg font-bold text-gray-900">
        Transaction Details
      </h2>
    </div>

    <div class="p-6 space-y-6 text-[var(--color-text-secondary)]">
      <div class="grid grid-cols-1 sm:grid-cols-4 gap-2">
        <span class="font-bold text-gray-900">Transaction Date</span>
        <span class="sm:col-span-3">
          {{ CommonUtils.formatDisplayDate(transactionData.invoiceCreatedOn, 'MMMM dd, yyyy h:mm a') }}
        </span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-4 gap-2">
        <span class="font-bold text-gray-900">Receipt</span>
        <div class="sm:col-span-3">
          <button
            v-if="canDownloadReceipt"
            class="flex items-center gap-1 text-primary cursor-pointer hover:underline"
            @click="handleDownloadReceipt()"
          >
            <UIcon name="i-mdi-file-pdf-outline" class="size-5" />
            <span>Receipt</span>
          </button>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full border-collapse table-fixed">
          <thead>
            <tr class="border-b border-gray-200">
              <th class="w-1/4 text-left py-3 pr-4 font-semibold">
                Application
              </th>
              <th class="w-1/3 text-left py-3 px-4 font-semibold border-l border-gray-200">
                Type
              </th>
              <th class="w-1/6 text-left py-3 px-4 font-semibold border-l border-gray-200">
                Number
              </th>
              <th class="w-1/4 text-left py-3 pl-4 font-semibold border-l border-gray-200">
                Detail
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="py-4 pr-4 align-top">
                {{ transactionData.applicationName }}
              </td>
              <td class="py-4 px-4 align-top border-l border-gray-200">
                {{ transactionData.applicationType }}
              </td>
              <td class="py-4 px-4 align-top border-l border-gray-200">
                {{ transactionData.businessIdentifier }}
              </td>
              <td class="py-4 pl-4 align-top border-l border-gray-200">
                <template v-if="transactionData.applicationDetails">
                  <div
                    v-for="(detail, index) in transactionData.applicationDetails"
                    :key="index"
                  >
                    {{ detail.label }} {{ detail.value }}
                  </div>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="font-bold text-gray-900">
        Identifier
      </div>

      <div class="overflow-x-auto">
        <table class="w-full border-collapse table-fixed">
          <thead>
            <tr class="border-b border-gray-200">
              <th class="w-1/4 text-left py-3 pr-4 font-semibold">
                Transaction ID
              </th>
              <th class="w-1/3 text-left py-3 px-4 font-semibold border-l border-gray-200">
                Invoice Reference ID
              </th>
              <th class="w-1/6 text-left py-3 px-4 font-semibold border-l border-gray-200">
                <template v-if="transactionData.routingSlip">
                  Routing Slip Number
                </template>
              </th>
              <th class="w-1/4" />
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="py-4 pr-4 align-top">
                {{ transactionData.invoiceId }}
              </td>
              <td class="py-4 px-4 align-top border-l border-gray-200">
                {{ transactionData.invoiceReferenceId }}
              </td>
              <td class="py-4 px-4 align-top border-l border-gray-200">
                {{ transactionData.routingSlip }}
              </td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '~/assets/scss/card.scss';

th, td {
  font-size: inherit;
}
</style>
