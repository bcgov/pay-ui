<template>
    <v-form ref="createRoutingSlipCashPaymentForm">
        <v-row class="d-flex pa-0 ma-0 justify-between">
            <v-col :cols="getColumnWidth" class="py-0">
                <v-text-field
                filled
                label="Receipt Number"
                persistent-hint
                v-model.trim="chequeReceiptNumber"
                data-test="txtReceiptNumber"
                :rules="receiptNumberRules"
                >
                </v-text-field>
            </v-col>
            <v-col :cols="getColumnWidth" class="py-0">
                <v-text-field
                filled
                label="Amount(CAD$)"
                persistent-hint
                v-model.number="paidAmount"
                type="number"
                data-test="txtPaidAmount"
                :rules="paidAmountRules"
                class="textNumber"
                >
                </v-text-field>
            </v-col>
            <v-col cols="4" class="py-0" v-if="isTheAmountPaidInUsd">
                <v-text-field
                filled
                label="Amount(USD$)"
                persistent-hint
                v-model.number="paidUsdAmount"
                type="number"
                data-test="txtPaidUsdAmount"
                :rules="paidUsdAmountRules"
                class="textNumber"
                >
                </v-text-field>
            </v-col>
        </v-row>
        <v-row class="pa-0 ma-0 justify-end" v-if="enableUSDExchange">
          <v-col cols="3" class="d-flex justify-end py-0">
            <v-checkbox
              v-model="isTheAmountPaidInUsd"
              label="Funds received in USD"
              hide-details
              class="ma-0"
            ></v-checkbox>
          </v-col>
        </v-row>
    </v-form>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { useCreateRoutingSlipCashPayment } from '@/composables/RoutingSlip'

@Component({
  setup () {
    const {
      chequeReceiptNumber,
      paidAmount,
      paidUsdAmount,
      createRoutingSlipCashPaymentForm,
      receiptNumberRules,
      paidAmountRules,
      paidUsdAmountRules,
      isValid,
      isTheAmountPaidInUsd,
      getColumnWidth,
      enableUSDExchange
    } = useCreateRoutingSlipCashPayment()
    return {
      chequeReceiptNumber,
      paidAmount,
      paidUsdAmount,
      createRoutingSlipCashPaymentForm,
      receiptNumberRules,
      paidAmountRules,
      paidUsdAmountRules,
      isValid,
      isTheAmountPaidInUsd,
      getColumnWidth,
      enableUSDExchange
    }
  }
})
export default class CreateRoutingSlipCashPayment extends Vue {
}
</script>
<style lang="scss" scoped>
  .textNumber input[type='number'] {
    -moz-appearance:textfield;
  }
  .textNumber input::-webkit-outer-spin-button,
  .textNumber input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
</style>
