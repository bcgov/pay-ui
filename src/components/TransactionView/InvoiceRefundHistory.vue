<template>
  <v-card flat>
    <v-card-title class="card-title">
      <v-icon
        class="pr-3"
        color="link"
      >
        mdi-format-list-bulleted
      </v-icon>
      Refund History
    </v-card-title>
    <v-card-text
      class="mt-5"
    >
      <v-row no-gutters>
        <v-col class="col-12 col-sm-12 ">
          <v-row>
            <v-col class="col-12">
              <v-simple-table>
                <template v-slot:default>
                  <thead>
                  <tr>
                    <th class="text-left">
                      Date
                    </th>
                    <th class="text-left">
                      Refund Method
                    </th>
                    <th class="text-left">
                      Refund Amount
                    </th>
                    <th class="text-left">
                      Actions
                    </th>
                  </tr>
                  </thead>
                  <tbody>
                  <tr v-for="item, index in refundHistoryData"
                      :key="item.codeRefundId"
                  class="mb-5">
                    <td>
                      {{formatUtcToPacificDate(item.requestedDate, 'MMMM DD, YYYY h:mm A')}}
                    </td>
                    <td>
                      <div class="mb-2">{{ item.refundMethod }}</div>
                      <div>
                        <v-chip
                          v-if="item.refundStatus === RefundStatus.PENDING_APPROVAL"
                          small
                          label
                          text-color="black"
                          class="gray pl-2 pr-2 mt-0"
                        >
                          <b>REFUND REQUESTED</b>
                        </v-chip>
                        <v-chip
                          v-else-if="item.refundStatus === RefundStatus.APPROVED && item.partialRefundLines.length > 0"
                          small
                          label
                          text-color="white"
                          class="primary pl-2 pr-2 mt-0"
                        >
                          <b>PARTIALLY REFUNDED</b>
                        </v-chip>
                        <v-chip
                          v-else-if="item.refundStatus === RefundStatus.APPROVED"
                          small
                          label
                          text-color="white"
                          class="primary pl-2 pr-2 mt-2"
                        >
                          <b>FULL REFUND APPROVED</b>
                        </v-chip>
                        <v-chip
                          v-else-if="item.refundStatus === RefundStatus.DECLINED"
                          small
                          label
                          text-color="white"
                          class="red pl-2 pr-2 mt-0"
                        >
                          <b>REFUND DECLINED</b>
                        </v-chip>
                      </div>
                    </td>
                    <td>
                      {{formatAmount(item.refundAmount)}}
                    </td>
                    <td>
                      <v-btn
                        small
                        color="primary"
                        min-width="150px"
                        min-height="44px"
                        class="single-action-btn pt-2 pb-2"
                        @click="viewDetails(index)"
                      >
                        View Details
                      </v-btn>
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
import { RefundRequest } from '@/models/transaction-refund'
import { RefundStatus, RouteNames } from '@/util/constants'

export default defineComponent({
  name: 'InvoiceRefundHistory',
  props: {
    refundHistoryData: {
      type: Array as PropType<RefundRequest[]>,
      required: true
    }
  },
  setup (props, { root }) {
    function viewDetails (index) {
      root.$router?.push({
        name: RouteNames.TRANSACTION_VIEW,
        params: {
          invoiceId: props.refundHistoryData[index].invoiceId.toString(),
          refundId: props.refundHistoryData[index].refundId.toString(),
          mode: 'refund-request'
        }
      })
    }

    return {
      formatUtcToPacificDate: CommonUtils.formatUtcToPacificDate,
      formatAmount: CommonUtils.formatAmount,
      RefundStatus,
      viewDetails
    }
  }
})
</script>

<style lang="scss" scoped>
@import '$assets/scss/actions.scss';
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
  padding-bottom: 16px;
  vertical-align: top;
}

</style>
