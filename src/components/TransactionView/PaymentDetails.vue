<template>
  <v-card flat>
    <v-card-title class="card-title">
      <v-icon
        class="pr-3"
        color="link"
      >
        mdi-file-document
      </v-icon>
      Payment Details
    </v-card-title>
    <v-card-text
      class="mt-5"
    >
      <v-row no-gutters>
        <v-col class="col-12 col-sm-12 ">
          <v-row>
            <v-col class="col-6 col-sm-3 font-weight-bold">
              Account Name
            </v-col>
            <v-col class="col-6 col-sm-9">
              {{paymentData.accountName}}
            </v-col>
          </v-row>
          <v-row>
            <v-col class="col-6 col-sm-3 font-weight-bold">
              Folio Number
            </v-col>
            <v-col class="col-6 col-sm-9">
              {{paymentData.folioNumber}}
            </v-col>
          </v-row>
          <v-row>
            <v-col class="col-6 col-sm-3 font-weight-bold">
              Initiated By
            </v-col>
            <v-col class="col-6 col-sm-9">
              {{paymentData.initiatedBy}}
            </v-col>
          </v-row>
          <v-divider class="my-6"></v-divider>
          <v-row>
            <v-col class="col-6 col-sm-3 font-weight-bold">
              Payment Info
            </v-col>
            <v-col class="col-6 col-sm-9">
              <v-row no-gutters>
                <v-col class="col-12 col-sm-6">
                  <div class="font-weight-bold">
                    Payment Method
                  </div>
                  <div class="mt-2 mb-3">
                    {{getPaymentTypeDisplayName(paymentData.paymentMethod)}}
                  </div>
                </v-col>
                <v-col class="col-12 col-sm-6">
                  <div class="font-weight-bold">
                    Status
                  </div>
                  <div class="mt-2 mb-3">
                    {{getInvoiceStatusDisplayName(paymentData.paymentStatus)}}
                  </div>
                </v-col>
              </v-row>
            </v-col>
          </v-row>
          <v-divider class="mt-2 mb-6"></v-divider>
          <v-row>
            <v-col class="col-6 col-sm-3 font-weight-bold">
              Total Amount
            </v-col>
            <v-col class="col-6 col-sm-9">
              {{formatAmount(Number(paymentData.totalTransactionAmount))}}
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
import { PaymentData } from '@/models/transaction-refund'
import { getInvoiceStatusDisplayName } from '@/util/invoice-status-display'
import { getPaymentTypeDisplayName } from '@/util/payment-type-display'

export default defineComponent({
  name: 'PaymentDetails',
  props: {
    paymentData: {
      type: Object as PropType<PaymentData>,
      required: true
    }
  },
  setup () {
    return {
      formatAmount: CommonUtils.formatAmount,
      getInvoiceStatusDisplayName,
      getPaymentTypeDisplayName
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

</style>
