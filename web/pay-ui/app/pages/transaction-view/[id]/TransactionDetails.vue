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
    <div class="flex items-center h-[75px] px-6 bg-blue-50">
      <UIcon name="i-mdi-file-document" class="text-primary text-3xl mr-3" />
      <span class="font-bold text-lg">Transaction Details</span>
    </div>

    <div class="p-6 space-y-6">
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
        <table class="w-full border-collapse">
          <thead>
            <tr class="border-b border-gray-200">
              <th class="text-left py-3 pr-4 font-semibold text-gray-700">
                Application
              </th>
              <th class="text-left py-3 px-4 font-semibold text-gray-700 border-l border-gray-200">
                Type
              </th>
              <th class="text-left py-3 px-4 font-semibold text-gray-700 border-l border-gray-200">
                Number
              </th>
              <th class="text-left py-3 pl-4 font-semibold text-gray-700 border-l border-gray-200">
                Detail
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="py-4 pr-4 align-top">
                {{ transactionData.applicationName }}
              </td>
              <td class="py-4 px-4 align-top">
                {{ transactionData.applicationType }}
              </td>
              <td class="py-4 px-4 align-top">
                {{ transactionData.businessIdentifier }}
              </td>
              <td class="py-4 pl-4 align-top">
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
        <table class="w-full border-collapse">
          <thead>
            <tr class="border-b border-gray-200">
              <th class="text-left py-3 pr-4 font-semibold text-gray-700">
                Transaction ID
              </th>
              <th class="text-left py-3 px-4 font-semibold text-gray-700 border-l border-gray-200">
                Invoice Reference ID
              </th>
              <th
                v-if="transactionData.routingSlip"
                class="text-left py-3 pl-4 font-semibold text-gray-700 border-l border-gray-200"
              >
                Routing Slip Number
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="py-4 pr-4 align-top">
                {{ transactionData.invoiceId }}
              </td>
              <td class="py-4 px-4 align-top">
                {{ transactionData.invoiceReferenceId }}
              </td>
              <td
                v-if="transactionData.routingSlip"
                class="py-4 pl-4 align-top"
              >
                {{ transactionData.routingSlip }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
