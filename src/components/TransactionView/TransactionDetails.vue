<template>
  <v-card flat>
    <v-card-title class="card-title">
      <v-icon
        class="pr-3"
        color="link"
      >
        mdi-file-document
      </v-icon>
      Transaction Details
    </v-card-title>
    <v-card-text
      class="mt-5"
    >
      <v-row no-gutters>
        <v-col class="col-12 col-sm-12 ">
          <v-row>
            <v-col class="col-6 col-sm-3 font-weight-bold">
              Transaction Date
            </v-col>
            <v-col class="col-6 col-sm-9">
              {{formatUtcToPacificDate(transactionData.invoiceCreatedOn, 'MMMM DD, YYYY h:mm A')}}
            </v-col>
          </v-row>
          <v-row>
            <v-col class="col-6 col-sm-3 font-weight-bold">
              Receipt
            </v-col>
            <v-col class="col-6 col-sm-9">
              <div
                v-if="transactionData.invoiceStatusCode === InvoiceStatus.COMPLETED || transactionData.invoiceStatusCode === InvoiceStatus.PAID"
                class="receipt"
                @click="downloadReceipt()"
              >
                <v-icon
                  color="primary"
                >
                  mdi-file-pdf-outline
                </v-icon>
                <span>
                  Receipt
                </span>
              </div>
            </v-col>
          </v-row>
          <v-row>
            <v-col class="col-12">
              <v-simple-table>
                <template v-slot:default>
                  <thead>
                    <tr>
                      <th class="text-left">
                        Application
                      </th>
                      <th class="text-left">
                        Type
                      </th>
                      <th class="text-left">
                        Number
                      </th>
                      <th class="text-left">
                        Detail
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        {{transactionData.applicationName}}
                      </td>
                      <td>
                        {{transactionData.applicationType}}
                      </td>
                      <td>
                        {{transactionData.businessIdentifier}}
                      </td>
                      <td>
                        <template v-if="transactionData.applicationDetails">
                          <div v-for="(detail, index) in transactionData.applicationDetails" :key="index">
                            {{ detail.label }} {{ detail.value }}
                          </div>
                        </template>
                      </td>
                    </tr>
                  </tbody>
                </template>
              </v-simple-table>
            </v-col>
          </v-row>
          <v-row>
            <v-col class="col-6 col-sm-3 font-weight-bold py-0">
              Identifier
            </v-col>
          </v-row>
          <v-row>
            <v-col class="col-12">
              <v-simple-table>
                <template v-slot:default>
                  <thead>
                    <tr>
                      <th class="text-left">
                        Transaction ID
                      </th>
                      <th class="text-left">
                        Invoice Reference ID
                      </th>
                      <th v-if="transactionData.routingSlip" class="text-left">
                        Routing Slip Number
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        {{transactionData.invoiceId}}
                      </td>
                      <td>
                        {{transactionData.invoiceReferenceId}}
                      </td>
                      <td v-if="transactionData.routingSlip" class="text-left">
                        {{transactionData.routingSlip}}
                      </td>
                    </tr>
                  </tbody>
                </template>
              </v-simple-table>
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import { defineComponent, PropType } from '@vue/composition-api'
import CommonUtils from '@/util/common-util'
import { TransactionData } from '@/models/transaction-refund'
import PaymentService from '@/services/payment.services'
import ConfigHelper from '@/util/config-helper'
import { InvoiceStatus, SessionStorageKeys } from '@/util/constants'

export default defineComponent({
  name: 'TransactionDetails',
  props: {
    transactionData: {
      type: Object as PropType<TransactionData>,
      required: true
    }
  },
  setup (props) {
    async function downloadReceipt () {
      const currentAccount = JSON.parse(ConfigHelper.getFromSession(SessionStorageKeys.CurrentAccount || '{}'))
      const receipt = await PaymentService.postReceipt(
        props.transactionData.invoiceId,
        currentAccount.id,
        CommonUtils.formatDisplayDate(props.transactionData.invoiceCreatedOn)
      )
      const filename = `bcregistry-receipts-${props.transactionData.invoiceId}.pdf`
      CommonUtils.fileDownload(receipt.data, filename, 'application/pdf')
    }

    return {
      formatDisplayDate: CommonUtils.formatDisplayDate,
      formatUtcToPacificDate: CommonUtils.formatUtcToPacificDate,
      downloadReceipt,
      InvoiceStatus
    }
  }
})
</script>

<style lang="scss" scoped>
@import '$assets/scss/theme.scss';
@import '$assets/scss/actions.scss';

.card-title {
  background-color: $app-lt-blue;
  justify-content: left;
  height: 75px;
  font-weight: bold;
  font-size: 1.125rem;
}

.v-data-table > .v-data-table__wrapper > table > thead > tr > th {
  border-right: 1px solid #E0E0E0;
}

.v-data-table > .v-data-table__wrapper > table > tbody > tr:hover {
  background-color: transparent !important;
}

.v-data-table > .v-data-table__wrapper > table > thead > tr > th:first-child,
.v-data-table > .v-data-table__wrapper > table > tbody > tr > td:first-child {
  padding-left: 0 !important;
}

.v-data-table > .v-data-table__wrapper > table > thead > tr > th:not(:first-child),
.v-data-table > .v-data-table__wrapper > table > tbody > tr > td:not(:first-child) {
  padding-left: 16px !important;
}

.v-data-table > .v-data-table__wrapper > table > tbody > tr > td {
  padding-top: 16px;
  vertical-align: top;
}
.v-application ol, .v-application ul {
  padding-left: 16px;
}
.receipt {
  cursor: pointer;
  color: var(--v-primary-base);
}

</style>
